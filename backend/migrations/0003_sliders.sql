CREATE TABLE sliders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    subtitle    TEXT,
    button_text VARCHAR(100),
    button_url  VARCHAR(500),
    image_url   TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para ordenar eficientemente
CREATE INDEX idx_sliders_order ON sliders(order_index, is_active);

-- 3 slides de ejemplo
INSERT INTO sliders (title, subtitle, button_text, button_url, image_url, order_index) VALUES
(
    'Bienvenido a RustCMS',
    'El CMS más rápido construido con Rust',
    'Comenzar',
    '/blog',
    '/uploads/slider/slide1.jpg',
    0
),
(
    'Gestión de Contenido',
    'Administra tus posts, medios y usuarios fácilmente',
    'Ver más',
    '/posts',
    '/uploads/slider/slide2.jpg',
    1
),
(
    'Potenciado por Rust',
    'Rendimiento, seguridad y confiabilidad',
    'Documentación',
    '/docs',
    '/uploads/slider/slide3.jpg',
    2
);
