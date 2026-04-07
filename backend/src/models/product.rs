use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub id:            Uuid,
    pub name:          String,
    pub slug:          String,
    pub description:   Option<String>,
    pub price:         f64,
    pub compare_price: Option<f64>,
    pub cost_price:    Option<f64>,
    pub sku:           Option<String>,
    pub stock:         i32,
    pub track_stock:   bool,
    pub status:        String,
    pub category_id:   Option<Uuid>,
    pub images:        Vec<String>,
    pub tags:          Vec<String>,
    pub weight:        Option<f64>,
    pub created_at:    DateTime<Utc>,
    pub updated_at:    DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProductCategory {
    pub id:          Uuid,
    pub name:        String,
    pub slug:        String,
    pub description: Option<String>,
    pub image:       Option<String>,
    pub parent_id:   Option<Uuid>,
    pub sort_order:  i32,
    pub created_at:  DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateProductDto {
    pub name:          String,
    pub slug:          Option<String>,
    pub description:   Option<String>,
    pub price:         f64,
    pub compare_price: Option<f64>,
    pub sku:           Option<String>,
    pub stock:         Option<i32>,
    pub status:        Option<String>,
    pub category_id:   Option<Uuid>,
    pub images:        Option<serde_json::Value>,
    pub tags:          Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProductDto {
    pub name:          Option<String>,
    pub description:   Option<String>,
    pub price:         Option<f64>,
    pub compare_price: Option<f64>,
    pub sku:           Option<String>,
    pub stock:         Option<i32>,
    pub status:        Option<String>,
    pub category_id:   Option<Uuid>,
    pub images:        Option<serde_json::Value>,
    pub tags:          Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct ProductQuery {
    pub page:        Option<i64>,
    pub per_page:    Option<i64>,
    pub status:      Option<String>,
    pub category_id: Option<Uuid>,
    pub search:      Option<String>,
}
