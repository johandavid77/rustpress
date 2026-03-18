use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Menu {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct MenuItem {
    pub id: Uuid,
    pub menu_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub label: String,
    pub url: Option<String>,
    pub target: String,
    pub icon: Option<String>,
    pub order_index: i32,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MenuWithItems {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub items: Vec<MenuItemTree>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MenuItemTree {
    pub id: Uuid,
    pub menu_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub label: String,
    pub url: Option<String>,
    pub target: String,
    pub icon: Option<String>,
    pub order_index: i32,
    pub is_active: bool,
    pub children: Vec<MenuItemTree>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateMenuDto {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(min = 1, max = 255))]
    pub slug: String,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateMenuDto {
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    #[validate(length(min = 1, max = 255))]
    pub slug: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct CreateMenuItemDto {
    pub menu_id: Uuid,
    pub parent_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub label: String,
    pub url: Option<String>,
    pub target: Option<String>,
    pub icon: Option<String>,
    pub order_index: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct UpdateMenuItemDto {
    pub parent_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub label: Option<String>,
    pub url: Option<String>,
    pub target: Option<String>,
    pub icon: Option<String>,
    pub order_index: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReorderItemDto {
    pub id: Uuid,
    pub order_index: i32,
    pub parent_id: Option<Uuid>,
}
