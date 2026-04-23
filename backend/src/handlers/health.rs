use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use std::time::{SystemTime, UNIX_EPOCH};

static START_TIME: std::sync::OnceLock<u64> = std::sync::OnceLock::new();

pub fn init_start_time() {
    START_TIME.get_or_init(|| {
        SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
    });
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(health_check));
}

async fn health_check(pool: web::Data<PgPool>) -> HttpResponse {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let start = START_TIME.get().copied().unwrap_or(now);
    let uptime_secs = now - start;

    let db_ok = sqlx::query("SELECT 1").fetch_one(pool.get_ref()).await.is_ok();

    let status = if db_ok { "ok" } else { "degraded" };
    let http_status = if db_ok { 200u16 } else { 503 };

    let body = serde_json::json!({
        "status":  status,
        "version": env!("CARGO_PKG_VERSION"),
        "uptime_seconds": uptime_secs,
        "uptime_human": format_uptime(uptime_secs),
        "database": if db_ok { "connected" } else { "disconnected" },
        "timestamp": now,
    });

    HttpResponse::build(actix_web::http::StatusCode::from_u16(http_status).unwrap())
        .json(body)
}

fn format_uptime(secs: u64) -> String {
    let d = secs / 86400;
    let h = (secs % 86400) / 3600;
    let m = (secs % 3600) / 60;
    let s = secs % 60;
    if d > 0 { format!("{}d {}h {}m {}s", d, h, m, s) }
    else if h > 0 { format!("{}h {}m {}s", h, m, s) }
    else { format!("{}m {}s", m, s) }
}
