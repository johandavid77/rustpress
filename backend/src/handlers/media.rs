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
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 82);
            encoder.encode_image(&img)?;
        }
        "png" | "webp" => {
            img.save(filepath)?;
        }
        _ => {}
    }

    // Generar thumbnail 400px en subdirectorio thumbs/
    if let Some(parent) = path.parent() {
        let thumb_dir = parent.join("thumbs");
        let _ = std::fs::create_dir_all(&thumb_dir);
        if let Some(fname) = path.file_name() {
            let thumb_path = thumb_dir.join(fname);
            let thumb = img.resize(400, 400, image::imageops::FilterType::Triangle);
            match ext.as_str() {
                "jpg" | "jpeg" => {
                    if let Ok(mut out) = std::fs::File::create(&thumb_path) {
                        let mut enc = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 75);
                        let _ = enc.encode_image(&thumb);
                    }
                }
                _ => { let _ = thumb.save(&thumb_path); }
            }
        }
    }

    Ok(std::fs::metadata(filepath)?.len())
}

/// Upload file to S3/R2-compatible storage using presigned PUT
/// Returns the public URL or None if S3 not configured
pub async fn upload_to_s3(
    cfg: &crate::config::AppConfig,
    data: &[u8],
    filename: &str,
    content_type: &str,
) -> Option<String> {
    let bucket   = cfg.s3_bucket.as_ref()?;
    let endpoint = cfg.s3_endpoint.as_ref()?;
    let access   = cfg.s3_access_key.as_ref()?;
    let secret   = cfg.s3_secret_key.as_ref()?;
    let region   = cfg.s3_region.as_deref().unwrap_or("auto");

    // Simple S3 PUT using reqwest with AWS Signature V4
    // For Cloudflare R2, endpoint = https://<account_id>.r2.cloudflarestorage.com
    let url = format!("{}/{}/{}", endpoint.trim_end_matches('/'), bucket, filename);

    let client = reqwest::Client::new();

    // Build minimal AWS SigV4 - using x-amz-content-sha256 unsigned for simplicity
    let now = chrono::Utc::now();
    let date_str  = now.format("%Y%m%d").to_string();
    let dt_str    = now.format("%Y%m%dT%H%M%SZ").to_string();

    use hmac::{Hmac, Mac};
    use sha2::{Digest, Sha256};

    let body_hash = hex::encode(Sha256::digest(data));

    let canonical = format!(
        "PUT
/{}/{}

content-type:{}
host:{}
x-amz-content-sha256:{}
x-amz-date:{}

content-type;host;x-amz-content-sha256;x-amz-date
{}",
        bucket, filename,
        content_type,
        endpoint.replace("https://","").replace("http://",""),
        body_hash, dt_str, body_hash
    );

    let string_to_sign = format!(
        "AWS4-HMAC-SHA256
{}
{}/{}/s3/aws4_request
{}",
        dt_str, date_str, region,
        hex::encode(Sha256::digest(canonical.as_bytes()))
    );

    let sign_key = |key: &[u8], msg: &str| -> Vec<u8> {
        let mut mac = Hmac::<Sha256>::new_from_slice(key).unwrap();
        mac.update(msg.as_bytes());
        mac.finalize().into_bytes().to_vec()
    };

    let k_date    = sign_key(format!("AWS4{}", secret).as_bytes(), &date_str);
    let k_region  = sign_key(&k_date, region);
    let k_service = sign_key(&k_region, "s3");
    let k_signing = sign_key(&k_service, "aws4_request");
    let signature = hex::encode({
        let mut mac = Hmac::<Sha256>::new_from_slice(&k_signing).unwrap();
        mac.update(string_to_sign.as_bytes());
        mac.finalize().into_bytes()
    });

    let auth = format!(
        "AWS4-HMAC-SHA256 Credential={}/{}/{}/s3/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature={}",
        access, date_str, region, signature
    );

    let res = client.put(&url)
        .header("Authorization", auth)
        .header("Content-Type", content_type)
        .header("x-amz-content-sha256", &body_hash)
        .header("x-amz-date", &dt_str)
        .body(data.to_vec())
        .send()
        .await;

    match res {
        Ok(r) if r.status().is_success() => {
            let public_url = cfg.s3_public_url.as_ref()
                .map(|base| format!("{}/{}", base.trim_end_matches('/'), filename))
                .unwrap_or(url);
            Some(public_url)
        }
        _ => None,
    }
}
