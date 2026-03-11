use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PluginRecord {
    pub id:           Uuid,
    pub name:         String,
    pub version:      String,
    pub description:  Option<String>,
    pub is_enabled:   bool,
    pub config:       serde_json::Value,
    pub installed_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePluginConfigDto {
    pub config: serde_json::Value,
}
