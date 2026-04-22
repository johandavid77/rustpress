use actix_web::{web, HttpRequest, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Deserialize)]
pub struct TrackDto {
    pub event:      String,
    pub entity_id:  Option<Uuid>,
    pub session_id: Option<String>,
    pub path:       Option<String>,
    pub referrer:   Option<String>,
    pub value:      Option<f64>,
}

#[derive(Deserialize)]
pub struct AnalyticsQuery {
    pub days: Option<i32>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/analytics")
            .route("/track",        web::post().to(track))
            .route("/dashboard",    web::get().to(dashboard))
            .route("/top-posts",    web::get().to(top_posts))
            .route("/top-products", web::get().to(top_products))
            .route("/funnel",       web::get().to(funnel))
            .route("/realtime",     web::get().to(realtime))
    );
}

async fn track(
    req:  HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<TrackDto>,
) -> AppResult<HttpResponse> {
    let ua = req.headers()
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let device = if ua.contains("Mobile") || ua.contains("Android") { "mobile" }
                 else if ua.contains("Tablet") || ua.contains("iPad") { "tablet" }
                 else { "desktop" };

    sqlx::query!(
        "INSERT INTO analytics_events (event, entity_id, session_id, path, referrer, device, value)
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
        body.event, body.entity_id,
        body.session_id.as_deref(), body.path.as_deref(),
        body.referrer.as_deref(), device,
        body.value.unwrap_or(0.0),
    ).execute(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn dashboard(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<AnalyticsQuery>,
) -> AppResult<HttpResponse> {
    let days  = query.days.unwrap_or(30);
    let ds    = days.to_string();
    let ds2   = (days * 2).to_string();

    macro_rules! count_event {
        ($pool:expr, $event:expr, $days:expr) => {
            sqlx::query_scalar!(
                "SELECT COUNT(*)::bigint FROM analytics_events
                 WHERE event = $1 AND created_at >= NOW() - ($2 || ' days')::interval",
                $event, $days
            ).fetch_one($pool).await?.unwrap_or(0)
        };
    }

    let page_views    = count_event!(pool.get_ref(), "page_view",    &ds);
    let post_views    = count_event!(pool.get_ref(), "post_view",    &ds);
    let product_views = count_event!(pool.get_ref(), "product_view", &ds);
    let add_to_carts  = count_event!(pool.get_ref(), "add_to_cart",  &ds);
    let purchases     = count_event!(pool.get_ref(), "purchase",     &ds);

    let revenue: f64 = sqlx::query_scalar!(
        "SELECT COALESCE(SUM(value), 0)::float8 FROM analytics_events
         WHERE event = 'purchase' AND created_at >= NOW() - ($1 || ' days')::interval", ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0.0);

    let unique_sessions: i64 = sqlx::query_scalar!(
        "SELECT COUNT(DISTINCT session_id)::bigint FROM analytics_events
         WHERE created_at >= NOW() - ($1 || ' days')::interval", ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let prev_views: i64 = sqlx::query_scalar!(
        "SELECT COUNT(*)::bigint FROM analytics_events
         WHERE event = 'page_view'
           AND created_at >= NOW() - ($1 || ' days')::interval
           AND created_at <  NOW() - ($2 || ' days')::interval",
        ds2, ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let prev_revenue: f64 = sqlx::query_scalar!(
        "SELECT COALESCE(SUM(value), 0)::float8 FROM analytics_events
         WHERE event = 'purchase'
           AND created_at >= NOW() - ($1 || ' days')::interval
           AND created_at <  NOW() - ($2 || ' days')::interval",
        ds2, ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0.0);

    // Serie diaria — evitar ORDER BY alias usando subquery
    let daily_rows = sqlx::query!(
        r#"SELECT
            day::date                    as "day!",
            page_views::bigint           as "page_views!",
            purchases_count::bigint      as "purchases_count!",
            revenue::float8              as "revenue!"
           FROM (
             SELECT
               DATE_TRUNC('day', created_at)                                         as day,
               COUNT(*) FILTER (WHERE event = 'page_view')                           as page_views,
               COUNT(*) FILTER (WHERE event = 'purchase')                            as purchases_count,
               COALESCE(SUM(value) FILTER (WHERE event = 'purchase'), 0.0)           as revenue
             FROM analytics_events
             WHERE created_at >= NOW() - ($1 || ' days')::interval
             GROUP BY DATE_TRUNC('day', created_at)
           ) sub
           ORDER BY day ASC"#,
        ds
    ).fetch_all(pool.get_ref()).await?;

    // Dispositivos
    let device_rows = sqlx::query!(
        r#"SELECT
            device_name    as "device_name!",
            device_count   as "device_count!"
           FROM (
             SELECT
               COALESCE(device, 'unknown') as device_name,
               COUNT(*)::bigint            as device_count
             FROM analytics_events
             WHERE created_at >= NOW() - ($1 || ' days')::interval
             GROUP BY device
           ) sub
           ORDER BY device_count DESC"#,
        ds
    ).fetch_all(pool.get_ref()).await?;

    let pct = |curr: i64, prev: i64| -> f64 {
        if prev == 0 { 0.0 } else { ((curr - prev) as f64 / prev as f64) * 100.0 }
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "period_days": days,
        "summary": {
            "page_views":      page_views,
            "post_views":      post_views,
            "product_views":   product_views,
            "add_to_carts":    add_to_carts,
            "purchases":       purchases,
            "revenue":         revenue,
            "unique_sessions": unique_sessions,
            "pv_change_pct":   pct(page_views, prev_views),
            "rev_change_pct":  if prev_revenue == 0.0 { 0.0 }
                               else { ((revenue - prev_revenue) / prev_revenue) * 100.0 },
        },
        "daily": daily_rows.iter().map(|d| serde_json::json!({
            "day": d.day, "views": d.page_views,
            "purchases": d.purchases_count, "revenue": d.revenue,
        })).collect::<Vec<_>>(),
        "devices": device_rows.iter().map(|d| serde_json::json!({
            "device": d.device_name, "count": d.device_count,
        })).collect::<Vec<_>>(),
    })))
}

async fn top_posts(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<AnalyticsQuery>,
) -> AppResult<HttpResponse> {
    let ds = query.days.unwrap_or(30).to_string();
    let rows = sqlx::query!(
        r#"SELECT
            entity_id   as "entity_id!",
            title       as "title!",
            slug        as "slug!",
            view_count  as "view_count!"
           FROM (
             SELECT
               ae.entity_id,
               p.title,
               p.slug,
               COUNT(*)::bigint as view_count
             FROM analytics_events ae
             JOIN posts p ON p.id = ae.entity_id
             WHERE ae.event = 'post_view'
               AND ae.created_at >= NOW() - ($1 || ' days')::interval
             GROUP BY ae.entity_id, p.title, p.slug
           ) sub
           ORDER BY view_count DESC LIMIT 10"#,
        ds
    ).fetch_all(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(rows.iter().map(|r| serde_json::json!({
        "id": r.entity_id, "title": r.title, "slug": r.slug, "views": r.view_count,
    })).collect::<Vec<_>>()))
}

async fn top_products(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<AnalyticsQuery>,
) -> AppResult<HttpResponse> {
    let ds = query.days.unwrap_or(30).to_string();
    let rows = sqlx::query!(
        r#"SELECT
            entity_id      as "entity_id!",
            prod_name      as "prod_name!",
            prod_slug      as "prod_slug!",
            view_count     as "view_count!",
            cart_count     as "cart_count!",
            purchase_count as "purchase_count!"
           FROM (
             SELECT
               ae.entity_id,
               p.name                                                              as prod_name,
               p.slug                                                              as prod_slug,
               COUNT(*) FILTER (WHERE ae.event = 'product_view')::bigint          as view_count,
               COUNT(*) FILTER (WHERE ae.event = 'add_to_cart')::bigint           as cart_count,
               COUNT(*) FILTER (WHERE ae.event = 'purchase')::bigint              as purchase_count
             FROM analytics_events ae
             JOIN products p ON p.id = ae.entity_id
             WHERE ae.event IN ('product_view','add_to_cart','purchase')
               AND ae.created_at >= NOW() - ($1 || ' days')::interval
             GROUP BY ae.entity_id, p.name, p.slug
           ) sub
           ORDER BY view_count DESC LIMIT 10"#,
        ds
    ).fetch_all(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(rows.iter().map(|r| serde_json::json!({
        "id": r.entity_id, "name": r.prod_name, "slug": r.prod_slug,
        "views": r.view_count, "carts": r.cart_count, "purchases": r.purchase_count,
        "conversion": if r.view_count > 0 {
            (r.purchase_count as f64 / r.view_count as f64) * 100.0
        } else { 0.0 },
    })).collect::<Vec<_>>()))
}

async fn funnel(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<AnalyticsQuery>,
) -> AppResult<HttpResponse> {
    let ds = query.days.unwrap_or(30).to_string();

    let viewed: i64 = sqlx::query_scalar!(
        "SELECT COUNT(DISTINCT session_id)::bigint FROM analytics_events
         WHERE event = 'product_view' AND created_at >= NOW() - ($1 || ' days')::interval", ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let carted: i64 = sqlx::query_scalar!(
        "SELECT COUNT(DISTINCT session_id)::bigint FROM analytics_events
         WHERE event = 'add_to_cart' AND created_at >= NOW() - ($1 || ' days')::interval", ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let purchased: i64 = sqlx::query_scalar!(
        "SELECT COUNT(DISTINCT session_id)::bigint FROM analytics_events
         WHERE event = 'purchase' AND created_at >= NOW() - ($1 || ' days')::interval", ds
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let pct = |a: i64, b: i64| if b == 0 { 0.0 } else { (a as f64 / b as f64) * 100.0 };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "funnel": [
            {"step": "Vio producto",    "sessions": viewed,    "rate": 100.0},
            {"step": "Agregó al carro", "sessions": carted,    "rate": pct(carted, viewed)},
            {"step": "Compró",          "sessions": purchased, "rate": pct(purchased, viewed)},
        ]
    })))
}

async fn realtime(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let active: i64 = sqlx::query_scalar!(
        "SELECT COUNT(DISTINCT session_id)::bigint FROM analytics_events
         WHERE created_at >= NOW() - INTERVAL '5 minutes'"
    ).fetch_one(pool.get_ref()).await?.unwrap_or(0);

    let recent = sqlx::query!(
        "SELECT event, path, device, created_at FROM analytics_events
         ORDER BY created_at DESC LIMIT 20"
    ).fetch_all(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "active_sessions": active,
        "recent_events": recent.iter().map(|r| serde_json::json!({
            "event": r.event, "path": r.path,
            "device": r.device, "created_at": r.created_at,
        })).collect::<Vec<_>>()
    })))
}

pub async fn revenue_monthly(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
            COALESCE(SUM(total), 0.0)::float8 as revenue,
            COUNT(*)::int as orders
           FROM orders
           WHERE created_at >= NOW() - INTERVAL '12 months'
             AND status NOT IN ('cancelled', 'refunded')
           GROUP BY DATE_TRUNC('month', created_at)
           ORDER BY DATE_TRUNC('month', created_at)"#
    )
    .fetch_all(pool.get_ref())
    .await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "month":   r.month,
        "revenue": r.revenue.unwrap_or(0.0),
        "orders":  r.orders.unwrap_or(0),
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": data })))
}

pub async fn top_products_sales(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT
            p.name,
            p.id::text as id,
            COALESCE(SUM(oi.quantity), 0)::int8 as total_sold,
            COALESCE(SUM(oi.quantity * oi.price), 0.0)::float8 as total_revenue
           FROM products p
           LEFT JOIN order_items oi ON oi.product_id = p.id
           LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded')
           GROUP BY p.id, p.name
           ORDER BY total_sold DESC
           LIMIT 10"#
    )
    .fetch_all(pool.get_ref())
    .await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id":            r.id,
        "name":          r.name,
        "total_sold":    r.total_sold.unwrap_or(0),
        "total_revenue": r.total_revenue.unwrap_or(0.0),
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": data })))
}

pub fn configure_exports(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/export")
            .route("/orders.csv",      web::get().to(export_orders_csv))
            .route("/posts.csv",       web::get().to(export_posts_csv))
            .route("/subscribers.csv", web::get().to(export_subscribers_csv))
            .route("/products.csv",    web::get().to(export_products_csv))
    );
}

pub async fn export_orders_csv(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    if !auth.has_permission("analytics:read") {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error":"Forbidden"})));
    }
    let rows = sqlx::query!(
        "SELECT id::text, status, total, created_at FROM orders ORDER BY created_at DESC LIMIT 5000"
    ).fetch_all(pool.get_ref()).await?;

    let mut csv = String::from("id,status,total,created_at\n");
    for r in &rows {
        csv.push_str(&format!("{},{},{:.2},{}\n",
            r.id.as_deref().unwrap_or(""),
            r.status,
            r.total,
            r.created_at.format("%Y-%m-%d %H:%M:%S")));
    }
    Ok(HttpResponse::Ok()
        .content_type("text/csv; charset=utf-8")
        .insert_header(("Content-Disposition", "attachment; filename=\"orders.csv\""))
        .body(csv))
}

pub async fn export_posts_csv(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    if !auth.has_permission("analytics:read") {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error":"Forbidden"})));
    }
    let rows = sqlx::query!(
        "SELECT id::text, title, status, views, created_at FROM posts ORDER BY created_at DESC LIMIT 5000"
    ).fetch_all(pool.get_ref()).await?;

    let mut csv = String::from("id,title,status,views,created_at\n");
    for r in &rows {
        let title = r.title.replace('"', "\"\"");
        let status = r.status.clone();
        let views = r.views;
        csv.push_str(&format!("{},\"{}\",{},{},{}\n",
            r.id.as_deref().unwrap_or(""),
            title, status, views,
            r.created_at.format("%Y-%m-%d %H:%M:%S")));
    }
    Ok(HttpResponse::Ok()
        .content_type("text/csv; charset=utf-8")
        .insert_header(("Content-Disposition", "attachment; filename=\"posts.csv\""))
        .body(csv))
}

pub async fn export_subscribers_csv(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    if !auth.has_permission("analytics:read") {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error":"Forbidden"})));
    }
    let rows = sqlx::query!(
        "SELECT email, name, active, created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 10000"
    ).fetch_all(pool.get_ref()).await?;

    let mut csv = String::from("email,name,active,created_at\n");
    for r in &rows {
        let name = r.name.as_deref().unwrap_or("").replace('"', "\"\"");
        csv.push_str(&format!("{},{},{},{}\n",
            r.email, name, r.active,
            r.created_at.format("%Y-%m-%d %H:%M:%S")));
    }
    Ok(HttpResponse::Ok()
        .content_type("text/csv; charset=utf-8")
        .insert_header(("Content-Disposition", "attachment; filename=\"subscribers.csv\""))
        .body(csv))
}

pub async fn export_products_csv(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    if !auth.has_permission("analytics:read") {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({"error":"Forbidden"})));
    }
    let rows = sqlx::query!(
        "SELECT id::text, name, price, stock, status, created_at FROM products ORDER BY created_at DESC LIMIT 5000"
    ).fetch_all(pool.get_ref()).await?;

    let mut csv = String::from("id,name,price,stock,status,created_at\n");
    for r in &rows {
        let name = r.name.replace('"', "\"\"");
        let price = r.price;
        let stock = r.stock;
        let status = r.status.clone();
        csv.push_str(&format!("{},\"{}\",{:.2},{},{},{}\n",
            r.id.as_deref().unwrap_or(""),
            name, price, stock, status,
            r.created_at.format("%Y-%m-%d %H:%M:%S")));
    }
    Ok(HttpResponse::Ok()
        .content_type("text/csv; charset=utf-8")
        .insert_header(("Content-Disposition", "attachment; filename=\"products.csv\""))
        .body(csv))
}



pub fn configure_traffic(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/traffic")
            .route("/sources", web::get().to(traffic_sources))
            .route("/utm",     web::get().to(utm_stats))
    );
}

async fn traffic_sources(
    pool:  web::Data<sqlx::PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> AppResult<HttpResponse> {
    let days = query.get("days").and_then(|d| d.parse::<i32>().ok()).unwrap_or(30);

    let rows = sqlx::query!(
        r#"SELECT
            CASE
                WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                WHEN referrer LIKE '%google%'   THEN 'Google'
                WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                WHEN referrer LIKE '%twitter%' OR referrer LIKE '%t.co%' THEN 'Twitter/X'
                WHEN referrer LIKE '%instagram%' THEN 'Instagram'
                WHEN referrer LIKE '%youtube%'  THEN 'YouTube'
                WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
                ELSE 'Other'
            END as "source!: String",
            COUNT(DISTINCT session_id)::int as "sessions!: i32",
            COUNT(*)::int as "pageviews!: i32"
           FROM analytics_events
           WHERE created_at >= NOW() - ($1 || ' days')::interval
           GROUP BY 1
           ORDER BY 2 DESC
           LIMIT 20"#,
        days.to_string()
    )
    .fetch_all(pool.get_ref())
    .await?;

    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "source":    r.source,
        "sessions":  r.sessions,
        "pageviews": r.pageviews,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": data })))
}

async fn utm_stats(
    pool:  web::Data<sqlx::PgPool>,
    _auth: AuthUserWithRole,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> AppResult<HttpResponse> {
    let days = query.get("days").and_then(|d| d.parse::<i32>().ok()).unwrap_or(30);

    let rows = sqlx::query!(
        r#"SELECT
            COALESCE(referrer, '') as "referrer!: String",
            COUNT(DISTINCT session_id)::int as "sessions!: i32"
           FROM analytics_events
           WHERE created_at >= NOW() - ($1 || ' days')::interval
             AND referrer IS NOT NULL AND referrer != ''
           GROUP BY referrer
           ORDER BY 2 DESC
           LIMIT 20"#,
        days.to_string()
    )
    .fetch_all(pool.get_ref())
    .await?;

    let data: Vec<serde_json::Value> = rows.iter().map(|r| serde_json::json!({
        "referrer":  r.referrer,
        "sessions":  r.sessions,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": data })))
}
