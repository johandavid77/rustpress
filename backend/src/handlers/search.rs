use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use crate::cache::{get_cached, set_cached, RedisPool};
use tokio::sync::Mutex;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: i64,
}
fn default_limit() -> i64 { 10 }

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/search")
            .route("", web::get().to(search_all))
            .route("/posts", web::get().to(search_posts))
            .route("/products", web::get().to(search_products))
    );
}

async fn search_all(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
    redis: web::Data<Mutex<RedisPool>>,
) -> crate::errors::AppResult<HttpResponse> {
    let q = &query.q;
    let cache_key = format!("search:all:{}", q);
    {
        let mut r = redis.lock().await;
        if let Some(cached) = get_cached(&mut r, &cache_key).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&cached) {
                return Ok(HttpResponse::Ok().json(val));
            }
        }
    }
    if q.trim().is_empty() {
        return Ok(HttpResponse::Ok().json(serde_json::json!({"posts":[],"products":[]})));
    }
    let posts = sqlx::query!(
        "SELECT id::text, title, slug, excerpt, created_at,
         ts_rank(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(excerpt,'')),
                 plainto_tsquery('spanish', $1))::float4 as rank
         FROM posts
         WHERE to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(excerpt,''))
               @@ plainto_tsquery('spanish', $1)
           AND status = 'published'
         ORDER BY rank DESC LIMIT $2",
        q, query.limit
    ).fetch_all(pool.get_ref()).await?;

    let products = sqlx::query!(
        "SELECT id::text, name, slug, price,
         ts_rank(to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,'')),
                 plainto_tsquery('spanish', $1))::float4 as rank
         FROM products
         WHERE to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,''))
               @@ plainto_tsquery('spanish', $1)
           AND status = 'active'
         ORDER BY rank DESC LIMIT $2",
        q, query.limit
    ).fetch_all(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "query": q,
        "posts": posts.iter().map(|r| serde_json::json!({
            "id": r.id, "title": r.title, "slug": r.slug,
            "excerpt": r.excerpt, "rank": r.rank,
            "created_at": r.created_at.format("%Y-%m-%d").to_string()
        })).collect::<Vec<_>>(),
        "products": products.iter().map(|r| serde_json::json!({
            "id": r.id, "name": r.name, "slug": r.slug,
            "price": r.price, "rank": r.rank
        })).collect::<Vec<_>>()
    })))
}

async fn search_posts(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
) -> crate::errors::AppResult<HttpResponse> {
    let rows = sqlx::query!(
        "SELECT id::text, title, slug, excerpt, created_at,
         ts_rank(to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(excerpt,'')),
                 plainto_tsquery('spanish', $1))::float4 as rank
         FROM posts
         WHERE to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(excerpt,''))
               @@ plainto_tsquery('spanish', $1)
           AND status = 'published'
         ORDER BY rank DESC LIMIT $2",
        &query.q, query.limit
    ).fetch_all(pool.get_ref()).await?;
    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "title": r.title, "slug": r.slug,
        "excerpt": r.excerpt, "rank": r.rank,
        "created_at": r.created_at.format("%Y-%m-%d").to_string()
    })).collect();
    Ok(HttpResponse::Ok().json(serde_json::json!({"data": data})))
}

async fn search_products(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
) -> crate::errors::AppResult<HttpResponse> {
    let rows = sqlx::query!(
        "SELECT id::text, name, slug, price,
         ts_rank(to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,'')),
                 plainto_tsquery('spanish', $1))::float4 as rank
         FROM products
         WHERE to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(description,''))
               @@ plainto_tsquery('spanish', $1)
           AND status = 'active'
         ORDER BY rank DESC LIMIT $2",
        &query.q, query.limit
    ).fetch_all(pool.get_ref()).await?;
    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id": r.id, "name": r.name, "slug": r.slug,
        "price": r.price, "rank": r.rank
    })).collect();
    Ok(HttpResponse::Ok().json(serde_json::json!({"data": data})))
}
