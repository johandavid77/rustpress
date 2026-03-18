use actix_web::{web::{self, Data, Json, Path}, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth::{AuthUser, AuthUserWithRole},
    models::user::{CreateUserDto, UpdateUserDto, User, UserPublic},
    services::auth_service::AuthService,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .route("",      web::get().to(list_users))
            .route("",      web::post().to(create_user))
            .route("/{id}", web::get().to(get_user))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user))
    );
}

async fn list_users(pool: Data<PgPool>, _auth: AuthUserWithRole) -> AppResult<HttpResponse> {
    let users: Vec<User> = sqlx::query_as!(
        User,
        "SELECT * FROM users ORDER BY created_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await?;

    let public: Vec<UserPublic> = users.into_iter().map(UserPublic::from).collect();
    Ok(HttpResponse::Ok().json(public))
}

async fn create_user(
    pool: Data<PgPool>,
    auth: AuthUserWithRole,
    body: Json<CreateUserDto>,
) -> AppResult<HttpResponse> {
    // Only admins can create users
    if !auth.has_permission("users:write") {
        return Err(AppError::Forbidden("Insufficient permissions to create users".into()));
    }

    use validator::Validate;
    body.validate().map_err(|e| AppError::BadRequest(e.to_string()))?;
    let hashed = AuthService::hash_password(&body.password)?;
    let user: User = sqlx::query_as!(
        User,
        r#"INSERT INTO users (id, username, email, password, role_id)
           VALUES (gen_random_uuid(), $1, $2, $3, $4)
           RETURNING *"#,
        body.username,
        body.email,
        hashed,
        body.role_id,
    )
    .fetch_one(pool.get_ref())
    .await?;

    Ok(HttpResponse::Created().json(UserPublic::from(user)))
}

async fn get_user(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let user: User = sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("User {} not found", id)))?;

    Ok(HttpResponse::Ok().json(UserPublic::from(user)))
}

async fn update_user(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    auth: AuthUserWithRole,
    body: Json<UpdateUserDto>,
) -> AppResult<HttpResponse> {
    // Only admins can update users
    if !auth.has_permission("users:write") {
        return Err(AppError::Forbidden("Insufficient permissions to update users".into()));
    }
    let new_password: Option<String> = if let Some(p) = &body.password {
        Some(AuthService::hash_password(p)?)
    } else {
        None
    };

    let user: User = sqlx::query_as!(
        User,
        r#"UPDATE users SET
            username   = COALESCE($1, username),
            email      = COALESCE($2, email),
            password   = COALESCE($3, password),
            role_id    = COALESCE($4, role_id),
            is_active  = COALESCE($5, is_active),
            updated_at = NOW()
           WHERE id = $6
           RETURNING *"#,
        body.username,
        body.email,
        new_password,
        body.role_id,
        body.is_active,
        *id,
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("User {} not found", id)))?;

    Ok(HttpResponse::Ok().json(UserPublic::from(user)))
}

async fn delete_user(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    // Only admins can delete users
    if !auth.has_permission("users:write") {
        return Err(AppError::Forbidden("Insufficient permissions to delete users".into()));
    }
    let result = sqlx::query!(
        "DELETE FROM users WHERE id = $1",
        *id
    )
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("User {} not found", id)));
    }

    Ok(HttpResponse::NoContent().finish())
}
