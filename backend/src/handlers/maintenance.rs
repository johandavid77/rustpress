use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Serialize)]
pub struct MaintenanceConfig {
    pub enabled: bool,
    pub message: Option<String>,
    pub ends_at: Option<chrono::DateTime<chrono::Utc>>,
    pub allowed_ips: Vec<String>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize)]
pub struct UpdateMaintenance {
    pub enabled: bool,
    pub message: Option<String>,
    pub ends_at: Option<chrono::DateTime<chrono::Utc>>,
    pub allowed_ips: Vec<String>,
}

async fn fetch_config(pool: &PgPool) -> Result<MaintenanceConfig, sqlx::Error> {
    let row = sqlx::query!(
        "SELECT enabled, message, ends_at, allowed_ips, updated_at FROM maintenance_mode WHERE id = 1"
    ).fetch_one(pool).await?;
    Ok(MaintenanceConfig {
        enabled: row.enabled.unwrap_or(false),
        message: row.message,
        ends_at: row.ends_at,
        allowed_ips: row.allowed_ips.unwrap_or_default(),
        updated_at: row.updated_at,
    })
}

pub async fn get_status(pool: web::Data<PgPool>) -> AppResult<HttpResponse> {
    let cfg = fetch_config(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(cfg))
}

pub async fn update_status(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
    body: web::Json<UpdateMaintenance>,
) -> AppResult<HttpResponse> {
    sqlx::query!("UPDATE maintenance_mode SET enabled = $1, updated_at = NOW() WHERE id = 1", body.enabled)
            .execute(pool.get_ref()).await?;
    if let Some(ref msg) = body.message {
        sqlx::query!("UPDATE maintenance_mode SET message = $1, updated_at = NOW() WHERE id = 1", msg)
            .execute(pool.get_ref()).await?;
    }
    if let Some(ends_at) = body.ends_at {
        sqlx::query!("UPDATE maintenance_mode SET ends_at = $1, updated_at = NOW() WHERE id = 1", ends_at)
            .execute(pool.get_ref()).await?;
    }
        let ips_slice: Vec<&str> = body.allowed_ips.iter().map(|s| s.as_str()).collect();
        sqlx::query!("UPDATE maintenance_mode SET allowed_ips = $1, updated_at = NOW() WHERE id = 1", &ips_slice as &[&str])
            .execute(pool.get_ref()).await?;
    let cfg = fetch_config(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(cfg))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/maintenance")
            .route("/status", web::get().to(get_status))
            .route("/status", web::put().to(update_status))
    );
}
