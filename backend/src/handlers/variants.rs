use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Deserialize, Serialize)]
pub struct VariantDto {
    pub name:       String,
    pub options:    serde_json::Value,
    pub sku:        Option<String>,
    pub price:      Option<f64>,
    pub stock:      i32,
    pub image:      Option<String>,
    pub sort_order: Option<i32>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/products/{product_id}/variants")
            .route("",      web::get().to(list))
            .route("",      web::post().to(create))
            .route("/{id}", web::put().to(update))
            .route("/{id}", web::delete().to(delete))
    );
}

async fn list(
    pool:       web::Data<PgPool>,
    product_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as::<_, (Uuid, String, serde_json::Value, Option<String>, Option<f64>, i32, Option<String>, i32)>(
        "SELECT id, name, options, sku, price, stock, image, sort_order
         FROM product_variants WHERE product_id = $1 ORDER BY sort_order, created_at"
    )
    .bind(*product_id)
    .fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.0, "name": r.1, "options": r.2,
        "sku": r.3, "price": r.4, "stock": r.5,
        "image": r.6, "sort_order": r.7,
    })).collect();

    Ok(HttpResponse::Ok().json(data))
}

async fn create(
    pool:       web::Data<PgPool>,
    product_id: web::Path<Uuid>,
    body:       web::Json<VariantDto>,
    _auth:      AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let id: (Uuid,) = sqlx::query_as(
        "INSERT INTO product_variants (product_id, name, options, sku, price, stock, image, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id"
    )
    .bind(*product_id)
    .bind(&body.name)
    .bind(&body.options)
    .bind(&body.sku)
    .bind(body.price)
    .bind(body.stock)
    .bind(&body.image)
    .bind(body.sort_order.unwrap_or(0))
    .fetch_one(pool.get_ref()).await?;

    Ok(HttpResponse::Created().json(serde_json::json!({"id": id.0})))
}

async fn update(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
    body: web::Json<VariantDto>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let (_, id) = path.into_inner();
    sqlx::query(
        "UPDATE product_variants SET name=$1,options=$2,sku=$3,price=$4,stock=$5,image=$6,sort_order=$7 WHERE id=$8"
    )
    .bind(&body.name).bind(&body.options).bind(&body.sku)
    .bind(body.price).bind(body.stock).bind(&body.image)
    .bind(body.sort_order.unwrap_or(0)).bind(id)
    .execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn delete(
    pool:  web::Data<PgPool>,
    path:  web::Path<(Uuid, Uuid)>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let (_, id) = path.into_inner();
    sqlx::query("DELETE FROM product_variants WHERE id=$1")
        .bind(id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}
