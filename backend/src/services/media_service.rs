use std::path::Path;

pub fn is_allowed_mime(mime: &str) -> bool {
    matches!(mime,
        "image/jpeg" | "image/png" | "image/gif" | "image/webp" |
        "image/svg+xml" | "application/pdf" | "video/mp4" |
        "audio/mpeg" | "audio/ogg"
    )
}

pub fn generate_filename(original: &str) -> String {
    let ext = Path::new(original).extension()
        .and_then(|e| e.to_str()).unwrap_or("bin");
    format!("{}.{}", uuid::Uuid::new_v4(), ext)
}
