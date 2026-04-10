#![allow(unused_imports, unused_variables)]
// handlers/posts.rs  —  CRUD completo de posts/páginas
use actix_web::{web::{self, Data, Json, Path, Query}, HttpResponse};
use sqlx::PgPool;
use tokio::sync::Mutex;
use crate::cache::{get_cached, set_cached, invalidate_pattern, RedisPool};
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    models::post::{CreatePostDto, PostQuery, UpdatePostDto},
    plugins::registry::PluginRegistry,
    middleware::auth::{AuthUser, AuthUserWithRole},
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/posts")
            .route("",                  web::get().to(list_posts))
            .route("",                  web::post().to(create_post))
            .route("/stats",            web::get().to(get_stats))
            .route("/slug/{slug}",      web::get().to(get_post_by_slug))
            .route("/{id}",             web::get().to(get_post))
            .route("/{id}",             web::put().to(update_post))
            .route("/{id}",             web::delete().to(delete_post))
            .route("/{id}/publish",     web::post().to(publish_post))
            .route("/{id}/unpublish",   web::post().to(unpublish_post))
    );
}

// ── GET /posts ───────────────────────────────────────────────────────────────
async fn list_posts(
    pool:  Data<PgPool>,
    redis: Data<Mutex<RedisPool>>,
    query: Query<PostQuery>,
    _auth: Option<AuthUser>,
) -> AppResult<HttpResponse> {
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);

    // Cache solo para requests públicos sin filtros especiales
    let cache_key = format!("posts:list:{}:{}:{}:{}",
        query.status.as_deref().unwrap_or("published"),
        query.search.as_deref().unwrap_or(""),
        page, per_page
    );
    {
        let mut r = redis.lock().await;
        if let Some(cached) = get_cached(&mut r, &cache_key).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&cached) {
                return Ok(HttpResponse::Ok().json(val));
            }
        }
    }
    let offset   = ((page - 1) * per_page) as i64;

    let rows = sqlx::query_as!(
        crate::models::post::Post,
        r#"SELECT * FROM posts
           WHERE ($1::text IS NULL OR status = $1)
             AND ($2::text IS NULL OR post_type = $2)
             AND ($3::uuid IS NULL OR author_id = $3)
             AND ($4::text IS NULL OR title ILIKE '%' || $4 || '%')
           ORDER BY created_at DESC
           LIMIT $5 OFFSET $6"#,
        query.status.as_deref(),
        query.post_type.as_deref(),
        query.author_id,
        query.search.as_deref(),
        per_page as i64,
        offset,
    )
    .fetch_all(pool.get_ref())
    .await?;

    let total = sqlx::query_scalar!(
        r#"SELECT COUNT(*) FROM posts
           WHERE ($1::text IS NULL OR status = $1)
             AND ($2::text IS NULL OR post_type = $2)"#,
        query.status.as_deref(),
        query.post_type.as_deref(),
    )
    .fetch_one(pool.get_ref())
    .await
    .unwrap_or(Some(0)).unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "data":        rows,
        "total":       total,
        "page":        page,
        "per_page":    per_page,
        "total_pages": (total as f64 / per_page as f64).ceil() as u32,
    })))
}

// ── POST /posts ──────────────────────────────────────────────────────────────
async fn create_post(
    pool:     Data<PgPool>,
    redis: Data<Mutex<RedisPool>>,
    registry: Data<PluginRegistry>,
    auth:     AuthUserWithRole,
    body:     Json<CreatePostDto>,
) -> AppResult<HttpResponse> {
    // Check permissions for creating posts
    if !auth.has_permission("posts:write") {
        return Err(AppError::Forbidden("Insufficient permissions to create posts".into()));
    }
    use validator::Validate;
    body.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let slug = body.slug.clone().unwrap_or_else(|| slug::slugify(&body.title));
    let post_type = body.post_type.clone().unwrap_or_else(|| "post".into());
    let meta = body.meta.clone().unwrap_or(serde_json::json!({}));

    let mut post = sqlx::query_as!(
        crate::models::post::Post,
        r#"INSERT INTO posts (id, title, slug, content, excerpt, post_type, status, author_id, meta, seo_title, seo_description, og_image, language)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9, $10, $11)
           RETURNING *"#,
        body.title,
        slug,
        body.content,
        body.excerpt,
        post_type,
        auth.user_id,
        meta,
        body.seo_title.clone(),
        body.seo_description.clone(),
        body.og_image.clone(),
        body.language.clone().unwrap_or_else(|| "es".to_string()),
    )
    .fetch_one(pool.get_ref())
    .await?;

    // Disparar hook de plugins
    registry.fire_before_post_save(&mut post).await?;

    Ok(HttpResponse::Created().json(post))
}

// ── GET /posts/:id ───────────────────────────────────────────────────────────
async fn get_post(
    pool: Data<PgPool>,
    id:   Path<Uuid>,
    _auth: Option<AuthUser>,
) -> AppResult<HttpResponse> {
    let post = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    Ok(HttpResponse::Ok().json(post))
}

// ── PUT /posts/:id ───────────────────────────────────────────────────────────
async fn update_post(
    pool: Data<PgPool>,
    redis: Data<Mutex<RedisPool>>,
    id:   Path<Uuid>,
    auth: AuthUserWithRole,
    body: Json<UpdatePostDto>,
) -> AppResult<HttpResponse> {
    let existing = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    // Check permissions: author can edit their own posts, or users with posts:write permission
    let can_edit = existing.author_id == auth.user_id || auth.has_permission("posts:write");
    if !can_edit {
        return Err(AppError::Forbidden("Insufficient permissions to edit this post".into()));
    }

    let updated = sqlx::query_as!(
        crate::models::post::Post,
        r#"UPDATE posts SET
            title     = COALESCE($1, title),
            slug      = COALESCE($2, slug),
            content   = COALESCE($3, content),
            excerpt   = COALESCE($4, excerpt),
            post_type = COALESCE($5, post_type),
            status    = COALESCE($6, status),
            meta      = COALESCE($7, meta),
                    seo_title       = COALESCE($8, seo_title),
        seo_description = COALESCE($9, seo_description),
        og_image        = COALESCE($10, og_image),
                language        = COALESCE($11, language),
        updated_at      = NOW()
        WHERE id = $12
           RETURNING *"#,
        body.title,
        body.slug,
        body.content,
        body.excerpt,
        body.post_type,
        body.status,
        body.meta,
        body.seo_title.clone(),
        body.seo_description.clone(),
        body.og_image.clone(),
        body.language.clone(),
        *id,
    )
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(updated))
}

// ── DELETE /posts/:id ────────────────────────────────────────────────────────
async fn delete_post(
    pool: Data<PgPool>,
    redis: Data<Mutex<RedisPool>>,
    id:   Path<Uuid>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let existing = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    // Check permissions: author can delete their own posts, or users with posts:delete permission
    let can_delete = existing.author_id == auth.user_id || auth.has_permission("posts:delete");
    if !can_delete {
        return Err(AppError::Forbidden("Insufficient permissions to delete this post".into()));
    }

    let result = sqlx::query!(
        "DELETE FROM posts WHERE id = $1",
        *id
    )
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Post not found or insufficient permissions".into()));
    }

    Ok(HttpResponse::NoContent().finish())
}

// ── POST /posts/:id/publish ──────────────────────────────────────────────────
async fn publish_post(
    pool:     Data<PgPool>,
    registry: Data<PluginRegistry>,
    id:       Path<Uuid>,
    auth:     AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let existing = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    // Check permissions: author can publish their own posts, or users with posts:write permission
    let can_publish = existing.author_id == auth.user_id || auth.has_permission("posts:write");
    if !can_publish {
        return Err(AppError::Forbidden("Insufficient permissions to publish this post".into()));
    }
    let post = sqlx::query_as!(
        crate::models::post::Post,
        r#"UPDATE posts SET
            status = 'published',
            published_at = NOW(),
            updated_at   = NOW()
           WHERE id = $1
           RETURNING *"#,
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    registry.fire_after_post_publish(&post).await?;

    // Disparar webhooks en background
    {
        let payload = serde_json::json!({
            "event": "post.published",
            "post": { "id": post.id, "title": post.title, "slug": post.slug }
        });
        let pool_ref = pool.get_ref().clone();
        tokio::spawn(async move {
            crate::handlers::webhooks::fire_webhooks(&pool_ref, "post.published", payload).await;
        });
    }

    Ok(HttpResponse::Ok().json(post))
}

// ── POST /posts/:id/unpublish ────────────────────────────────────────────────
async fn unpublish_post(
    pool:  Data<PgPool>,
    id:    Path<Uuid>,
    auth:  AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let existing = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    // Check permissions: author can unpublish their own posts, or users with posts:write permission
    let can_unpublish = existing.author_id == auth.user_id || auth.has_permission("posts:write");
    if !can_unpublish {
        return Err(AppError::Forbidden("Insufficient permissions to unpublish this post".into()));
    }
    let post = sqlx::query_as!(
        crate::models::post::Post,
        "UPDATE posts SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING *",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Post {} not found", id)))?;

    Ok(HttpResponse::Ok().json(post))
}

async fn get_post_by_slug(
    pool: Data<PgPool>,
    slug: Path<String>,
) -> AppResult<HttpResponse> {
    let post = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE slug = $1 AND status = 'published'",
        slug.into_inner()
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Post not found".into()))?;

    Ok(HttpResponse::Ok().json(post))
}

pub async fn get_stats(
    pool: Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let stats = sqlx::query!(
        r#"SELECT
            COUNT(*) FILTER (WHERE true) as total_posts,
            COUNT(*) FILTER (WHERE status = 'published') as published_posts,
            COUNT(*) FILTER (WHERE status = 'draft') as draft_posts,
            MAX(published_at) as last_published_at
        FROM posts"#
    )
    .fetch_one(pool.get_ref())
    .await?;

    let media_count = sqlx::query_scalar!("SELECT COUNT(*) FROM media")
        .fetch_one(pool.get_ref())
        .await?;

    // Contar imagenes de productos y sliders
    let product_images = sqlx::query_scalar!(
        "SELECT COALESCE(SUM(jsonb_array_length(images)), 0) FROM products WHERE images IS NOT NULL AND jsonb_array_length(images) > 0"
    ).fetch_one(pool.get_ref()).await.unwrap_or(Some(0));

    let slider_images = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM sliders WHERE image_url IS NOT NULL AND image_url != ''"
    ).fetch_one(pool.get_ref()).await.unwrap_or(Some(0));

    let total_media_count = media_count.unwrap_or(0) + product_images.unwrap_or(0) + slider_images.unwrap_or(0);

    let recent_posts = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts ORDER BY created_at DESC LIMIT 5"
    )
    .fetch_all(pool.get_ref())
    .await?;

    // Estadisticas de ordenes
    let orders_total = sqlx::query_scalar!("SELECT COUNT(*) FROM orders")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);
    let orders_pending = sqlx::query_scalar!("SELECT COUNT(*) FROM orders WHERE status = 'pending'")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);
    let orders_today = sqlx::query_scalar!("SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '24 hours'")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);
    let revenue_total = sqlx::query_scalar!("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled' AND status != 'refunded'")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0.0);
    let revenue_today = sqlx::query_scalar!("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled' AND status != 'refunded' AND created_at >= NOW() - INTERVAL '24 hours'")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0.0);

    // Estadisticas de productos
    let total_products = sqlx::query_scalar!("SELECT COUNT(*) FROM products")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);
    let low_stock = sqlx::query_scalar!("SELECT COUNT(*) FROM products WHERE stock < 5 AND status = 'active'")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);
    let out_of_stock = sqlx::query_scalar!("SELECT COUNT(*) FROM products WHERE stock = 0 AND status = 'active'")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);

    // Estadisticas de usuarios
    let total_users = sqlx::query_scalar!("SELECT COUNT(*) FROM users")
        .fetch_one(pool.get_ref()).await?.unwrap_or(0);

    // Ordenes recientes
    let recent_orders = sqlx::query!(
        "SELECT id, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5"
    )
    .fetch_all(pool.get_ref())
    .await?;

    let recent_orders_json: Vec<serde_json::Value> = recent_orders.iter().map(|o| serde_json::json!({
        "id": o.id,
        "total": o.total,
        "status": o.status,
        "created_at": o.created_at,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_posts": stats.total_posts.unwrap_or(0),
        "published_posts": stats.published_posts.unwrap_or(0),
        "draft_posts": stats.draft_posts.unwrap_or(0),
        "last_published_at": stats.last_published_at,
        "total_media": total_media_count,
        "recent_posts": recent_posts,
        "orders_total": orders_total,
        "orders_pending": orders_pending,
        "orders_today": orders_today,
        "revenue_total": revenue_total,
        "revenue_today": revenue_today,
        "total_products": total_products,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "total_users": total_users,
        "recent_orders": recent_orders_json,
    })))
}

// — POST /posts/:slug/view (incrementar contador)
pub async fn increment_view(
    pool: web::Data<PgPool>,
    slug: web::Path<String>,
) -> AppResult<HttpResponse> {
    let result = sqlx::query!(
        "UPDATE posts SET views = views + 1 WHERE slug = $1 AND status = 'published' RETURNING views",
        *slug
    )
    .fetch_optional(pool.get_ref())
    .await?;

    let views = result.map(|r| r.views).unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({ "views": views })))
}

// — GET /posts/:id/preview (admin — incluye borradores)
pub async fn get_post_preview(
    pool: web::Data<PgPool>,
    id: web::Path<uuid::Uuid>,
    _auth: crate::middleware::auth::AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let post = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| crate::errors::AppError::NotFound("Post not found".into()))?;

    Ok(HttpResponse::Ok().json(post))
}

// — GET /posts/stats/views — visitas por día últimos 30 días
pub async fn views_by_day(
    pool: web::Data<sqlx::PgPool>,
    _auth: crate::middleware::auth::AuthUserWithRole,
) -> crate::errors::AppResult<actix_web::HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT
            DATE(updated_at) as day,
            SUM(views)::bigint as total_views
           FROM posts
           WHERE updated_at >= NOW() - INTERVAL '30 days'
             AND status = 'published'
           GROUP BY DATE(updated_at)
           ORDER BY day ASC"#
    )
    .fetch_all(pool.get_ref())
    .await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "day":   r.day.map(|d| d.to_string()).unwrap_or_default(),
        "views": r.total_views.unwrap_or(0),
    })).collect();

    Ok(actix_web::HttpResponse::Ok().json(data))
}

// GET /posts/stats/views — datos de vistas por día para el ViewsChart
pub async fn get_views_chart(
    pool: web::Data<sqlx::PgPool>,
    _auth: crate::middleware::auth::AuthUserWithRole,
) -> crate::errors::AppResult<actix_web::HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT
            DATE(created_at) as "date!: chrono::NaiveDate",
            COUNT(*) as "count!"
           FROM posts
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY DATE(created_at)
           ORDER BY DATE(created_at) ASC"#
    ).fetch_all(pool.get_ref()).await?;

    // También incluir vistas totales por día si la tabla lo permite
    let views = sqlx::query!(
        r#"SELECT
            DATE(updated_at) as "date!: chrono::NaiveDate",
            SUM(views)::bigint as "views!"
           FROM posts
           WHERE updated_at >= NOW() - INTERVAL '30 days'
             AND status = 'published'
           GROUP BY DATE(updated_at)
           ORDER BY DATE(updated_at) ASC"#
    ).fetch_all(pool.get_ref()).await?;

    let total: i64 = views.iter().map(|r| r.views).sum();
    let data: Vec<_> = views.iter().map(|r| serde_json::json!({
        "date":  r.date.to_string(),
        "views": r.views,
    })).collect();

    Ok(actix_web::HttpResponse::Ok().json(serde_json::json!({
        "data": data,
        "total": total,
    })))
}
