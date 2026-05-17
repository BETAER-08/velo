use clap::{Parser, Subcommand};
use colored::Colorize;
use std::path::PathBuf;
use velo_core::collection::CollectionManager;
use velo_core::environment::EnvironmentManager;
use velo_core::executor::Executor;

#[derive(Parser)]
#[command(name = "velo", about = "Velo HTTP client CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Run {
        collection: String,
        request: String,
        #[arg(long)]
        env: String,
        #[arg(long)]
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
        #[arg(long)]
        base_path: Option<String>,
    },
    Environments {
        #[arg(long)]
        base_path: Option<String>,
    },
}

fn default_base_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| String::from("/tmp"));
    PathBuf::from(home).join(".velo")
}

fn status_text(status: u16) -> &'static str {
    match status {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        301 => "Moved Permanently",
        302 => "Found",
        304 => "Not Modified",
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        408 => "Request Timeout",
        409 => "Conflict",
        422 => "Unprocessable Entity",
        429 => "Too Many Requests",
        500 => "Internal Server Error",
        501 => "Not Implemented",
        502 => "Bad Gateway",
        503 => "Service Unavailable",
        504 => "Gateway Timeout",
        _ => "",
    }
}

fn print_status_line(status: u16, duration_ms: u64) {
    let text = status_text(status);
    let line = if text.is_empty() {
        format!("✓ {}  [{}ms]", status, duration_ms)
    } else {
        format!("✓ {} {}  [{}ms]", status, text, duration_ms)
    };
    if status >= 500 {
        println!("{}", line.red());
    } else if status >= 400 {
        println!("{}", line.yellow());
    } else if status >= 200 && status < 300 {
        println!("{}", line.green());
    } else {
        println!("{}", line);
    }
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    if let Err(e) = run(cli).await {
        eprintln!("error: {}", e);
        std::process::exit(1);
    }
}

async fn run(cli: Cli) -> Result<(), String> {
    match cli.command {
        Commands::Run {
            collection,
            request,
            env,
            base_path,
        } => {
            let base = base_path.map(PathBuf::from).unwrap_or_else(default_base_path);
            let req = CollectionManager::new(base.clone())
                .get_request(&collection, &request)
                .await
                .map_err(|e| e.to_string())?;
            let environment = EnvironmentManager::new(base)
                .load(&env)
                .await
                .map_err(|e| e.to_string())?;
            let result = Executor::new()
                .map_err(|e| e.to_string())?
                .execute(&req, &environment)
                .await
                .map_err(|e| e.to_string())?;

            print_status_line(result.status, result.duration_ms);
            for (k, v) in &result.headers {
                println!("{}: {}", k, v);
            }
            println!();
            let body = match serde_json::from_str::<serde_json::Value>(&result.body) {
                Ok(v) => serde_json::to_string_pretty(&v).unwrap_or(result.body),
                Err(_) => result.body,
            };
            println!("{}", body);
            Ok(())
        }
        Commands::List { target } => match target {
            ListTarget::Collections { base_path } => {
                let base = base_path.map(PathBuf::from).unwrap_or_else(default_base_path);
                let names = CollectionManager::new(base.clone())
                    .list()
                    .await
                    .map_err(|e| e.to_string())?;
                println!("collections (base: {}):", base.display());
                for name in names {
                    println!("  • {}", name);
                }
                Ok(())
            }
            ListTarget::Environments { base_path } => {
                let base = base_path.map(PathBuf::from).unwrap_or_else(default_base_path);
                let names = EnvironmentManager::new(base.clone())
                    .list()
                    .await
                    .map_err(|e| e.to_string())?;
                println!("environments (base: {}):", base.display());
                for name in names {
                    println!("  • {}", name);
                }
                Ok(())
            }
        },
    }
}
