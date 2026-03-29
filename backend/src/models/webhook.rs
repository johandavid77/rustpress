use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Webhook {
    pub id:         Uuid,
    pub name:       String,
    pub url:        String,
    pub event:      String,
    pub active:     bool,
    pub secret:     Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWebhookDto {
    pub name:   String,
    pub url:    String,
    pub event:  Option<String>,
    pub secret: Option<String>,
}
