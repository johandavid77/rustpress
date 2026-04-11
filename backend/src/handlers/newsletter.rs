use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;
use crate::services::email_service::EmailService;
use crate::config::AppConfig;

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

pub async fn subscribe(pool: web::Data<PgPool>, body: web::Json<Subscribe>) -> AppResult<HttpResponse> {
    sqlx::query!(
        "INSERT INTO newsletter_subscribers (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET active = true",
        body.email, body.name
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "message": "Suscrito correctamente"})))
}

pub async fn unsubscribe(pool: web::Data<PgPool>, path: web::Path<String>) -> AppResult<HttpResponse> {
    sqlx::query!("UPDATE newsletter_subscribers SET active = false WHERE email = $1", *path)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn list_subscribers(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Subscriber,
        "SELECT id, email, name, active, confirmed, created_at FROM newsletter_subscribers ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    let total = rows.len();
    let active = rows.iter().filter(|s| s.active).count();
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "subscribers": rows,
        "total": total,
        "active": active,
    })))
}

pub async fn delete_subscriber(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM newsletter_subscribers WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn list_campaigns(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Campaign,
        "SELECT id, subject, body, sent_at, sent_count, status, created_at FROM newsletter_campaigns ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

pub async fn create_campaign(pool: web::Data<PgPool>, _auth: AuthUserWithRole, body: web::Json<CreateCampaign>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(Campaign,
        "INSERT INTO newsletter_campaigns (subject, body) VALUES ($1, $2) RETURNING id, subject, body, sent_at, sent_count, status, created_at",
        body.subject, body.body
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(row))
}

pub async fn delete_campaign(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM newsletter_campaigns WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn send_campaign(
    pool: web::Data<PgPool>,
    cfg: web::Data<AppConfig>,
    _auth: AuthUserWithRole,
    path: web::Path<uuid::Uuid>,
) -> AppResult<HttpResponse> {
    let campaign = sqlx::query!(
        "SELECT subject, body FROM newsletter_campaigns WHERE id = $1", *path
    ).fetch_one(pool.get_ref()).await?;

    let subscribers = sqlx::query!(
        "SELECT email, name FROM newsletter_subscribers WHERE active = true"
    ).fetch_all(pool.get_ref()).await?;

    let count = subscribers.len() as i32;

    if !cfg.smtp_host.is_empty() && !cfg.smtp_username.is_empty() {
        let mailer = EmailService::new(
            &cfg.smtp_host,
            cfg.smtp_port,
            &cfg.smtp_username,
            &cfg.smtp_password,
            &cfg.smtp_from,
        );

        let mut sent = 0i32;
        for sub in &subscribers {
            let unsub = format!("/newsletter/unsubscribe/{}", sub.email);
            let footer = "<br><hr><p>Recibes este email porque te suscribiste a RustCMS. <a href='".to_string() + &unsub + "'>Desuscribirse</a></p>";
            let body = campaign.body.clone() + &footer;
            match mailer.send(&sub.email, &campaign.subject, body).await {
                Ok(_) => sent += 1,
                Err(e) => tracing::warn!("Failed to send to {}: {}", sub.email, e),
            }
        }

        sqlx::query!(
            "UPDATE newsletter_campaigns SET status = $1, sent_at = NOW(), sent_count = $2 WHERE id = $3",
            "sent", sent, *path
        ).execute(pool.get_ref()).await?;

        Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "sent_to": sent, "total": count})))
    } else {
        sqlx::query!(
            "UPDATE newsletter_campaigns SET status = $1, sent_at = NOW(), sent_count = $2 WHERE id = $3",
            "sent", count, *path
        ).execute(pool.get_ref()).await?;
        tracing::info!("Newsletter simulated to {} subscribers (no SMTP configured)", count);
        Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "sent_to": count, "simulated": true})))
    }
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
