use actix_web::{dev::Payload, web::Data, FromRequest, HttpRequest};
use std::future::{ready, Ready};
use std::pin::Pin;
use std::future::Future;
use uuid::Uuid;
use sqlx::PgPool;

use crate::config::AppConfig;
use crate::errors::{AppError, AppResult};
use crate::services::auth_service::{AuthService, Claims};
use crate::models::user::Role;

#[derive(Debug, Clone)]
pub struct AuthUser(pub Claims);

impl FromRequest for AuthUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let cfg = req.app_data::<Data<AppConfig>>().cloned();

        let result = (|| -> AppResult<Claims> {
            let cfg = cfg.ok_or_else(|| AppError::Internal("Config not found".into()))?;
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| AppError::Unauthorized("Missing Authorization header".into()))?;
            let token = auth_header
                .strip_prefix("Bearer ")
                .ok_or_else(|| AppError::Unauthorized("Invalid token format".into()))?;
            AuthService::validate_token(token, &cfg.jwt_secret)
        })();

        ready(result.map(AuthUser).map_err(|e| {
            use actix_web::ResponseError;
            let resp = e.error_response();
            actix_web::error::InternalError::from_response("Unauthorized", resp).into()
        }))
    }
}

/// Authorized user with role and permissions loaded from database
#[derive(Debug, Clone)]
pub struct AuthUserWithRole {
    pub user_id: Uuid,
    pub email: String,
    pub role: Option<Role>,
}

impl AuthUserWithRole {
    pub fn has_permission(&self, permission: &str) -> bool {
        self.role.as_ref()
            .and_then(|r| r.permissions.as_array())
            .map(|perms| perms.iter().any(|p| p.as_str() == Some(permission)))
            .unwrap_or(false)
    }

    pub fn has_any_permission(&self, permissions: &[&str]) -> bool {
        permissions.iter().any(|p| self.has_permission(p))
    }

    pub fn has_all_permissions(&self, permissions: &[&str]) -> bool {
        permissions.iter().all(|p| self.has_permission(p))
    }

    pub fn is_admin(&self) -> bool {
        self.role.as_ref()
            .map(|r| r.name == "admin")
            .unwrap_or(false)
    }
}

impl FromRequest for AuthUserWithRole {
    type Error = actix_web::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        let cfg = req.app_data::<Data<AppConfig>>().cloned();
        let pool = req.app_data::<Data<PgPool>>().cloned();
        let req = req.clone();

        Box::pin(async move {
            let cfg = cfg.ok_or_else(|| {
                use actix_web::ResponseError;
                let e = AppError::Internal("Config not found".into());
                let resp = e.error_response();
                actix_web::error::InternalError::from_response("Unauthorized", resp)
            })?;

            let pool = pool.ok_or_else(|| {
                use actix_web::ResponseError;
                let e = AppError::Internal("Database pool not found".into());
                let resp = e.error_response();
                actix_web::error::InternalError::from_response("Unauthorized", resp)
            })?;

            // Parse token
            let auth_header = req
                .headers()
                .get("Authorization")
                .and_then(|v| v.to_str().ok())
                .ok_or_else(|| {
                    use actix_web::ResponseError;
                    let e = AppError::Unauthorized("Missing Authorization header".into());
                    let resp = e.error_response();
                    actix_web::error::InternalError::from_response("Unauthorized", resp)
                })?;

            let token = auth_header
                .strip_prefix("Bearer ")
                .ok_or_else(|| {
                    use actix_web::ResponseError;
                    let e = AppError::Unauthorized("Invalid token format".into());
                    let resp = e.error_response();
                    actix_web::error::InternalError::from_response("Unauthorized", resp)
                })?;

            let claims = AuthService::validate_token(token, &cfg.jwt_secret)
                .map_err(|e| {
                    use actix_web::ResponseError;
                    let resp = e.error_response();
                    actix_web::error::InternalError::from_response("Unauthorized", resp)
                })?;

            // Load role from database
            let role = if let Some(role_id) = claims.role_id {
                sqlx::query_as!(
                    Role,
                    "SELECT id, name, permissions, created_at FROM roles WHERE id = $1",
                    role_id
                )
                .fetch_optional(pool.get_ref())
                .await
                .map_err(|e| {
                    use actix_web::ResponseError;
                    let err = AppError::Database(e);
                    let resp = err.error_response();
                    actix_web::error::InternalError::from_response("Unauthorized", resp)
                })?
            } else {
                None
            };

            Ok(AuthUserWithRole {
                user_id: claims.sub,
                email: claims.email,
                role,
            })
        })
    }
}
