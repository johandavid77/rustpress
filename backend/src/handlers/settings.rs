// handlers/settings.rs — GET y PUT del theme activo
use actix_web::{web, HttpResponse};
use sqlx::PgPool;

use crate::{
    errors::AppResult,
    middleware::auth::AuthUserWithRole,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/settings")
            .route("/active-theme", web::get().to(get_active_theme))
            .route("/active-theme", web::put().to(set_active_theme)),
    );
}

// — GET /settings/active-theme
async fn get_active_theme(
    pool: web::Data<PgPool>,
) -> AppResult<HttpResponse> {
    let value: Option<String> = sqlx::query_scalar!(
        "SELECT value FROM settings WHERE key = 'active_theme'"
    )
    .fetch_optional(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "key": "active_theme",
        "value": value.unwrap_or_else(|| "dark".to_string())
    })))
}

// — PUT /settings/active-theme
async fn set_active_theme(
    pool: web::Data<PgPool>,
    body: web::Json<serde_json::Value>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let theme = body.get("value")
        .and_then(|v| v.as_str())
        .unwrap_or("dark")
        .to_string();

    let valid_themes = ["dark", "minimal", "bold", "magazine"];
    if !valid_themes.contains(&theme.as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid theme. Valid: dark, minimal, bold, magazine"
        })));
    }

    sqlx::query!(
        r#"INSERT INTO settings (key, value)
           VALUES ('active_theme', $1)
           ON CONFLICT (key) DO UPDATE SET value = $1"#,
        theme
    )
    .execute(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "key": "active_theme",
        "value": theme
    })))
}
// — GET /health/detailed
pub async fn health_detailed(
    pool:  web::Data<sqlx::PgPool>,
    redis: web::Data<tokio::sync::Mutex<crate::cache::RedisPool>>,
) -> crate::errors::AppResult<actix_web::HttpResponse> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let start = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // DB check
    let db_ok = sqlx::query("SELECT 1")
        .execute(pool.get_ref())
        .await
        .is_ok();

    // DB stats
    let post_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM posts")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or(0);

    let user_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or(0);

    let media_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM media")
        .fetch_one(pool.get_ref())
        .await
        .unwrap_or(0);

    // Redis check
    let redis_ok = {
        use redis::AsyncCommands;
        let mut r = redis.lock().await;
        r.set_ex::<_, _, ()>("health:ping", "pong", 5).await.is_ok()
    };

    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status":      if db_ok && redis_ok { "ok" } else { "degraded" },
        "timestamp":   start,
        "services": {
            "database": { "status": if db_ok { "ok" } else { "error" } },
            "redis":    { "status": if redis_ok { "ok" } else { "error" } },
        },
        "stats": {
            "posts": post_count,
            "users": user_count,
            "media": media_count,
        }
    })))
}

pub async fn uptime_stats(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let events = sqlx::query!(
        r#"SELECT status, checked_at FROM uptime_events ORDER BY checked_at DESC LIMIT 288"#
    )
    .fetch_all(pool.get_ref()).await?;

    let total = events.len();
    let up = events.iter().filter(|e| e.status == "up").count();
    let uptime_pct = if total > 0 { (up as f64 / total as f64) * 100.0 } else { 100.0 };

    let data: Vec<_> = events.iter().map(|e| serde_json::json!({
        "status": e.status,
        "checked_at": e.checked_at,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "uptime_pct": uptime_pct,
        "total_checks": total,
        "events": data,
    })))
}
