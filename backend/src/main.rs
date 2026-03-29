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
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "rustcms=debug,actix_web=info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

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
    // Rate limiting: 60 requests/min por IP
    let governor_conf = GovernorConfigBuilder::default()
        .requests_per_second(1)
        .burst_size(60)
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
                    .configure(handlers::webhooks::configure)  // 👈 nuevo
            )
            .route("/health", web::get().to(health_check))
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
}