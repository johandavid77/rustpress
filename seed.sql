-- ============================================
-- RustPress - Seed de demostración completo
-- Contraseña de todos los usuarios: password123
-- ============================================

-- Roles
INSERT INTO roles (id, name) VALUES
  ('2ad5c455-c92e-49f2-a26b-a993c56298bf', 'admin'),
  ('5d34326a-6bbc-4acb-b201-8fb824443fb1', 'editor'),
  ('2269e3e7-9979-486a-8a67-6ae596b12625', 'author'),
  ('a6cb19e8-4496-406a-ad7d-c8290eec82fe', 'viewer')
ON CONFLICT DO NOTHING;

-- Usuarios (password: password123)
INSERT INTO users (username, email, password, role_id, is_active, public, bio, website)
VALUES
  ('admin',   'admin@rustpress.dev',  '$2b$12$xj6SqEzFTtg/KacEkxX./.kSzB3c89jd3pCNpq9YVNgZKIKkv4Tse', '2ad5c455-c92e-49f2-a26b-a993c56298bf', true, true, 'Administrador del sitio RustPress', 'https://rustpress.dev'),
  ('editor1', 'editor@rustpress.dev', '$2b$12$xj6SqEzFTtg/KacEkxX./.kSzB3c89jd3pCNpq9YVNgZKIKkv4Tse', '5d34326a-6bbc-4acb-b201-8fb824443fb1', true, true, 'Editor de contenido', null),
  ('autor1',  'autor@rustpress.dev',  '$2b$12$xj6SqEzFTtg/KacEkxX./.kSzB3c89jd3pCNpq9YVNgZKIKkv4Tse', '2269e3e7-9979-486a-8a67-6ae596b12625', true, true, 'Autor invitado', null),
  ('johndoe', 'john@example.com',     '$2b$12$xj6SqEzFTtg/KacEkxX./.kSzB3c89jd3pCNpq9YVNgZKIKkv4Tse', 'a6cb19e8-4496-406a-ad7d-c8290eec82fe', true, true, 'Cliente demo', null),
  ('janedoe', 'jane@example.com',     '$2b$12$xj6SqEzFTtg/KacEkxX./.kSzB3c89jd3pCNpq9YVNgZKIKkv4Tse', 'a6cb19e8-4496-406a-ad7d-c8290eec82fe', true, true, 'Cliente demo 2', null)
ON CONFLICT DO NOTHING;

-- Media
INSERT INTO media (filename, original_name, mime_type, size_bytes, url, thumbnail_url, alt_text, uploaded_by)
VALUES
  ('hero-laptop.jpg',     'hero-laptop.jpg',     'image/jpeg', 245000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200', 'Laptop sobre escritorio', (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('hero-coffee.jpg',     'hero-coffee.jpg',     'image/jpeg', 198000, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200', 'Taza de café',            (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('product-mouse.jpg',   'product-mouse.jpg',   'image/jpeg', 132000, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200', 'Mouse inalámbrico',       (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('product-keyboard.jpg','product-keyboard.jpg','image/jpeg', 156000, 'https://images.unsplash.com/photo-1561112078-7d24e04c3407?w=600', 'https://images.unsplash.com/photo-1561112078-7d24e04c3407?w=200', 'Teclado mecánico',        (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('product-monitor.jpg', 'product-monitor.jpg', 'image/jpeg', 189000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200', 'Monitor 4K',              (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('blog-tech.jpg',       'blog-tech.jpg',       'image/jpeg', 221000, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200', 'Tecnología',              (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('blog-design.jpg',     'blog-design.jpg',     'image/jpeg', 176000, 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800', 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=200', 'Diseño UI',               (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('blog-code.jpg',       'blog-code.jpg',       'image/jpeg', 203000, 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200', 'Código',                  (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('auriculares.jpg',     'auriculares.jpg',     'image/jpeg',  98000, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200', 'Auriculares BT',          (SELECT id FROM users WHERE username='admin' LIMIT 1)),
  ('banner-sale.jpg',     'banner-sale.jpg',     'image/jpeg', 312000, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200','https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200', 'Banner oferta',           (SELECT id FROM users WHERE username='admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Posts
INSERT INTO posts (title, slug, content, excerpt, status, author_id, og_image, views)
SELECT t.title, t.slug, t.content, t.excerpt, t.status,
  (SELECT id FROM users WHERE username='admin' LIMIT 1), t.image, t.views
FROM (VALUES
  ('Bienvenido a RustPress','bienvenido-rustpress','<h2>El CMS más rápido del oeste</h2><p>RustPress está construido con Rust y React, ofreciendo rendimiento excepcional y una experiencia de desarrollo moderna.</p>','Descubre el CMS más rápido construido con Rust y React.','published','https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',1420),
  ('Guía completa de Rust para principiantes','guia-rust-principiantes','<h2>Introducción a Rust</h2><p>Rust es un lenguaje de programación de sistemas enfocado en seguridad, velocidad y concurrencia.</p><pre><code>fn main() { println!("Hola, Rust!"); }</code></pre>','Aprende Rust desde cero con esta guía completa.','published','https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',892),
  ('Diseño de interfaces modernas con Tailwind','diseno-interfaces-tailwind','<h2>Tailwind CSS</h2><p>Framework utility-first para construir interfaces modernas directamente en HTML sin escribir CSS personalizado.</p>','Cómo crear interfaces hermosas con Tailwind CSS.','published','https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',654),
  ('Optimización de bases de datos PostgreSQL','optimizacion-postgresql','<h2>Tips de rendimiento</h2><p>PostgreSQL es una de las bases de datos más potentes del mundo open source. Usa EXPLAIN ANALYZE para identificar consultas lentas.</p>','Mejora el rendimiento de tus consultas PostgreSQL.','published','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',445),
  ('El futuro del desarrollo web','futuro-desarrollo-web','<h2>Tendencias 2025</h2><p>WebAssembly, Edge Computing y los LLMs están transformando cómo construimos aplicaciones web modernas.</p>','Las tendencias más importantes del desarrollo web para 2025.','published','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',1103),
  ('Construyendo APIs REST con Actix-web','apis-rest-actix-web','<h2>Actix-web</h2><p>Uno de los frameworks web más rápidos del mundo. Con Rust como base, ofrece rendimiento extraordinario y seguridad de memoria.</p>','Tutorial para construir APIs REST de alto rendimiento con Actix-web.','published','https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',778),
  ('Seguridad en aplicaciones web modernas','seguridad-aplicaciones-web','<h2>Seguridad</h2><p>JWT, bcrypt, rate limiting y CSP headers son esenciales en toda aplicación moderna.</p>','Mejores prácticas de seguridad para aplicaciones web.','draft','https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',0)
) AS t(title,slug,content,excerpt,status,image,views)
ON CONFLICT DO NOTHING;

-- Productos
INSERT INTO products (name, slug, description, price, compare_price, stock, status, images, tags)
VALUES
  ('Laptop Pro X1','laptop-pro-x1','Laptop de alto rendimiento con Intel Core i9, 32GB RAM y SSD NVMe 1TB. Pantalla 4K OLED 15.6".',1299.99,1599.99,15,'active',ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],ARRAY['laptop','intel','4k','premium']),
  ('Mouse Ergonómico Pro','mouse-ergonomico-pro','Mouse inalámbrico ergonómico 16000 DPI, batería 6 meses, Bluetooth/USB.',45.99,59.99,50,'active',ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],ARRAY['mouse','inalambrico','ergonomico']),
  ('Teclado Mecánico RGB','teclado-mecanico-rgb','Teclado mecánico TKL Cherry MX Red, iluminación RGB por tecla, cuerpo aluminio.',89.99,109.99,30,'active',ARRAY['https://images.unsplash.com/photo-1561112078-7d24e04c3407?w=600'],ARRAY['teclado','mecanico','rgb','gaming']),
  ('Monitor 4K UltraWide','monitor-4k-ultrawide','Monitor UltraWide 34" 4K IPS HDR400 144Hz 1ms.',499.99,649.99,10,'active',ARRAY['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'],ARRAY['monitor','4k','ultrawide','gaming']),
  ('Auriculares BT Studio','auriculares-bt-studio','Auriculares over-ear ANC, 40h batería, audio Hi-Fi.',129.99,179.99,25,'active',ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],ARRAY['auriculares','bluetooth','anc']),
  ('SSD NVMe 2TB','ssd-nvme-2tb','SSD NVMe PCIe 4.0 2TB, 7000 MB/s lectura. Compatible PS5 y PC.',189.99,249.99,40,'active',ARRAY['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],ARRAY['ssd','nvme','almacenamiento']),
  ('Webcam 4K Pro','webcam-4k-pro','Cámara web 4K autoenfoque, corrección de luz IA, micrófono estéreo.',79.99,99.99,35,'active',ARRAY['https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600'],ARRAY['webcam','4k','streaming']),
  ('Hub USB-C 12en1','hub-usb-c-12en1','Hub USB-C con HDMI 4K, 3x USB 3.0, SD/MicroSD, Ethernet Gigabit, PD 100W.',49.99,69.99,60,'active',ARRAY['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600'],ARRAY['hub','usb-c','accesorios'])
ON CONFLICT DO NOTHING;

-- Órdenes
INSERT INTO orders (user_id, total, status)
SELECT (SELECT id FROM users WHERE username='johndoe' LIMIT 1), total, status
FROM (VALUES (1299.99,'delivered'),(135.98,'shipped'),(499.99,'paid'),(89.99,'pending'),(259.98,'delivered'),(45.99,'pending'),(319.98,'paid'),(129.99,'cancelled')) AS t(total,status);

-- Cupones
INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
VALUES
  ('WELCOME10','percent',10,0,100,NOW()+INTERVAL '30 days'),
  ('SAVE20','percent',20,100,50,NOW()+INTERVAL '15 days'),
  ('FLAT50','fixed',50,200,25,NOW()+INTERVAL '7 days'),
  ('NEWUSER15','percent',15,0,200,NOW()+INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- Newsletter
INSERT INTO newsletter_subscribers (email, name, active, confirmed)
VALUES
  ('subscriber1@example.com','Carlos López',true,true),
  ('subscriber2@example.com','María García',true,true),
  ('subscriber3@example.com','Pedro Martínez',true,false),
  ('subscriber4@example.com','Ana Rodríguez',true,true),
  ('subscriber5@example.com','Luis Sánchez',true,true)
ON CONFLICT DO NOTHING;

-- Sliders
INSERT INTO sliders (title, subtitle, image_url, button_url, button_text, is_active, order_index)
VALUES
  ('Bienvenido a RustPress','El CMS más rápido construido con Rust','https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200','/shop','Ver tienda',true,1),
  ('Laptops Premium','Hasta 20% de descuento esta semana','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200','/shop','Comprar ahora',true,2),
  ('Nuevos Periféricos','Equipa tu setup con lo mejor del mercado','https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1200','/shop','Ver productos',true,3)
ON CONFLICT DO NOTHING;

-- Settings
INSERT INTO settings (key, value)
VALUES
  ('site_name','"RustPress Demo"'),
  ('site_description','"El CMS más rápido del oeste"'),
  ('site_url','"http://localhost:5173"'),
  ('currency','"COP"'),
  ('currency_symbol','"$"'),
  ('tax_rate','"19"'),
  ('posts_per_page','"10"'),
  ('allow_comments','"true"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

SELECT
  (SELECT COUNT(*) FROM users)                  as users,
  (SELECT COUNT(*) FROM posts)                  as posts,
  (SELECT COUNT(*) FROM products)               as products,
  (SELECT COUNT(*) FROM orders)                 as orders,
  (SELECT COUNT(*) FROM media)                  as media,
  (SELECT COUNT(*) FROM coupons)                as coupons,
  (SELECT COUNT(*) FROM newsletter_subscribers) as subscribers,
  (SELECT COUNT(*) FROM sliders)                as sliders;
