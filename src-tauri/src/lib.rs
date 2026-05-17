use velo_core::collection::CollectionManager;
use velo_core::environment::EnvironmentManager;
use velo_core::executor::Executor;
use std::path::PathBuf;

#[tauri::command]
async fn list_collections(base_path: String) -> Result<Vec<String>, String> {
    CollectionManager::new(PathBuf::from(base_path))
        .list()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_collection(base_path: String, name: String) -> Result<velo_core::collection::Collection, String> {
    CollectionManager::new(PathBuf::from(base_path))
        .load(&name)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn execute_request(
    base_path: String,
    collection_name: String,
    request_name: String,
    env_name: String,
) -> Result<velo_core::executor::RequestResult, String> {
    let base = PathBuf::from(base_path);
    let request = CollectionManager::new(base.clone())
        .get_request(&collection_name, &request_name)
        .await
        .map_err(|e| e.to_string())?;
    let env = EnvironmentManager::new(base)
        .load(&env_name)
        .await
        .map_err(|e| e.to_string())?;
    Executor::new()
        .execute(&request, &env)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn list_environments(base_path: String) -> Result<Vec<String>, String> {
    EnvironmentManager::new(PathBuf::from(base_path))
        .list()
        .await
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_collections,
            get_collection,
            execute_request,
            list_environments,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
