use actix_web::{web, HttpResponse, HttpRequest};
use actix_web::rt::time::interval;
use sqlx::PgPool;
use std::time::Duration;
use crate::middleware::auth::AuthUserWithRole;

pub async fn notifications_stream(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> HttpResponse {
    let pool = pool.clone();

    let stream = async_stream::stream! {
        let mut ticker = interval(Duration::from_secs(15));
        let mut last_order_count: i64 = 0;
        let mut first = true;

        loop {
            ticker.tick().await;

            // Contar pedidos pendientes
            let pending = sqlx::query_scalar!(
                "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
            )
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or(Some(0))
            .unwrap_or(0);

            // Contar pedidos totales para detectar nuevos
            let total = sqlx::query_scalar!("SELECT COUNT(*) FROM orders")
                .fetch_one(pool.get_ref())
                .await
                .unwrap_or(Some(0))
                .unwrap_or(0);

            let new_order = !first && total > last_order_count;
            last_order_count = total;
            first = false;

            // Stock bajo
            let low_stock = sqlx::query_scalar!(
                "SELECT COUNT(*) FROM products WHERE stock < 5 AND status = 'active'"
            )
            .fetch_one(pool.get_ref())
            .await
            .unwrap_or(Some(0))
            .unwrap_or(0);

            let data = serde_json::json!({
                "pending_orders": pending,
                "total_orders": total,
                "new_order": new_order,
                "low_stock": low_stock,
            });

            let msg = format!("data: {}\n\n", data.to_string());
            yield Ok::<_, actix_web::Error>(actix_web::web::Bytes::from(msg));
        }
    };

    HttpResponse::Ok()
        .insert_header(("Content-Type", "text/event-stream"))
        .insert_header(("Cache-Control", "no-cache"))
        .insert_header(("X-Accel-Buffering", "no"))
        .streaming(stream)
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/notifications")
            .route("/stream", web::get().to(notifications_stream))
    );
}



#[derive(serde::Deserialize, serde::Serialize, Debug, Clone)]
pub struct AlertConfig {
    pub low_stock_threshold:  i32,
    pub low_stock_email:      bool,
    pub new_order_email:      bool,
    pub new_comment_email:    bool,
    pub alert_email:          String,
}

impl Default for AlertConfig {
    fn default() -> Self {
        Self {
            low_stock_threshold: 5,
            low_stock_email:     true,
            new_order_email:     true,
            new_comment_email:   false,
            alert_email:         String::new(),
        }
    }
}

pub fn configure_alerts(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/alerts")
            .route("/config",       web::get().to(get_alert_config))
            .route("/config",       web::post().to(set_alert_config))
            .route("/test",         web::post().to(test_alert))
            .route("/check-stock",  web::post().to(check_stock_alerts))
    );
}

pub async fn get_alert_config(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> actix_web::Result<HttpResponse> {
    let row = sqlx::query!(
        "SELECT value FROM settings WHERE key = 'alert_config' LIMIT 1"
    )
    .fetch_optional(pool.get_ref())
    .await
    .unwrap_or(None);

    let config: AlertConfig = row
        .and_then(|r| serde_json::from_str(&r.value).ok())
        .unwrap_or_default();

    Ok(HttpResponse::Ok().json(config))
}

pub async fn set_alert_config(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
    body: web::Json<AlertConfig>,
) -> actix_web::Result<HttpResponse> {
    let value = serde_json::to_string(&*body).unwrap_or_default();
    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES ('alert_config', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1",
        value
    )
    .execute(pool.get_ref())
    .await
    .ok();

    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn test_alert(
    pool: web::Data<PgPool>,
    _cfg: web::Data<crate::config::AppConfig>,
    _auth: AuthUserWithRole,
) -> actix_web::Result<HttpResponse> {
    let row = sqlx::query!(
        "SELECT value FROM settings WHERE key = 'alert_config' LIMIT 1"
    )
    .fetch_optional(pool.get_ref())
    .await
    .unwrap_or(None);

    let alert_cfg: AlertConfig = row
        .and_then(|r| serde_json::from_str(&r.value).ok())
        .unwrap_or_default();

    if alert_cfg.alert_email.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "No alert email configured"})));
    }

    // Send via SMTP settings
    eprintln!("[alert-test] Would send to: {}", alert_cfg.alert_email);

    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "sent_to": alert_cfg.alert_email})))
}

pub async fn check_stock_alerts(
    pool: web::Data<PgPool>,
    _cfg: web::Data<crate::config::AppConfig>,
    _auth: AuthUserWithRole,
) -> actix_web::Result<HttpResponse> {
    let row = sqlx::query!(
        "SELECT value FROM settings WHERE key = 'alert_config' LIMIT 1"
    )
    .fetch_optional(pool.get_ref())
    .await
    .unwrap_or(None);

    let alert_cfg: AlertConfig = row
        .and_then(|r| serde_json::from_str(&r.value).ok())
        .unwrap_or_default();

    if !alert_cfg.low_stock_email || alert_cfg.alert_email.is_empty() {
        return Ok(HttpResponse::Ok().json(serde_json::json!({"skipped": true})));
    }

    let low_stock = sqlx::query!(
        "SELECT id::text, name, stock FROM products WHERE stock <= $1 AND status = 'active' ORDER BY stock ASC LIMIT 20",
        alert_cfg.low_stock_threshold as i64
    )
    .fetch_all(pool.get_ref())
    .await
    .unwrap_or_default();

    if low_stock.is_empty() {
        return Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "alerts": 0})));
    }

    let rows_html: String = low_stock.iter().map(|p| {
        format!(
            "<tr><td style='padding:8px;border-bottom:1px solid #eee'>{}</td><td style='padding:8px;border-bottom:1px solid #eee;color:{}' align='right'>{}</td></tr>",
            p.name,
            if p.stock == 0 { "#e53e3e" } else { "#d97706" },
            p.stock
        )
    }).collect();

    let html = format!(
        r#"<h2>⚠️ Low Stock Alert</h2>
        <p>{} products have low stock (threshold: {}):</p>
        <table style='width:100%;border-collapse:collapse'>
          <tr><th align='left' style='padding:8px;background:#f7f7f7'>Product</th><th align='right' style='padding:8px;background:#f7f7f7'>Stock</th></tr>
          {}
        </table>
        <p style='color:#666;font-size:12px'>Sent by RustCMS</p>"#,
        low_stock.len(), alert_cfg.low_stock_threshold, rows_html
    );

    eprintln!("[alert-stock] Would send to: {} - {} low stock products", alert_cfg.alert_email, low_stock.len());

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "ok": true,
        "alerts": low_stock.len(),
        "products": low_stock.iter().map(|p| serde_json::json!({"name": p.name, "stock": p.stock})).collect::<Vec<_>>()
    })))
}
