use crate::email::{Mailer, templates};
use actix_web::{web, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Deserialize)]
pub struct CreateOrderDto {
    pub shipping_addr: Option<serde_json::Value>,
    pub notes:         Option<String>,
    pub coupon_code:   Option<String>,
}

#[derive(Deserialize)]
pub struct OrderQuery {
    pub page:    Option<i64>,
    pub status:  Option<String>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/orders")
            .route("",        web::get().to(list_orders))
            .route("",        web::post().to(create_order))
            .route("/{id}",   web::get().to(get_order))
            .route("/{id}/status", web::put().to(update_status))
                .route("/my",        web::get().to(my_orders))
    );
}

async fn list_orders(
    pool:  web::Data<PgPool>,
    auth:  AuthUserWithRole,
    query: web::Query<OrderQuery>,
) -> AppResult<HttpResponse> {
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = 20i64;
    let offset   = (page - 1) * per_page;

    let rows = sqlx::query!(
        r#"SELECT id, status, total, currency, payment_method, created_at
           FROM orders
           WHERE user_id = $1
             AND ($2::text IS NULL OR status = $2)
           ORDER BY created_at DESC
           LIMIT $3 OFFSET $4"#,
        auth.user_id,
        query.status.as_deref(),
        per_page, offset,
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|o| serde_json::json!({
        "id":             o.id,
        "status":         o.status,
        "total":          o.total,
        "currency":       o.currency,
        "payment_method": o.payment_method,
        "created_at":     o.created_at,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({"data": data, "page": page})))
}

async fn get_order(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let order = sqlx::query!(
        "SELECT id, status, total, subtotal, discount, shipping, currency,
                payment_method, payment_ref, notes, shipping_addr, created_at
         FROM orders WHERE id = $1 AND user_id = $2",
        *id, auth.user_id
    ).fetch_optional(pool.get_ref()).await?;

    let Some(o) = order else {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Not found"})));
    };

    let items = sqlx::query!(
        "SELECT id, name, sku, quantity, price, total FROM order_items WHERE order_id = $1",
        *id
    ).fetch_all(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "id":             o.id,
        "status":         o.status,
        "total":          o.total,
        "subtotal":       o.subtotal,
        "discount":       o.discount,
        "shipping":       o.shipping,
        "currency":       o.currency,
        "payment_method": o.payment_method,
        "payment_ref":    o.payment_ref,
        "notes":          o.notes,
        "shipping_addr":  o.shipping_addr,
        "created_at":     o.created_at,
        "items": items.iter().map(|i| serde_json::json!({
            "id":       i.id,
            "name":     i.name,
            "sku":      i.sku,
            "quantity": i.quantity,
            "price":    i.price,
            "total":    i.total,
        })).collect::<Vec<_>>(),
    })))
}

async fn create_order(
    pool:   web::Data<PgPool>,
    auth:   AuthUserWithRole,
    body:   web::Json<CreateOrderDto>,
    mailer: web::Data<Option<crate::email::Mailer>>,
) -> AppResult<HttpResponse> {
    // Obtener carrito del usuario
    let cart = sqlx::query!(
        "SELECT id FROM carts WHERE user_id = $1", auth.user_id
    ).fetch_optional(pool.get_ref()).await?;

    let Some(cart) = cart else {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error":"Carrito vacío"})));
    };

    let items = sqlx::query!(
        r#"SELECT ci.id, ci.quantity, ci.price, ci.product_id,
                  p.name, p.sku, p.stock, p.track_stock
           FROM cart_items ci JOIN products p ON p.id = ci.product_id
           WHERE ci.cart_id = $1"#,
        cart.id
    ).fetch_all(pool.get_ref()).await?;

    if items.is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error":"Carrito vacío"})));
    }

    // Calcular subtotal
    let subtotal: f64 = items.iter().map(|i| i.price * i.quantity as f64).sum();
    let mut discount = 0f64;

    // Aplicar cupón si existe
    if let Some(code) = &body.coupon_code {
        let coupon = sqlx::query!(
        "SELECT id, discount_type, discount_value::float8 as value, min_order_amount::float8 as min_order, max_uses, used_count as uses
         FROM coupons WHERE code = $1 AND active = true AND (expires_at IS NULL OR expires_at > NOW())",

            code
        ).fetch_optional(pool.get_ref()).await?;

        if let Some(c) = coupon {
            let valid_min = c.min_order.map(|m| subtotal >= m).unwrap_or(true);
            let valid_uses = c.max_uses.map(|m| c.uses < m).unwrap_or(true);
            if valid_min && valid_uses {
                discount = if c.discount_type == "percent" {
                    subtotal * c.value.unwrap_or(0.0) / 100.0
                } else {
                    c.value.unwrap_or(0.0).min(subtotal)
                };
                sqlx::query!("UPDATE coupons SET used_count = used_count + 1 WHERE id = $1", c.id)
                    .execute(pool.get_ref()).await?;
            }
        }
    }

    let total = (subtotal - discount).max(0.0);

    let mut tx = pool.begin().await?;

    // Crear orden
    let order = sqlx::query!(
        "INSERT INTO orders (user_id, subtotal, discount, total, shipping_addr, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        auth.user_id, subtotal, discount, total,
        body.shipping_addr, body.notes
    ).fetch_one(&mut *tx).await?;

    // Insertar items y descontar stock
    for item in &items {
        sqlx::query!(
            "INSERT INTO order_items (order_id, product_id, name, sku, quantity, price, total)
             VALUES ($1, $2, $3, $4, $5, $6, $7)",
            order.id, item.product_id, item.name, item.sku,
            item.quantity, item.price, item.price * item.quantity as f64,
        ).execute(&mut *tx).await?;

        if item.track_stock {
            sqlx::query!(
                "UPDATE products SET stock = stock - $1 WHERE id = $2",
                item.quantity, item.product_id
            ).execute(&mut *tx).await?;
        }
    }

    // Vaciar carrito
    sqlx::query!("DELETE FROM cart_items WHERE cart_id = $1", cart.id)
        .execute(&mut *tx).await?;

    tx.commit().await?;

    // Enviar email de confirmación en background
    if let Some(mailer) = mailer.as_ref() {
        if let Ok(user) = sqlx::query!("SELECT email, username FROM users WHERE id = $1", auth.user_id)
            .fetch_one(pool.get_ref()).await {
            let items_html = items.iter().map(|i| format!(
                "<div style='display:flex;justify-content:space-between;padding:4px 0'><span>{} ×{}</span><span>${:.2}</span></div>",
                i.name, i.quantity, i.price * i.quantity as f64
            )).collect::<Vec<_>>().join("");
            let (subject, html) = templates::order_confirmed(&order.id.to_string(), total, &items_html, &user.username);
            mailer.send_bg(user.email, subject, html);
        }
    }
    
    Ok(HttpResponse::Created().json(serde_json::json!({
        "order_id": order.id,
        "total":    total,
        "status":   "pending",
    })))
}

#[derive(Deserialize)]
struct StatusBody { status: String }

async fn update_status(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body: web::Json<StatusBody>,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
        body.status, *id
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn my_orders(
    pool: web::Data<sqlx::PgPool>,
    auth: crate::middleware::auth::AuthUserWithRole,
) -> crate::errors::AppResult<actix_web::HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT id::text, status, subtotal, discount, total,
                  shipping_addr, notes, created_at
           FROM orders WHERE user_id = $1
           ORDER BY created_at DESC LIMIT 50"#,
        auth.user_id
    )
    .fetch_all(pool.get_ref())
    .await?;

    let orders: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "id":           r.id,
        "status":       r.status,
        "subtotal":     r.subtotal,
        "discount":     r.discount,
        "total":        r.total,
        "shipping_addr":r.shipping_addr,
        "notes":        r.notes,
        "created_at":   r.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
    })).collect();

    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({ "data": orders })))
}
