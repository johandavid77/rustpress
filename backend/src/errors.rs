use actix_web::HttpResponse;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

impl actix_web::ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let (status, code) = match self {
            AppError::NotFound(_)     => (actix_web::http::StatusCode::NOT_FOUND, "NOT_FOUND"),
            AppError::Unauthorized(_) => (actix_web::http::StatusCode::UNAUTHORIZED, "UNAUTHORIZED"),
            AppError::Forbidden(_)    => (actix_web::http::StatusCode::FORBIDDEN, "FORBIDDEN"),
            AppError::BadRequest(_)   => (actix_web::http::StatusCode::BAD_REQUEST, "BAD_REQUEST"),
            AppError::Conflict(_)     => (actix_web::http::StatusCode::CONFLICT, "CONFLICT"),
            _                         => (actix_web::http::StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR"),
        };

        HttpResponse::build(status).json(serde_json::json!({
            "error":   code,
            "message": self.to_string()
        }))
    }
}

pub type AppResult<T> = Result<T, AppError>;
