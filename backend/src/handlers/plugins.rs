use actix_web::{web::{self, Data, Json, Path}, HttpResponse};
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth::AuthUser,
    models::plugin::{PluginRecord, UpdatePluginConfigDto},
    plugins::registry::PluginRegistry,
};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/plugins")
            .route("",              web::get().to(list_plugins))
            .route("/{id}/enable",  web::post().to(enable_plugin))
            .route("/{id}/disable", web::post().to(disable_plugin))
            .route("/{id}/config",  web::get().to(get_plugin_config))
            .route("/{id}/config",  web::put().to(update_plugin_config))
            .route("/{id}",         web::delete().to(delete_plugin))
    );
}

async fn list_plugins(pool: Data<PgPool>, _auth: AuthUser) -> AppResult<HttpResponse> {
    let plugins: Vec<PluginRecord> = sqlx::query_as!(
        PluginRecord,
        "SELECT * FROM plugins ORDER BY installed_at DESC"
    )
    .fetch_all(pool.get_ref())
    .await?;
    Ok(HttpResponse::Ok().json(plugins))
}

async fn enable_plugin(
    pool: Data<PgPool>,
    registry: Data<PluginRegistry>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "UPDATE plugins SET is_enabled = true WHERE id = $1 RETURNING *",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    if let Some(p) = registry.get(&plugin.name) {
        p.on_enable().await?;
    }
    Ok(HttpResponse::Ok().json(plugin))
}

async fn disable_plugin(
    pool: Data<PgPool>,
    registry: Data<PluginRegistry>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "UPDATE plugins SET is_enabled = false WHERE id = $1 RETURNING *",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    if let Some(p) = registry.get(&plugin.name) {
        p.on_disable().await?;
        registry.unregister(&plugin.name);
    }
    Ok(HttpResponse::Ok().json(plugin))
}

async fn get_plugin_config(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "SELECT * FROM plugins WHERE id = $1",
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    Ok(HttpResponse::Ok().json(plugin.config))
}

async fn update_plugin_config(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUser,
    body: Json<UpdatePluginConfigDto>,
) -> AppResult<HttpResponse> {
    let plugin: PluginRecord = sqlx::query_as!(
        PluginRecord,
        "UPDATE plugins SET config = $1 WHERE id = $2 RETURNING *",
        body.config,
        *id
    )
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Plugin {} not found", id)))?;

    Ok(HttpResponse::Ok().json(plugin))
}

async fn delete_plugin(
    pool: Data<PgPool>,
    id: Path<Uuid>,
    _auth: AuthUser,
) -> AppResult<HttpResponse> {
    let result = sqlx::query!(
        "DELETE FROM plugins WHERE id = $1",
        *id
    )
    .execute(pool.get_ref())
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!("Plugin {} not found", id)));
    }
    Ok(HttpResponse::NoContent().finish())
}

pub async fn marketplace() -> HttpResponse {
    // Catálogo de plugins disponibles (en producción vendría de un registry externo)
    let catalog = serde_json::json!([
        {
            "id": "seo-advanced",
            "name": "seo-advanced",
            "title": "SEO Avanzado",
            "description": "Meta tags dinámicos, sitemap avanzado, schema.org, Open Graph automático por post",
            "version": "1.2.0",
            "author": "RustPress Team",
            "category": "seo",
            "icon": "Search",
            "color": "from-purple-500/20 to-purple-600/5 border-purple-500/20",
            "downloads": 1240,
            "rating": 4.8,
            "price": "free",
            "tags": ["seo", "meta", "sitemap"],
            "installed": false
        },
        {
            "id": "livechat-crisp",
            "name": "livechat-crisp",
            "title": "Live Chat (Crisp)",
            "description": "Integración con Crisp.chat — widget de soporte en tiempo real configurable desde el admin",
            "version": "1.0.3",
            "author": "Community",
            "category": "integrations",
            "icon": "MessageSquare",
            "color": "from-blue-500/20 to-blue-600/5 border-blue-500/20",
            "downloads": 856,
            "rating": 4.6,
            "price": "free",
            "tags": ["chat", "soporte", "crisp"],
            "installed": false
        },
        {
            "id": "social-login",
            "name": "social-login",
            "title": "Login Social",
            "description": "Google OAuth y GitHub OAuth — login sin contraseña para usuarios del sitio",
            "version": "2.0.1",
            "author": "RustPress Team",
            "category": "auth",
            "icon": "LogIn",
            "color": "from-green-500/20 to-green-600/5 border-green-500/20",
            "downloads": 2103,
            "rating": 4.9,
            "price": "free",
            "tags": ["oauth", "google", "github", "auth"],
            "installed": false
        },
        {
            "id": "analytics-plausible",
            "name": "analytics-plausible",
            "title": "Analytics (Plausible)",
            "description": "Integración con Plausible Analytics — privacidad primero, sin cookies",
            "version": "1.1.0",
            "author": "Community",
            "category": "analytics",
            "icon": "BarChart2",
            "color": "from-orange-500/20 to-orange-600/5 border-orange-500/20",
            "downloads": 634,
            "rating": 4.7,
            "price": "free",
            "tags": ["analytics", "plausible", "privacidad"],
            "installed": false
        },
        {
            "id": "ecommerce-pro",
            "name": "ecommerce-pro",
            "title": "Ecommerce Pro",
            "description": "Suscripciones recurrentes, bundles de productos, upsells automáticos y descuentos por volumen",
            "version": "1.0.0",
            "author": "RustPress Team",
            "category": "ecommerce",
            "icon": "ShoppingBag",
            "color": "from-pink-500/20 to-pink-600/5 border-pink-500/20",
            "downloads": 412,
            "rating": 4.5,
            "price": "premium",
            "tags": ["ecommerce", "suscripciones", "bundles"],
            "installed": false
        },
        {
            "id": "ai-writer",
            "name": "ai-writer",
            "title": "AI Writer",
            "description": "Generación de contenido con IA — títulos, meta descriptions y borradores de posts",
            "version": "0.9.1",
            "author": "Community",
            "category": "content",
            "icon": "Sparkles",
            "color": "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20",
            "downloads": 298,
            "rating": 4.3,
            "price": "free",
            "tags": ["ai", "contenido", "escritura"],
            "installed": false
        },
        {
            "id": "multi-language",
            "name": "multi-language",
            "title": "Multi-idioma",
            "description": "Posts y productos en múltiples idiomas con selector de idioma automático",
            "version": "1.3.0",
            "author": "RustPress Team",
            "category": "content",
            "icon": "Globe",
            "color": "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
            "downloads": 789,
            "rating": 4.7,
            "price": "free",
            "tags": ["i18n", "idiomas", "traduccion"],
            "installed": false
        },
        {
            "id": "subscription-forms",
            "name": "subscription-forms",
            "title": "Formularios Pro",
            "description": "Constructor drag & drop de formularios con lógica condicional y webhooks",
            "version": "2.1.0",
            "author": "Community",
            "category": "content",
            "icon": "FormInput",
            "color": "from-indigo-500/20 to-indigo-600/5 border-indigo-500/20",
            "downloads": 1567,
            "rating": 4.8,
            "price": "free",
            "tags": ["formularios", "drag-drop", "webhooks"],
            "installed": false
        }
    ]);
    HttpResponse::Ok().json(serde_json::json!({ "data": catalog }))
}
