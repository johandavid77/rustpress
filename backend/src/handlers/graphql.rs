use async_graphql::{Context, Object, Schema, SimpleObject, EmptyMutation, EmptySubscription};
use async_graphql_actix_web::{GraphQLRequest, GraphQLResponse};
use actix_web::{web, HttpResponse};
use sqlx::PgPool;

#[derive(SimpleObject)]
pub struct PostGql {
    pub id:         String,
    pub title:      String,
    pub slug:       String,
    pub excerpt:    Option<String>,
    pub status:     String,
    pub views:      i64,
    pub created_at: String,
}

#[derive(SimpleObject)]
pub struct ProductGql {
    pub id:     String,
    pub name:   String,
    pub slug:   String,
    pub price:  f64,
    pub stock:  i32,
    pub status: String,
}

#[derive(SimpleObject)]
pub struct UserGql {
    pub id:       String,
    pub username: String,
    pub email:    String,
    pub role_id:  i32,
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn posts(
        &self, ctx: &Context<'_>,
        #[graphql(default = 10)] limit: i64,
        #[graphql(default = 0)]  offset: i64,
    ) -> async_graphql::Result<Vec<PostGql>> {
        let pool = ctx.data::<PgPool>()?;
        let rows = sqlx::query!(
            "SELECT id::text, title, slug, excerpt, status, views, created_at
             FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit, offset
        ).fetch_all(pool).await?;

        Ok(rows.into_iter().map(|r| PostGql {
            id:         r.id.unwrap_or_default(),
            title:      r.title,
            slug:       r.slug,
            excerpt:    r.excerpt,
            status:     r.status,
            views:      r.views,
            created_at: r.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
        }).collect())
    }

    async fn post(&self, ctx: &Context<'_>, slug: String) -> async_graphql::Result<Option<PostGql>> {
        let pool = ctx.data::<PgPool>()?;
        let r = sqlx::query!(
            "SELECT id::text, title, slug, excerpt, status, views, created_at
             FROM posts WHERE slug = $1 AND status = 'published'",
            slug
        ).fetch_optional(pool).await?;

        Ok(r.map(|r| PostGql {
            id:         r.id.unwrap_or_default(),
            title:      r.title,
            slug:       r.slug,
            excerpt:    r.excerpt,
            status:     r.status,
            views:      r.views,
            created_at: r.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
        }))
    }

    async fn products(
        &self, ctx: &Context<'_>,
        #[graphql(default = 10)] limit: i64,
    ) -> async_graphql::Result<Vec<ProductGql>> {
        let pool = ctx.data::<PgPool>()?;
        let rows = sqlx::query!(
            "SELECT id::text, name, slug, price, stock, status
             FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT $1",
            limit
        ).fetch_all(pool).await?;

        Ok(rows.into_iter().map(|r| ProductGql {
            id:     r.id.unwrap_or_default(),
            name:   r.name,
            slug:   r.slug,
            price:  r.price,
            stock:  r.stock,
            status: r.status,
        }).collect())
    }
}

pub type AppSchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

pub fn create_schema(pool: PgPool) -> AppSchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription)
        .data(pool)
        .finish()
}

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/graphql", web::post().to(graphql_handler))
       .route("/graphql", web::get().to(graphiql_handler));
}

async fn graphql_handler(
    schema: web::Data<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphiql_handler() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(async_graphql::http::graphiql_source("/api/v1/graphql", None))
}
