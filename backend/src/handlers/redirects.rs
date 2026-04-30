use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Redirect {
    pub id: uuid::Uuid,
    pub from_path: String,
    pub to_path: String,
    pub status_code: Option<i32>,
    pub active: Option<bool>,
    pub hits: Option<i32>,
}

#[derive(Deserialize)]
pub struct CreateRedirect {
    pub from_path: String,
    pub to_path: String,
    pub status_code: Option<i32>,
}

pub async fn list_redirects(pool: web::Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let rows = sqlx::query_as!(Redirect,
        "SELECT id, from_path, to_path, status_code, active, hits FROM redirects ORDER BY created_at DESC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(rows))
}

pub async fn create_redirect(pool: web::Data<PgPool>, _auth: AuthUserWithRole, body: web::Json<CreateRedirect>) -> AppResult<HttpResponse> {
    let code = body.status_code.unwrap_or(301);
    let row = sqlx::query_as!(Redirect,
        "INSERT INTO redirects (from_path, to_path, status_code) VALUES ($1, $2, $3) RETURNING id, from_path, to_path, status_code, active, hits",
        body.from_path, body.to_path, code
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(row))
}

pub async fn delete_redirect(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM redirects WHERE id = $1", *path).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn toggle_redirect(pool: web::Data<PgPool>, _auth: AuthUserWithRole, path: web::Path<uuid::Uuid>) -> AppResult<HttpResponse> {
    let row = sqlx::query_as!(Redirect,
        "UPDATE redirects SET active = NOT active WHERE id = $1 RETURNING id, from_path, to_path, status_code, active, hits",
        *path
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(row))
}

pub async fn handle_redirect(pool: web::Data<PgPool>, req: actix_web::HttpRequest) -> HttpResponse {
    let path = req.path().to_string();
    let row = sqlx::query!(
        "UPDATE redirects SET hits = hits + 1 WHERE from_path = $1 AND active = true RETURNING to_path, status_code",
        path
    ).fetch_optional(pool.get_ref()).await;

    match row {
        Ok(Some(r)) => {
            if r.status_code.unwrap_or(301) == 302 {
                HttpResponse::Found().insert_header(("Location", r.to_path)).finish()
            } else {
                HttpResponse::MovedPermanently().insert_header(("Location", r.to_path)).finish()
            }
        }
        _ => HttpResponse::NotFound().finish()
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/redirects")
            .route("", web::get().to(list_redirects))
            .route("", web::post().to(create_redirect))
            .route("/{id}", web::delete().to(delete_redirect))
            .route("/{id}/toggle", web::post().to(toggle_redirect))
    );
}
