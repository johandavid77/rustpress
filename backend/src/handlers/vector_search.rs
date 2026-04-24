use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct VectorQuery {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: i64,
}
fn default_limit() -> i64 { 5 }

#[derive(Deserialize, Serialize)]
pub struct EmbeddingInput {
    pub product_id: uuid::Uuid,
    pub embedding:  Vec<f32>,
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/vector")
            .route("/similar/{id}", web::get().to(similar_products))
            .route("/embed",        web::post().to(store_embedding))
    );
}

async fn similar_products(
    pool: web::Data<PgPool>,
    path: web::Path<uuid::Uuid>,
) -> crate::errors::AppResult<HttpResponse> {
    let product_id = path.into_inner();

    let rows: Vec<_> = sqlx::query!(
        r#"SELECT p.id::text, p.name, p.slug, p.price,
            (pe.embedding <=> ref_e.embedding)::float4 as distance
           FROM product_embeddings pe
           JOIN product_embeddings ref_e ON ref_e.product_id = $1
           JOIN products p ON p.id = pe.product_id
           WHERE pe.product_id != $1
             AND p.status = 'active'
           ORDER BY distance ASC
           LIMIT 5"#,
        product_id
    ).fetch_all(pool.get_ref()).await?;

    let data: Vec<_> = rows.iter().map(|r| serde_json::json!({
        "id":       r.id,
        "name":     r.name,
        "slug":     r.slug,
        "price":    r.price,
        "distance": r.distance,
    })).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({ "data": data })))
}

async fn store_embedding(
    pool: web::Data<PgPool>,
    body: web::Json<EmbeddingInput>,
    _auth: crate::middleware::auth::AuthUserWithRole,
) -> crate::errors::AppResult<HttpResponse> {
    let vec_str = format!("[{}]", body.embedding.iter()
        .map(|f| f.to_string())
        .collect::<Vec<_>>()
        .join(","));

    sqlx::query!(
        "INSERT INTO product_embeddings (product_id, embedding)
         VALUES ($1, $2::vector)
         ON CONFLICT (product_id) DO UPDATE SET embedding = EXCLUDED.embedding, created_at = NOW()",
        body.product_id,
        vec_str as _
    ).execute(pool.get_ref()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({"ok": true})))
}
