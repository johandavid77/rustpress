use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Default)]
pub struct Comment {
    pub id:         Uuid,
    pub post_id:    Uuid,
    pub author_id:  Uuid,
    pub content:    String,
    pub status:     String,
    #[serde(default)]
    #[sqlx(default)]
    pub tenant_id: Option<uuid::Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentDto {
    pub content: String,
}

#[derive(Debug, Deserialize, Default)]
pub struct CommentQuery {
    pub page:     Option<u32>,
    pub per_page: Option<u32>,
    pub status:   Option<String>,
}
