use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ApiKey {
    pub id:         Uuid,
    pub user_id:    Uuid,
    pub name:       String,
    pub key_hash:   String,
    pub prefix:     String,
    pub scopes:     Vec<String>,
    pub last_used:  Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApiKeyDto {
    pub name:       String,
    pub scopes:     Option<Vec<String>>,
    pub expires_at: Option<DateTime<Utc>>,
}
