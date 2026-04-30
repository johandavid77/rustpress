use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::Deserialize;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Deserialize)]
pub struct AuditQuery {
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
    pub action: Option<String>,
    pub user_id: Option<uuid::Uuid>,
}
fn default_limit() -> i64 { 50 }

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/audit")
            .route("", web::get().to(list_logs))
    );
}

pub async fn log_action(
    pool: &PgPool,
    user_id: Option<uuid::Uuid>,
    username: Option<&str>,
    action: &str,
    resource: Option<&str>,
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

async fn list_logs(
    pool: web::Data<PgPool>,
    query: web::Query<AuditQuery>,
    _auth: AuthUserWithRole,
) -> crate::errors::AppResult<HttpResponse> {
    let rows = sqlx::query!(
        "SELECT id::text, user_id::text, username, action, resource, resource_id,
                details, ip, created_at
         FROM activity_logs
         WHERE ($1::text IS NULL OR action = $1)
           AND ($2::uuid IS NULL OR user_id = $2)
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4",
        query.action, query.user_id, query.limit, query.offset
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id":          r.id,
        "user_id":     r.user_id,
        "username":    r.username,
        "action":      r.action,
        "resource":    r.resource,
        "resource_id": r.resource_id,
        "details":     r.details,
        "ip":          r.ip,
        "created_at":  r.created_at.map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()).unwrap_or_default(),
    })).collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(serde_json::json!({"data": data, "count": data.len()})))
}
