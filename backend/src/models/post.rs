use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum PostStatus {
    Draft,
    Published,
    Archived,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum PostType {
    Post,
    Page,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id:           Uuid,
    pub title:        String,
    pub slug:         String,
    pub content:      Option<String>,
    pub excerpt:      Option<String>,
    pub post_type:    String,
    pub status:       String,
    pub author_id:    Uuid,
    pub meta:         serde_json::Value,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at:   DateTime<Utc>,
    pub updated_at:      DateTime<Utc>,
    pub seo_title:       Option<String>,
    pub seo_description: Option<String>,
    pub og_image:        Option<String>,
    pub language:        String,
    pub views:           i64,
    pub publish_at:      Option<chrono::DateTime<chrono::Utc>>,
}

// ─── DTOs ───────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, validator::Validate)]
pub struct CreatePostDto {
    #[validate(length(min = 1, max = 500))]
    pub title:     String,
    pub slug:      Option<String>,    // auto-generated if None
    pub content:   Option<String>,
    pub excerpt:         Option<String>,
    pub seo_title:       Option<String>,
    pub seo_description: Option<String>,
    pub og_image:        Option<String>,
    pub publish_at:      Option<chrono::DateTime<chrono::Utc>>,
    pub language:        Option<String>,
    pub post_type: Option<String>,    // "post" | "page" | "custom"
    pub meta:      Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePostDto {
    pub title:     Option<String>,
    pub slug:      Option<String>,
    pub content:   Option<String>,
    pub excerpt:         Option<String>,
    pub seo_title:       Option<String>,
    pub seo_description: Option<String>,
    pub og_image:        Option<String>,
    pub publish_at:      Option<chrono::DateTime<chrono::Utc>>,
    pub language:        Option<String>,
    pub post_type: Option<String>,
    pub status:    Option<String>,
    pub meta:      Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct PostQuery {
    pub page:      Option<u32>,
    pub per_page:  Option<u32>,
    pub status:    Option<String>,
    pub post_type: Option<String>,
    pub author_id: Option<Uuid>,
    pub search:    Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PostListResponse {
    pub data:        Vec<Post>,
    pub total:       i64,
    pub page:        u32,
    pub per_page:    u32,
    pub total_pages: u32,
}
