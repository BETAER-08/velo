use std::path::PathBuf;
use std::process::ExitCode;

use clap::{Parser, Subcommand};
use colored::Colorize;
use velo_core::collection::CollectionManager;
use velo_core::environment::EnvironmentManager;
use velo_core::executor::Executor;

#[derive(Parser)]
#[command(name = "velo", about = "Velo HTTP client CLI", version)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Run {
        collection: String,
        request: String,
        #[arg(long)]
        env: String,
        #[arg(long = "base-path")]
        base_path: Option<String>,
    },
    List {
        #[command(subcommand)]
        target: ListTarget,
    },
}

#[derive(Subcommand)]
enum ListTarget {
    Collections {
        #[arg(long = "base-path")]
        base_path: Option<String>,
    },
    Environments {
        #[arg(long = "base-path")]
        base_path: Option<String>,
    },
}

fn resolve_base_path(arg: Option<String>) -> Result<PathBuf, String> {
    if let Some(value) = arg {
        return Ok(PathBuf::from(value));
    }
    let home = dirs::home_dir().ok_or_else(|| "unable to determine home directory".to_string())?;
    Ok(home.join(".velo"))
}

fn status_label(status: u16) -> &'static str {
    match status {
        100 => "Continue",
        101 => "Switching Protocols",
        200 => "OK",
        201 => "Created",
        202 => "Accepted",
        204 => "No Content",
        301 => "Moved Permanently",
        302 => "Found",
        304 => "Not Modified",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        429 => "Too Many Requests",
        500 => "Internal Server Error",
        502 => "Bad Gateway",
        503 => "Service Unavailable",
        504 => "Gateway Timeout",
        _ => "",
    }
}

fn colorize_status(status: u16) -> String {
    let label = status_label(status);
    let line = if label.is_empty() {
        format!("{}", status)
    } else {
        format!("{} {}", status, label)
    };
    match status {
        200..=299 => line.green().to_string(),
        400..=499 => line.yellow().to_string(),
        500..=599 => line.red().to_string(),
        _ => line.normal().to_string(),
    }
}

fn format_body(raw: &str) -> String {
    match serde_json::from_str::<serde_json::Value>(raw) {
        Ok(value) => serde_json::to_string_pretty(&value).unwrap_or_else(|_| raw.to_string()),
        Err(_) => raw.to_string(),
    }
}

async fn run_request(
    collection: String,
    request: String,
    env: String,
    base_path: PathBuf,
) -> Result<(), String> {
    let collection_manager = CollectionManager::new(base_path.clone());
    let request_obj = collection_manager
        .get_request(&collection, &request)
        .await
        .map_err(|e| e.to_string())?;
    let env_manager = EnvironmentManager::new(base_path);
    let env_obj = env_manager.load(&env).await.map_err(|e| e.to_string())?;
    let executor = Executor::new().map_err(|e| e.to_string())?;
    let result = executor
        .execute(&request_obj, &env_obj)
        .await
        .map_err(|e| e.to_string())?;

    let check = "✓".green();
    println!(
        "{} {}  [{}ms]",
        check,
        colorize_status(result.status),
        result.duration_ms
    );
    let mut header_keys: Vec<&String> = result.headers.keys().collect();
    header_keys.sort();
    for key in header_keys {
        if let Some(value) = result.headers.get(key) {
            println!("{}: {}", key, value);
        }
    }
    println!();
    println!("{}", format_body(&result.body));
    Ok(())
}

async fn list_collections(base_path: PathBuf) -> Result<(), String> {
    let names = CollectionManager::new(base_path.clone())
        .list()
        .await
        .map_err(|e| e.to_string())?;
    println!("collections (base: {}):", base_path.display());
    if names.is_empty() {
        println!("  (none)");
    } else {
        for name in names {
            println!("  • {}", name);
        }
    }
    Ok(())
}

async fn list_environments(base_path: PathBuf) -> Result<(), String> {
    let names = EnvironmentManager::new(base_path.clone())
        .list()
        .await
        .map_err(|e| e.to_string())?;
    println!("environments (base: {}):", base_path.display());
    if names.is_empty() {
        println!("  (none)");
    } else {
        for name in names {
            println!("  • {}", name);
        }
    }
    Ok(())
}

#[tokio::main]
async fn main() -> ExitCode {
    let cli = Cli::parse();
    let outcome = match cli.command {
        Command::Run { collection, request, env, base_path } => {
            match resolve_base_path(base_path) {
                Ok(base) => run_request(collection, request, env, base).await,
                Err(e) => Err(e),
            }
        }
        Command::List { target } => match target {
            ListTarget::Collections { base_path } => match resolve_base_path(base_path) {
                Ok(base) => list_collections(base).await,
                Err(e) => Err(e),
            },
            ListTarget::Environments { base_path } => match resolve_base_path(base_path) {
                Ok(base) => list_environments(base).await,
                Err(e) => Err(e),
            },
        },
    };

    match outcome {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("{} {}", "error:".red().bold(), e);
            ExitCode::from(1)
        }
    }
}
