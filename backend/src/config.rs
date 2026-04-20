use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub host:            String,
    pub port:            u16,
    pub database_url:    String,
    pub frontend_url:    String,
    pub jwt_secret:      String,
    pub jwt_expiry_hours: u64,
    pub upload_dir:      String,
    pub max_upload_mb:   u64,
    pub s3_bucket:      Option<String>,
    pub s3_region:      Option<String>,
    pub s3_endpoint:    Option<String>,
    pub s3_access_key:  Option<String>,
    pub s3_secret_key:  Option<String>,
    pub s3_public_url:  Option<String>,
    // 👇 estos van aquí, en el struct
    pub smtp_host:       String,
    pub smtp_port:       u16,
    pub smtp_from:       String,
    pub smtp_username:   String,
    pub smtp_password:   String,
    pub redis_url:       String,
    pub backup_dir:      String,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            host:             std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port:             std::env::var("PORT").unwrap_or_else(|_| "8080".into()).parse()?,
            database_url:     std::env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            frontend_url:     std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".into()),
            jwt_secret:       std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            jwt_expiry_hours: std::env::var("JWT_EXPIRY_HOURS").unwrap_or_else(|_| "720".into()).parse()?,
            upload_dir:       std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".into()),
            max_upload_mb:    std::env::var("MAX_UPLOAD_MB").unwrap_or_else(|_| "10".into()).parse()?,
            smtp_host:        std::env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".into()),
            smtp_port:        std::env::var("SMTP_PORT").unwrap_or_else(|_| "1025".into()).parse()?,
            smtp_from:        std::env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@rustcms.dev".into()),
            smtp_username:    std::env::var("SMTP_USERNAME").unwrap_or_else(|_| "".into()),
            smtp_password:    std::env::var("SMTP_PASSWORD").unwrap_or_else(|_| "".into()),
            redis_url:          std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".into()),
            backup_dir:         std::env::var("BACKUP_DIR").unwrap_or_else(|_| "./backups".into()),
            s3_bucket:     std::env::var("S3_BUCKET").ok(),
            s3_region:     std::env::var("S3_REGION").ok(),
            s3_endpoint:   std::env::var("S3_ENDPOINT").ok(),
            s3_access_key: std::env::var("S3_ACCESS_KEY").ok(),
            s3_secret_key: std::env::var("S3_SECRET_KEY").ok(),
            s3_public_url: std::env::var("S3_PUBLIC_URL").ok(),
        })
    }
}