use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Serialize, sqlx::FromRow)]
pub struct Subscriber {
    pub id: uuid::Uuid,
    pub email: String,
    pub name: Option<String>,
    pub active: bool,
    pub confirmed: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Campaign {
    pub id: uuid::Uuid,
    pub subject: String,
    pub body: String,
    pub sent_at: Option<chrono::DateTime<chrono::Utc>>,
    pub sent_count: i32,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct Subscribe {
    pub email: String,
    pub name: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateCampaign {
    pub subject: String,
    pub body: String,
}

// Publico: suscribirse
pub async fn subscribe(pool: web::Data<PgPool>, body: web::Json<Subscribe>) -> AppResult<HttpResponse> {
    sqlx::query!(
        "INSERT INTO newsletter_subscribers (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET active = true",
        body.email, body.name
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "message": "Suscrito correctamente"})))
}

// Publico: desuscribirse
pub async fn unsubscribe(pool: web::Data<PgPool>, path: web::Path<String>) -> AppResult<HttpResponse> {
    sqlx::query!("UPDATE newsletter_subscribers SET active = false WHERE email = $1", *path)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

// Admin: listar suscriptores
pub async fn list_subscribers(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Subscriber,
        "SELECT id, email, name, active, confirmed, created_at FROM newsletter_subscribers ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "subscribers": rows,
        "total": rows.len(),
        "active": rows.iter().filter(|s| s.active).count(),
    })))
}

// Admin: eliminar suscriptor
pub async fn delete_subscriber(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM newsletter_subscribers WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

// Admin: listar campanas
pub async fn list_campaigns(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Campaign,
        "SELECT id, subject, body, sent_at, sent_count, status, created_at FROM newsletter_campaigns ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

// Admin: crear campana
pub async fn create_campaign(pool: web::Data<PgPool>, _auth: AuthUserWithRole, body: web::Json<CreateCampaign>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(Campaign,
        "INSERT INTO newsletter_campaigns (subject, body) VALUES ($1, $2) RETURNING id, subject, body, sent_at, sent_count, status, created_at",
        body.subject, body.body
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(row))
}

// Admin: eliminar campana
pub async fn delete_campaign(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM newsletter_campaigns WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

// Admin: enviar campana (simulado - log)
pub async fn send_campaign(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    let count = sqlx::query_scalar!("SELECT COUNT(*) FROM newsletter_subscribers WHERE active = true")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);

    sqlx::query!(
        "UPDATE newsletter_campaigns SET status = 'sent', sent_at = NOW(), sent_count = $1 WHERE id = $2",
        count as i32, *path
    ).execute(pool.get_ref()).await?;

    tracing::info!("Newsletter campaign {} sent to {} subscribers", path, count);
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "sent_to": count})))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/newsletter")
            .route("/subscribe", web::post().to(subscribe))
            .route("/unsubscribe/{email}", web::post().to(unsubscribe))
            .route("/subscribers", web::get().to(list_subscribers))
            .route("/subscribers/{id}", web::delete().to(delete_subscriber))
            .route("/campaigns", web::get().to(list_campaigns))
            .route("/campaigns", web::post().to(create_campaign))
            .route("/campaigns/{id}", web::delete().to(delete_campaign))
            .route("/campaigns/{id}/send", web::post().to(send_campaign))
    );
}
