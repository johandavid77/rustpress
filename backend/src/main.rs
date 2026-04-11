use actix_cors::Cors;
use actix_governor::{Governor, GovernorConfigBuilder};
use actix_files::Files;
use actix_web::{middleware, web, App, HttpServer};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use rustcms_lib::{
    cache,
    config::AppConfig,
    db::pool::create_pool,
    handlers,
    plugins::registry::PluginRegistry,
    services::email_service::EmailService,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let log_format = std::env::var("LOG_FORMAT").unwrap_or_else(|_| "pretty".into());
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "rustcms=debug,actix_web=info".into());
    if log_format == "json" {
        tracing_subscriber::registry()
            .with(filter)
            .with(tracing_subscriber::fmt::layer().json())
            .init();
    } else {
        tracing_subscriber::registry()
            .with(filter)
            .with(tracing_subscriber::fmt::layer())
            .init();
    }

    dotenvy::dotenv().ok();
    let cfg: AppConfig = AppConfig::from_env()?;
    info!("🚀 RustCMS starting on {}:{}", cfg.host, cfg.port);

    let pool = create_pool(&cfg.database_url).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("✅ Database connected & migrations applied");

    let plugin_registry: PluginRegistry = PluginRegistry::new();
    let registry_data = web::Data::new(plugin_registry);

    // — Email Service ————————————————————————————
    let email_service = EmailService::new(
        &cfg.smtp_host,
        cfg.smtp_port,
        &cfg.smtp_username,
        &cfg.smtp_password,
        &cfg.smtp_from,
    );
    let email_data = web::Data::new(email_service);

    let pool_data = web::Data::new(pool);
    let redis = crate::cache::create_redis_pool(&cfg.redis_url).await.expect("Failed to connect to Redis");
    let redis_data = web::Data::new(tokio::sync::Mutex::new(redis));
    let cfg_data  = web::Data::new(cfg.clone());
    // Rate limiting diferenciado por scope
    // Auth: estricto — 10 req/min (burst 5)
    let _governor_auth = GovernorConfigBuilder::default()
        .requests_per_second(6)   // 1 req cada 6s = 10/min
        .burst_size(5)
        .finish()
        .unwrap();

    // API general: permisivo — 200 req/min (burst 50)
    let governor_conf = GovernorConfigBuilder::default()
        .requests_per_second(1)
        .burst_size(200)
        .finish()
        .unwrap();

    let bind_addr = format!("{}:{}", cfg.host, cfg.port);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin(&cfg.frontend_url)
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(middleware::Compress::default())
            .wrap(Governor::new(&governor_conf))
            .wrap(tracing_actix_web::TracingLogger::default())
            .app_data(pool_data.clone())
                    .app_data(redis_data.clone())
            .app_data(cfg_data.clone())
            .app_data(registry_data.clone())
            .app_data(email_data.clone())
            .app_data(
                web::JsonConfig::default()
                    .error_handler(|err, _req| {
                        let resp = actix_web::HttpResponse::BadRequest()
                            .json(serde_json::json!({ "error": err.to_string() }));
                        actix_web::error::InternalError::from_response(err, resp).into()
                    })
            )
            .service(
                web::scope("/api/v1")
            .configure(handlers::auth::configure)
                        .route("/shop/categories", web::get().to(handlers::products_shop::list_categories))
                        .configure(handlers::backup::configure)
                        .configure(handlers::updates::configure)
                        .configure(handlers::search::configure)
                        .configure(handlers::notifications::configure)
                        .configure(handlers::redirects::configure)
                        .configure(handlers::newsletter::configure)
                        .configure(handlers::contact::configure)
                        .route("/shop/products", web::get().to(handlers::products_shop::list_products))
                        .route("/shop/categories", web::post().to(handlers::products_shop::create_category))
                        .route("/shop/products", web::post().to(handlers::products_shop::create_product))
                        .route("/shop/products/slug/{slug}", web::get().to(handlers::products_shop::get_product_by_slug))
                        .route("/shop/products/{id}", web::get().to(handlers::products_shop::get_product))
                        .route("/shop/products/{id}", web::put().to(handlers::products_shop::update_product))
                        .route("/shop/products/{id}", web::delete().to(handlers::products_shop::delete_product))
                    .configure(handlers::posts::configure)
                    .configure(handlers::media::configure)
                    .configure(handlers::users::configure)
                    .configure(handlers::plugins::configure)
                    .configure(handlers::sliders::configure)
                    .configure(handlers::menus::configure)
                    .configure(handlers::comments::configure)
                    .configure(handlers::settings::configure)
                    .configure(handlers::feed::configure)
                    .configure(handlers::categories::configure)
                    .configure(handlers::webhooks::configure)
                    .configure(handlers::api_keys::configure)
                    .configure(handlers::roles::configure)
                    .configure(handlers::orders::configure)
                    .configure(handlers::bookings::configure)
                    .configure(handlers::payments::configure)
                    .configure(handlers::reviews::configure)
                    .configure(handlers::variants::configure)
                    .configure(handlers::analytics::configure)  // 👈 nuevo
            )
            .route("/health", web::get().to(health_check))
            .route("/health/detailed", web::get().to(handlers::settings::health_detailed))
            .route("/sitemap.xml", web::get().to(handlers::feed::sitemap))
            .service(Files::new("/uploads", &cfg.upload_dir).show_files_listing())
    })
    .bind(&bind_addr)?
    .run()
    .await?;

    Ok(())
}

async fn health_check() -> actix_web::HttpResponse {
    actix_web::HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "version": env!("CARGO_PKG_VERSION")
    }))
}// NOTA: agregar estas rutas al web::scope de arriba
