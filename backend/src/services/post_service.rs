pub fn generate_slug(title: &str) -> String {
    slug::slugify(title)
}
