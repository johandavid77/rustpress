use actix_web::{web, HttpResponse, HttpRequest};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Serialize, sqlx::FromRow)]
pub struct ActivityLog {
    pub id: uuid::Uuid,
    pub user_id: Option<uuid::Uuid>,
    pub username: Option<String>,
    pub action: String,
    pub resource: Option<String>,
    pub resource_id: Option<String>,
    pub details: Option<serde_json::Value>,
    pub ip: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize)]
pub struct LogQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub resource: Option<String>,
    pub user_id: Option<uuid::Uuid>,
}

pub async fn list_logs(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<LogQuery>,
) -> AppResult<HttpResponse> {
    let limit = query.limit.unwrap_or(50).min(200);
    let offset = query.offset.unwrap_or(0);

    let rows = if let Some(ref resource) = query.resource {
        sqlx::query_as!(ActivityLog,
            "SELECT id, user_id, username, action, resource, resource_id, details, ip, created_at
             FROM activity_logs WHERE resource = $1
             ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            resource, limit, offset
        ).fetch_all(pool.get_ref()).await?
    } else {
        sqlx::query_as!(ActivityLog,
            "SELECT id, user_id, username, action, resource, resource_id, details, ip, created_at
             FROM activity_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit, offset
        ).fetch_all(pool.get_ref()).await?
    };

    let total: i64 = sqlx::query_scalar!("SELECT COUNT(*) FROM activity_logs")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "logs": rows,
        "total": total,
        "limit": limit,
        "offset": offset,
    })))
}

pub async fn clear_logs(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '30 days'")
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

// Funcion publica para registrar actividad desde otros handlers
pub async fn log_activity(
    pool: &PgPool,
    user_id: Option<uuid::Uuid>,
    username: Option<&str>,
    action: &str,
    resource: &str,
    resource_id: Option<&str>,
    details: Option<serde_json::Value>,
    ip: Option<&str>,
) {
    let _ = sqlx::query!(
        "INSERT INTO activity_logs (user_id, username, action, resource, resource_id, details, ip)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
        user_id, username, action, resource, resource_id, details, ip
    ).execute(pool).await;
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/activity")
            .route("/logs", web::get().to(list_logs))
            .route("/logs/clear", web::post().to(clear_logs))
    );
}
