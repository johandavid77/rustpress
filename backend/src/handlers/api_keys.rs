use actix_web::{web, HttpResponse};
use sha2::{Sha256, Digest};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppResult,
    models::api_key::{ApiKey, CreateApiKeyDto},
    middleware::auth::AuthUserWithRole,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api-keys")
            .route("",      web::get().to(list_keys))
            .route("",      web::post().to(create_key))
            .route("/{id}", web::delete().to(delete_key)),
    );
}

fn hash_key(key: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn generate_key() -> (String, String) {
    let raw = format!("rp_{}", Uuid::new_v4().to_string().replace('-', ""));
    let prefix = raw[..10].to_string();
    (raw, prefix)
}

async fn list_keys(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let keys = sqlx::query_as!(
        ApiKey,
        "SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC",
        auth.user_id
    )
    .fetch_all(pool.get_ref())
    .await?;

    // No exponer key_hash en la lista
    let safe: Vec<_> = keys.iter().map(|k| serde_json::json!({
        "id":         k.id,
        "name":       k.name,
        "prefix":     k.prefix,
        "scopes":     k.scopes,
        "last_used":  k.last_used,
        "expires_at": k.expires_at,
        "created_at": k.created_at,
    })).collect();

    Ok(HttpResponse::Ok().json(safe))
}

async fn create_key(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
    body: web::Json<CreateApiKeyDto>,
) -> AppResult<HttpResponse> {
    let (raw_key, prefix) = generate_key();
    let key_hash = hash_key(&raw_key);
    let scopes = body.scopes.clone().unwrap_or_else(|| vec!["read".into()]);

    sqlx::query!(
        "INSERT INTO api_keys (user_id, name, key_hash, prefix, scopes, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)",
        auth.user_id, body.name, key_hash, prefix,
        &scopes, body.expires_at
    )
    .execute(pool.get_ref())
    .await?;

    // Solo se muestra la key completa una vez
    Ok(HttpResponse::Created().json(serde_json::json!({
        "key":    raw_key,
        "prefix": prefix,
        "name":   body.name,
        "scopes": scopes,
        "note":   "Guarda esta key — no se mostrará de nuevo"
    })))
}

async fn delete_key(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        "DELETE FROM api_keys WHERE id = $1 AND user_id = $2",
        *id, auth.user_id
    )
    .execute(pool.get_ref())
    .await?;
    Ok(HttpResponse::NoContent().finish())
}
