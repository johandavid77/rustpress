use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use crate::cache::{get_cached, set_cached, RedisPool};
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::{
    errors::AppResult,
    middleware::auth::AuthUserWithRole,
    models::product::{CreateProductDto, UpdateProductDto, ProductQuery, ProductCategory},
};

fn slugify(s: &str) -> String {
    s.to_lowercase()
     .chars()
     .map(|c| if c.is_alphanumeric() { c } else { '-' })
     .collect::<String>()
     .split('-')
     .filter(|s| !s.is_empty())
     .collect::<Vec<_>>()
     .join("-")
}


pub async fn get_product_by_slug(pool: web::Data<PgPool>, slug: web::Path<String>, redis: web::Data<Mutex<RedisPool>>) -> AppResult<HttpResponse> {
    let cache_key = format!("products:slug:{}", slug);
    {
        let mut r = redis.lock().await;
        if let Some(cached) = get_cached(&mut r, &cache_key).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&cached) {
                return Ok(HttpResponse::Ok().json(val));
            }
        }
    }
    let slug = slug.into_inner();
    let row = sqlx::query!(
        r#"SELECT id, name, slug, description, price, compare_price, cost_price,
                  stock, status, images, tags, weight, created_at
           FROM products WHERE slug = $1"#,
        slug
    )
    .fetch_optional(pool.get_ref())
    .await?;

    match row {
        Some(p) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "id": p.id, "name": p.name, "slug": p.slug,
            "description": p.description, "price": p.price,
            "compare_price": p.compare_price, "cost_price": p.cost_price,
            "stock": p.stock, "status": p.status,
            "images": p.images, "tags": p.tags,
            "weight": p.weight, "created_at": p.created_at
        }))),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error": "Product not found"}))),
    }
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/shop")
            .route("/categories", web::get().to(list_categories))
            .route("/products", web::get().to(list_products))
            .route("/products/{id}", web::get().to(get_product))
    );
}

pub async fn list_categories(pool: web::Data<PgPool>) -> AppResult<HttpResponse> {
    let cats = sqlx::query_as!(
        ProductCategory,
        "SELECT * FROM product_categories ORDER BY sort_order, name"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(cats))
}

pub async fn create_category(
    pool: web::Data<PgPool>, _auth: AuthUserWithRole,
    body: web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    let name = body["name"].as_str().unwrap_or("").to_string();
    let slug = body["slug"].as_str().map(|s| s.to_string()).unwrap_or_else(|| slugify(&name));
    let cat = sqlx::query_as!(ProductCategory,
        "INSERT INTO product_categories (name, slug, description, image, parent_id)
         VALUES ($1,$2,$3,$4,$5) RETURNING *",
        name, slug,
        body["description"].as_str(),
        body["image"].as_str(),
        body["parent_id"].as_str().and_then(|s| s.parse::<Uuid>().ok()),
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(cat))
}

async fn update_category(
    pool: web::Data<PgPool>, id: web::Path<Uuid>, _auth: AuthUserWithRole,
    body: web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    let cat = sqlx::query_as!(ProductCategory,
        "UPDATE product_categories SET
            name       = COALESCE($1, name),
            description= COALESCE($2, description),
            image      = COALESCE($3, image),
            sort_order = COALESCE($4, sort_order)
         WHERE id=$5 RETURNING *",
        body["name"].as_str(),
        body["description"].as_str(),
        body["image"].as_str(),
        body["sort_order"].as_i64().map(|v| v as i32),
        *id,
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(cat))
}

async fn delete_category(
    pool: web::Data<PgPool>, id: web::Path<Uuid>, _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM product_categories WHERE id=$1", *id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn list_products(
    pool: web::Data<PgPool>, query: web::Query<ProductQuery>,
    redis: web::Data<Mutex<RedisPool>>,
) -> AppResult<HttpResponse> {
    let cache_key = format!("products:list:{}:{}:{}", query.status.as_deref().unwrap_or("active"), query.page.unwrap_or(1), query.per_page.unwrap_or(20));
    {
        let mut r = redis.lock().await;
        if let Some(cached) = get_cached(&mut r, &cache_key).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&cached) {
                return Ok(HttpResponse::Ok().json(val));
            }
        }
    }
    let page     = query.page.unwrap_or(1).max(1);
    let per_page = query.per_page.unwrap_or(20).min(100);
    let offset   = (page - 1) * per_page;
    let rows = sqlx::query!(
        r#"SELECT id, name, slug, price, compare_price, stock, status,
                  category_id, images, tags, sku, created_at
           FROM products
           WHERE ($1::text IS NULL OR status=$1)
             AND ($2::uuid IS NULL OR category_id=$2)
             AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%')
           ORDER BY created_at DESC LIMIT $4 OFFSET $5"#,
        query.status.as_deref(), query.category_id,
        query.search.as_deref(), per_page, offset,
    ).fetch_all(pool.get_ref()).await?;
    let data: Vec<_> = rows.iter().map(|p| serde_json::json!({
        "id": p.id, "name": p.name, "slug": p.slug,
        "price": p.price, "compare_price": p.compare_price,
        "stock": p.stock, "status": p.status,
        "category_id": p.category_id, "images": p.images,
        "tags": p.tags, "sku": p.sku, "created_at": p.created_at,
    })).collect();
    let response = serde_json::json!({"data": data, "page": page, "per_page": per_page});
    if let Ok(serialized) = serde_json::to_string(&response) {
        let mut r = redis.lock().await;
        set_cached(&mut r, &cache_key, &serialized, 300).await;
    }
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_product(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> AppResult<HttpResponse> {
    let p = sqlx::query!(
        "SELECT id, name, slug, description, price, compare_price, cost_price,
                stock, status, category_id, images, tags, sku, track_stock,
                created_at, updated_at, weight
         FROM products WHERE id=$1", *id
    ).fetch_optional(pool.get_ref()).await?;
    match p {
        None    => Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Not found"}))),
        Some(p) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "id": p.id, "name": p.name, "slug": p.slug,
            "description": p.description, "price": p.price,
            "compare_price": p.compare_price, "stock": p.stock,
            "status": p.status, "category_id": p.category_id,
            "images": p.images, "tags": p.tags, "sku": p.sku,
            "track_stock": p.track_stock, "created_at": p.created_at,
        }))),
    }
}

pub async fn create_product(
    pool: web::Data<PgPool>, _auth: AuthUserWithRole,
    body: web::Json<CreateProductDto>,
) -> AppResult<HttpResponse> {
    let slug = body.slug.clone().unwrap_or_else(|| slugify(&body.name));
    let p = sqlx::query!(
        r#"INSERT INTO products (name,slug,description,price,compare_price,sku,stock,status,category_id,images,tags)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
           RETURNING id,name,slug,status,price,stock,created_at"#,
        body.name, slug, body.description, body.price, body.compare_price,
        body.sku, body.stock.unwrap_or(0),
        body.status.clone().unwrap_or_else(|| "draft".into()),
        body.category_id,
        &body.images.clone().unwrap_or_default(),
        &body.tags.clone().unwrap_or_default(),
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(serde_json::json!({
        "id": p.id, "name": p.name, "slug": p.slug,
        "status": p.status, "price": p.price,
        "stock": p.stock, "created_at": p.created_at,
    })))
}

pub async fn update_product(
    pool: web::Data<PgPool>, id: web::Path<Uuid>, _auth: AuthUserWithRole,
    body: web::Json<UpdateProductDto>,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        r#"UPDATE products SET
            name          = COALESCE($1, name),
            description   = COALESCE($2, description),
            price         = COALESCE($3, price),
            compare_price = COALESCE($4, compare_price),
            sku           = COALESCE($5, sku),
            stock         = COALESCE($6, stock),
            status        = COALESCE($7, status),
            category_id   = COALESCE($8, category_id),
            updated_at    = NOW()
           WHERE id=$9"#,
        body.name.as_deref(), body.description.as_deref(),
        body.price, body.compare_price,
        body.sku.as_deref(), body.stock,
        body.status.as_deref(), body.category_id, *id,
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

pub async fn delete_product(
    pool: web::Data<PgPool>, id: web::Path<Uuid>, _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    sqlx::query!("DELETE FROM products WHERE id=$1", *id)
        .execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}
