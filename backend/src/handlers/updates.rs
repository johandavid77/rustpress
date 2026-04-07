use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use tokio::process::Command;

#[derive(Serialize)]
pub struct UpdateStatus {
    pub current_commit:  String,
    pub current_version: String,
    pub remote_commit:   String,
    pub remote_message:  String,
    pub up_to_date:      bool,
    pub has_update:      bool,
}

// GET /api/v1/updates/status
pub async fn check_updates() -> HttpResponse {
    // Commit local
    let local = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output().await;

    let current_commit = local
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    // Fetch remoto sin merge
    Command::new("git").args(["fetch", "origin", "main"]).output().await.ok();

    // Commit remoto
    let remote = Command::new("git")
        .args(["rev-parse", "--short", "origin/main"])
        .output().await;

    let remote_commit = remote
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    // Mensaje del último commit remoto
    let msg = Command::new("git")
        .args(["log", "origin/main", "-1", "--pretty=%s"])
        .output().await;

    let remote_message = msg
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|| "".to_string());

    let up_to_date = current_commit == remote_commit;

    HttpResponse::Ok().json(UpdateStatus {
        current_commit,
        current_version: env!("CARGO_PKG_VERSION").to_string(),
        remote_commit,
        remote_message,
        up_to_date,
        has_update: !up_to_date,
    })
}

// POST /api/v1/updates/apply
pub async fn apply_update() -> HttpResponse {
    // git pull
    let pull = Command::new("git")
        .args(["pull", "origin", "main"])
        .output().await;

    match pull {
        Ok(out) if out.status.success() => {
            let pull_output = String::from_utf8_lossy(&out.stdout).to_string();

            // cargo build en background
            tokio::spawn(async {
                Command::new("cargo")
                    .args(["build", "--release"])
                    .output().await.ok();
            });

            HttpResponse::Ok().json(serde_json::json!({
                "success": true,
                "message": "Actualización aplicada. El sistema se recompilará en background.",
                "pull_output": pull_output
            }))
        }
        Ok(out) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("git pull falló: {}", String::from_utf8_lossy(&out.stderr))
        })),
        Err(e) => HttpResponse::InternalServerError().json(serde_json::json!({
            "error": format!("Error: {}", e)
        })),
    }
}

// GET /api/v1/updates/changelog
pub async fn get_changelog() -> HttpResponse {
    let log = Command::new("git")
        .args(["log", "origin/main", "-10", "--pretty=format:%h|%s|%ar|%an"])
        .output().await;

    match log {
        Ok(out) if out.status.success() => {
            let commits: Vec<serde_json::Value> = String::from_utf8_lossy(&out.stdout)
                .lines()
                .map(|line| {
                    let parts: Vec<&str> = line.splitn(4, '|').collect();
                    serde_json::json!({
                        "hash":    parts.get(0).unwrap_or(&""),
                        "message": parts.get(1).unwrap_or(&""),
                        "date":    parts.get(2).unwrap_or(&""),
                        "author":  parts.get(3).unwrap_or(&""),
                    })
                })
                .collect();
            HttpResponse::Ok().json(serde_json::json!({ "commits": commits }))
        }
        _ => HttpResponse::Ok().json(serde_json::json!({ "commits": [] }))
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/updates")
            .route("/status",    web::get().to(check_updates))
            .route("/apply",     web::post().to(apply_update))
            .route("/changelog", web::get().to(get_changelog))
    );
}
