use redis::{aio::ConnectionManager, AsyncCommands, Client};

pub type RedisPool = ConnectionManager;

pub async fn create_redis_pool(url: &str) -> Result<RedisPool, redis::RedisError> {
    let client = Client::open(url)?;
    ConnectionManager::new(client).await
}

pub async fn get_cached(conn: &mut RedisPool, key: &str) -> Option<String> {
    conn.get::<_, Option<String>>(key).await.ok().flatten()
}

pub async fn set_cached(conn: &mut RedisPool, key: &str, value: &str, ttl_secs: u64) {
    let _: Result<(), _> = conn.set_ex(key, value, ttl_secs).await;
}

pub async fn invalidate_pattern(conn: &mut RedisPool, pattern: &str) {
    if let Ok(keys) = conn.keys::<_, Vec<String>>(pattern).await {
        for key in keys {
            let _: Result<(), _> = conn.del(&key).await;
        }
    }
}
