use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use velo_core::collection::{Collection, CollectionManager};
use velo_core::environment::EnvironmentManager;
use velo_core::error::VeloError;
use velo_core::executor::{Executor, RequestResult};

pub struct AppState {
    pub base_path: RwLock<String>,
    pub collection_cache: Arc<RwLock<HashMap<String, Collection>>>,
    pub executor: Executor,
}

#[derive(serde::Serialize)]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}

fn into_command_error(e: VeloError) -> CommandError {
    let code: &'static str = match &e {
        VeloError::CollectionNotFound(_) => "COLLECTION_NOT_FOUND",
        VeloError::EnvironmentNotFound(_) => "ENVIRONMENT_NOT_FOUND",
        VeloError::RequestNotFound(_) => "REQUEST_NOT_FOUND",
        VeloError::Http(_) => "NETWORK_ERROR",
        _ => "INTERNAL_ERROR",
    };
    CommandError {
        code,
        message: e.to_string(),
    }
}

#[tauri::command]
async fn set_base_path(
    path: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), CommandError> {
    let expanded = velo_core::expand_home(&path);
    *state.base_path.write().await = expanded;
    state.collection_cache.write().await.clear();
    Ok(())
}

#[tauri::command]
async fn list_collections(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, CommandError> {
    let base_path = state.base_path.read().await.clone();
    CollectionManager::new(PathBuf::from(base_path))
        .list()
        .await
        .map_err(into_command_error)
}

#[tauri::command]
async fn get_collection(
    name: String,
    state: tauri::State<'_, AppState>,
) -> Result<Collection, CommandError> {
    {
        let cache = state.collection_cache.read().await;
        if let Some(col) = cache.get(&name) {
            return Ok(col.clone());
        }
    }
    let base_path = state.base_path.read().await.clone();
    let col = CollectionManager::new(PathBuf::from(base_path))
        .load(&name)
        .await
        .map_err(into_command_error)?;
    state.collection_cache.write().await.insert(name, col.clone());
    Ok(col)
}

#[tauri::command]
async fn list_environments(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<String>, CommandError> {
    let base_path = state.base_path.read().await.clone();
    EnvironmentManager::new(PathBuf::from(base_path))
        .list()
        .await
        .map_err(into_command_error)
}

#[tauri::command]
async fn execute_request_with_body(
    collection_name: String,
    request_name: String,
    env_name: String,
    override_body: Option<serde_json::Value>,
    override_headers: HashMap<String, String>,
    state: tauri::State<'_, AppState>,
) -> Result<RequestResult, CommandError> {
    let base_path = state.base_path.read().await.clone();
    let base = PathBuf::from(base_path);
    let mut request = CollectionManager::new(base.clone())
        .get_request(&collection_name, &request_name)
        .await
        .map_err(into_command_error)?;
    let env = EnvironmentManager::new(base)
        .load(&env_name)
        .await
        .map_err(into_command_error)?;
    if let Some(body) = override_body {
        if body.is_null() {
            request.body = None;
        } else {
            request.body = Some(body);
        }
    }
    for (k, v) in override_headers {
        request.headers.insert(k, v);
    }
    state.executor
        .execute(&request, &env)
        .await
        .map_err(into_command_error)
}

#[tauri::command]
async fn save_environment(
    name: String,
    values: HashMap<String, String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), CommandError> {
    let base_path = state.base_path.read().await.clone();
    let env = velo_core::environment::Environment { name, values };
    EnvironmentManager::new(PathBuf::from(base_path))
        .save(&env)
        .await
        .map_err(into_command_error)
}

#[tauri::command]
async fn get_environment(
    name: String,
    state: tauri::State<'_, AppState>,
) -> Result<velo_core::environment::Environment, CommandError> {
    let base_path = state.base_path.read().await.clone();
    EnvironmentManager::new(PathBuf::from(base_path))
        .load(&name)
        .await
        .map_err(into_command_error)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            base_path: RwLock::new(String::new()),
            collection_cache: Arc::new(RwLock::new(HashMap::new())),
            executor: Executor::new().expect("failed to build HTTP client"),
        })
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
            set_base_path,
            list_collections,
            get_collection,
            list_environments,
            execute_request_with_body,
            save_environment,
            get_environment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
