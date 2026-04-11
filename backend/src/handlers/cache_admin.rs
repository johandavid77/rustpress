use actix_web::{web, HttpResponse};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;
use crate::cache::{get_cached, set_cached, invalidate_pattern, RedisPool};
use tokio::sync::Mutex;

pub async fn get_stats(
    redis: web::Data<Mutex<RedisPool>>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let mut r = redis.lock().await;
    use redis::AsyncCommands;

    let keys: Vec<String> = r.keys("*").await.unwrap_or_default();
    let total = keys.len();

    let mut by_prefix: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for key in &keys {
        let prefix = key.split(':').next().unwrap_or("other").to_string();
        *by_prefix.entry(prefix).or_insert(0) += 1;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_keys": total,
        "by_prefix": by_prefix,
        "keys": keys,
    })))
}

pub async fn flush_all(
    redis: web::Data<Mutex<RedisPool>>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let mut r = redis.lock().await;
    use redis::AsyncCommands;
    let keys: Vec<String> = r.keys("*").await.unwrap_or_default();
    let count = keys.len();
    for key in &keys {
        let _: redis::RedisResult<()> = r.del(key).await;
    }
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "flushed": count})))
}

pub async fn flush_pattern(
    redis: web::Data<Mutex<RedisPool>>,
    _auth: AuthUserWithRole,
    path: web::Path<String>,
) -> AppResult<HttpResponse> {
    let mut r = redis.lock().await;
    let pattern = format!("{}*", *path);
    invalidate_pattern(&mut r, &pattern).await;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "pattern": pattern})))
}

pub async fn set_key(
    redis: web::Data<Mutex<RedisPool>>,
    _auth: AuthUserWithRole,
    body: web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    let mut r = redis.lock().await;
    let key = body["key"].as_str().unwrap_or("").to_string();
    let value = body["value"].to_string();
    let ttl = body["ttl"].as_u64().unwrap_or(3600);
    set_cached(&mut r, &key, &value, ttl).await;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/cache")
            .route("/stats", web::get().to(get_stats))
            .route("/flush", web::post().to(flush_all))
            .route("/flush/{prefix}", web::post().to(flush_pattern))
            .route("/set", web::post().to(set_key))
    );
}
