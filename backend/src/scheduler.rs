use sqlx::PgPool;
use tokio::time::{interval, Duration};
use tracing::info;

pub fn start(pool: PgPool) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(60));
        loop {
            ticker.tick().await;
            if let Err(e) = publish_scheduled(&pool).await {
                tracing::error!("Scheduler error: {}", e);
            }
        }
    });
}

async fn publish_scheduled(pool: &PgPool) -> Result<(), sqlx::Error> {
    let published = sqlx::query!(
        r#"UPDATE posts
           SET status = 'published', published_at = NOW(), updated_at = NOW()
           WHERE status = 'draft'
             AND publish_at IS NOT NULL
             AND publish_at <= NOW()
           RETURNING id, title, slug"#
    )
    .fetch_all(pool)
    .await?;

    for p in &published {
        info!("Scheduled post published: {} ({})", p.title, p.slug);
    }

    Ok(())
}
