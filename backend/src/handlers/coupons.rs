use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Serialize, sqlx::FromRow)]
pub struct Coupon {
    pub id: uuid::Uuid,
    pub code: String,
    pub r#type: String,
    pub value: f64,
    pub min_order: Option<f64>,
    pub max_uses: Option<i32>,
    pub uses: i32,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct CreateCoupon {
    pub code: String,
    pub r#type: String,
    pub value: f64,
    pub min_order: Option<f64>,
    pub max_uses: Option<i32>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize)]
pub struct UpdateCoupon {
    pub value: Option<f64>,
    pub min_order: Option<f64>,
    pub max_uses: Option<i32>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub active: Option<bool>,
}

pub async fn list_coupons(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Coupon,
        r#"SELECT id, code, type as "type", value, min_order, max_uses, uses, expires_at, active, created_at
           FROM coupons ORDER BY created_at DESC"#
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

pub async fn create_coupon(pool: web::Data<PgPool>, _auth: AuthUserWithRole, body: web::Json<CreateCoupon>) -> AppResult<HttpResponse> {
    let code = body.code.to_uppercase();
    let row = sqlx::query_as!(Coupon,
        r#"INSERT INTO coupons (code, type, value, min_order, max_uses, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, code, type as "type", value, min_order, max_uses, uses, expires_at, active, created_at"#,
        code, body.r#type, body.value, body.min_order, body.max_uses, body.expires_at
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(row))
}

pub async fn update_coupon(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>, body: web::Json<UpdateCoupon>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(Coupon,
        r#"UPDATE coupons SET
            value = COALESCE($1, value),
            min_order = COALESCE($2, min_order),
            max_uses = COALESCE($3, max_uses),
            expires_at = COALESCE($4, expires_at),
            active = COALESCE($5, active)
           WHERE id = $6
           RETURNING id, code, type as "type", value, min_order, max_uses, uses, expires_at, active, created_at"#,
        body.value, body.min_order, body.max_uses, body.expires_at, body.active, *path
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(row))
}

pub async fn delete_coupon(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM coupons WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn toggle_coupon(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(Coupon,
        r#"UPDATE coupons SET active = NOT active WHERE id = $1
           RETURNING id, code, type as "type", value, min_order, max_uses, uses, expires_at, active, created_at"#,
        *path
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(row))
}

// Publico: validar cupon
pub async fn validate_coupon(pool: web::Data<PgPool>, path: web::Path<String>) -> AppResult<HttpResponse> {
    let code = path.to_uppercase();
    let row = sqlx::query_as!(Coupon,
        r#"SELECT id, code, type as "type", value, min_order, max_uses, uses, expires_at, active, created_at
           FROM coupons WHERE code = $1 AND active = true"#,
        code
    ).fetch_optional(pool.get_ref()).await?;

    match row {
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Cupon no valido o inactivo"}))),
        Some(c) => {
            if let Some(max) = c.max_uses {
                if c.uses >= max {
                    return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Cupon agotado"})));
                }
            }
            if let Some(exp) = c.expires_at {
                if exp < chrono::Utc::now() {
                    return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Cupon expirado"})));
                }
            }
            Ok(HttpResponse::Ok().json(c))
        }
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/coupons")
            .route("", web::get().to(list_coupons))
            .route("", web::post().to(create_coupon))
            .route("/validate/{code}", web::get().to(validate_coupon))
            .route("/{id}", web::put().to(update_coupon))
            .route("/{id}", web::delete().to(delete_coupon))
            .route("/{id}/toggle", web::post().to(toggle_coupon))
    );
}
