pub mod registry;

use async_trait::async_trait;
use sqlx::PgPool;

use crate::errors::AppResult;
use crate::models::{post::Post, user::User};

#[async_trait]
pub trait CmsPlugin: Send + Sync {
    fn name(&self)        -> &str;
    fn version(&self)     -> &str;
    fn description(&self) -> &str;

    async fn on_install(&self,   _db: &PgPool) -> AppResult<()> { Ok(()) }
    async fn on_uninstall(&self, _db: &PgPool) -> AppResult<()> { Ok(()) }
    async fn on_enable(&self)  -> AppResult<()> { Ok(()) }
    async fn on_disable(&self) -> AppResult<()> { Ok(()) }

    async fn before_post_save(&self,   _post: &mut Post) -> AppResult<()> { Ok(()) }
    async fn after_post_publish(&self, _post: &Post)     -> AppResult<()> { Ok(()) }
    async fn before_post_delete(&self, _post: &Post)     -> AppResult<()> { Ok(()) }

    async fn on_user_login(&self,    _user: &User) -> AppResult<()> { Ok(()) }
    async fn on_user_register(&self, _user: &User) -> AppResult<()> { Ok(()) }

    fn routes(&self) -> Option<actix_web::Scope> { None }
}
