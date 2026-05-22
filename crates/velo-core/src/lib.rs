pub mod collection;
pub mod environment;
pub mod error;
pub mod executor;

pub fn expand_home(path: &str) -> String {
    if path == "~" || path.starts_with("~/") {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_default();
        if home.is_empty() {
            return path.to_string();
        }
        return path.replacen('~', &home, 1);
    }
    path.to_string()
}
