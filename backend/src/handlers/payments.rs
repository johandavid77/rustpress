use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};
use crate::payments::{
    gateway::PaymentIntent,
    stripe::StripeGateway,
    paypal::PayPalGateway,
    PaymentGateway,
};

#[derive(Deserialize)]
pub struct InitPaymentDto {
    pub order_id: Uuid,
    pub gateway:  String, // "stripe" | "paypal"
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/payments")
            .route("/init",              web::post().to(init_payment))
            .route("/stripe/webhook",    web::post().to(stripe_webhook))
            .route("/paypal/webhook",    web::post().to(paypal_webhook))
            .route("/status/{order_id}", web::get().to(payment_status))
    );
}

fn get_stripe() -> StripeGateway {
    StripeGateway::new(
        std::env::var("STRIPE_SECRET_KEY").unwrap_or_default(),
        std::env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_default(),
    )
}

fn get_paypal() -> PayPalGateway {
    let sandbox = std::env::var("PAYPAL_SANDBOX").unwrap_or("true".into()) == "true";
    PayPalGateway::new(
        std::env::var("PAYPAL_CLIENT_ID").unwrap_or_default(),
        std::env::var("PAYPAL_CLIENT_SECRET").unwrap_or_default(),
        sandbox,
    )
}

async fn init_payment(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
    body: web::Json<InitPaymentDto>,
) -> AppResult<HttpResponse> {
    // Obtener la orden
    let order = sqlx::query!(
        "SELECT id, total, currency, status FROM orders WHERE id = $1 AND user_id = $2",
        body.order_id, auth.user_id
    ).fetch_optional(pool.get_ref()).await?;

    let Some(order) = order else {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Orden no encontrada"})));
    };

    if order.status != "pending" {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "La orden ya fue procesada"})));
    }

    let intent = PaymentIntent {
        order_id:    order.id,
        amount:      order.total,
        currency:    order.currency.to_lowercase(),
        description: format!("Orden #{}", order.id.to_string().split('-').next().unwrap_or("")),
        metadata:    serde_json::json!({"order_id": order.id}),
    };

    let result = match body.gateway.as_str() {
        "stripe" => get_stripe().create_payment(intent).await
            .map_err(|e| crate::errors::AppError::Internal(e.to_string()))?,
        "paypal" => get_paypal().create_payment(intent).await
            .map_err(|e| crate::errors::AppError::Internal(e.to_string()))?,
        _ => return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Gateway no soportado"}))),
    };

    // Guardar referencia de pago en la orden
    sqlx::query!(
        "UPDATE orders SET payment_method = $1, payment_ref = $2 WHERE id = $3",
        body.gateway, result.external_id, order.id
    ).execute(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "gateway":      result.gateway,
        "external_id":  result.external_id,
        "status":       result.status.to_string(),
        "checkout_url": result.checkout_url,
    })))
}

async fn stripe_webhook(
    req:  HttpRequest,
    body: web::Bytes,
    pool: web::Data<PgPool>,
) -> AppResult<HttpResponse> {
    let sig = req.headers()
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let result = get_stripe().handle_webhook(&body, sig).await
        .map_err(|e| crate::errors::AppError::Internal(e.to_string()))?;

    update_order_payment(&pool, &result.external_id, &result.status.to_string(), "stripe").await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({"received": true})))
}

async fn paypal_webhook(
    body: web::Bytes,
    pool: web::Data<PgPool>,
) -> AppResult<HttpResponse> {
    let result = get_paypal().handle_webhook(&body, "").await
        .map_err(|e| crate::errors::AppError::Internal(e.to_string()))?;

    update_order_payment(&pool, &result.external_id, &result.status.to_string(), "paypal").await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({"received": true})))
}

async fn payment_status(
    pool:     web::Data<PgPool>,
    order_id: web::Path<Uuid>,
    auth:     AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let order = sqlx::query!(
        "SELECT id, status, payment_method, payment_ref, total FROM orders WHERE id = $1 AND user_id = $2",
        *order_id, auth.user_id
    ).fetch_optional(pool.get_ref()).await?;

    match order {
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"}))),
        Some(o) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "order_id":       o.id,
            "status":         o.status,
            "payment_method": o.payment_method,
            "payment_ref":    o.payment_ref,
            "total":          o.total,
        }))),
    }
}

async fn update_order_payment(
    pool:       &PgPool,
    payment_ref: &str,
    status:     &str,
    _gateway:   &str,
) -> Result<(), sqlx::Error> {
    let order_status = match status {
        "completed" => "paid",
        "failed"    => "cancelled",
        "refunded"  => "refunded",
        _           => return Ok(()),
    };
    sqlx::query!(
        "UPDATE orders SET status = $1, updated_at = NOW() WHERE payment_ref = $2",
        order_status, payment_ref
    ).execute(pool).await?;
    Ok(())
}
