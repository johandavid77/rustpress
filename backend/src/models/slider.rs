use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Slider {
    pub id:          Uuid,
    pub title:       String,
    pub subtitle:    Option<String>,
    pub button_text: Option<String>,
    pub button_url:  Option<String>,
    pub image_url:   String,
    pub order_index: i32,
    pub is_active:   bool,
    pub created_at:  DateTime<Utc>,
    pub updated_at:  DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateSliderDto {
    #[validate(length(min = 1, max = 255))]
    pub title:       String,
    pub subtitle:    Option<String>,
    pub button_text: Option<String>,
    pub button_url:  Option<String>,
    pub image_url:   String,
    pub order_index: Option<i32>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateSliderDto {
    #[validate(length(min = 1, max = 255))]
    pub title:       Option<String>,
    pub subtitle:    Option<String>,
    pub button_text: Option<String>,
    pub button_url:  Option<String>,
    pub image_url:   Option<String>,
    pub order_index: Option<i32>,
    pub is_active:   Option<bool>,
}
