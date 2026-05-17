use std::collections::HashMap;
use std::time::Instant;
use serde::{Deserialize, Serialize};
use crate::collection::Request;
use crate::environment::{Environment, EnvironmentManager};
use crate::error::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestResult {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub duration_ms: u64,
}

pub struct Executor {
    client: reqwest::Client,
}

impl Executor {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .use_rustls_tls()
            .build()
            .expect("failed to build reqwest client");
        Self { client }
    }

    pub async fn execute(&self, request: &Request, env: &Environment) -> Result<RequestResult> {
        let url = EnvironmentManager::resolve(&request.url, env)?;

        let method = reqwest::Method::from_bytes(request.method.to_uppercase().as_bytes())
            .unwrap_or(reqwest::Method::GET);

        let mut builder = self.client.request(method, &url);

        for (key, value) in &request.headers {
            let resolved_key = EnvironmentManager::resolve(key, env)?;
            let resolved_value = EnvironmentManager::resolve(value, env)?;
            builder = builder.header(resolved_key, resolved_value);
        }

        if let Some(body) = &request.body {
            let body_str = serde_json::to_string(body)?;
            let resolved_body = EnvironmentManager::resolve(&body_str, env)?;
            builder = builder.body(resolved_body);
        }

        let start = Instant::now();
        let response = builder.send().await?;
        let duration_ms = start.elapsed().as_millis() as u64;

        let status = response.status().as_u16();
        let headers = response
            .headers()
            .iter()
            .filter_map(|(k, v)| {
                v.to_str().ok().map(|v| (k.to_string(), v.to_string()))
            })
            .collect();
        let body = response.text().await?;

        Ok(RequestResult {
            status,
            headers,
            body,
            duration_ms,
        })
    }
}

impl Default for Executor {
    fn default() -> Self {
        Self::new()
    }
}
