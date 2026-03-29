use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppResult,
    models::webhook::{Webhook, CreateWebhookDto},
    middleware::auth::AuthUserWithRole,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/webhooks")
            .route("",      web::get().to(list_webhooks))
            .route("",      web::post().to(create_webhook))
            .route("/{id}", web::delete().to(delete_webhook))
            .route("/{id}/toggle", web::post().to(toggle_webhook)),
    );
}

async fn list_webhooks(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let webhooks = sqlx::query_as!(
        Webhook,
        "SELECT * FROM webhooks ORDER BY created_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await?;
    Ok(HttpResponse::Ok().json(webhooks))
}

async fn create_webhook(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
    body: web::Json<CreateWebhookDto>,
) -> AppResult<HttpResponse> {
    let webhook = sqlx::query_as!(
        Webhook,
        "INSERT INTO webhooks (name, url, event, secret) VALUES ($1, $2, $3, $4) RETURNING *",
        body.name,
        body.url,
        body.event.clone().unwrap_or_else(|| "post.published".into()),
        body.secret
    )
    .fetch_one(pool.get_ref())
    .await?;
    Ok(HttpResponse::Created().json(webhook))
}

async fn delete_webhook(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM webhooks WHERE id = $1", *id)
        .execute(pool.get_ref())
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

async fn toggle_webhook(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let webhook = sqlx::query_as!(
        Webhook,
        "UPDATE webhooks SET active = NOT active WHERE id = $1 RETURNING *",
        *id
    )
    .fetch_one(pool.get_ref())
    .await?;
    Ok(HttpResponse::Ok().json(webhook))
}

// — Disparar webhooks (llamado internamente al publicar)
pub async fn fire_webhooks(pool: &PgPool, event: &str, payload: serde_json::Value) {
    let Ok(webhooks) = sqlx::query_as!(
        Webhook,
        "SELECT * FROM webhooks WHERE event = $1 AND active = true",
        event
    )
    .fetch_all(pool)
    .await else { return };

    let client = reqwest::Client::new();
    for wh in webhooks {
        let _ = client
            .post(&wh.url)
            .json(&payload)
            .timeout(std::time::Duration::from_secs(5))
            .send()
            .await;
    }
}
