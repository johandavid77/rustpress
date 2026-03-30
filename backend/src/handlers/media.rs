use actix_web::{web::{self, Data, Path, Query}, HttpResponse};
use actix_multipart::Multipart;
use futures_util::TryStreamExt;
use sqlx::PgPool;
use uuid::Uuid;
use std::io::Write;

use crate::{
    config::AppConfig,
    errors::{AppError, AppResult},
    middleware::auth::AuthUser,
    models::media::MediaQuery,
    services::media_service::{generate_filename, is_allowed_mime},
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/media")
            .route("",        web::get().to(list_media))
            .route("/upload", web::post().to(upload_media))
            .route("/{id}",   web::get().to(get_media))
            .route("/{id}",   web::delete().to(delete_media))
    );
}

async fn list_media(pool: Data<PgPool>, query: Query<MediaQuery>, _auth: AuthUser) -> AppResult<HttpResponse> {
    let page = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(30).min(100);
    let offset = ((page - 1) * per_page) as i64;

    let rows = sqlx::query_as!(crate::models::media::MediaFile,
        r#"SELECT * FROM media WHERE ($1::text IS NULL OR mime_type LIKE $1 || '%')
           ORDER BY created_at DESC LIMIT $2 OFFSET $3"#,
        query.mime_type.as_deref(), per_page as i64, offset,
    ).fetch_all(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": rows, "page": page })))
}

async fn upload_media(
    pool: Data<PgPool>, cfg: Data<AppConfig>,
    auth: AuthUser, mut payload: Multipart,
) -> AppResult<HttpResponse> {
    std::fs::create_dir_all(&cfg.upload_dir)?;
    let mut uploaded = vec![];

    while let Some(mut field) = payload.try_next().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        let content_type = field.content_type().map(|m| m.to_string()).unwrap_or_else(|| "application/octet-stream".to_string());
        if !is_allowed_mime(&content_type) {
            return Err(AppError::BadRequest(format!("MIME type not allowed: {}", content_type)));
        }
        let original_name = field.content_disposition().get_filename().unwrap_or("upload").to_string();
        let filename = generate_filename(&original_name);
        let filepath = format!("{}/{}", cfg.upload_dir, filename);
        let url = format!("/uploads/{}", filename);

        let mut file = std::fs::File::create(&filepath)?;
        let mut size = 0u64;
        let max_bytes = cfg.max_upload_mb * 1024 * 1024;

        while let Some(chunk) = field.try_next().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
            size += chunk.len() as u64;
            if size > max_bytes {
                std::fs::remove_file(&filepath).ok();
                return Err(AppError::BadRequest(format!("File exceeds {}MB limit", cfg.max_upload_mb)));
            }
            file.write_all(&chunk)?;
        }

        let record = sqlx::query_as!(crate::models::media::MediaFile,
            r#"INSERT INTO media (id, filename, original_name, mime_type, size_bytes, url, uploaded_by)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) RETURNING *"#,
            filename, original_name, content_type, size as i64, url, auth.0.sub,
        ).fetch_one(pool.get_ref()).await?;

        // Optimizar imagen si aplica
        let _size = optimize_image(&filepath).unwrap_or(size);

        uploaded.push(record);
    }

    Ok(HttpResponse::Created().json(uploaded))
}

async fn get_media(pool: Data<PgPool>, id: Path<Uuid>, _auth: AuthUser) -> AppResult<HttpResponse> {
    let file = sqlx::query_as!(crate::models::media::MediaFile, "SELECT * FROM media WHERE id = $1", *id)
        .fetch_optional(pool.get_ref()).await?
        .ok_or_else(|| AppError::NotFound(format!("Media {} not found", id)))?;
    Ok(HttpResponse::Ok().json(file))
}

async fn delete_media(pool: Data<PgPool>, cfg: Data<AppConfig>, id: Path<Uuid>, _auth: AuthUser) -> AppResult<HttpResponse> {
    let file = sqlx::query_as!(crate::models::media::MediaFile, "SELECT * FROM media WHERE id = $1", *id)
        .fetch_optional(pool.get_ref()).await?
        .ok_or_else(|| AppError::NotFound(format!("Media {} not found", id)))?;

    sqlx::query!("DELETE FROM media WHERE id = $1", *id).execute(pool.get_ref()).await?;
    std::fs::remove_file(format!("{}/{}", cfg.upload_dir, file.filename)).ok();
    Ok(HttpResponse::NoContent().finish())
}

fn optimize_image(filepath: &str) -> Result<u64, Box<dyn std::error::Error>> {
    let path = std::path::Path::new(filepath);
    let ext = path.extension()
        .and_then(|e: &std::ffi::OsStr| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if !["jpg", "jpeg", "png", "webp"].contains(&ext.as_str()) {
        return Ok(std::fs::metadata(filepath)?.len());
    }

    let img = image::open(filepath)?;

    // Redimensionar si es más grande que 1920px
    let img = if img.width() > 1920 || img.height() > 1920 {
        img.resize(1920, 1920, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };

    // Guardar optimizado
    match ext.as_str() {
        "jpg" | "jpeg" => {
            let mut out = std::fs::File::create(filepath)?;
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 85);
            encoder.encode_image(&img)?;
        }
        "png" => {
            img.save(filepath)?;
        }
        "webp" => {
            img.save(filepath)?;
        }
        _ => {}
    }

    Ok(std::fs::metadata(filepath)?.len())
}
