// ─────────────────────────────────────────────────────────────────────────────
// models/user.rs
// ─────────────────────────────────────────────────────────────────────────────
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id:         Uuid,
    pub username:   String,
    pub email:      String,
    #[serde(skip_serializing)]
    pub password:   String,
    pub role_id:    Option<Uuid>,
    pub is_active:  bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Safe public view (no password)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPublic {
    pub id:        Uuid,
    pub username:  String,
    pub email:     String,
    pub role_id:   Option<Uuid>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        Self {
            id: u.id, username: u.username, email: u.email,
            role_id: u.role_id, is_active: u.is_active, created_at: u.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Role {
    pub id:          Uuid,
    pub name:        String,
    pub permissions: serde_json::Value, // ["posts:write", "media:upload", ...]
    pub created_at:  DateTime<Utc>,
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────
#[derive(Debug, Deserialize, validator::Validate)]
pub struct RegisterDto {
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(email)]
    pub email:    String,
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginDto {
    pub email:    String,
    pub password: String,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct CreateUserDto {
    #[validate(length(min = 3, max = 50))]
    pub username: String,
    #[validate(email)]
    pub email:    String,
    #[validate(length(min = 8))]
    pub password: String,
    pub role_id:  Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserDto {
    pub username:  Option<String>,
    pub email:     Option<String>,
    pub password:  Option<String>,
    pub role_id:   Option<Uuid>,
    pub is_active: Option<bool>,
}
