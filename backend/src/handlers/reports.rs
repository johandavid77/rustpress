use actix_web::{web, HttpResponse};
use sqlx::PgPool;
use printpdf::*;
use std::io::BufWriter;
use crate::middleware::auth::AuthUserWithRole;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/reports")
            .route("/sales/pdf",    web::get().to(sales_pdf))
            .route("/orders/pdf",   web::get().to(orders_pdf))
    );
}

async fn sales_pdf(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> crate::errors::AppResult<HttpResponse> {
    let rows = sqlx::query!(
        "SELECT o.id::text, o.total::float8 as total, o.status,
                o.created_at, u.username, u.email
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC LIMIT 100"
    ).fetch_all(pool.get_ref()).await?;

    let (doc, page1, layer1) = PdfDocument::new("Reporte de Ventas", Mm(210.0), Mm(297.0), "Layer 1");
    let page = doc.get_page(page1);
    let layer = page.get_layer(layer1);
    let font = doc.add_builtin_font(BuiltinFont::HelveticaBold).unwrap();
    let font_reg = doc.add_builtin_font(BuiltinFont::Helvetica).unwrap();

    // Título
    layer.use_text("REPORTE DE VENTAS", 20.0, Mm(20.0), Mm(277.0), &font);
    layer.use_text(
        &format!("Generado: {}", chrono::Utc::now().format("%Y-%m-%d %H:%M UTC")),
        10.0, Mm(20.0), Mm(268.0), &font_reg
    );

    // Cabecera tabla
    layer.use_text("ID", 9.0, Mm(20.0), Mm(258.0), &font);
    layer.use_text("Cliente", 9.0, Mm(55.0), Mm(258.0), &font);
    layer.use_text("Estado", 9.0, Mm(115.0), Mm(258.0), &font);
    layer.use_text("Total", 9.0, Mm(155.0), Mm(258.0), &font);
    layer.use_text("Fecha", 9.0, Mm(175.0), Mm(258.0), &font);

    // Filas
    let mut y = 250.0f32;
    let mut total_sum = 0.0f64;
    for r in &rows {
        if y < 20.0 { break; }
        let id_short = r.id.as_deref().unwrap_or("").chars().take(8).collect::<String>();
        let email = r.email.as_str();
        let status = &r.status;
        let total = r.total;
        let fecha = r.created_at.format("%Y-%m-%d").to_string();

        layer.use_text(&id_short, 8.0, Mm(20.0), Mm(y), &font_reg);
        layer.use_text(&email.chars().take(30).collect::<String>(), 8.0, Mm(55.0), Mm(y), &font_reg);
        layer.use_text(status, 8.0, Mm(115.0), Mm(y), &font_reg);
        layer.use_text(&format!("${:.2}", total), 8.0, Mm(155.0), Mm(y), &font_reg);
        layer.use_text(&fecha, 8.0, Mm(175.0), Mm(y), &font_reg);

        total_sum += total;
        y -= 7.0;
    }

    // Total
    layer.use_text(&format!("TOTAL: ${:.2}", total_sum), 11.0, Mm(140.0), Mm(y - 5.0), &font);

    let mut buf = BufWriter::new(Vec::new());
    doc.save(&mut buf).unwrap();
    let bytes = buf.into_inner().unwrap();

    Ok(HttpResponse::Ok()
        .content_type("application/pdf")
        .insert_header(("Content-Disposition", "attachment; filename=\"ventas.pdf\""))
        .body(bytes))
}

async fn orders_pdf(
    pool: web::Data<PgPool>,
    _auth: AuthUserWithRole,
) -> crate::errors::AppResult<HttpResponse> {
    let rows = sqlx::query!(
        "SELECT o.id::text, o.total::float8 as total, o.status,
                o.created_at, u.email,
                COUNT(oi.id) as items_count
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         GROUP BY o.id, o.total, o.status, o.created_at, u.email
         ORDER BY o.created_at DESC LIMIT 50"
    ).fetch_all(pool.get_ref()).await?;

    let (doc, page1, layer1) = PdfDocument::new("Órdenes", Mm(210.0), Mm(297.0), "Layer 1");
    let page = doc.get_page(page1);
    let layer = page.get_layer(layer1);
    let font = doc.add_builtin_font(BuiltinFont::HelveticaBold).unwrap();
    let font_reg = doc.add_builtin_font(BuiltinFont::Helvetica).unwrap();

    layer.use_text("REPORTE DE ORDENES", 20.0, Mm(20.0), Mm(277.0), &font);

    layer.use_text("ID", 9.0, Mm(20.0), Mm(258.0), &font);
    layer.use_text("Email", 9.0, Mm(55.0), Mm(258.0), &font);
    layer.use_text("Items", 9.0, Mm(120.0), Mm(258.0), &font);
    layer.use_text("Estado", 9.0, Mm(140.0), Mm(258.0), &font);
    layer.use_text("Total", 9.0, Mm(170.0), Mm(258.0), &font);

    let mut y = 250.0f32;
    for r in &rows {
        if y < 20.0 { break; }
        let id_short = r.id.as_deref().unwrap_or("").chars().take(8).collect::<String>();
        layer.use_text(&id_short, 8.0, Mm(20.0), Mm(y), &font_reg);
        layer.use_text(&r.email.chars().take(35).collect::<String>(), 8.0, Mm(55.0), Mm(y), &font_reg);
        layer.use_text(&r.items_count.unwrap_or(0).to_string(), 8.0, Mm(120.0), Mm(y), &font_reg);
        layer.use_text(&r.status, 8.0, Mm(140.0), Mm(y), &font_reg);
        layer.use_text(&format!("${:.2}", r.total), 8.0, Mm(170.0), Mm(y), &font_reg);
        y -= 7.0;
    }

    let mut buf = BufWriter::new(Vec::new());
    doc.save(&mut buf).unwrap();
    let bytes = buf.into_inner().unwrap();

    Ok(HttpResponse::Ok()
        .content_type("application/pdf")
        .insert_header(("Content-Disposition", "attachment; filename=\"ordenes.pdf\""))
        .body(bytes))
}
