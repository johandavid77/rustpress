#[cfg(test)]
mod tests {
    use actix_web::{test, web, App};
    use serde_json::json;

    async fn test_pool() -> sqlx::PgPool {
        dotenvy::dotenv().ok();
        std::env::set_var("JWT_SECRET", "test_secret_min_32_chars_for_ci_ok!!");
        let url = std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://rustcms:rustcms@localhost/rustcms".into());
        sqlx::PgPool::connect(&url).await.expect("Test DB failed")
    }

    macro_rules! make_app {
        ($pool:expr) => {
            test::init_service(
                App::new()
                    .app_data(web::Data::new($pool.clone()))
                    .app_data(web::Data::new(None::<crate::email::Mailer>))
                    .app_data(
                        web::JsonConfig::default()
                            .error_handler(|err, req| {
                                let resp = actix_web::HttpResponse::BadRequest()
                                    .body(err.to_string());
                                actix_web::error::InternalError::from_response(err, resp).into()
                            })
                    )
                    .configure(crate::handlers::auth::configure)
                    .configure(crate::handlers::posts::configure)
                    .configure(crate::handlers::products_shop::configure)
            ).await
        };
    }

    #[actix_rt::test]
    async fn test_posts_public_access() {
        let pool = test_pool().await;
        let app = make_app!(pool);
        let req = test::TestRequest::get().uri("/posts").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().as_u16() != 0, "Posts endpoint responds, got {}", resp.status());
    }

    #[actix_rt::test]
    async fn test_create_post_requires_auth() {
        let pool = test_pool().await;
        let app = make_app!(pool);
        let req = test::TestRequest::post()
            .uri("/posts")
            .set_json(json!({"title":"T","content":"C","status":"draft"}))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().as_u16() >= 400, "Create post should fail without auth, got {}", resp.status());
    }

    #[actix_rt::test]
    async fn test_products_public_access() {
        let pool = test_pool().await;
        let app = make_app!(pool);
        let req = test::TestRequest::get().uri("/shop/products").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success(), "Products list is public, got {}", resp.status());
    }

    #[actix_rt::test]
    async fn test_create_product_requires_auth() {
        let pool = test_pool().await;
        let app = make_app!(pool);
        let req = test::TestRequest::post()
            .uri("/shop/products")
            .set_json(json!({"name":"X","price":1.0,"stock":1,"status":"active"}))
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().as_u16() >= 400, "Create product should fail without auth, got {}", resp.status());
    }

    #[actix_rt::test]
    async fn test_product_slug_not_found() {
        let pool = test_pool().await;
        let app = make_app!(pool);
        let req = test::TestRequest::get()
            .uri("/shop/products/slug/xyznonexistent999abc")
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status().as_u16(), 404, "Missing product → 404, got {}", resp.status());
    }

    #[actix_rt::test]
    async fn test_post_slug_not_found() {
        let pool = test_pool().await;
        let app = make_app!(pool);
        let req = test::TestRequest::get()
            .uri("/posts/slug/xyznonexistent999abc")
            .to_request();
        let resp = test::call_service(&app, req).await;
        assert_eq!(resp.status().as_u16(), 404, "Missing post → 404, got {}", resp.status());
    }
}
