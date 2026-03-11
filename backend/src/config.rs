use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub host:         String,
    pub port:         u16,
    pub database_url: String,
    pub frontend_url: String,
    pub jwt_secret:   String,
    pub jwt_expiry_hours: u64,
    pub upload_dir:   String,
    pub max_upload_mb: u64,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            host:              std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port:              std::env::var("PORT").unwrap_or_else(|_| "8080".into()).parse()?,
            database_url:      std::env::var("DATABASE_URL")
                                    .expect("DATABASE_URL must be set"),
            frontend_url:      std::env::var("FRONTEND_URL")
                                    .unwrap_or_else(|_| "http://localhost:5173".into()),
            jwt_secret:        std::env::var("JWT_SECRET")
                                    .expect("JWT_SECRET must be set"),
            jwt_expiry_hours:  std::env::var("JWT_EXPIRY_HOURS")
                                    .unwrap_or_else(|_| "24".into()).parse()?,
            upload_dir:        std::env::var("UPLOAD_DIR")
                                    .unwrap_or_else(|_| "./uploads".into()),
            max_upload_mb:     std::env::var("MAX_UPLOAD_MB")
                                    .unwrap_or_else(|_| "10".into()).parse()?,
        })
    }
}
