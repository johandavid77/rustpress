use std::path::PathBuf;
use tokio::time::{interval, Duration};
use tracing::{info, error};
use chrono::Utc;

pub fn start(database_url: String, backup_dir: String) {
    tokio::spawn(async move {
        // Primer backup al arrancar (con delay de 30s)
        tokio::time::sleep(Duration::from_secs(30)).await;

        let mut ticker = interval(Duration::from_secs(86400)); // 24h
        loop {
            ticker.tick().await;
            match run_backup(&database_url, &backup_dir).await {
                Ok(path) => info!("DB backup saved: {}", path),
                Err(e)   => error!("DB backup failed: {}", e),
            }
        }
    });
}

async fn run_backup(database_url: &str, backup_dir: &str) -> Result<String, String> {
    let dir = PathBuf::from(backup_dir);
    tokio::fs::create_dir_all(&dir).await
        .map_err(|e| e.to_string())?;

    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename  = format!("rustcms_{}.sql", timestamp);
    let filepath  = dir.join(&filename);

    let output = tokio::process::Command::new("pg_dump")
        .arg(database_url)
        .arg("--no-password")
        .output()
        .await
        .map_err(|e| format!("pg_dump failed: {}", e))?;

    if !output.status.success() {
        return Err(format!("pg_dump error: {}", String::from_utf8_lossy(&output.stderr)));
    }

    tokio::fs::write(&filepath, &output.stdout).await
        .map_err(|e| e.to_string())?;

    // Limpiar backups viejos (mantener 30)
    cleanup_old_backups(&dir, 30).await;

    Ok(filepath.to_string_lossy().to_string())
}

async fn cleanup_old_backups(dir: &PathBuf, keep: usize) {
    let Ok(mut entries) = tokio::fs::read_dir(dir).await else { return };
    let mut files = vec![];

    while let Ok(Some(entry)) = entries.next_entry().await {
        let path = entry.path();
        if path.extension().map(|e| e == "sql").unwrap_or(false) {
            if let Ok(meta) = entry.metadata().await {
                if let Ok(modified) = meta.modified() {
                    files.push((modified, path));
                }
            }
        }
    }

    files.sort_by(|a, b| b.0.cmp(&a.0)); // más reciente primero
    for (_, path) in files.iter().skip(keep) {
        let _ = tokio::fs::remove_file(path).await;
    }
}
