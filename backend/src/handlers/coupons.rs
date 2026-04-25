use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::middleware::auth::{AuthUserWithRole, AuthUser};

#[derive(Deserialize, Serialize)]
pub struct CreateCoupon {
    pub code: String,
    pub discount_type: String,
    pub discount_value: f64,
    pub min_order_amount: Option<f64>,
    pub max_uses: Option<i32>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize)]
pub struct ApplyCoupon {
    pub code: String,
    pub order_amount: f64,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/coupons")
            .route("",       web::get().to(list_coupons))
            .route("",       web::post().to(create_coupon))
            .route("/apply", web::post().to(apply_coupon))
            .route("/{id}",  web::delete().to(delete_coupon))
    );
}

async fn list_coupons(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> crate::errors::AppResult<HttpResponse> {
    let rows = sqlx::query!(
        "SELECT id::text, code, discount_type, discount_value::float8 as dv,
                min_order_amount::float8 as moa,
                max_uses, used_count, expires_at, active, created_at
         FROM coupons ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;

    let data = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "code": r.code, "discount_type": r.discount_type,
        "discount_value": r.dv, "min_order_amount": r.moa,
        "max_uses": r.max_uses, "used_count": r.used_count,
        "expires_at": r.expires_at.map(|d| d.format("%Y-%m-%d %H:%M:%S").to_string()),
        "active": r.active.unwrap_or(true),
        "created_at": r.created_at.format("%Y-%m-%d").to_string(),
    })).collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(serde_json::json!({"data": data})))
}

async fn create_coupon(
    pool: web::Data<PgPool>, _auth: AuthUserWithRole, body: web::Json<CreateCoupon>
) -> crate::errors::AppResult<HttpResponse> {
    let id = sqlx::query_scalar!(
        "INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::text",
        body.code.to_uppercase(), body.discount_type, body.discount_value,
        body.min_order_amount, body.max_uses, body.expires_at
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(serde_json::json!({"id": id, "code": body.code.to_uppercase()})))
}

async fn apply_coupon(
    pool: web::Data<PgPool>, _auth: AuthUser, body: web::Json<ApplyCoupon>
) -> crate::errors::AppResult<HttpResponse> {
    let c = sqlx::query!(
        "SELECT discount_type, discount_value::float8 as dv, min_order_amount::float8 as moa,
                max_uses, used_count, expires_at, active
         FROM coupons WHERE code = $1",
        body.code.to_uppercase()
    ).fetch_optional(pool.get_ref()).await?;

    let c = match c {
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Cupón no encontrado"}))),
        Some(c) => c,
    };

    if !c.active.unwrap_or(false) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Cupón inactivo"})));
    }
    if let Some(exp) = c.expires_at {
        if exp < chrono::Utc::now() {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Cupón expirado"})));
        }
    }
    if let Some(max) = c.max_uses {
        if c.used_count >= max {
            return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Cupón agotado"})));
        }
    }
    if body.order_amount < c.moa {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Monto mínimo no alcanzado"})));
    }

    let dv = c.dv;
    let discount = if c.discount_type == "percent" {
        (body.order_amount * dv) / 100.0
    } else { dv };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "valid": true, "discount": discount,
        "final_amount": (body.order_amount - discount).max(0.0),
        "type": c.discount_type,
    })))
}

async fn delete_coupon(
    pool: web::Data<PgPool>, _auth: AuthUserWithRole, id: web::Path<uuid::Uuid>
) -> crate::errors::AppResult<HttpResponse> {
    sqlx::query!("UPDATE coupons SET active = FALSE WHERE id = $1", *id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}
