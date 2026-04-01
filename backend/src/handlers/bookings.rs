use actix_web::{web, HttpResponse};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{errors::AppResult, middleware::auth::AuthUserWithRole};

#[derive(Deserialize)]
pub struct BookingQuery {
    pub service_type: Option<String>,
    pub page:         Option<i64>,
}

#[derive(Deserialize)]
pub struct CreateBookingDto {
    pub service_id:  Uuid,
    pub slot_id:     Option<Uuid>,
    pub quantity:    Option<i32>,
    pub guest_name:  Option<String>,
    pub guest_email: Option<String>,
    pub guest_phone: Option<String>,
    pub notes:       Option<String>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/bookings")
            .route("/services",         web::get().to(list_services))
            .route("/services",         web::post().to(create_service))
            .route("/services/{id}",    web::get().to(get_service))
            .route("/services/{id}",    web::put().to(update_service))
            .route("/services/{id}/slots", web::get().to(get_slots))
            .route("/services/{id}/slots", web::post().to(create_slot))
            .route("",                  web::get().to(list_bookings))
            .route("",                  web::post().to(create_booking))
            .route("/{id}",             web::get().to(get_booking))
            .route("/{id}/status",      web::put().to(update_booking_status))
    );
}

async fn list_services(
    pool:  web::Data<PgPool>,
    query: web::Query<BookingQuery>,
) -> AppResult<HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT id, type, name, slug, description, price, currency,
                  capacity, duration_min, images, location, active, created_at
           FROM booking_services
           WHERE active = true
             AND ($1::text IS NULL OR type = $1)
           ORDER BY created_at DESC
           LIMIT 50"#,
        query.service_type.as_deref(),
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|s| serde_json::json!({
        "id": s.id, "type": s.r#type, "name": s.name, "slug": s.slug,
        "description": s.description, "price": s.price, "currency": s.currency,
        "capacity": s.capacity, "duration_min": s.duration_min,
        "images": s.images, "location": s.location, "created_at": s.created_at,
    })).collect();

    Ok(HttpResponse::Ok().json(data))
}

async fn get_service(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> AppResult<HttpResponse> {
    let s = sqlx::query!(
        "SELECT * FROM booking_services WHERE id = $1", *id
    ).fetch_optional(pool.get_ref()).await?;

    match s {
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Not found"}))),
        Some(s) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "id": s.id, "type": s.r#type, "name": s.name, "slug": s.slug,
            "description": s.description, "price": s.price, "currency": s.currency,
            "capacity": s.capacity, "duration_min": s.duration_min,
            "images": s.images, "location": s.location, "meta": s.meta,
            "active": s.active, "created_at": s.created_at,
        }))),
    }
}

async fn create_service(
    pool:  web::Data<PgPool>,
    _auth: AuthUserWithRole,
    body:  web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    let name = body["name"].as_str().unwrap_or("").to_string();
    let slug = name.to_lowercase().replace(' ', "-");
    let s = sqlx::query!(
        r#"INSERT INTO booking_services (type, name, slug, description, price, currency, capacity, duration_min, location, images)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, name, slug"#,
        body["type"].as_str().unwrap_or("tour"),
        name, slug,
        body["description"].as_str(),
        body["price"].as_f64().unwrap_or(0.0),
        body["currency"].as_str().unwrap_or("COP"),
        body["capacity"].as_i64().map(|v| v as i32),
        body["duration_min"].as_i64().map(|v| v as i32),
        body["location"].as_str(),
        &body["images"].as_array().map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect::<Vec<_>>()).unwrap_or_default(),
    ).fetch_one(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(serde_json::json!({"id": s.id, "name": s.name, "slug": s.slug})))
}

async fn update_service(
    pool:  web::Data<PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body:  web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        r#"UPDATE booking_services SET
            name        = COALESCE($1, name),
            description = COALESCE($2, description),
            price       = COALESCE($3, price),
            capacity    = COALESCE($4, capacity),
            location    = COALESCE($5, location),
            active      = COALESCE($6, active)
           WHERE id = $7"#,
        body["name"].as_str(),
        body["description"].as_str(),
        body["price"].as_f64(),
        body["capacity"].as_i64().map(|v| v as i32),
        body["location"].as_str(),
        body["active"].as_bool(),
        *id,
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}

async fn get_slots(pool: web::Data<PgPool>, id: web::Path<Uuid>) -> AppResult<HttpResponse> {
    let slots = sqlx::query!(
        r#"SELECT id, starts_at, ends_at, capacity, booked, price, active
           FROM booking_slots WHERE service_id = $1 AND active = true
           AND starts_at > NOW() ORDER BY starts_at ASC LIMIT 30"#,
        *id
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = slots.iter().map(|s| serde_json::json!({
        "id": s.id, "starts_at": s.starts_at, "ends_at": s.ends_at,
        "capacity": s.capacity, "booked": s.booked,
        "available": s.capacity - s.booked,
        "price": s.price,
    })).collect();
    Ok(HttpResponse::Ok().json(data))
}

async fn create_slot(
    pool:  web::Data<PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body:  web::Json<serde_json::Value>,
) -> AppResult<HttpResponse> {
    let starts_at: chrono::DateTime<chrono::Utc> = body["starts_at"].as_str()
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(chrono::Utc::now);
    let ends_at: chrono::DateTime<chrono::Utc> = body["ends_at"].as_str()
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(chrono::Utc::now);

    sqlx::query!(
        "INSERT INTO booking_slots (service_id, starts_at, ends_at, capacity, price)
         VALUES ($1,$2,$3,$4,$5)",
        *id, starts_at, ends_at,
        body["capacity"].as_i64().unwrap_or(1) as i32,
        body["price"].as_f64(),
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Created().json(serde_json::json!({"ok": true})))
}

async fn list_bookings(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let rows = sqlx::query!(
        r#"SELECT b.id, b.status, b.quantity, b.total, b.created_at,
                  s.name as service_name, s.type as service_type
           FROM bookings b JOIN booking_services s ON s.id = b.service_id
           WHERE b.user_id = $1 ORDER BY b.created_at DESC LIMIT 20"#,
        auth.user_id
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|b| serde_json::json!({
        "id": b.id, "status": b.status, "quantity": b.quantity,
        "total": b.total, "service_name": b.service_name,
        "service_type": b.service_type, "created_at": b.created_at,
    })).collect();
    Ok(HttpResponse::Ok().json(data))
}

async fn create_booking(
    pool: web::Data<PgPool>,
    auth: AuthUserWithRole,
    body: web::Json<CreateBookingDto>,
) -> AppResult<HttpResponse> {
    let service = sqlx::query!(
        "SELECT price FROM booking_services WHERE id = $1 AND active = true",
        body.service_id
    ).fetch_optional(pool.get_ref()).await?;

    let Some(s) = service else {
        return Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Servicio no disponible"})));
    };

    let quantity = body.quantity.unwrap_or(1);
    let price = body.slot_id
        .and_then(|_| None::<f64>)
        .unwrap_or(s.price);
    let total = price * quantity as f64;

    let b = sqlx::query!(
        r#"INSERT INTO bookings (service_id, slot_id, user_id, quantity, total, guest_name, guest_email, guest_phone, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id"#,
        body.service_id, body.slot_id, auth.user_id, quantity, total,
        body.guest_name.as_deref(), body.guest_email.as_deref(),
        body.guest_phone.as_deref(), body.notes.as_deref(),
    ).fetch_one(pool.get_ref()).await?;

    // Actualizar slot si existe
    if let Some(slot_id) = body.slot_id {
        sqlx::query!("UPDATE booking_slots SET booked = booked + $1 WHERE id = $2", quantity, slot_id)
            .execute(pool.get_ref()).await?;
    }

    Ok(HttpResponse::Created().json(serde_json::json!({
        "booking_id": b.id, "total": total, "status": "pending"
    })))
}

async fn get_booking(
    pool: web::Data<PgPool>,
    id:   web::Path<Uuid>,
    auth: AuthUserWithRole,
) -> AppResult<HttpResponse> {
    let b = sqlx::query!(
        r#"SELECT b.*, s.name as service_name, s.type as service_type, s.location
           FROM bookings b JOIN booking_services s ON s.id = b.service_id
           WHERE b.id = $1 AND b.user_id = $2"#,
        *id, auth.user_id
    ).fetch_optional(pool.get_ref()).await?;

    match b {
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({"error":"Not found"}))),
        Some(b) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "id": b.id, "status": b.status, "quantity": b.quantity,
            "total": b.total, "notes": b.notes,
            "service_name": b.service_name, "service_type": b.service_type,
            "location": b.location, "created_at": b.created_at,
        }))),
    }
}

#[derive(Deserialize)]
struct StatusBody { status: String }

async fn update_booking_status(
    pool:  web::Data<PgPool>,
    id:    web::Path<Uuid>,
    _auth: AuthUserWithRole,
    body:  web::Json<StatusBody>,
) -> AppResult<HttpResponse> {
    sqlx::query!(
        "UPDATE bookings SET status=$1, updated_at=NOW() WHERE id=$2",
        body.status, *id
    ).execute(pool.get_ref()).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}
