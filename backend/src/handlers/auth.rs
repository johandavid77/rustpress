use actix_web::{web::{self, Data, Json}, HttpResponse};
use sqlx::PgPool;

use crate::{
    config::AppConfig,
    errors::{AppError, AppResult},
    middleware::auth::AuthUser,
    models::user::{LoginDto, RegisterDto, User, UserPublic},
    plugins::registry::PluginRegistry,
    services::auth_service::AuthService,
    services::email_service::EmailService,  // 👈 agrega esto
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/register", web::post().to(register))
            .route("/login",    web::post().to(login))
            .route("/me",       web::get().to(me))
	    .route("/forgot-password", web::post().to(forgot_password))
	    .route("/reset-password",  web::post().to(reset_password))
    );
}

async fn register(
    pool:     Data<PgPool>,
    cfg:      Data<AppConfig>,
    registry: Data<PluginRegistry>,
    email:    Data<EmailService>,   // 👈 agrega esto
    body:     Json<RegisterDto>,
) -> AppResult<HttpResponse> {
    use validator::Validate;
    body.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;

    let exists: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM users WHERE email = $1 OR username = $2",
        body.email,
        body.username
    )
    .fetch_one(pool.get_ref())
    .await?
    .unwrap_or(0);

    if exists > 0 {
        return Err(AppError::Conflict("Email or username already taken".into()));
    }

    let hashed = AuthService::hash_password(&body.password)?;
    let user: User = sqlx::query_as!(
        User,
        r#"INSERT INTO users (id, username, email, password)
           VALUES (gen_random_uuid(), $1, $2, $3)
           RETURNING *"#,
        body.username,
        body.email,
        hashed,
    )
    .fetch_one(pool.get_ref())
    .await?;

    registry.fire_on_user_register(&user).await.ok();

    // 👇 Envía email de bienvenida (no bloqueante, si falla no interrumpe)
    email.send_welcome(&user.email, &user.username).await.ok();
    

    let token = AuthService::generate_token(
        user.id, &user.email, user.role_id,
        &cfg.jwt_secret, cfg.jwt_expiry_hours,
    )?;

    Ok(HttpResponse::Created().json(serde_json::json!({
        "user":  UserPublic::from(user),
        "token": token
    })))
}

async fn login(
    pool:     Data<PgPool>,
    cfg:      Data<AppConfig>,
    registry: Data<PluginRegistry>,
    body:     Json<LoginDto>,
) -> AppResult<HttpResponse> {
    let user: User = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        body.email
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid credentials".into()))?;

    if !AuthService::verify_password(&body.password, &user.password)? {
        return Err(AppError::Unauthorized("Invalid credentials".into()));
    }

    registry.fire_on_user_login(&user).await.ok();

    let token = AuthService::generate_token(
        user.id, &user.email, user.role_id,
        &cfg.jwt_secret, cfg.jwt_expiry_hours,
    )?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "user":  UserPublic::from(user),
        "token": token
    })))
}

async fn me(auth: AuthUser, pool: Data<PgPool>) -> AppResult<HttpResponse> {
    let user: User = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        auth.0.sub
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    Ok(HttpResponse::Ok().json(UserPublic::from(user)))
}

#[derive(serde::Deserialize)]
struct ForgotPasswordDto {
    email: String,
}

#[derive(serde::Deserialize)]
struct ResetPasswordDto {
    token:    String,
    password: String,
}

async fn forgot_password(
    pool:  Data<PgPool>,
    cfg:   Data<AppConfig>,
    email: Data<EmailService>,
    body:  Json<ForgotPasswordDto>,
) -> AppResult<HttpResponse> {
    // Busca el usuario (si no existe respondemos igual para no revelar emails)
    let user = sqlx::query!(
        "SELECT id, email, username FROM users WHERE email = $1 AND is_active = true",
        body.email
    )
    .fetch_optional(pool.get_ref())
    .await?;

    if let Some(user) = user {
        // Genera token seguro
        let token = uuid::Uuid::new_v4().to_string().replace("-", "");

        // Guarda en DB con expiración de 1 hora
        sqlx::query!(
            r#"INSERT INTO password_reset_tokens (user_id, token, expires_at)
               VALUES ($1, $2, NOW() + INTERVAL '1 hour')"#,
            user.id,
            token
        )
        .execute(pool.get_ref())
        .await?;

        // Envía el email
        email.send_password_reset(&user.email, &token, &cfg.frontend_url).await.ok();
    }

    // Siempre respondemos igual (seguridad)
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Si el email existe, recibirás instrucciones para resetear tu contraseña"
    })))
}

async fn reset_password(
    pool: Data<PgPool>,
    body: Json<ResetPasswordDto>,
) -> AppResult<HttpResponse> {
    if body.password.len() < 8 {
        return Err(AppError::BadRequest("Password must be at least 8 characters".into()));
    }

    // Busca el token válido
    let record = sqlx::query!(
        r#"SELECT id, user_id FROM password_reset_tokens
           WHERE token = $1 AND used = false AND expires_at > NOW()"#,
        body.token
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::BadRequest("Token inválido o expirado".into()))?;

    // Hashea nueva contraseña
    let hashed = AuthService::hash_password(&body.password)?;

    // Actualiza contraseña
    sqlx::query!(
        "UPDATE users SET password = $1 WHERE id = $2",
        hashed,
        record.user_id
    )
    .execute(pool.get_ref())
    .await?;

    // Marca token como usado
    sqlx::query!(
        "UPDATE password_reset_tokens SET used = true WHERE id = $1",
        record.id
    )
    .execute(pool.get_ref())
    .await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Contraseña actualizada exitosamente"
    })))
}
