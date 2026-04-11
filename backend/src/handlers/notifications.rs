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
