use std::sync::Arc;
use tauri::Manager;
use tokio::sync::broadcast;
use tokio::sync::Mutex;
use tauri_plugin_dialog::DialogExt;

mod websocket;

#[tauri::command]
fn broadcast_to_obs(message: String, state: tauri::State<'_, Arc<websocket::WsState>>) -> Result<(), String> {
    state.tx.send(message).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn update_websocket_config(new_port: u16, state: tauri::State<'_, Arc<websocket::WsState>>) -> Result<(), String> {
    let mut handle_guard = state.server_handle.lock().await;
    
    // Abort the existing server if it's running
    if let Some(handle) = handle_guard.take() {
        handle.abort();
    }
    
    let state_clone = Arc::clone(&state);
    let new_handle = tokio::spawn(async move {
        websocket::start_server(state_clone, new_port).await;
    });
    
    *handle_guard = Some(new_handle);
    
    Ok(())
}

#[tauri::command]
async fn export_database_file(app: tauri::AppHandle) -> Result<String, String> {
    let db_path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("gmnexus.db");
    
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file()
        .set_title("Export Database")
        .set_file_name("gmnexus_backup.db")
        .save_file(move |path| {
            let _ = tx.send(path);
        });
    
    let file_path = rx.await.map_err(|e| e.to_string())?;
    
    if let Some(path) = file_path {
        let dest = path.into_path().map_err(|e| e.to_string())?;
        std::fs::copy(db_path, &dest).map_err(|e| e.to_string())?;
        Ok(dest.to_string_lossy().into_owned())
    } else {
        Err("Export cancelled".into())
    }
}

#[tauri::command]
async fn get_import_preview(path: String) -> Result<Vec<(String, String)>, String> {
    let conn = rusqlite::Connection::open(&path).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name FROM campaigns").map_err(|e| e.to_string())?;
    let campaign_iter = stmt.query_map([], |row| {
        let id: String = row.get(0)?;
        let name: String = row.get(1)?;
        Ok((id, name))
    }).map_err(|e| e.to_string())?;
    
    let mut campaigns = Vec::new();
    for (index, campaign) in campaign_iter.enumerate() {
        let c = campaign.map_err(|e| e.to_string())?;
        campaigns.push(c);
    }
    Ok(campaigns)
}

#[tauri::command]
async fn import_campaigns(app: tauri::AppHandle, source_path: String, selected_ids: Vec<String>) -> Result<(), String> {
    let target_path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("gmnexus.db");
    
    let target_conn = rusqlite::Connection::open(&target_path).map_err(|e| e.to_string())?;
    
    // We'll use ATTACH DATABASE to make it easier to copy between databases
    target_conn.execute("ATTACH DATABASE ? AS source", [&source_path]).map_err(|e| e.to_string())?;
    
    for id in selected_ids {
        // Check if exists in target
        let exists: bool = target_conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM campaigns WHERE id = ?)",
            [&id],
            |row| row.get(0)
        ).map_err(|e| e.to_string())?;
        
        if exists {
            continue; // Skip existing campaigns to prevent overwrite
        }
        
        // Copy campaign and related records
        // This is a simplified version, ideally we'd copy all related tables
        let tables = ["campaigns", "players", "player_resources", "campaign_entities", "inbox_entries", "notes", "relationships", "sessions", "session_events", "status_effects", "resource_history", "creatures", "settings"];
        
        for table in tables {
            // Check if table exists in source
            let table_exists: bool = target_conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM source.sqlite_master WHERE type='table' AND name=?)",
                [table],
                |row| row.get(0)
            ).unwrap_or(false);
        
            if !table_exists { 
                continue; 
            }

            let query = if table == "campaigns" {
                format!("INSERT INTO {} SELECT * FROM source.{} WHERE id = ?", table, table)
            } else if table == "settings" {
                format!("INSERT INTO {} SELECT * FROM source.{} WHERE campaignId = ?", table, table)
            } else if table == "player_resources" {
                // Special case for player_resources as it links to players
                format!("INSERT INTO {} SELECT * FROM source.{} WHERE playerId IN (SELECT id FROM source.players WHERE campaignId = ?)", table, table)
            } else if table == "status_effects" || table == "resource_history" {
                format!("INSERT INTO {} SELECT * FROM source.{} WHERE playerId IN (SELECT id FROM source.players WHERE campaignId = ?)", table, table)
            } else if table == "session_events" {
                format!("INSERT INTO {} SELECT * FROM source.{} WHERE sessionId IN (SELECT id FROM source.sessions WHERE campaignId = ?)", table, table)
            } else {
                format!("INSERT INTO {} SELECT * FROM source.{} WHERE campaignId = ?", table, table)
            };
        
            let mut stmt = target_conn.prepare(&query).map_err(|e| e.to_string())?;
            stmt.execute([&id]).map_err(|e| e.to_string())?;
        }
    }
    
    target_conn.execute("DETACH DATABASE source", []).map_err(|e| e.to_string())?;
    
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
                server_handle: Mutex::new(None),
            });
            app.manage(ws_state.clone());
            
            let ws_state_clone = ws_state.clone();
            tauri::async_runtime::spawn(async move {
                let handle = tokio::spawn(async move {
                    websocket::start_server(ws_state_clone, 3030).await;
                });
                
                let ws_state_inner = ws_state.clone();
                let mut handle_guard = ws_state_inner.server_handle.lock().await;
                *handle_guard = Some(handle);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            broadcast_to_obs, 
            update_websocket_config,
            export_database_file,
            get_import_preview,
            import_campaigns
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
