# Changelog — RustCMS

All notable changes to this project are documented here.
Todos los cambios notables de este proyecto están documentados aquí.

Format: `[Date] - Description / Descripción`

---

## [2026-04-04] — Session 4 (Today / Hoy)

### ✨ Added / Agregado
- **WooCommerce-style Ecommerce Dashboard** — Panel completo accesible desde Plugins
  - Overview con KPIs, gráfica de revenue diario, pedidos recientes
  - Gestión de Productos con editor modal (nombre, precio, stock, imágenes, estado)
  - Gestión de Pedidos con detalle, cambio de estado y exportar CSV
  - Gestión de Clientes (listado de usuarios registrados)
  - Gestión de Cupones con generador de código automático
  - Inventario con edición inline de stock y alertas de stock bajo
  - Ajustes de tienda (general, pasarelas, email SMTP)
- **Wompi Gateway** — Pasarela de pago colombiana integrada (sandbox + producción)
- **GitHub Actions CI/CD** — Pipeline automático con:
  - Tests de Rust (`cargo test`) con PostgreSQL y Redis de servicio
  - Build del frontend React
  - Build de imagen Docker
  - Deploy via SSH (configurable con secrets)
- **Product Variants Backend** — Variantes de productos (talla, color, atributos custom)
  - Endpoint REST completo: list, create, update, delete
  - Stock editable por variante
- **Email System** — Sistema SMTP completo con templates HTML
  - Confirmación de orden al cliente
  - Notificación de envío
  - Alerta de reseña pendiente al admin
  - Reset de contraseña
- **CSV Export** — Exportar órdenes a CSV (`GET /orders/export`)
- **Show/Hide Password** — Ojito en el formulario de login para mostrar/ocultar contraseña
- **Sidebar con secciones** — Admin reorganizado: General / Contenido / Tienda / Analítica
- **10 productos demo** — Hardware seed (AMD, NVIDIA, Samsung, Corsair, ASUS, etc.)
- **Docker + docker-compose** — Stack completo: Rust + React + PostgreSQL + Redis + Nginx
- **README bilingüe** — Documentación completa ES/EN con roadmap, estructura, API reference

### 🐛 Fixed / Corregido
- EcommerceHome no renderizaba al hacer click en plugin → Fixed overlay `fixed inset-0 z-50`
- `recharts` requería `react-is` no instalado → Instalado con `--legacy-peer-deps`
- `product_variants` migración no aplicada → Reescrito handler sin `sqlx::query!` macro
- Sidebar de admin no mostraba sección Tienda → Reorganizado con secciones agrupadas
- Backend `order_items`/`order_id` fuera de scope en email handler → Variables corregidas
- Dashboard pantalla en blanco por fragment `<>` roto → Fixed overlay dentro del div raíz

---

## [2026-04-02] — Session 3

### ✨ Added / Agregado
- **Stripe + PayPal** — Pasarelas de pago con trait modular `PaymentGateway`
  - Checkout Sessions (Stripe) y Orders API (PayPal)
  - Webhooks con verificación de firma HMAC-SHA256
  - Páginas `/checkout/success` y `/checkout/cancel`
- **Reviews & Ratings** — Sistema completo de reseñas
  - Rating 1-5 estrellas con distribución visual
  - Compra verificada badge
  - Panel admin con aprobación/rechazo en un click
  - Reseñas de invitados sin login requerido
- **Analytics Dashboard** — Métricas reales
  - KPIs: vistas, sesiones, compras, revenue
  - Gráficas diarias (LineChart + BarChart)
  - Funnel de conversión (shop → cart → checkout)
  - Realtime: sesiones activas + eventos recientes
  - Top posts y top productos
- **Unit Tests** — 60 tests pasando (`cargo test`)
  - Módulos: auth, payments, reviews, coupons, cart, orders, slugs, bookings
- **Config. Tienda** — Panel de ajustes: general, pasarelas, SMTP
- **Panel de Plugins** — Módulos integrados + plugins instalados desde DB
- **Página pública de producto** — `/shop/:slug` con galería, variantes, reseñas, carrito
- **Ecommerce Admin** — Productos, Órdenes, Cupones, Inventario en sidebar

### 🐛 Fixed / Corregido
- `avg_rating` tipo NUMERIC incompatible con sqlx → Cast a `float8` en query
- Imports inexistentes `RelatedPosts`, `readingTime` → Eliminados
- `dangerouslySetInnerHTML` con `??` causaba parse error esbuild → Removido

---

## [2026-04-01] — Session 2

### ✨ Added / Agregado
- **Blog funcional** — 4 temas: dark, bold, magazine, minimal
- **Módulo de Reservas** — Tours, hospedaje, restaurante con disponibilidad por slots
- **Ecommerce base** — Productos, carrito, checkout, órdenes, cupones
- **Webhooks** — Notificaciones a Slack, Discord y URLs custom
- **Módulos admin** — Sliders, Menús, Comentarios, Categorías, API Keys
- **i18n** — Soporte ES/EN en el dashboard
- **Rate limiting** — Protección de endpoints sensibles
- **Redis cache** — Caché de respuestas frecuentes

### 🐛 Fixed / Corregido
- BlogPost.tsx parse errors en todos los temas → Reescritura limpia
- Frontend llamaba `/posts/:slug` → Corregido a `/posts/slug/:slug`
- `article` tag multilínea sin cerrar → Fixed en los 4 temas
- `selected` state duplicado en Dashboard → Eliminado
- Phantom `0` por operador `|` en webhooks → Corregido a `||`

---

## [2026-03-27] — Session 1

### ✨ Added / Agregado
- **Proyecto inicial** — Backend Rust (Actix-Web) + Frontend React (TypeScript + Vite)
- **Auth JWT** — Login, registro, roles y permisos
- **CMS base** — CRUD de posts con editor TipTap
- **Media library** — Upload y gestión de imágenes
- **User management** — Usuarios, roles, API Keys
- **Dashboard admin** — Sidebar, temas, configuración
- **PostgreSQL + sqlx** — Migraciones automáticas
- **RSS + Sitemap** — Generación automática

---

## 🗺️ Roadmap Actualizado / Updated Roadmap

### ✅ Completado
- Blog CMS multi-tema | Auth JWT | Editor TipTap | Media library
- Ecommerce completo (productos, carrito, órdenes, cupones, variantes, inventario)
- Pasarelas: Stripe + PayPal + Wompi
- Reviews & ratings | Analytics dashboard | Módulo reservas
- Emails SMTP | CSV export | 60+ unit tests
- Docker + CI/CD | README bilingüe

### 🔜 Próximo
- [ ] Integration tests (httptest / actix-test)
- [ ] Admin responsive móvil + PWA
- [ ] Stripe webhooks en producción (ngrok para dev)
- [ ] Envío real de emails (conectar SMTP en producción)
- [ ] Multi-tienda / Multi-store
- [ ] App móvil React Native
- [ ] Wompi en producción (keys reales)
- [ ] GitHub Secrets configurados para deploy automático

---

*Generated with 🦀 Rust + ⚛️ React — RustCMS Project*
