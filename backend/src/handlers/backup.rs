use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::path::PathBuf;
use tokio::process::Command;
use chrono::Utc;

#[derive(Serialize)]
pub struct BackupEntry {
    pub filename: String,
    pub size_bytes: u64,
    pub created_at: String,
}

#[derive(Serialize)]
pub struct BackupListResponse {
    pub backups: Vec<BackupEntry>,
}

fn backup_dir() -> PathBuf {
    PathBuf::from(std::env::var("BACKUP_DIR").unwrap_or_else(|_| "./backups".to_string()))
}

// GET /api/v1/backup/list
pub async fn list_backups() -> HttpResponse {
    let dir = backup_dir();
    let mut entries = Vec::new();

    if let Ok(mut read_dir) = tokio::fs::read_dir(&dir).await {
        while let Ok(Some(entry)) = read_dir.next_entry().await {
            let path = entry.path();
            if path.extension().map(|e| e == "sql").unwrap_or(false) {
                if let Ok(meta) = entry.metadata().await {
                    let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                    let size_bytes = meta.len();
                    let created_at = meta.modified()
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| {
                            let secs = d.as_secs() as i64;
                            chrono::DateTime::from_timestamp(secs, 0)
                                .map(|dt| dt.format("%Y-%m-%d %H:%M:%S UTC").to_string())
                                .unwrap_or_default()
                        })
                        .unwrap_or_default();
                    entries.push(BackupEntry { filename, size_bytes, created_at });
                }
            }
        }
    }

    entries.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    HttpResponse::Ok().json(BackupListResponse { backups: entries })
}

// POST /api/v1/backup/create
pub async fn create_backup() -> HttpResponse {
    let dir = backup_dir();
    tokio::fs::create_dir_all(&dir).await.ok();

    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let filename = format!("rustcms_{}.sql", timestamp);
    let filepath = dir.join(&filename);

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://rustcms:rustcms_secret@localhost:5432/rustcms".to_string());

    let output = Command::new("pg_dump")
        .arg(&database_url)
        .arg("--no-password")
        .output()
        .await;

    match output {
        Ok(out) if out.status.success() => {
            if let Err(e) = tokio::fs::write(&filepath, &out.stdout).await {
                return HttpResponse::InternalServerError().json(serde_json::json!({
                    "error": format!("Failed to write backup: {}", e)
                }));
            }
            let size = out.stdout.len() as u64;
            HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "filename": filename,
                "size_bytes": size,
                "created_at": Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string()
            }))
        }
        Ok(out) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("pg_dump error: {}", String::from_utf8_lossy(&out.stderr))
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to run pg_dump: {}", e)
        })),
    }
}

// GET /api/v1/backup/download/{filename}
pub async fn download_backup(path: web::Path<String>) -> HttpResponse {
    let filename = path.into_inner();
    // Seguridad: no permitir path traversal
    if filename.contains('/') || filename.contains("..") {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid filename"}));
    }
    let filepath = backup_dir().join(&filename);
    match tokio::fs::read(&filepath).await {
        Ok(data) => HttpResponse::Ok()
            .insert_header(("Content-Type", "application/octet-stream"))
            .insert_header(("Content-Disposition", format!("attachment; filename=\"{}\"", filename)))
            .body(data),
        Err(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Backup not found"})),
    }
}

// DELETE /api/v1/backup/{filename}
pub async fn delete_backup(path: web::Path<String>) -> HttpResponse {
    let filename = path.into_inner();
    if filename.contains('/') || filename.contains("..") {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid filename"}));
    }
    let filepath = backup_dir().join(&filename);
    match tokio::fs::remove_file(&filepath).await {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"success": true})),
        Err(_) => HttpResponse::NotFound().json(serde_json::json!({"error": "Backup not found"})),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/backup")
            .route("/list",              web::get().to(list_backups))
            .route("/create",            web::post().to(create_backup))
            .route("/download/{filename}", web::get().to(download_backup))
            .route("/{filename}",        web::delete().to(delete_backup))
            .route("/restore",            web::post().to(restore_backup))
    );
}

// POST /api/v1/backup/restore (multipart: file .sql)
use actix_multipart::Multipart;
use futures_util::StreamExt as _;

pub async fn restore_backup(mut payload: Multipart) -> HttpResponse {
    let mut sql_content: Vec<u8> = Vec::new();

    while let Some(item) = payload.next().await {
        let mut field = match item {
            Ok(f) => f,
            Err(e) => return HttpResponse::BadRequest().json(serde_json::json!({"error": e.to_string()})),
        };
        while let Some(chunk) = field.next().await {
            match chunk {
                Ok(data) => sql_content.extend_from_slice(&data),
                Err(e) => return HttpResponse::BadRequest().json(serde_json::json!({"error": e.to_string()})),
            }
        }
    }

    if sql_content.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "No file received"}));
    }

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://rustcms:rustcms_secret@localhost:5432/rustcms".to_string());

    // Escribir a temp file y ejecutar psql
    let tmp_path = format!("/tmp/restore_{}.sql", Utc::now().timestamp());
    if let Err(e) = tokio::fs::write(&tmp_path, &sql_content).await {
        return HttpResponse::InternalServerError().json(serde_json::json!({"error": format!("Write error: {}", e)}));
    }

    let output = Command::new("psql")
        .arg(&database_url)
        .arg("--no-password")
        .arg("-f").arg(&tmp_path)
        .output().await;

    tokio::fs::remove_file(&tmp_path).await.ok();

    match output {
        Ok(out) if out.status.success() => {
            HttpResponse::Ok().json(serde_json::json!({"success": true, "message": "Base de datos restaurada correctamente"}))
        }
        Ok(out) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("psql error: {}", String::from_utf8_lossy(&out.stderr))
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Failed to run psql: {}", e)
        })),
    }
}
