use thiserror::Error;

#[derive(Debug, Error)]
pub enum VeloError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("yaml error: {0}")]
    Yaml(#[from] serde_yaml::Error),

    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("collection not found: {0}")]
    CollectionNotFound(String),

    #[error("request not found: {0}")]
    RequestNotFound(String),

    #[error("environment not found: {0}")]
    EnvironmentNotFound(String),

    #[error("invalid template: {0}")]
    InvalidTemplate(String),
}

pub type Result<T> = std::result::Result<T, VeloError>;
