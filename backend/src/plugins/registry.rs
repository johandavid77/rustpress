use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use crate::errors::AppResult;
use crate::models::{post::Post, user::User};
use super::CmsPlugin;

pub type PluginArc = Arc<dyn CmsPlugin>;

#[derive(Default)]
pub struct PluginRegistry {
    plugins: RwLock<HashMap<String, PluginArc>>,
}

impl PluginRegistry {
    pub fn new() -> Self { Self { plugins: RwLock::new(HashMap::new()) } }

    pub fn register(&self, plugin: PluginArc) {
        let mut map = self.plugins.write().unwrap();
        map.insert(plugin.name().to_string(), plugin);
    }

    pub fn unregister(&self, name: &str) {
        self.plugins.write().unwrap().remove(name);
    }

    pub fn get(&self, name: &str) -> Option<PluginArc> {
        self.plugins.read().unwrap().get(name).cloned()
    }

    pub fn all(&self) -> Vec<PluginArc> {
        self.plugins.read().unwrap().values().cloned().collect()
    }

    pub async fn fire_before_post_save(&self, post: &mut Post) -> AppResult<()> {
        for p in self.all() { p.before_post_save(post).await?; }
        Ok(())
    }

    pub async fn fire_after_post_publish(&self, post: &Post) -> AppResult<()> {
        for p in self.all() { p.after_post_publish(post).await?; }
        Ok(())
    }

    pub async fn fire_on_user_login(&self, user: &User) -> AppResult<()> {
        for p in self.all() { p.on_user_login(user).await?; }
        Ok(())
    }

    pub async fn fire_on_user_register(&self, user: &User) -> AppResult<()> {
        for p in self.all() { p.on_user_register(user).await?; }
        Ok(())
    }
}
