use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MediaFile {
    pub id:            Uuid,
    pub filename:      String,
    pub original_name: String,
    pub mime_type:     String,
    pub size_bytes:    i64,
    pub url:           String,
    pub thumbnail_url: Option<String>,
    pub alt_text:      Option<String>,
    pub uploaded_by:   Option<Uuid>,
    pub created_at:    DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct MediaQuery {
    pub page:      Option<u32>,
    pub per_page:  Option<u32>,
    pub mime_type: Option<String>,
}
