use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use totp_rs::{Algorithm, TOTP, Secret};
use serde::{Deserialize, Serialize};
use crate::middleware::auth::AuthUser;

#[derive(Serialize)]
struct TotpSetupResponse {
    secret: String,
    qr_url: String,
    uri:    String,
}

#[derive(Deserialize)]
pub struct TotpVerify {
    pub code: String,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/2fa")
            .route("/setup",    web::post().to(setup_2fa))
            .route("/verify",   web::post().to(verify_2fa))
            .route("/disable",  web::delete().to(disable_2fa))
    );
}

async fn setup_2fa(
    pool: web::Data<PgPool>,
    auth: AuthUser,
) -> crate::errors::AppResult<HttpResponse> {
    let secret = Secret::generate_secret();
    let secret_b32 = secret.to_encoded().to_string();

    let totp = TOTP::new(
        Algorithm::SHA1, 6, 1, 30,
        secret.to_bytes().unwrap(),
        Some("RustPress".into()),
        auth.0.email.clone(),
    ).unwrap();

    let qr_url = totp.get_qr_base64().unwrap_or_default();
    let uri    = totp.get_url();

    // Guardar secret pendiente (no activo hasta verificar)
    sqlx::query!(
        "UPDATE users SET totp_secret = $1, totp_enabled = FALSE WHERE id = $2",
        secret_b32, auth.0.sub
    ).execute(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(TotpSetupResponse { secret: secret_b32, qr_url, uri }))
}

async fn verify_2fa(
    pool: web::Data<PgPool>,
    auth: AuthUser,
    body: web::Json<TotpVerify>,
) -> crate::errors::AppResult<HttpResponse> {
    let row = sqlx::query!("SELECT totp_secret FROM users WHERE id = $1", auth.0.sub)
        .fetch_one(pool.get_ref()).await?;

    let secret_b32 = row.totp_secret.ok_or_else(|| {
        crate::errors::AppError::BadRequest("2FA not set up".into())
    })?;

    let secret = Secret::Encoded(secret_b32).to_bytes().unwrap();
    let totp = TOTP::new(Algorithm::SHA1, 6, 1, 30, secret,
        Some("RustPress".into()), auth.0.email.clone()).unwrap();

    if totp.check_current(&body.code).unwrap_or(false) {
        sqlx::query!("UPDATE users SET totp_enabled = TRUE WHERE id = $1", auth.0.sub)
            .execute(pool.get_ref()).await?;
        Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true, "message": "2FA enabled"})))
    } else {
        Ok(HttpResponse::UnprocessableEntity().json(serde_json::json!({"error": "Invalid code"})))
    }
}

async fn disable_2fa(
    pool: web::Data<PgPool>,
    auth: AuthUser,
) -> crate::errors::AppResult<HttpResponse> {
    sqlx::query!(
        "UPDATE users SET totp_secret = NULL, totp_enabled = FALSE WHERE id = $1", auth.0.sub
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}
