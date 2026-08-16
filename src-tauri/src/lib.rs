use std::sync::Arc;
use tauri::Manager;
use tokio::sync::broadcast;

mod websocket;

#[tauri::command]
fn broadcast_to_obs(message: String, state: tauri::State<'_, Arc<websocket::WsState>>) -> Result<(), String> {
    state.tx.send(message).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, _rx) = broadcast::channel(100);

    let tx_clone = tx.clone();
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            let ws_state = Arc::new(websocket::WsState { 
                tx: tx_clone,
                app_handle: app.handle().clone(),
            });
            app.manage(ws_state.clone());
            
            tauri::async_runtime::spawn(async move {
                websocket::start_server(ws_state).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![broadcast_to_obs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
