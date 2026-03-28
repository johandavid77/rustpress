use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use slug::slugify;

use crate::{
    errors::AppResult,
    models::category::{Category, CreateCategoryDto},
    middleware::auth::AuthUserWithRole,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/categories")
            .route("",        web::get().to(list_categories))
            .route("",        web::post().to(create_category))
            .route("/{id}",   web::delete().to(delete_category))
            .route("/{slug}/posts", web::get().to(posts_by_category)),
    );
    cfg.service(
        web::scope("/posts/{post_id}/categories")
            .route("",      web::get().to(get_post_categories))
            .route("/{id}", web::post().to(add_category_to_post))
            .route("/{id}", web::delete().to(remove_category_from_post)),
    );
}

// GET /categories
async fn list_categories(pool: web::Data<PgPool>) -> AppResult<HttpResponse> {
    let categories = sqlx::query_as!(
        Category,
        "SELECT * FROM categories ORDER BY name ASC"
    )
    .fetch_all(pool.get_ref())
    .await?;
    Ok(HttpResponse::Ok().json(categories))
}

// POST /categories
async fn create_category(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
    body: web::Json<CreateCategoryDto>,
) -> AppResult<HttpResponse> {
    let slug = body.slug.clone().unwrap_or_else(|| slugify(&body.name));
    let category = sqlx::query_as!(
        Category,
        "INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING *",
        body.name, slug
    )
    .fetch_one(pool.get_ref())
    .await?;
    Ok(HttpResponse::Created().json(category))
}

// DELETE /categories/:id
async fn delete_category(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM categories WHERE id = $1", *id)
        .execute(pool.get_ref())
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

// GET /categories/:slug/posts
async fn posts_by_category(
    pool: web::Data<PgPool>,
    slug: web::Path<String>,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> AppResult<HttpResponse> {
    let page     = query.get("page").and_then(|p| p.parse::<i64>().ok()).unwrap_or(1).max(1);
    let per_page = query.get("per_page").and_then(|p| p.parse::<i64>().ok()).unwrap_or(10).min(100);
    let offset   = (page - 1) * per_page;

    let posts = sqlx::query_as!(
        crate::models::post::Post,
        r#"SELECT p.* FROM posts p
           JOIN post_categories pc ON pc.post_id = p.id
           JOIN categories c ON c.id = pc.category_id
           WHERE c.slug = $1 AND p.status = 'published'
           ORDER BY p.published_at DESC
           LIMIT $2 OFFSET $3"#,
        *slug, per_page, offset
    )
    .fetch_all(pool.get_ref())
    .await?;

    let total: i64 = sqlx::query_scalar!(
        r#"SELECT COUNT(*) FROM posts p
           JOIN post_categories pc ON pc.post_id = p.id
           JOIN categories c ON c.id = pc.category_id
           WHERE c.slug = $1 AND p.status = 'published'"#,
        *slug
    )
    .fetch_one(pool.get_ref())
    .await?
    .unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "data": posts,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total as f64 / per_page as f64).ceil() as u32,
    })))
}

// GET /posts/:post_id/categories
async fn get_post_categories(
    pool: web::Data<PgPool>,
    post_id: web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    let categories = sqlx::query_as!(
        Category,
        r#"SELECT c.* FROM categories c
           JOIN post_categories pc ON pc.category_id = c.id
           WHERE pc.post_id = $1
           ORDER BY c.name ASC"#,
        *post_id
    )
    .fetch_all(pool.get_ref())
    .await?;
    Ok(HttpResponse::Ok().json(categories))
}

// POST /posts/:post_id/categories/:id
async fn add_category_to_post(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let (post_id, category_id) = path.into_inner();
    sqlx::query!(
        "INSERT INTO post_categories (post_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        post_id, category_id
    )
    .execute(pool.get_ref())
    .await?;
    Ok(HttpResponse::Created().finish())
}

// DELETE /posts/:post_id/categories/:id
async fn remove_category_from_post(
    pool: web::Data<PgPool>,
    path: web::Path<(Uuid, Uuid)>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let (post_id, category_id) = path.into_inner();
    sqlx::query!(
        "DELETE FROM post_categories WHERE post_id = $1 AND category_id = $2",
        post_id, category_id
    )
    .execute(pool.get_ref())
    .await?;
    Ok(HttpResponse::NoContent().finish())
}
