use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tokio::fs;
use crate::error::{Result, VeloError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Request {
    pub id: String,
    pub name: String,
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<serde_json::Value>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collection {
    pub name: String,
    pub description: Option<String>,
    pub requests: Vec<Request>,
}

pub struct CollectionManager {
    base_path: PathBuf,
}

impl CollectionManager {
    pub fn new(base_path: PathBuf) -> Self {
        Self { base_path }
    }

    pub async fn load(&self, name: &str) -> Result<Collection> {
        let path = self.base_path.join("collections").join(format!("{}.yaml", name));
        let content = fs::read_to_string(&path).await.map_err(|_| {
            VeloError::CollectionNotFound(name.to_string())
        })?;
        let collection = serde_yaml::from_str(&content)?;
        Ok(collection)
    }

    pub async fn save(&self, collection: &Collection) -> Result<()> {
        let dir = self.base_path.join("collections");
        fs::create_dir_all(&dir).await?;
        let path = dir.join(format!("{}.yaml", collection.name));
        let content = serde_yaml::to_string(collection)?;
        fs::write(path, content).await?;
        Ok(())
    }

    pub async fn list(&self) -> Result<Vec<String>> {
        let dir = self.base_path.join("collections");
        let mut names = Vec::new();
        let mut entries = fs::read_dir(&dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("yaml") {
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    names.push(stem.to_string());
                }
            }
        }
        Ok(names)
    }

    pub async fn get_request(&self, collection_name: &str, request_name: &str) -> Result<Request> {
        let collection = self.load(collection_name).await?;
        collection
            .requests
            .into_iter()
            .find(|r| r.name == request_name)
            .ok_or_else(|| VeloError::RequestNotFound(request_name.to_string()))
    }
}
