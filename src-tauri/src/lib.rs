use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use serde::Serialize;
use velo_core::collection::{Collection, CollectionManager, Request};
use velo_core::environment::{Environment, EnvironmentManager};
use velo_core::error::VeloError;
use velo_core::executor::{Executor, RequestResult};

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub code: &'static str,
    pub message: String,
}

impl From<VeloError> for CommandError {
    fn from(err: VeloError) -> Self {
        let code = match &err {
            VeloError::CollectionNotFound(_) => "COLLECTION_NOT_FOUND",
            VeloError::EnvironmentNotFound(_) => "ENVIRONMENT_NOT_FOUND",
            VeloError::RequestNotFound(_) => "REQUEST_NOT_FOUND",
            VeloError::Http(_) => "NETWORK_ERROR",
            _ => "INTERNAL_ERROR",
        };
        CommandError { code, message: err.to_string() }
    }
}

impl CommandError {
    fn internal(message: impl Into<String>) -> Self {
        CommandError { code: "INTERNAL_ERROR", message: message.into() }
    }

    fn invalid_state(message: impl Into<String>) -> Self {
        CommandError { code: "INVALID_STATE", message: message.into() }
    }
}

pub struct AppState {
    pub base_path: Mutex<String>,
}

fn current_base_path(state: &tauri::State<'_, AppState>) -> Result<PathBuf, CommandError> {
    let guard = state.base_path.lock().map_err(|e| CommandError::internal(e.to_string()))?;
    let value = guard.clone();
    drop(guard);
    if value.is_empty() {
        return Err(CommandError::invalid_state("base path is not set"));
    }
    Ok(PathBuf::from(value))
}

#[tauri::command]
async fn set_base_path(path: String, state: tauri::State<'_, AppState>) -> Result<(), CommandError> {
    let mut guard = state.base_path.lock().map_err(|e| CommandError::internal(e.to_string()))?;
    *guard = path;
    Ok(())
}

#[tauri::command]
async fn list_collections(state: tauri::State<'_, AppState>) -> Result<Vec<String>, CommandError> {
    let base = current_base_path(&state)?;
    let names = CollectionManager::new(base).list().await?;
    Ok(names)
}

#[tauri::command]
async fn get_collection(name: String, state: tauri::State<'_, AppState>) -> Result<Collection, CommandError> {
    let base = current_base_path(&state)?;
    let collection = CollectionManager::new(base).load(&name).await?;
    Ok(collection)
}

#[tauri::command]
async fn execute_request(
    collection_name: String,
    request_name: String,
    env_name: String,
    state: tauri::State<'_, AppState>,
) -> Result<RequestResult, CommandError> {
    let base = current_base_path(&state)?;
    let request = CollectionManager::new(base.clone())
        .get_request(&collection_name, &request_name)
        .await?;
    let env = EnvironmentManager::new(base).load(&env_name).await?;
    let executor = Executor::new()?;
    let result = executor.execute(&request, &env).await?;
    Ok(result)
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
    let base = current_base_path(&state)?;
    let base_request = CollectionManager::new(base.clone())
        .get_request(&collection_name, &request_name)
        .await?;
    let env = EnvironmentManager::new(base).load(&env_name).await?;
    let request = Request {
        id: base_request.id,
        name: base_request.name,
        method: base_request.method,
        url: base_request.url,
        headers: override_headers,
        body: override_body,
        description: base_request.description,
    };
    let executor = Executor::new()?;
    let result = executor.execute(&request, &env).await?;
    Ok(result)
}

#[tauri::command]
async fn list_environments(state: tauri::State<'_, AppState>) -> Result<Vec<String>, CommandError> {
    let base = current_base_path(&state)?;
    let names = EnvironmentManager::new(base).list().await?;
    Ok(names)
}

#[tauri::command]
async fn get_environment(name: String, state: tauri::State<'_, AppState>) -> Result<Environment, CommandError> {
    let base = current_base_path(&state)?;
    let env = EnvironmentManager::new(base).load(&name).await?;
    Ok(env)
}

#[tauri::command]
async fn save_environment(
    name: String,
    values: HashMap<String, String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), CommandError> {
    let base = current_base_path(&state)?;
    let env = Environment { name, values };
    EnvironmentManager::new(base).save(&env).await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState { base_path: Mutex::new(String::new()) })
        .plugin(tauri_plugin_fs::init())
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
            execute_request,
            execute_request_with_body,
            list_environments,
            get_environment,
            save_environment,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
