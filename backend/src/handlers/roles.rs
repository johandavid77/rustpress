use actix_web::{web, HttpResponse};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Role {
    pub id:          Uuid,
    pub name:        String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Permission {
    pub id:       Uuid,
    pub resource: String,
    pub action:   String,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/roles")
            .route("",              web::get().to(list_roles))
            .route("/{id}/permissions", web::get().to(get_role_permissions))
            .route("/{id}/permissions", web::put().to(set_role_permissions))
    );
    cfg.service(
        web::scope("/permissions")
            .route("", web::get().to(list_permissions))
    );
}

async fn list_roles(
    pool:  web::Data<sqlx::PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let roles = sqlx::query_as!(Role, "SELECT id, name, description FROM roles ORDER BY name")
        .fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(roles))
}

async fn list_permissions(
    pool:  web::Data<sqlx::PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let perms = sqlx::query_as!(Permission,
        "SELECT id, resource, action FROM permissions ORDER BY resource, action")
        .fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(perms))
}

async fn get_role_permissions(
    pool:  web::Data<sqlx::PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let perms = sqlx::query_as!(Permission,
        r#"SELECT p.id, p.resource, p.action FROM permissions p
           JOIN role_permissions rp ON rp.permission_id = p.id
           WHERE rp.role_id = $1 ORDER BY p.resource, p.action"#,
        *id)
        .fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(perms))
}

#[derive(Deserialize)]
struct SetPermsBody { permission_ids: Vec<Uuid> }

async fn set_role_permissions(
    pool:  web::Data<sqlx::PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body:  web::Json<SetPermsBody>,
) -> AppResult<HttpResponse> {
    let mut tx = pool.begin().await?;

    sqlx::query!("DELETE FROM role_permissions WHERE role_id = $1", *id)
        .execute(&mut *tx).await?;

    for perm_id in &body.permission_ids {
        sqlx::query!(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING",
            *id, perm_id
        ).execute(&mut *tx).await?;
    }

    tx.commit().await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}
