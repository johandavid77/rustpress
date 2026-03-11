use actix_web::{dev::Payload, web::Data, FromRequest, HttpRequest};
use std::future::{ready, Ready};

use crate::config::AppConfig;
use crate::errors::{AppError, AppResult};
use crate::services::auth_service::{AuthService, Claims};

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

        // ✅ Usamos error_response() en vez de .into()
        ready(result.map(AuthUser).map_err(|e| {
            use actix_web::ResponseError;
            let resp = e.error_response();
            actix_web::error::InternalError::from_response("Unauthorized", resp).into()
        }))
    }
}
