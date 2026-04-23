use actix_cors::Cors;
use actix_governor::{Governor, GovernorConfigBuilder};
use actix_files::Files;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use std::time::{SystemTime, UNIX_EPOCH};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::OnceLock;
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

    let pool_mon = pool.clone();
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

    // Backup automático cada 24 horas
    let backup_dir_auto = cfg.backup_dir.clone();
    let db_url_auto = cfg.database_url.clone();
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(86400)).await;
            let ts = chrono::Utc::now().format("%Y%m%d_%H%M%S");
            let filename = format!("auto_backup_{}.sql", ts);
            let filepath = format!("{}/{}", backup_dir_auto, filename);
            let _ = std::fs::create_dir_all(&backup_dir_auto);
            let _ = std::process::Command::new("pg_dump")
                .arg(&db_url_auto)
                .arg("-f").arg(&filepath)
                .output();
            eprintln!("[auto-backup] {}", filename);
        }
    });

    // Monitor de uptime cada 5 minutos
    {
        let site_url_mon = cfg.frontend_url.clone();

        tokio::spawn(async move {
            let mut fails: u32 = 0;
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(300)).await;
                let ok = reqwest::get(format!("{}/health", site_url_mon))
                    .await.map(|r| r.status().is_success()).unwrap_or(false);
                if ok {
                    if fails > 0 {
                        eprintln!("[uptime] Recuperado tras {} fallos", fails);
                        let _ = sqlx::query!(
                            "INSERT INTO uptime_events (id, status, checked_at) VALUES (gen_random_uuid(), 'up', NOW())"
                        ).execute(&pool_mon).await;
                        fails = 0;
                    }
                } else {
                    fails += 1;
                    eprintln!("[uptime] FALLO #{}", fails);
                    let _ = sqlx::query!(
                        "INSERT INTO uptime_events (id, status, checked_at) VALUES (gen_random_uuid(), 'down', NOW())"
                    ).execute(&pool_mon).await;
                }
            }
        });
    }

    handlers::health::init_start_time();
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
                        .configure(handlers::coupons::configure)
                        .configure(handlers::cache_admin::configure)
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
                .configure(handlers::tenants::configure)
                .configure(handlers::notifications::configure_alerts)
                .configure(handlers::analytics::configure_exports)
                .configure(handlers::analytics::configure_traffic)
                .configure(handlers::health::configure)
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
                .route("/api-docs/openapi.json", web::get().to(serve_openapi))
            .route("/health/detailed", web::get().to(handlers::settings::health_detailed))
                .route("/uptime", web::get().to(handlers::settings::uptime_stats))
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

async fn serve_openapi() -> actix_web::HttpResponse {
    let json = include_str!("../static/openapi.json");
    actix_web::HttpResponse::Ok()
        .content_type("application/json")
        .append_header(("Access-Control-Allow-Origin", "*"))
        .body(json)
}
