use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use validator::Validate;

use crate::{
    errors::{AppError, AppResult},
    models::slider::{CreateSliderDto, Slider, UpdateSliderDto},
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/sliders")
            .route("",          web::get().to(list))
            .route("",          web::post().to(create))
            .route("/{id}",     web::get().to(get_one))
            .route("/{id}",     web::put().to(update))
            .route("/{id}",     web::delete().to(delete))
            .route("/reorder",  web::post().to(reorder))
    );
}

// GET /sliders — todos los activos (público)
async fn list(pool: web::Data<PgPool>) -> AppResult<HttpResponse> {
    let sliders = sqlx::query_as!(
        Slider,
        "SELECT * FROM sliders WHERE is_active = true ORDER BY order_index ASC"
    )
    .fetch_all(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(sliders))
}

// GET /sliders/:id
async fn get_one(
    pool: web::Data<PgPool>,
    id:   web::Path<uuid::Uuid>,
) -> AppResult<HttpResponse> {
    let slider = sqlx::query_as!(
        Slider,
        "SELECT * FROM sliders WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Slider not found".into()))?;

    Ok(HttpResponse::Ok().json(slider))
}

// POST /sliders
async fn create(
    pool: web::Data<PgPool>,
    body: web::Json<CreateSliderDto>,
) -> AppResult<HttpResponse> {
    body.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let order = body.order_index.unwrap_or_else(|| {
        0 // lo ajustamos abajo
    });

    let slider = sqlx::query_as!(
        Slider,
        r#"INSERT INTO sliders (title, subtitle, button_text, button_url, image_url, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
        body.title,
        body.subtitle,
        body.button_text,
        body.button_url,
        body.image_url,
        order,
    )
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Created().json(slider))
}

// PUT /sliders/:id
async fn update(
    pool: web::Data<PgPool>,
    id:   web::Path<uuid::Uuid>,
    body: web::Json<UpdateSliderDto>,
) -> AppResult<HttpResponse> {
    body.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let slider = sqlx::query_as!(
        Slider,
        r#"UPDATE sliders SET
            title       = COALESCE($1, title),
            subtitle    = COALESCE($2, subtitle),
            button_text = COALESCE($3, button_text),
            button_url  = COALESCE($4, button_url),
            image_url   = COALESCE($5, image_url),
            order_index = COALESCE($6, order_index),
            is_active   = COALESCE($7, is_active),
            updated_at  = NOW()
           WHERE id = $8
           RETURNING *"#,
        body.title,
        body.subtitle,
        body.button_text,
        body.button_url,
        body.image_url,
        body.order_index,
        body.is_active,
        *id,
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("Slider not found".into()))?;

    Ok(HttpResponse::Ok().json(slider))
}

// DELETE /sliders/:id
async fn delete(
    pool: web::Data<PgPool>,
    id:   web::Path<uuid::Uuid>,
) -> AppResult<HttpResponse> {
    let result = sqlx::query!(
        "DELETE FROM sliders WHERE id = $1",
        *id
    )
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Slider not found".into()));
    }

    Ok(HttpResponse::NoContent().finish())
}

// POST /sliders/reorder — recibe [{id, order_index}]
#[derive(serde::Deserialize)]
struct ReorderItem {
    id:          uuid::Uuid,
    order_index: i32,
}

async fn reorder(
    pool:  web::Data<PgPool>,
    body:  web::Json<Vec<ReorderItem>>,
) -> AppResult<HttpResponse> {
    for item in body.iter() {
        sqlx::query!(
            "UPDATE sliders SET order_index = $1, updated_at = NOW() WHERE id = $2",
            item.order_index,
            item.id,
        )
        .execute(pool.get_ref())
        .await?;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Reordered successfully" })))
}
