use actix_web::{web::{self, Data, Json}, HttpResponse};
use sqlx::PgPool;

use crate::{
    config::AppConfig,
    errors::{AppError, AppResult},
    middleware::auth::AuthUser,
    models::user::{LoginDto, RegisterDto, User, UserPublic},
    plugins::registry::PluginRegistry,
    services::auth_service::AuthService,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/register", web::post().to(register))
            .route("/login",    web::post().to(login))
            .route("/me",       web::get().to(me))
    );
}

async fn register(
    pool:     Data<PgPool>,
    cfg:      Data<AppConfig>,
    registry: Data<PluginRegistry>,
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
