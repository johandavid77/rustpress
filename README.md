# RustPress CMS

> 🇪🇸 [Español](#español) | 🇺🇸 [English](#english)

---

# Español

> CMS moderno construido con Rust (Actix-Web) + React (TypeScript) + PostgreSQL.
> Inspirado en WordPress pero más rápido, más seguro y extensible por diseño.

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Rust 1.75+ · Actix-Web 4 · SQLx · JWT · bcrypt |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · recharts |
| Base de datos | PostgreSQL 16 |
| Cache | Redis 7 |
| Infra | Docker · Nginx · certbot (SSL) |
| i18n | react-i18next (ES / EN) |
| SEO | react-helmet-async · Open Graph · Twitter Cards |
| Pagos | Stripe · PayPal |
| Analytics | Propio sin Google (pageviews, top posts, funnel, realtime) |

---

## Inicio rápido

```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
docker compose up -d
cd backend && cp .env.example .env && cargo run
cd frontend && npm install --legacy-peer-deps && npm run dev
```

Acceder en: http://localhost:5173

---

## Credenciales por defecto

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | johan@rustcms.dev | admin123 |
| Editor | editor@rustcms.dev | editor123 |

> ⚠️ Cambiar antes de ir a producción.

---

## Producción con Docker + Nginx + SSL

```bash
cp .env.prod.example .env.prod
nano .env.prod
./ssl-init.sh
./deploy.sh
```

---

## Estructura

```
rustpress/
├── backend/src/handlers/
│   ├── activity.rs            Log de actividad
│   ├── analytics.rs           Dashboard analítico
│   ├── api_keys.rs            API Keys
│   ├── auth.rs                Login, registro, recuperación de contraseña
│   ├── backup.rs              Backup con pg_dump y restore
│   ├── bookings.rs            Sistema de reservas
│   ├── cache_admin.rs         Panel cache Redis
│   ├── cart.rs                Carrito de compras
│   ├── categories.rs          Taxonomías para posts y productos
│   ├── comments.rs            Moderación de comentarios
│   ├── contact.rs             Formularios de contacto
│   ├── coupons.rs             Cupones de descuento
│   ├── csv_io.rs              Import/Export CSV
│   ├── feed.rs                RSS feed automático
│   ├── maintenance.rs         Modo mantenimiento con whitelist IPs
│   ├── media.rs               Subida y gestión de archivos multimedia
│   ├── menus.rs               Navegación personalizable
│   ├── newsletter.rs          Suscriptores y campañas SMTP
│   ├── notifications.rs       SSE en tiempo real
│   ├── orders.rs              Pedidos y estado
│   ├── payments.rs            Stripe y PayPal
│   ├── plugins.rs             Sistema de plugins dinámico
│   ├── posts.rs               CRUD posts, stats, views
│   ├── products_shop.rs       Tienda pública y CRUD admin
│   ├── redirects.rs           Redirecciones 301/302 con hits
│   ├── reviews.rs             Reseñas de productos
│   ├── roles.rs               Roles y permisos por recurso
│   ├── search.rs              Búsqueda global Ctrl+K
│   ├── settings.rs            Configuración del sitio
│   ├── sliders.rs             Carrusel de imágenes
│   ├── updates.rs             Actualizaciones vía git pull
│   ├── users.rs               CRUD usuarios
│   ├── variants.rs            Variantes de productos
│   └── webhooks.rs            Notificaciones HTTP externas
└── frontend/src/
    ├── pages/
    │   ├── Analytics.tsx          Dashboard analítico
    │   ├── Dashboard.tsx          Panel principal con métricas
    │   ├── Stats.tsx              Estadísticas detalladas
    │   ├── Login.tsx / Register.tsx / ForgotPassword.tsx / ResetPassword.tsx
    │   ├── Blog/                  Gestión de posts
    │   ├── Gallery/               Galería con lightbox y drag & drop
    │   ├── Media/                 Archivos multimedia
    │   ├── Posts/                 Editor con preview
    │   ├── Shop/                  Productos, pedidos, variantes
    │   ├── Ecommerce/             Tienda pública con carrito
    │   ├── Users/                 Gestión de usuarios
    │   ├── Settings/              Configuración
    │   ├── Plugins/               Todos los plugins admin
    │   └── public/                Blog público, tienda, checkout, mantenimiento
    ├── plugins/pluginRegistry.ts  Registro central con lazy loading
    ├── components/
    │   ├── SEO/                   Meta tags, Open Graph, Twitter Cards
    │   ├── GlobalSearch/          Búsqueda global Ctrl+K
    │   ├── NotificationBell/      Notificaciones SSE
    │   └── Newsletter/            Widget público de suscripción
    └── locales/
        ├── es/translation.json
        └── en/translation.json
```

---

## Sistema de Plugins

Los plugins se registran en la DB y en un registry central. El Dashboard los carga automáticamente con lazy loading.

### Agregar un plugin nuevo

1. Crear `frontend/src/pages/Plugins/MiPlugin.tsx`
2. Registrar en `frontend/src/plugins/pluginRegistry.ts` con lazy import
3. Insertar en la DB:

```sql
INSERT INTO plugins (id, name, version, description, is_enabled, config)
VALUES (gen_random_uuid(), 'mi-plugin', '1.0.0', 'Descripcion', true,
  '{"title":"Mi Plugin","icon":"Zap","color":"from-blue-500/20 to-blue-600/5 border-blue-500/20","category":"content"}');
```

4. Aparece automáticamente con toggle activo/inactivo.

### Plugins disponibles

| Plugin | Categoría | Descripción |
|--------|-----------|-------------|
| Sliders | Contenido | Carrusel de imágenes para la home |
| Menús | Contenido | Navegación personalizable |
| Comentarios | Contenido | Moderación de comentarios |
| Categorías | Contenido | Taxonomías para posts y productos |
| Galería | Contenido | Grid con lightbox y drag & drop |
| Formularios de contacto | Contenido | Constructor con bandeja y notificación email |
| Webhooks | Integraciones | Notificaciones HTTP externas |
| Newsletter | Integraciones | Suscriptores y envío masivo SMTP real |
| Reservas | Integraciones | Sistema de bookings |
| Ecommerce | Ecommerce | Tienda completa con Stripe y PayPal |
| Cupones | Ecommerce | Descuentos por porcentaje o monto fijo |
| Variantes | Ecommerce | Talla, color, etc. |
| Reseñas | Ecommerce | Sistema de reseñas de productos |
| Healthcheck | Sistema | Estado servidor, DB y Redis en tiempo real |
| Backup | Sistema | pg_dump con restore desde el admin |
| Actualizaciones | Sistema | git pull + cargo build desde el admin |
| Redirecciones | Sistema | 301/302 con contador de hits y toggle |
| Cache Redis | Sistema | Estadísticas y limpieza por prefijo |
| CSV Import/Export | Sistema | Exportar datos e importar productos en bulk |
| Modo Mantenimiento | Sistema | Página pública con countdown y whitelist IPs |
| Roles y Permisos | Sistema | Gestión de roles y permisos por recurso |
| Log de Actividad | Sistema | Auditoría completa con filtros y paginación |
| API Keys | Sistema | Gestión de claves de API |
| Feed RSS | Sistema | Feed RSS automático de posts |

---

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

### Auth
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /auth/login | No | Login, retorna JWT |
| POST | /auth/register | No | Registro de usuario |
| GET | /auth/me | Sí | Perfil actual |
| POST | /auth/forgot-password | No | Solicitar recuperación |
| POST | /auth/reset-password | No | Restablecer contraseña |

### Posts
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /posts | No | Listar posts publicados |
| POST | /posts | Sí | Crear post |
| GET | /posts/:id | No | Obtener post |
| PUT | /posts/:id | Sí | Editar post |
| DELETE | /posts/:id | Sí | Eliminar post |
| POST | /posts/:slug/view | No | Incrementar vistas |
| GET | /posts/stats | Sí | Estadísticas generales |
| GET | /posts/stats/views | Sí | Vistas por día para gráfica |

### Shop público
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /shop/products | No | Productos con filtros y paginación |
| GET | /shop/products/slug/:slug | No | Detalle por slug |
| GET | /shop/categories | No | Categorías de productos |

### Productos admin
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /products | Sí | Listar todos |
| POST | /products | Sí | Crear producto |
| PUT | /products/:id | Sí | Editar producto |
| DELETE | /products/:id | Sí | Eliminar producto |

### Carrito
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /cart | Sí | Ver carrito |
| POST | /cart/items | Sí | Agregar ítem |
| PUT | /cart/items/:id | Sí | Actualizar cantidad |
| DELETE | /cart/items/:id | Sí | Eliminar ítem |

### Pedidos y Pagos
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /orders | Sí | Listar pedidos |
| POST | /orders | Sí | Crear pedido |
| GET | /orders/:id | Sí | Detalle de pedido |
| PUT | /orders/:id/status | Sí | Actualizar estado |
| POST | /payments/init | Sí | Iniciar pago Stripe o PayPal |
| POST | /payments/stripe/webhook | No | Webhook Stripe |
| POST | /payments/paypal/webhook | No | Webhook PayPal |
| GET | /payments/status/:order_id | Sí | Estado del pago |

### Analytics
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /analytics/track | No | Registrar evento |
| GET | /analytics/dashboard | Sí | Métricas generales |
| GET | /analytics/top-posts | Sí | Posts más vistos |
| GET | /analytics/top-products | Sí | Productos más vistos |
| GET | /analytics/funnel | Sí | Funnel de conversión |
| GET | /analytics/realtime | Sí | Visitantes en tiempo real |

### Plugins y utilidades
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /newsletter/subscribe | No | Suscribirse al newsletter |
| GET | /newsletter/subscribers | Sí | Listar suscriptores |
| POST | /newsletter/campaigns/:id/send | Sí | Enviar campaña |
| POST | /contact/forms/:id/submit | No | Enviar mensaje de contacto |
| GET | /contact/admin/forms | Sí | Bandeja de mensajes |
| GET | /coupons/validate/:code | No | Validar cupón |
| GET | /redirects | Sí | Listar redirecciones |
| GET | /cache/stats | Sí | Estadísticas Redis |
| POST | /cache/flush | Sí | Limpiar cache |
| GET | /csv/export/products | Sí | Exportar productos CSV |
| POST | /csv/import/products | Sí | Importar productos CSV |
| GET | /maintenance/status | No | Estado modo mantenimiento |
| GET | /roles | Sí | Listar roles |
| GET | /permissions | Sí | Listar permisos |
| GET | /activity/logs | Sí | Log de actividad |
| GET | /search?q=... | Sí | Búsqueda global |
| GET | /notifications/stream | Sí | SSE tiempo real |
| GET | /sitemap.xml | No | Sitemap dinámico |
| GET | /robots.txt | No | Robots.txt |
| GET | /health | No | Health check básico |
| GET | /health/detailed | No | Estado detallado DB y Redis |

---

## i18n (ES / EN)

Bilingüe con react-i18next. Selector de idioma en el sidebar del admin y footer del sitio público.

- `frontend/src/locales/es/translation.json`
- `frontend/src/locales/en/translation.json`

---

## SEO

Implementado con react-helmet-async en todas las páginas públicas: title dinámico, meta description, Open Graph completo, Twitter Cards, canonical URLs, sitemap.xml desde la DB, robots.txt con Disallow en /admin y /api.

---

## Carrito y Checkout

El carrito usa **localStorage** para visitantes no autenticados — pueden agregar productos libremente. Al ir al checkout sin sesión, se redirige a `/login?redirect=/checkout` y se regresa automáticamente después del login.

---

## Tests

```bash
cd backend && cargo test
```

32 tests — 0 failed

| Módulo | Tests | Qué cubren |
|--------|-------|------------|
| coupon_tests | 6 | Descuentos, protección negativos |
| payments_tests | 6 | HMAC-SHA256, payload adulterado |
| reviews_tests | 7 | Gateways, PaymentStatus |
| auth_service | 7 | JWT, bcrypt, tokens |
| email_service | 6 | Plantillas, validación |

---

## CI/CD

GitHub Actions en `.github/workflows/ci.yml`. Se ejecuta en cada push y PR a `main`:
- **Backend**: `cargo build` + `cargo test` con PostgreSQL y Redis como servicios
- **Frontend**: `npm ci --legacy-peer-deps` + `npm run build`

---

## Variables de entorno

### Backend (`backend/.env`)
```env
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
REDIS_URL=redis://localhost:6379
JWT_SECRET=cambiar_en_produccion
JWT_EXPIRY_HOURS=720
PORT=8080
SITE_URL=http://localhost:5173
BACKUP_DIR=./backups
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu@email.com
SMTP_PASSWORD=tu_app_password
SMTP_FROM=noreply@tudominio.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_SANDBOX=true
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=/api/v1
```

---

## Licencia

GPL-3.0 © 2026 Johan David — [github.com/johandavid77/rustpress](https://github.com/johandavid77/rustpress)

---
---

# English

> Modern CMS built with Rust (Actix-Web) + React (TypeScript) + PostgreSQL.
> Inspired by WordPress but faster, more secure, and extensible by design.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Rust 1.75+ · Actix-Web 4 · SQLx · JWT · bcrypt |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · recharts |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Infra | Docker · Nginx · certbot (SSL) |
| i18n | react-i18next (ES / EN) |
| SEO | react-helmet-async · Open Graph · Twitter Cards |
| Payments | Stripe · PayPal |
| Analytics | Own system — no Google (pageviews, top posts, funnel, realtime) |

---

## Quick Start

```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
docker compose up -d
cd backend && cp .env.example .env && cargo run
cd frontend && npm install --legacy-peer-deps && npm run dev
```

Open: http://localhost:5173

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | johan@rustcms.dev | admin123 |
| Editor | editor@rustcms.dev | editor123 |

> ⚠️ Change before going to production.

---

## Production Deploy (Docker + Nginx + SSL)

```bash
cp .env.prod.example .env.prod
nano .env.prod
./ssl-init.sh
./deploy.sh
```

---

## Available Plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| Sliders | Content | Image carousel for homepage |
| Menus | Content | Customizable navigation |
| Comments | Content | Comment moderation |
| Categories | Content | Taxonomies for posts and products |
| Gallery | Content | Media grid with lightbox and drag & drop |
| Contact Forms | Content | Form builder with inbox and email notification |
| Webhooks | Integrations | External HTTP notifications |
| Newsletter | Integrations | Subscribers and bulk email via real SMTP |
| Bookings | Integrations | Booking system |
| Ecommerce | Ecommerce | Full store with Stripe and PayPal |
| Coupons | Ecommerce | Percentage or fixed amount discounts |
| Variants | Ecommerce | Size, color, etc. |
| Reviews | Ecommerce | Product review system |
| Healthcheck | System | Server, DB and Redis status |
| Backup | System | pg_dump with restore from admin |
| Updates | System | git pull + cargo build from admin |
| Redirects | System | 301/302 with hit counter and toggle |
| Redis Cache | System | Stats and prefix-based clearing |
| CSV Import/Export | System | Export data and bulk import products |
| Maintenance Mode | System | Public page with countdown and IP whitelist |
| Roles & Permissions | System | Role and resource-level permission management |
| Activity Log | System | Full audit log with filters and pagination |
| API Keys | System | API key management |
| RSS Feed | System | Automatic RSS feed for posts |

---

## Cart & Checkout

The cart uses **localStorage** for unauthenticated visitors — they can freely add products. When going to checkout without a session, the user is redirected to `/login?redirect=/checkout` and returned automatically after login.

---

## Tests

```bash
cd backend && cargo test
```

32 tests — 0 failed

---

## CI/CD

GitHub Actions at `.github/workflows/ci.yml`. Runs on every push and PR to `main`:
- **Backend**: `cargo build` + `cargo test` with PostgreSQL and Redis services
- **Frontend**: `npm ci --legacy-peer-deps` + `npm run build`

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
REDIS_URL=redis://localhost:6379
JWT_SECRET=change_in_production
JWT_EXPIRY_HOURS=720
PORT=8080
SITE_URL=http://localhost:5173
BACKUP_DIR=./backups
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=you@email.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_SANDBOX=true
```

---

## License

GPL-3.0 © 2026 Johan David — [github.com/johandavid77/rustpress](https://github.com/johandavid77/rustpress)

---

## Roadmap

> Estado actual: v1.0.0 — Sistema completo con 24 plugins, tienda, pagos, i18n ES/EN, Docker producción.

### 🔴 v1.1.0 — Fixes urgentes
- [x] Claves i18n faltantes en dashboard (`overview.ofStock`, `overview.users3`, subclaves de tarjetas)
- [x] "Ver tienda" en header del admin no cambia de idioma en EN
- [x] Subclaves de stats hardcodeadas en Stats.tsx (Low stock, Borradores, Total)
- [x] Carrito: sincronizar localStorage → backend al hacer login
- [x] Checkout: mostrar resumen con imágenes y precios reales
- [x] Página pública de mantenimiento: verificar que bloquea realmente a visitantes

### 🟡 v1.2.0 — Seguridad y permisos reales
- [x] Middleware de permisos en frontend — rutas del admin protegidas por rol (Editor, Moderador, Admin)
- [x] Ocultar secciones del sidebar según rol del usuario logueado
- [ ] Proteger endpoints del backend con has_permission() por recurso
- [ ] Log de actividad: registrar automáticamente create/update/delete en posts, productos y usuarios
- [ ] Sesiones: invalidar JWT al cambiar contraseña

### 🟡 v1.3.0 — Tienda mejorada
- [x] UI pública de reseñas — formulario desde página de producto
- [x] Filtros avanzados en tienda — rango de precio, ordenar por precio/popularidad/nuevo
- [x] Filtro por categoría desde URL (/shop?category=ropa)
- [ ] Página de producto mejorada — galería, zoom, variantes con selector visual
- [x] Wishlist / Lista de deseos
- [ ] Historial de pedidos para el cliente desde su perfil
- [ ] Email de confirmación de pedido automático
- [ ] Stock en tiempo real sin recargar

### 🟡 v1.4.0 — Experiencia de usuario
- [x] Onboarding wizard al primer login (sitio, logo, primer post, primer producto, SMTP)
- [x] Página 404 personalizable con links sugeridos y buscador
- [x] Perfil de usuario — cambiar avatar, contraseña y preferencias
- [ ] Editor de posts mejorado — bloques al estilo Notion
- [ ] Preview en tiempo real del post mientras se escribe
- [x] Borrador automático cada 30 segundos en el editor

### 🟢 v1.5.0 — Performance y optimización
- [x] Optimización automática de imágenes al subir (resize + compress + WebP)
- [x] Lazy loading de imágenes en tienda y galería
- [x] Cache de páginas públicas en Redis (TTL configurable desde admin)
- [ ] CDN-ready — servir uploads desde S3/R2/Cloudflare
- [ ] Lighthouse score > 90 en todas las páginas públicas

### 🟢 v1.6.0 — Analytics avanzados
- [x] Gráfica de ingresos por mes (últimos 12 meses)
- [x] Productos más vendidos con cantidad e ingresos
- [ ] Tasa de conversión carrito → checkout → pago completado
- [ ] Origen del tráfico (referrer, UTM params)
- [ ] Exportar estadísticas a CSV
- [ ] Alertas configurables por email (ventas, stock bajo)

### 🟢 v1.7.0 — Integraciones externas
- [x] Plugin Google Analytics / Plausible
- [ ] Plugin Mailchimp / Brevo — sincronizar suscriptores
- [x] Plugin WhatsApp Business — botón flotante configurable
- [ ] Plugin Livechat (Tawk.to / Crisp)
- [x] Login social — Google OAuth y GitHub OAuth
- [x] Plugin de mapa con ubicación del negocio

### 🟢 v1.8.0 — Multi-tenant y escalabilidad
- [ ] Soporte multi-idioma en contenido (posts y productos en ES/EN/FR etc.)
- [ ] Multi-sitio — un backend, varios frontends independientes
- [x] Backup automático programado — cron a S3/R2
- [x] Monitoreo de uptime con alertas por email/Slack

### 🔵 v2.0.0 — Plataforma
- [ ] Marketplace de plugins — instalar de terceros desde el admin
- [ ] Marketplace de temas — cambiar diseño del sitio público desde admin
- [x] API pública documentada con Swagger/OpenAPI
- [ ] SDK JavaScript para integrar con cualquier frontend
- [ ] CLI tool — rustpress new, rustpress deploy, rustpress backup
- [ ] App móvil admin (React Native)

### ✅ v1.0.0 — Completado
- [x] Backend Rust con Actix-Web, SQLx, JWT, bcrypt
- [x] Frontend React 18 + TypeScript + Tailwind CSS
- [x] 24 plugins: Sliders, Menús, Comentarios, Categorías, Galería, Formularios, Webhooks, Newsletter, Reservas, Ecommerce, Cupones, Variantes, Reseñas, Healthcheck, Backup, Actualizaciones, Redirecciones, Cache Redis, CSV Import/Export, Modo Mantenimiento, Roles y Permisos, Log de Actividad, API Keys, Feed RSS
- [x] Tienda completa con carrito (localStorage para invitados)
- [x] Pagos con Stripe y PayPal
- [x] Analytics propio sin Google (pageviews, funnel, realtime)
- [x] i18n bilingüe ES/EN con react-i18next
- [x] SEO completo (Open Graph, Twitter Cards, sitemap.xml, robots.txt)
- [x] Búsqueda global Ctrl+K
- [x] Notificaciones SSE en tiempo real
- [x] Docker producción con Nginx + SSL + certbot
- [x] CI/CD con GitHub Actions
- [x] 32 tests automatizados (0 failed)
