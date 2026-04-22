use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Tenant {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub domain: Option<String>,
    pub plan: String,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTenantDto {
    pub name: String,
    pub slug: String,
    pub domain: Option<String>,
    pub plan: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTenantDto {
    pub name: Option<String>,
    pub domain: Option<String>,
    pub plan: Option<String>,
    pub is_active: Option<bool>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/tenants")
            .route("",           web::get().to(list_tenants))
            .route("",           web::post().to(create_tenant))
            .route("/{id}",      web::get().to(get_tenant))
            .route("/{id}",      web::put().to(update_tenant))
            .route("/{id}",      web::delete().to(delete_tenant))
            .route("/{id}/stats",web::get().to(tenant_stats))
    );
}

pub async fn list_tenants(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let tenants = sqlx::query_as!(
        Tenant,
        r#"SELECT id, name, slug, domain, plan, is_active, created_at
           FROM tenants ORDER BY created_at DESC"#
    )
    .fetch_all(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": tenants })))
}

pub async fn get_tenant(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let id = path.into_inner();
    let tenant = sqlx::query_as!(
        Tenant,
        r#"SELECT id, name, slug, domain, plan, is_active, created_at
           FROM tenants WHERE id = $1"#,
        id
    )
    .fetch_optional(pool.get_ref())
    .await?;

    match tenant {
        Some(t) => Ok(HttpResponse::Ok().json(t)),
        None    => Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Tenant not found"}))),
    }
}

pub async fn create_tenant(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
    body: web::Json<CreateTenantDto>,
) -> AppResult<HttpResponse> {
    if !auth.has_permission("tenants:write") {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error":"Forbidden"})));
    }
    let tenant = sqlx::query_as!(
        Tenant,
        r#"INSERT INTO tenants (name, slug, domain, plan)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, slug, domain, plan, is_active, created_at"#,
        body.name,
        body.slug,
        body.domain,
        body.plan.as_deref().unwrap_or("free"),
    )
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Created().json(tenant))
}

pub async fn update_tenant(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body: web::Json<UpdateTenantDto>,
) -> AppResult<HttpResponse> {
    let id = path.into_inner();
    let tenant = sqlx::query_as!(
        Tenant,
        r#"UPDATE tenants SET
            name      = COALESCE($2, name),
            domain    = COALESCE($3, domain),
            plan      = COALESCE($4, plan),
            is_active = COALESCE($5, is_active),
            updated_at = NOW()
           WHERE id = $1
           RETURNING id, name, slug, domain, plan, is_active, created_at"#,
        id,
        body.name,
        body.domain,
        body.plan,
        body.is_active,
    )
    .fetch_optional(pool.get_ref())
    .await?;

    match tenant {
        Some(t) => Ok(HttpResponse::Ok().json(t)),
        None    => Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Not found"}))),
    }
}

pub async fn delete_tenant(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    if !auth.has_permission("tenants:write") {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error":"Forbidden"})));
    }
    let id = path.into_inner();
    // No permitir borrar el tenant default
    if id.to_string() == "00000000-0000-0000-0000-000000000001" {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error":"Cannot delete default tenant"})));
    }
    sqlx::query!("DELETE FROM tenants WHERE id = $1", id)
        .execute(pool.get_ref())
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn tenant_stats(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let id = path.into_inner();
    let posts = sqlx::query_scalar!(
        "SELECT COUNT(*)::int FROM posts WHERE tenant_id = $1", id
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let users = sqlx::query_scalar!(
        "SELECT COUNT(*)::int FROM users WHERE tenant_id = $1", id
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let media = sqlx::query_scalar!(
        "SELECT COUNT(*)::int FROM media WHERE tenant_id = $1", id
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "tenant_id": id,
        "posts": posts,
        "users": users,
        "media": media,
    })))
}
