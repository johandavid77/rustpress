use actix_web::{web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Deserialize)]
pub struct AddToCart {
    pub product_id: Uuid,
    pub variant_id: Option<Uuid>,
    pub quantity:   i32,
}

#[derive(Deserialize)]
pub struct UpdateCartItem {
    pub quantity: i32,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/cart")
            .route("",           web::get().to(get_cart))
            .route("/items",     web::post().to(add_item))
            .route("/items/{id}", web::put().to(update_item))
            .route("/items/{id}", web::delete().to(remove_item))
            .route("",           web::delete().to(clear_cart))
    );
}

async fn get_or_create_cart(pool: &PgPool, user_id: Uuid) -> Result<Uuid, sqlx::Error> {
    let existing = sqlx::query!(
        "SELECT id FROM carts WHERE user_id = $1", user_id
    ).fetch_optional(pool).await?;

    if let Some(c) = existing {
        return Ok(c.id);
    }

    let c = sqlx::query!(
        "INSERT INTO carts (user_id) VALUES ($1) RETURNING id", user_id
    ).fetch_one(pool).await?;
    Ok(c.id)
}

async fn get_cart(pool: web::Data<PgPool>, auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let cart_id = get_or_create_cart(&pool, auth.user_id).await?;

    let items = sqlx::query!(
        r#"SELECT ci.id, ci.quantity, ci.price,
                  p.id as product_id, p.name, p.slug, p.images
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           WHERE ci.cart_id = $1"#,
        cart_id
    ).fetch_all(pool.get_ref()).await?;

    let total: f64 = items.iter().map(|i| i.price * i.quantity as f64).sum();

    let data: Vec<_> = items.iter().map(|i| serde_json::json!({
        "id":         i.id,
        "product_id": i.product_id,
        "name":       i.name,
        "slug":       i.slug,
        "images":     i.images,
        "quantity":   i.quantity,
        "price":      i.price,
        "subtotal":   i.price * i.quantity as f64,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "cart_id": cart_id,
        "items":   data,
        "total":   total,
        "count":   items.len(),
    })))
}

async fn add_item(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
    body: web::Json<AddToCart>,
) -> AppResult<HttpResponse> {
    let cart_id = get_or_create_cart(&pool, auth.user_id).await?;

    // Obtener precio del producto
    let product = sqlx::query!(
        "SELECT price, stock, track_stock FROM products WHERE id = $1 AND status = 'active'",
        body.product_id
    ).fetch_optional(pool.get_ref()).await?;

    let Some(p) = product else {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Producto no disponible"})));
    };

    if p.track_stock && p.stock < body.quantity {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Stock insuficiente"})));
    }

    sqlx::query!(
        r#"INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (cart_id, product_id, variant_id)
           DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity"#,
        cart_id, body.product_id, body.variant_id, body.quantity, p.price
    ).execute(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn update_item(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
    auth: AuthUserWithRole,
    body: web::Json<UpdateCartItem>,
) -> AppResult<HttpResponse> {
    if body.quantity <= 0 {
        sqlx::query!("DELETE FROM cart_items WHERE id = $1", *id)
            .execute(pool.get_ref()).await?;
    } else {
        sqlx::query!(
            "UPDATE cart_items SET quantity = $1 WHERE id = $2",
            body.quantity, *id
        ).execute(pool.get_ref()).await?;
    }
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn remove_item(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM cart_items WHERE id = $1", *id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}

async fn clear_cart(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        "DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)",
        auth.user_id
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}
