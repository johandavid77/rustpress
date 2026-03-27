use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use crate::errors::AppResult;
use crate::models::post::Post;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("")
            .route("/feed.xml", web::get().to(rss_feed))
    );
}

async fn rss_feed(pool: web::Data<PgPool>) -> AppResult<HttpResponse> {
    let posts = sqlx::query_as!(
        Post,
        r#"SELECT * FROM posts WHERE status = 'published'
           ORDER BY published_at DESC LIMIT 20"#
    )
    .fetch_all(pool.get_ref())
    .await?;

    let items = posts.iter().map(|p| {
        let date = p.published_at
            .unwrap_or(p.created_at)
            .format("%a, %d %b %Y %H:%M:%S GMT")
            .to_string();
        let excerpt = p.excerpt.clone().unwrap_or_default();
        format!(
            "<item>\
              <title><![CDATA[{}]]></title>\
              <link>https://rustcms.dev/blog/{}</link>\
              <guid>https://rustcms.dev/blog/{}</guid>\
              <pubDate>{}</pubDate>\
              <description><![CDATA[{}]]></description>\
            </item>",
            p.title, p.slug, p.slug, date, excerpt
        )
    }).collect::<Vec<_>>().join("\n");

    let xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>RustCMS Blog</title>
    <link>https://rustcms.dev/blog</link>
    <description>Artículos, notas y experimentos</description>
    <language>es-co</language>
    <atom:link href="https://rustcms.dev/feed.xml" rel="self" type="application/rss+xml"/>
    {}
  </channel>
</rss>"#,
        items
    );

    Ok(HttpResponse::Ok()
        .content_type("application/rss+xml; charset=utf-8")
        .body(xml))
}
