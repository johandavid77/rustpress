use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};
use crate::errors::AppResult;
use crate::middleware::auth::AuthUserWithRole;

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

#[derive(Serialize)]
pub struct SearchResult {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub url: String,
    pub meta: Option<String>,
}

pub async fn global_search(
    pool: web::Data<PgPool>,
    query: web::Query<SearchQuery>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let q = format!("%{}%", query.q.to_lowercase());
    let mut results: Vec<SearchResult> = Vec::new();

    let posts = sqlx::query!(
        r#"SELECT id, title, status, slug FROM posts
           WHERE LOWER(title) LIKE $1 OR LOWER(content::text) LIKE $1
           ORDER BY updated_at DESC LIMIT 5"#,
        q
    ).fetch_all(pool.get_ref()).await.unwrap_or_default();

    for p in posts {
        results.push(SearchResult {
            id: p.id.to_string(),
            kind: "post".to_string(),
            title: p.title.clone(),
            subtitle: Some(p.status.clone()),
            url: "posts".to_string(),
            meta: Some(p.slug.clone()),
        });
    }

    let products = sqlx::query!(
        r#"SELECT id, name, status, slug, price FROM products
           WHERE LOWER(name) LIKE $1 OR LOWER(description) LIKE $1
           ORDER BY updated_at DESC LIMIT 5"#,
        q
    ).fetch_all(pool.get_ref()).await.unwrap_or_default();

    for p in products {
        results.push(SearchResult {
            id: p.id.to_string(),
            kind: "product".to_string(),
            title: p.name.clone(),
            subtitle: Some(format!("${:.2}", p.price)),
            url: "shop-products".to_string(),
            meta: Some(p.slug.clone()),
        });
    }

    let users = sqlx::query!(
        r#"SELECT id, username, email FROM users
           WHERE LOWER(username) LIKE $1 OR LOWER(email) LIKE $1
           ORDER BY created_at DESC LIMIT 3"#,
        q
    ).fetch_all(pool.get_ref()).await.unwrap_or_default();

    for u in users {
        results.push(SearchResult {
            id: u.id.to_string(),
            kind: "user".to_string(),
            title: u.username.clone(),
            subtitle: Some(u.email.clone()),
            url: "users".to_string(),
            meta: None,
        });
    }

    let orders = sqlx::query!(
        r#"SELECT id, status, total FROM orders
           WHERE LOWER(status) LIKE $1
           ORDER BY created_at DESC LIMIT 3"#,
        q
    ).fetch_all(pool.get_ref()).await.unwrap_or_default();

    for o in orders {
        let id_str = o.id.to_string();
        let short = &id_str[..8.min(id_str.len())];
        results.push(SearchResult {
            id: id_str.clone(),
            kind: "order".to_string(),
            title: format!("Pedido #{}", short),
            subtitle: Some(format!("{} - ${:.2}", o.status, o.total)),
            url: "shop-orders".to_string(),
            meta: None,
        });
    }

    let total = results.len();
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "results": results,
        "total": total
    })))
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/search")
            .route("", web::get().to(global_search))
    );
}
