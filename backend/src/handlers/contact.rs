use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;
use crate::services::email_service::EmailService;
use crate::config::AppConfig;

#[derive(Serialize, sqlx::FromRow)]
pub struct ContactForm {
    pub id: uuid::Uuid,
    pub name: String,
    pub slug: String,
    pub fields: serde_json::Value,
    pub email_to: String,
    pub active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct Submission {
    pub id: uuid::Uuid,
    pub form_id: uuid::Uuid,
    pub data: serde_json::Value,
    pub read: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct CreateForm {
    pub name: String,
    pub slug: String,
    pub fields: serde_json::Value,
    pub email_to: String,
}

#[derive(Deserialize)]
pub struct UpdateForm {
    pub name: Option<String>,
    pub fields: Option<serde_json::Value>,
    pub email_to: Option<String>,
    pub active: Option<bool>,
}

// Publico: listar formularios activos
pub async fn list_public_forms(pool: web::Data<PgPool>) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(ContactForm,
        "SELECT id, name, slug, fields, email_to, active, created_at FROM contact_forms WHERE active = true ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

// Publico: obtener formulario por slug
pub async fn get_form_by_slug(pool: web::Data<PgPool>, path: web::Path<String>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(ContactForm,
        "SELECT id, name, slug, fields, email_to, active, created_at FROM contact_forms WHERE slug = $1 AND active = true",
        *path
    ).fetch_optional(pool.get_ref()).await?;
    match row {
        Some(f) => Ok(HttpResponse::Ok().json(f)),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Form not found"}))),
    }
}

// Publico: enviar submission
pub async fn submit_form(
    pool: web::Data<PgPool>,
    cfg: web::Data<AppConfig>,
    path: web::Path<uuid::Uuid>,
    body: web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    let form = sqlx::query!(
        "SELECT name, email_to FROM contact_forms WHERE id = $1 AND active = true", *path
    ).fetch_optional(pool.get_ref()).await?;

    let form = match form {
        Some(f) => f,
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Form not found"}))),
    };

    sqlx::query!(
        "INSERT INTO contact_submissions (form_id, data) VALUES ($1, $2)",
        *path, body.0
    ).execute(pool.get_ref()).await?;

    // Enviar email de notificacion
    if !cfg.smtp_host.is_empty() && !cfg.smtp_username.is_empty() {
        let mailer = EmailService::new(
            &cfg.smtp_host, cfg.smtp_port, &cfg.smtp_username, &cfg.smtp_password, &cfg.smtp_from,
        );
        let data_str = serde_json::to_string_pretty(&body.0).unwrap_or_default();
        let email_body = format!(
            "<h2>Nuevo mensaje del formulario: {}</h2><pre>{}</pre>",
            form.name, data_str
        );
        let _ = mailer.send(&form.email_to, &format!("Nuevo contacto: {}", form.name), email_body).await;
    }

    Ok(HttpResponse::Created().json(serde_json::json!({"ok": true, "message": "Mensaje enviado correctamente"})))
}

// Admin: listar formularios
pub async fn list_forms(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(ContactForm,
        "SELECT id, name, slug, fields, email_to, active, created_at FROM contact_forms ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

// Admin: crear formulario
pub async fn create_form(pool: web::Data<PgPool>, _auth: AuthUserWithRole, body: web::Json<CreateForm>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(ContactForm,
        "INSERT INTO contact_forms (name, slug, fields, email_to) VALUES ($1, $2, $3, $4) RETURNING id, name, slug, fields, email_to, active, created_at",
        body.name, body.slug, body.fields, body.email_to
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(row))
}

// Admin: actualizar formulario
pub async fn update_form(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>, body: web::Json<UpdateForm>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(ContactForm,
        "UPDATE contact_forms SET
            name = COALESCE($1, name),
            fields = COALESCE($2, fields),
            email_to = COALESCE($3, email_to),
            active = COALESCE($4, active)
         WHERE id = $5
         RETURNING id, name, slug, fields, email_to, active, created_at",
        body.name, body.fields, body.email_to, body.active, *path
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(row))
}

// Admin: eliminar formulario
pub async fn delete_form(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM contact_forms WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

// Admin: listar submissions de un formulario
pub async fn list_submissions(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Submission,
        "SELECT id, form_id, data, read, created_at FROM contact_submissions WHERE form_id = $1 ORDER BY created_at DESC",
        *path
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

// Admin: marcar submission como leida
pub async fn mark_read(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("UPDATE contact_submissions SET read = true WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

// Admin: eliminar submission
pub async fn delete_submission(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM contact_submissions WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/contact")
            .route("/forms", web::get().to(list_public_forms))
            .route("/forms/{slug}/view", web::get().to(get_form_by_slug))
            .route("/forms/{id}/submit", web::post().to(submit_form))
            .route("/admin/forms", web::get().to(list_forms))
            .route("/admin/forms", web::post().to(create_form))
            .route("/admin/forms/{id}", web::put().to(update_form))
            .route("/admin/forms/{id}", web::delete().to(delete_form))
            .route("/admin/forms/{id}/submissions", web::get().to(list_submissions))
            .route("/admin/submissions/{id}/read", web::post().to(mark_read))
            .route("/admin/submissions/{id}", web::delete().to(delete_submission))
    );
}
