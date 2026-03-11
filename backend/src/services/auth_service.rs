use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub:     Uuid,
    pub email:   String,
    pub role_id: Option<Uuid>,
    pub exp:     i64,
    pub iat:     i64,
}

pub struct AuthService;

impl AuthService {
    pub fn hash_password(plain: &str) -> AppResult<String> {
        bcrypt::hash(plain, bcrypt::DEFAULT_COST)
            .map_err(|e| AppError::Internal(e.to_string()))
    }

    pub fn verify_password(plain: &str, hash: &str) -> AppResult<bool> {
        bcrypt::verify(plain, hash)
            .map_err(|e| AppError::Internal(e.to_string()))
    }

    pub fn generate_token(
        user_id: Uuid,
        email: &str,
        role_id: Option<Uuid>,
        secret: &str,
        expiry_hours: u64,
    ) -> AppResult<String> {
        let now = Utc::now();
        let claims = Claims {
            sub:     user_id,
            email:   email.to_string(),
            role_id,
            iat:     now.timestamp(),
            exp:     (now + Duration::hours(expiry_hours as i64)).timestamp(),
        };
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
        .map_err(AppError::Jwt)
    }

    pub fn validate_token(token: &str, secret: &str) -> AppResult<Claims> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )
        .map(|td| td.claims)
        .map_err(AppError::Jwt)
    }
}
