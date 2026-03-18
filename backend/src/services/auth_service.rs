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

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    // ── hash_password & verify_password ──────────────────────────────────────

    #[test]
    fn test_hash_password_returns_hash() {
        let hash = AuthService::hash_password("mypassword123").unwrap();
        assert!(!hash.is_empty());
        assert_ne!(hash, "mypassword123");
    }

    #[test]
    fn test_verify_password_correct() {
        let hash = AuthService::hash_password("mypassword123").unwrap();
        let valid = AuthService::verify_password("mypassword123", &hash).unwrap();
        assert!(valid);
    }

    #[test]
    fn test_verify_password_incorrect() {
        let hash = AuthService::hash_password("mypassword123").unwrap();
        let valid = AuthService::verify_password("wrongpassword", &hash).unwrap();
        assert!(!valid);
    }

    #[test]
    fn test_hash_is_different_each_time() {
        let hash1 = AuthService::hash_password("samepassword").unwrap();
        let hash2 = AuthService::hash_password("samepassword").unwrap();
        // bcrypt genera salt distinto cada vez
        assert_ne!(hash1, hash2);
        // pero ambos verifican correctamente
        assert!(AuthService::verify_password("samepassword", &hash1).unwrap());
        assert!(AuthService::verify_password("samepassword", &hash2).unwrap());
    }

    // ── generate_token & validate_token ──────────────────────────────────────

    #[test]
    fn test_generate_and_validate_token() {
        let user_id = Uuid::new_v4();    let token = AuthService::generate_token(
        user_id,
        "test@test.com",
        None,
        "supersecret",
        24,
    ).unwrap();

    let claims = AuthService::validate_token(&token, "supersecret").unwrap();
    assert_eq!(claims.sub, user_id);
    assert_eq!(claims.email, "test@test.com");
}

#[test]
fn test_invalid_token_rejected() {
    let result = AuthService::validate_token("invalid.token.here", "supersecret");
    assert!(result.is_err());
}

#[test]
fn test_wrong_secret_rejected() {
    let user_id = Uuid::new_v4();
    let token = AuthService::generate_token(
        user_id,
        "test@test.com",
        None,
        "supersecret",
        24,
    ).unwrap();

    let result = AuthService::validate_token(&token, "wrongsecret");
    assert!(result.is_err());
}
}
