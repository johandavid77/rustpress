use actix_web::{web, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Deserialize)]
pub struct CreateReviewDto {
    pub rating:     i32,
    pub title:      Option<String>,
    pub body:       Option<String>,
    pub guest_name: Option<String>,
}

#[derive(Deserialize)]
pub struct ReviewQuery {
    pub page:   Option<i64>,
    pub status: Option<String>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/reviews")
            .route("/product/{id}",  web::get().to(list_product_reviews))
            .route("/product/{id}",  web::post().to(create_review))
            .route("/{id}/helpful",  web::post().to(mark_helpful))
            .route("",               web::get().to(list_all_reviews))
            .route("/{id}/status",   web::put().to(update_status))
            .route("/{id}",          web::delete().to(delete_review))
    );
}

async fn list_product_reviews(
    pool:  web::Data<PgPool>,
    id:    web::Path<Uuid>,
    query: web::Query<ReviewQuery>,
) -> AppResult<HttpResponse> {
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = 10i64;
    let offset   = (page - 1) * per_page;

    let reviews = sqlx::query!(
        r#"SELECT r.id, r.rating, r.title, r.body, r.helpful, r.verified,
                  r.created_at, r.guest_name,
                  u.username as "username?"
           FROM reviews r
           LEFT JOIN users u ON u.id = r.user_id
           WHERE r.product_id = $1 AND r.status = 'approved'
           ORDER BY r.created_at DESC
           LIMIT $2 OFFSET $3"#,
        *id, per_page, offset
    ).fetch_all(pool.get_ref()).await?;

    let summary = sqlx::query!(
        r#"SELECT
            COALESCE(AVG(rating::float8), 0.0) as "avg_rating!: f64",
            COUNT(*)::bigint as "total_reviews!",
            COUNT(*) FILTER (WHERE rating = 5)::bigint as "five_star!",
            COUNT(*) FILTER (WHERE rating = 4)::bigint as "four_star!",
            COUNT(*) FILTER (WHERE rating = 3)::bigint as "three_star!",
            COUNT(*) FILTER (WHERE rating = 2)::bigint as "two_star!",
            COUNT(*) FILTER (WHERE rating = 1)::bigint as "one_star!"
           FROM reviews WHERE product_id = $1 AND status = 'approved'"#,
        *id
    ).fetch_one(pool.get_ref()).await?;

    let data: Vec<_> = reviews.iter().map(|r| serde_json::json!({
        "id":         r.id,
        "rating":     r.rating,
        "title":      r.title,
        "body":       r.body,
        "helpful":    r.helpful,
        "verified":   r.verified,
        "created_at": r.created_at,
        "author":     r.username.as_deref().unwrap_or(r.guest_name.as_deref().unwrap_or("Anónimo")),
    })).collect();

    let avg = (summary.avg_rating * 10.0).round() / 10.0;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "data": data,
        "page": page,
        "summary": {
            "avg_rating":    avg,
            "total_reviews": summary.total_reviews,
            "distribution": {
                "5": summary.five_star,
                "4": summary.four_star,
                "3": summary.three_star,
                "2": summary.two_star,
                "1": summary.one_star,
            }
        }
    })))
}

async fn create_review(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
    body: web::Json<CreateReviewDto>,
    auth: Option<AuthUserWithRole>,
) -> AppResult<HttpResponse> {
    if body.rating < 1 || body.rating > 5 {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "Rating entre 1 y 5"})));
    }

    let user_id = auth.as_ref().map(|a| a.user_id);

    let verified = if let Some(uid) = user_id {
        sqlx::query!(
            r#"SELECT EXISTS(
                SELECT 1 FROM order_items oi
                JOIN orders o ON o.id = oi.order_id
                WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'paid'
            ) as "exists!""#,
            uid, *id
        ).fetch_one(pool.get_ref()).await?.exists
    } else { false };

    sqlx::query!(
        "INSERT INTO reviews (product_id, user_id, guest_name, rating, title, body, verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
        *id, user_id, body.guest_name.as_deref(),
        body.rating, body.title.as_deref(), body.body.as_deref(), verified
    ).execute(pool.get_ref()).await?;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "ok": true,
        "message": "Reseña enviada — pendiente de aprobación",
        "verified": verified,
    })))
}

async fn mark_helpful(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
) -> AppResult<HttpResponse> {
    sqlx::query!("UPDATE reviews SET helpful = helpful + 1 WHERE id = $1", *id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn list_all_reviews(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<ReviewQuery>,
) -> AppResult<HttpResponse> {
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = 20i64;
    let offset   = (page - 1) * per_page;

    let rows = sqlx::query!(
        r#"SELECT r.id, r.rating, r.title, r.body, r.status, r.verified,
                  r.created_at, r.guest_name,
                  u.username as "username?",
                  p.name as product_name
           FROM reviews r
           LEFT JOIN users u ON u.id = r.user_id
           JOIN products p ON p.id = r.product_id
           WHERE ($1::text IS NULL OR r.status = $1)
           ORDER BY r.created_at DESC
           LIMIT $2 OFFSET $3"#,
        query.status.as_deref(), per_page, offset
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id":           r.id,
        "rating":       r.rating,
        "title":        r.title,
        "body":         r.body,
        "status":       r.status,
        "verified":     r.verified,
        "created_at":   r.created_at,
        "author":       r.username.as_deref().unwrap_or(r.guest_name.as_deref().unwrap_or("Anónimo")),
        "product_name": r.product_name,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({"data": data, "page": page})))
}

async fn update_status(
    pool:  web::Data<PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body:  web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        "UPDATE reviews SET status = $1 WHERE id = $2",
        body["status"].as_str().unwrap_or("pending"), *id
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn delete_review(
    pool:  web::Data<PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM reviews WHERE id = $1", *id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}
