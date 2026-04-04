pub fn order_confirmed(order_id: &str, total: f64, items: &str, customer_name: &str) -> (String, String) {
    let subject = format!("✅ Orden confirmada #{}", &order_id[..8].to_uppercase());
    let body = format!(r#"
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f9f9f9;padding:40px 0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e5e5">
    <h1 style="color:#7c6aff;font-size:24px;margin:0 0 8px">¡Gracias por tu compra, {name}!</h1>
    <p style="color:#666;margin:0 0 24px">Tu orden ha sido confirmada y está siendo procesada.</p>
    
    <div style="background:#f5f5ff;border-radius:8px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:12px;color:#888;font-family:monospace">ORDEN #{order_id}</p>
      <div style="margin-top:12px">{items}</div>
      <div style="border-top:1px solid #ddd;margin-top:16px;padding-top:12px;display:flex;justify-content:space-between">
        <strong>Total</strong>
        <strong style="color:#7c6aff">${total:.2}</strong>
      </div>
    </div>
    
    <p style="color:#999;font-size:12px;text-align:center">RustCMS Shop · Gracias por tu confianza</p>
  </div>
</body>
</html>
    "#, name=customer_name, order_id=&order_id[..8].to_uppercase(), items=items, total=total);
    (subject, body)
}

pub fn order_shipped(order_id: &str, tracking: Option<&str>) -> (String, String) {
    let subject = format!("🚚 Tu orden #{} fue enviada", &order_id[..8].to_uppercase());
    let tracking_info = tracking.map(|t| format!(
        "<p style='margin:0'>Número de rastreo: <strong style='font-family:monospace'>{}</strong></p>", t
    )).unwrap_or_default();
    let body = format!(r#"
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;padding:40px 0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e5e5">
    <h1 style="color:#7c6aff;font-size:24px;margin:0 0 8px">¡Tu pedido está en camino!</h1>
    <p style="color:#666">Orden <strong>#{order_id}</strong> fue enviada.</p>
    {tracking}
    <p style="color:#999;font-size:12px;margin-top:32px;text-align:center">RustCMS Shop</p>
  </div>
</body>
</html>
    "#, order_id=&order_id[..8].to_uppercase(), tracking=tracking_info);
    (subject, body)
}

pub fn review_pending_admin(product_name: &str, author: &str, rating: i32) -> (String, String) {
    let subject = format!("⭐ Nueva reseña pendiente — {}", product_name);
    let stars = "★".repeat(rating as usize) + &"☆".repeat((5 - rating) as usize);
    let body = format!(r#"
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;padding:32px">
  <h2>Nueva reseña pendiente de moderación</h2>
  <p><strong>Producto:</strong> {product}</p>
  <p><strong>Autor:</strong> {author}</p>
  <p><strong>Rating:</strong> <span style="color:#f59e0b">{stars}</span> ({rating}/5)</p>
  <p>Entra al panel de admin para aprobar o rechazar.</p>
</body>
</html>
    "#, product=product_name, author=author, stars=stars, rating=rating);
    (subject, body)
}

pub fn password_reset(token: &str, base_url: &str) -> (String, String) {
    let subject = "🔐 Restablecer contraseña — RustCMS".to_string();
    let link = format!("{}/reset-password?token={}", base_url, token);
    let body = format!(r#"
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9f9f9;padding:40px 0">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e5e5">
    <h1 style="font-size:22px;margin:0 0 16px">Restablecer contraseña</h1>
    <p style="color:#666">Haz clic en el botón para crear una nueva contraseña. El enlace expira en 1 hora.</p>
    <a href="{link}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c6aff;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
      Restablecer contraseña
    </a>
    <p style="color:#999;font-size:12px;margin-top:24px">Si no solicitaste esto, ignora este mensaje.</p>
  </div>
</body>
</html>
    "#, link=link);
    (subject, body)
}
