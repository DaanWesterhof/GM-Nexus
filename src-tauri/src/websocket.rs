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
use tauri::Emitter;
use tower_http::cors::CorsLayer;

pub struct WsState {
    pub tx: broadcast::Sender<String>,
    pub app_handle: tauri::AppHandle,
}

pub async fn start_server(state: Arc<WsState>) {
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/assets/{*path}", get(asset_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3030));
    println!("Server listening on: {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
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

async fn asset_handler(
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
