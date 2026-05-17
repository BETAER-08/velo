use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tokio::fs;
use crate::error::{Result, VeloError};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub name: String,
    pub values: HashMap<String, String>,
}

pub struct EnvironmentManager {
    base_path: PathBuf,
}

impl EnvironmentManager {
    pub fn new(base_path: PathBuf) -> Self {
        Self { base_path }
    }

    pub async fn load(&self, name: &str) -> Result<Environment> {
        let path = self.base_path.join("environments").join(format!("{}.yaml", name));
        let content = fs::read_to_string(&path).await.map_err(|_| {
            VeloError::EnvironmentNotFound(name.to_string())
        })?;
        let env = serde_yaml::from_str(&content)?;
        Ok(env)
    }

    pub async fn save(&self, env: &Environment) -> Result<()> {
        let dir = self.base_path.join("environments");
        fs::create_dir_all(&dir).await?;
        let path = dir.join(format!("{}.yaml", env.name));
        let content = serde_yaml::to_string(env)?;
        fs::write(path, content).await?;
        Ok(())
    }

    pub async fn list(&self) -> Result<Vec<String>> {
        let dir = self.base_path.join("environments");
        if !dir.exists() {
            return Ok(vec![]);
        }
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

    pub fn resolve_strict(template: &str, env: &Environment) -> Result<String> {
        let mut result = template.to_string();
        let mut search_start = 0;
        loop {
            if search_start > result.len() {
                break;
            }
            let remaining = &result[search_start..];
            let Some(open) = remaining.find("{{") else { break };
            let abs_open = search_start + open;
            let after_open = abs_open + 2;
            let Some(close) = result[after_open..].find("}}") else { break };
            let abs_close = after_open + close;
            let key = result[after_open..abs_close].trim();
            let value = env.values.get(key).ok_or_else(|| {
                VeloError::InvalidTemplate(format!("key '{}' not found in environment", key))
            })?;
            let replacement = value.clone();
            result.replace_range(abs_open..abs_close + 2, &replacement);
            search_start = abs_open + replacement.len();
        }
        Ok(result)
    }

    pub fn resolve_lenient(template: &str, env: &Environment) -> String {
        let mut result = template.to_string();
        let mut search_start = 0;
        loop {
            if search_start > result.len() {
                break;
            }
            let remaining = &result[search_start..];
            let Some(open) = remaining.find("{{") else { break };
            let abs_open = search_start + open;
            let after_open = abs_open + 2;
            let Some(close) = result[after_open..].find("}}") else { break };
            let abs_close = after_open + close;
            let key = result[after_open..abs_close].trim();
            match env.values.get(key) {
                Some(value) => {
                    let replacement = value.clone();
                    let new_start = abs_open + replacement.len();
                    result.replace_range(abs_open..abs_close + 2, &replacement);
                    search_start = new_start;
                }
                None => {
                    search_start = abs_close + 2;
                }
            }
        }
        result
    }
}
