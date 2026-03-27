// handlers/comments.rs
use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::AppResult,
    models::comment::{Comment, CreateCommentDto, CommentQuery},
    middleware::auth::{AuthUser, AuthUserWithRole},
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/comments")
            .route("/all", web::get().to(list_all_comments))
            .route("/{id}/approve", web::put().to(approve_comment))
            .route("/{id}", web::delete().to(delete_comment)),
    );
    cfg.service(
        web::scope("/posts/{post_id}/comments")
            .route("", web::get().to(list_comments))
            .route("", web::post().to(create_comment)),
    );
}

// — GET /posts/:post_id/comments
async fn list_comments(
    pool: web::Data<PgPool>,
    post_id: web::Path<Uuid>,
    query: web::Query<CommentQuery>,
) -> AppResult<HttpResponse> {
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset   = ((page - 1) * per_page) as i64;

    let comments = sqlx::query_as!(
        Comment,
        r#"SELECT c.id, c.post_id, c.author_id, c.content, c.status,
                  c.created_at, c.updated_at
           FROM comments c
           WHERE c.post_id = $1 AND c.status = 'approved'
           ORDER BY c.created_at ASC
           LIMIT $2 OFFSET $3"#,
        *post_id,
        per_page as i64,
        offset,
    )
    .fetch_all(pool.get_ref())
    .await?;

    let total: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM comments WHERE post_id = $1 AND status = 'approved'",
        *post_id
    )
    .fetch_one(pool.get_ref())
    .await?
    .unwrap_or(0);

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "data": comments,
        "total": total,
        "page": page,
        "per_page": per_page,
    })))
}

// — POST /posts/:post_id/comments
async fn create_comment(
    pool: web::Data<PgPool>,
    post_id: web::Path<Uuid>,
    auth: AuthUser,
    body: web::Json<CreateCommentDto>,
) -> AppResult<HttpResponse> {
    if body.content.trim().is_empty() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "El comentario no puede estar vacío"
        })));
    }

    let comment = sqlx::query_as!(
        Comment,
        r#"INSERT INTO comments (post_id, author_id, content, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING *"#,
        *post_id,
        auth.0.sub,
        body.content.trim(),
    )
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Created().json(comment))
}

// — PUT /comments/:id/approve
async fn approve_comment(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let comment = sqlx::query_as!(
        Comment,
        r#"UPDATE comments SET status = 'approved', updated_at = NOW()
           WHERE id = $1 RETURNING *"#,
        *id,
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| crate::errors::AppError::NotFound("Comment not found".into()))?;

    Ok(HttpResponse::Ok().json(comment))
}

// — DELETE /comments/:id
async fn delete_comment(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM comments WHERE id = $1", *id)
        .execute(pool.get_ref())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

// — GET /comments/all (admin)
pub async fn list_all_comments(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let comments = sqlx::query_as!(
        Comment,
        r#"SELECT * FROM comments ORDER BY created_at DESC"#,
    )
    .fetch_all(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "data": comments,
        "total": comments.len()
    })))
}
