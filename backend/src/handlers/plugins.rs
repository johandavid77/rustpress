use actix_web::{web::{self, Data, Json, Path}, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth::AuthUser,
    models::plugin::{PluginRecord, UpdatePluginConfigDto},
    plugins::registry::PluginRegistry,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/plugins")
            .route("",              web::get().to(list_plugins))
            .route("/{id}/enable",  web::post().to(enable_plugin))
            .route("/{id}/disable", web::post().to(disable_plugin))
            .route("/{id}/config",  web::get().to(get_plugin_config))
            .route("/{id}/config",  web::put().to(update_plugin_config))
            .route("/{id}",         web::delete().to(delete_plugin))
    );
}

async fn list_plugins(pool: Data<PgPool>, _auth: AuthUser) -> AppResult<HttpResponse> {
    let plugins: Vec<PluginRecord> = sqlx::query_as!(
        PluginRecord,
        "SELECT * FROM plugins ORDER BY installed_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await?;
    Ok(HttpResponse::Ok().json(plugins))
}

async fn enable_plugin(
    pool: Data<PgPool>,
    registry: Data<PluginRegistry>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "UPDATE plugins SET is_enabled = true WHERE id = $1 RETURNING *",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    if let Some(p) = registry.get(&plugin.name) {
        p.on_enable().await?;
    }
    Ok(HttpResponse::Ok().json(plugin))
}

async fn disable_plugin(
    pool: Data<PgPool>,
    registry: Data<PluginRegistry>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "UPDATE plugins SET is_enabled = false WHERE id = $1 RETURNING *",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    if let Some(p) = registry.get(&plugin.name) {
        p.on_disable().await?;
        registry.unregister(&plugin.name);
    }
    Ok(HttpResponse::Ok().json(plugin))
}

async fn get_plugin_config(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "SELECT * FROM plugins WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    Ok(HttpResponse::Ok().json(plugin.config))
}

async fn update_plugin_config(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUser,
    body: Json<UpdatePluginConfigDto>,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "UPDATE plugins SET config = $1 WHERE id = $2 RETURNING *",
        body.config,
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    Ok(HttpResponse::Ok().json(plugin))
}

async fn delete_plugin(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let result = sqlx::query!(
        "DELETE FROM plugins WHERE id = $1",
        *id
    )
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Plugin {} not found", id)));
    }
    Ok(HttpResponse::NoContent().finish())
}
