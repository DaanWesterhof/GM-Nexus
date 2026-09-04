use std::{
    net::SocketAddr,
    sync::Arc,
    path::PathBuf,
};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
        Path,
    },
    response::{IntoResponse, Response},
    routing::get,
    Router,
    http::{StatusCode, header},
};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::broadcast;
use tauri::{Emitter, Manager};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;

/// Name of the resource directory the built frontend (`dist`) is copied into.
/// Must match the `bundle.resources` mapping in `tauri.conf.json`.
const OVERLAY_RESOURCE_DIR: &str = "overlay-dist";

/// Resolves the directory that contains the built frontend (`overlay.html`,
/// `assets/*.js`, `assets/*.css`, ...).
///
/// In production this is a resource that was explicitly bundled via
/// `tauri.conf.json` (`bundle.resources`), resolved through Tauri's resource
/// path API so it works regardless of install location/OS.
/// In development (running via `cargo run`/`tauri dev` without a packaged
/// resource dir) we fall back to the `dist` folder produced by `vite build`
/// next to the project root, purely as a convenience - the dev overlay is
/// normally served by the Vite dev server itself, not this fallback.
fn resolve_overlay_dist_dir(app_handle: &tauri::AppHandle) -> Option<PathBuf> {
    match app_handle
        .path()
        .resolve(OVERLAY_RESOURCE_DIR, tauri::path::BaseDirectory::Resource)
    {
        Ok(resource_dir) if resource_dir.join("overlay.html").exists() => {
            println!("[overlay] Serving bundled resource dist from: {}", resource_dir.display());
            return Some(resource_dir);
        }
        Ok(resource_dir) => {
            eprintln!(
                "[overlay] Resolved resource dir '{}' but overlay.html is missing there",
                resource_dir.display()
            );
        }
        Err(e) => {
            eprintln!("[overlay] Could not resolve packaged resource dir '{}': {}", OVERLAY_RESOURCE_DIR, e);
        }
    }

    // Development fallback: <manifest_dir>/../dist (i.e. project_root/dist)
    let dev_dist = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join("dist");
    if dev_dist.join("overlay.html").exists() {
        println!("[overlay] Serving development dist fallback from: {}", dev_dist.display());
        return Some(dev_dist);
    }

    eprintln!(
        "[overlay] Unable to locate overlay.html in either the packaged resource dir ('{}') or the dev fallback ('{}'). \
        The OBS overlay will be unreachable until this is fixed.",
        OVERLAY_RESOURCE_DIR,
        dev_dist.display()
    );
    None
}

pub struct WsState {
    pub tx: broadcast::Sender<String>,
    pub app_handle: tauri::AppHandle,
}

pub async fn start_server(state: Arc<WsState>) {
    let overlay_dist_dir = resolve_overlay_dist_dir(&state.app_handle);

    let mut app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/player-assets/{*path}", get(player_asset_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Serve the built overlay frontend (overlay.html, /assets/*.js, /assets/*.css, ...)
    // as a fallback so it works standalone in the packaged app, without Vite/Node.
    if let Some(dist_dir) = overlay_dist_dir {
        app = app.fallback_service(ServeDir::new(dist_dir));
    } else {
        app = app.fallback(overlay_unavailable_handler);
    }

    let addr = SocketAddr::from(([127, 0, 0, 1], 3030));
    println!("Server listening on: {}", addr);
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(listener) => listener,
        Err(e) => {
            eprintln!("[overlay] Failed to bind overlay server to {}: {}", addr, e);
            return;
        }
    };
    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("[overlay] Overlay server stopped unexpectedly: {}", e);
    }
}

async fn overlay_unavailable_handler() -> impl IntoResponse {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Overlay files could not be found on disk. Check the application logs for the resolved \
        resource path and verify the app was built/installed correctly.",
    )
        .into_response()
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<WsState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<WsState>) {
    println!("New WebSocket connection");

    // Notify frontend that a new client connected so it can broadcast a full sync
    let _ = state.app_handle.emit("ws-client-connected", ());

    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    println!("Received from WS client: {}", text);
                }
                Message::Close(_) => break,
                _ => (),
            }
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };

    println!("WebSocket connection closed");
}

async fn player_asset_handler(
    Path(path): Path<String>,
) -> impl IntoResponse {
    // Basic file serving logic
    // The path comes in as the full original local path or relative path
    // In our case, player.image stores the full path on disk.
    
    // We need to handle Windows paths correctly.
    // The path might be something like "C:/Users/.../image.png"
    // URL encoded it might look different.
    
    let path = path.replace('\\', "/");
    let file_path = PathBuf::from(&path);
    
    if !file_path.exists() {
        return (StatusCode::NOT_FOUND, "File not found").into_response();
    }

    match tokio::fs::read(&file_path).await {
        Ok(contents) => {
            let mime = mime_guess::from_path(&file_path).first_or_octet_stream();
            Response::builder()
                .header(header::CONTENT_TYPE, mime.as_ref())
                .body(axum::body::Body::from(contents))
                .unwrap()
                .into_response()
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Failed to read file").into_response(),
    }
}
