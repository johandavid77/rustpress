// handlers/posts.rs  —  CRUD completo de posts/páginas
use actix_web::{web::{self, Data, Json, Path, Query}, HttpResponse};
use sqlx::PgPool;
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
    query: Query<PostQuery>,
    _auth: Option<AuthUser>,
) -> AppResult<HttpResponse> {
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
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

    let total: i64 = sqlx::query_scalar!(
        r#"SELECT COUNT(*) FROM posts
           WHERE ($1::text IS NULL OR status = $1)
             AND ($2::text IS NULL OR post_type = $2)"#,
        query.status.as_deref(),
        query.post_type.as_deref(),
    )
    .fetch_one(pool.get_ref())
    .await?
    .unwrap_or(0);

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
        r#"INSERT INTO posts (id, title, slug, content, excerpt, post_type, status, author_id, meta, seo_title, seo_description, og_image)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'draft', $6, $7, $8, $9, $10)
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
        updated_at      = NOW()
        WHERE id = $11
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
        *id,
    )
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(updated))
}

// ── DELETE /posts/:id ────────────────────────────────────────────────────────
async fn delete_post(
    pool: Data<PgPool>,
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

    let recent_posts = sqlx::query_as!(
        crate::models::post::Post,
        "SELECT * FROM posts ORDER BY created_at DESC LIMIT 5"
    )
    .fetch_all(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_posts": stats.total_posts.unwrap_or(0),
        "published_posts": stats.published_posts.unwrap_or(0),
        "draft_posts": stats.draft_posts.unwrap_or(0),
        "last_published_at": stats.last_published_at,
        "total_media": media_count.unwrap_or(0),
        "recent_posts": recent_posts,
    })))
}
