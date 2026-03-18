use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;
use crate::errors::AppError;
use crate::models::menu::*;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/menus")
            .route("", web::get().to(list_menus))
            .route("", web::post().to(create_menu))
            .route("/slug/{slug}", web::get().to(get_menu_by_slug))
            .route("/{id}", web::get().to(get_menu))
            .route("/{id}", web::put().to(update_menu))
            .route("/{id}", web::delete().to(delete_menu))
            .route("/{id}/items", web::get().to(list_items))
            .route("/{id}/items", web::post().to(create_item))
            .route("/{id}/items/reorder", web::post().to(reorder_items))
    ).service(
        web::scope("/menu-items")
            .route("/{id}", web::put().to(update_item))
            .route("/{id}", web::delete().to(delete_item))
    );
}

async fn list_menus(pool: web::Data<PgPool>) -> Result<HttpResponse, AppError> {
    let menus = sqlx::query_as!(Menu,
        "SELECT * FROM menus ORDER BY created_at ASC"
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(menus))
}

async fn get_menu(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    let menu = sqlx::query_as!(Menu, "SELECT * FROM menus WHERE id = $1", id)
        .fetch_optional(pool.get_ref()).await?
        .ok_or(AppError::NotFound("Menu not found".into()))?;
    let items = get_items_tree(&pool, id).await?;
    Ok(HttpResponse::Ok().json(MenuWithItems {
        id: menu.id, name: menu.name, slug: menu.slug,
        description: menu.description, is_active: menu.is_active, items,
    }))
}

async fn get_menu_by_slug(pool: web::Data<PgPool>, path: web::Path<String>) -> Result<HttpResponse, AppError> {
    let slug = path.into_inner();
    let menu = sqlx::query_as!(Menu, "SELECT * FROM menus WHERE slug = $1 AND is_active = true", slug)
        .fetch_optional(pool.get_ref()).await?
        .ok_or(AppError::NotFound("Menu not found".into()))?;
    let items = get_items_tree(&pool, menu.id).await?;
    Ok(HttpResponse::Ok().json(MenuWithItems {
        id: menu.id, name: menu.name, slug: menu.slug,
        description: menu.description, is_active: menu.is_active, items,
    }))
}

async fn get_items_tree(pool: &PgPool, menu_id: Uuid) -> Result<Vec<MenuItemTree>, AppError> {
    let all_items = sqlx::query_as!(MenuItem,
        "SELECT * FROM menu_items WHERE menu_id = $1 AND is_active = true ORDER BY order_index ASC",
        menu_id
    ).fetch_all(pool).await?;
    Ok(build_tree(all_items, None))
}

fn build_tree(items: Vec<MenuItem>, parent_id: Option<Uuid>) -> Vec<MenuItemTree> {
    items.iter()
        .filter(|i| i.parent_id == parent_id)
        .map(|i| MenuItemTree {
            id: i.id, menu_id: i.menu_id, parent_id: i.parent_id,
            label: i.label.clone(), url: i.url.clone(), target: i.target.clone(),
            icon: i.icon.clone(), order_index: i.order_index, is_active: i.is_active,
            children: build_tree(items.clone(), Some(i.id)),
        })
        .collect()
}

async fn create_menu(pool: web::Data<PgPool>, body: web::Json<CreateMenuDto>) -> Result<HttpResponse, AppError> {
    let menu = sqlx::query_as!(Menu,
        "INSERT INTO menus (name, slug, description, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
        body.name, body.slug, body.description, body.is_active.unwrap_or(true)
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(menu))
}

async fn update_menu(pool: web::Data<PgPool>, path: web::Path<Uuid>, body: web::Json<UpdateMenuDto>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    let menu = sqlx::query_as!(Menu,
        r#"UPDATE menus SET
            name = COALESCE($1, name),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            is_active = COALESCE($4, is_active),
            updated_at = NOW()
        WHERE id = $5 RETURNING *"#,
        body.name, body.slug, body.description, body.is_active, id
    ).fetch_optional(pool.get_ref()).await?
        .ok_or(AppError::NotFound("Menu not found".into()))?;
    Ok(HttpResponse::Ok().json(menu))
}

async fn delete_menu(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    sqlx::query!("DELETE FROM menus WHERE id = $1", id).execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}

async fn list_items(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> Result<HttpResponse, AppError> {
    let menu_id = path.into_inner();
    let items = sqlx::query_as!(MenuItem,
        "SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY order_index ASC", menu_id
    ).fetch_all(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(items))
}

async fn create_item(pool: web::Data<PgPool>, path: web::Path<Uuid>, body: web::Json<CreateMenuItemDto>) -> Result<HttpResponse, AppError> {
    let menu_id = path.into_inner();
    let item = sqlx::query_as!(MenuItem,
        "INSERT INTO menu_items (menu_id, parent_id, label, url, target, icon, order_index, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        menu_id, body.parent_id, body.label, body.url,
        body.target.as_deref().unwrap_or("_self"),
        body.icon, body.order_index.unwrap_or(0), body.is_active.unwrap_or(true)
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(item))
}

async fn update_item(pool: web::Data<PgPool>, path: web::Path<Uuid>, body: web::Json<UpdateMenuItemDto>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    let item = sqlx::query_as!(MenuItem,
        r#"UPDATE menu_items SET
            parent_id = COALESCE($1, parent_id),
            label = COALESCE($2, label),
            url = COALESCE($3, url),
            target = COALESCE($4, target),
            icon = COALESCE($5, icon),
            order_index = COALESCE($6, order_index),
            is_active = COALESCE($7, is_active),
            updated_at = NOW()
        WHERE id = $8 RETURNING *"#,
        body.parent_id, body.label, body.url, body.target,
        body.icon, body.order_index, body.is_active, id
    ).fetch_optional(pool.get_ref()).await?
        .ok_or(AppError::NotFound("Item not found".into()))?;
    Ok(HttpResponse::Ok().json(item))
}

async fn delete_item(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    sqlx::query!("DELETE FROM menu_items WHERE id = $1", id).execute(pool.get_ref()).await?;
    Ok(HttpResponse::NoContent().finish())
}

async fn reorder_items(pool: web::Data<PgPool>, _path: web::Path<Uuid>, body: web::Json<Vec<ReorderItemDto>>) -> Result<HttpResponse, AppError> {
    for item in body.iter() {
        sqlx::query!(
            "UPDATE menu_items SET order_index = $1, parent_id = $2, updated_at = NOW() WHERE id = $3",
            item.order_index, item.parent_id, item.id
        ).execute(pool.get_ref()).await?;
    }
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}
