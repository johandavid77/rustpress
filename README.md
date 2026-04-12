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

\`\`\`bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
docker compose up -d
cd backend && cp .env.example .env && cargo run
cd frontend && npm install --legacy-peer-deps && npm run dev
\`\`\`

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

\`\`\`bash
cp .env.prod.example .env.prod
nano .env.prod
./ssl-init.sh
./deploy.sh
\`\`\`

---

## Estructura

\`\`\`
rustpress/
├── backend/src/
│   ├── main.rs                  Punto de entrada y rutas
│   ├── config.rs                Variables de entorno
│   ├── errors.rs                Manejo centralizado de errores
│   ├── handlers/
│   │   ├── auth.rs              Login, registro, perfil
│   │   ├── posts.rs             CRUD posts, stats, views
│   │   ├── media.rs             Subida y gestión de archivos
│   │   ├── users.rs             CRUD usuarios y roles
│   │   ├── plugins.rs           Sistema de plugins dinámico
│   │   ├── products_shop.rs     Tienda pública y CRUD admin
│   │   ├── orders.rs            Pedidos y estado
│   │   ├── payments.rs          Stripe y PayPal
│   │   ├── analytics.rs         Tracking y dashboard analítico
│   │   ├── backup.rs            Backup y restore con pg_dump
│   │   ├── updates.rs           Actualizaciones vía git pull
│   │   ├── search.rs            Búsqueda global Ctrl+K
│   │   ├── notifications.rs     SSE en tiempo real
│   │   ├── newsletter.rs        Suscriptores y campañas SMTP
│   │   ├── contact.rs           Formularios de contacto
│   │   ├── redirects.rs         Redirecciones 301/302
│   │   ├── coupons.rs           Cupones de descuento
│   │   ├── cache_admin.rs       Panel de cache Redis
│   │   ├── csv_io.rs            Import/Export CSV
│   │   ├── maintenance.rs       Modo mantenimiento
│   │   ├── roles.rs             Roles y permisos
│   │   ├── activity.rs          Log de actividad
│   │   └── webhooks.rs          Notificaciones externas
│   ├── payments/
│   │   ├── stripe.rs            Gateway Stripe
│   │   ├── paypal.rs            Gateway PayPal
│   │   └── gateway.rs           Trait PaymentGateway
│   └── services/
│       ├── auth_service.rs      JWT y bcrypt
│       └── email_service.rs     Plantillas de email
├── frontend/src/
│   ├── pages/
│   │   ├── public/              Blog, Shop, ProductDetail, Checkout, MaintenancePage
│   │   ├── Dashboard/           Overview, Users, HealthDashboard
│   │   ├── Shop/                Products, ProductEditor, Orders
│   │   ├── Gallery/             Galería de medios
│   │   └── Plugins/             Todos los plugins admin
│   ├── plugins/
│   │   └── pluginRegistry.ts    Registro central de plugins
│   ├── components/
│   │   ├── SEO/                 Meta tags, Open Graph, Twitter Cards
│   │   ├── GlobalSearch/        Búsqueda global Ctrl+K
│   │   ├── NotificationBell/    Notificaciones SSE
│   │   └── Newsletter/          Widget público de suscripción
│   ├── locales/
│   │   ├── es/translation.json  Traducciones español
│   │   └── en/translation.json  Traducciones inglés
│   └── api/                     Clientes API tipados
├── nginx/nginx.conf             Reverse proxy, SSL, rate limiting
├── docker-compose.yml           Desarrollo local
├── docker-compose.prod.yml      Producción completa
├── deploy.sh                    Script de deploy con un comando
├── ssl-init.sh                  Obtener SSL con Let's Encrypt
└── .env.prod.example            Variables de producción
\`\`\`

---

## Sistema de Plugins

Los plugins se registran en la DB y en un registry central. El Dashboard los carga automáticamente con lazy loading.

### Para agregar un plugin nuevo

1. Crear el componente en `frontend/src/pages/Plugins/MiPlugin.tsx`
2. Registrar en `frontend/src/plugins/pluginRegistry.ts` con lazy import
3. Insertar en la DB:

\`\`\`sql
INSERT INTO plugins (id, name, version, description, is_enabled, config)
VALUES (gen_random_uuid(), 'mi-plugin', '1.0.0', 'Descripcion', true,
  '{"title":"Mi Plugin","icon":"Zap","color":"from-blue-500/20 to-blue-600/5 border-blue-500/20","category":"content"}');
\`\`\`

4. Listo — aparece automáticamente con toggle activo/inactivo.

### Plugins disponibles

| Plugin | Categoría | Descripción |
|--------|-----------|-------------|
| Sliders | Contenido | Carrusel de imágenes para la home |
| Menús | Contenido | Navegación personalizable |
| Comentarios | Contenido | Moderación de comentarios |
| Categorías | Contenido | Taxonomías para posts y productos |
| Galería | Contenido | Grid de medios con lightbox y drag & drop |
| Formularios | Contenido | Constructor de formularios con bandeja de mensajes |
| Webhooks | Integraciones | Notificaciones HTTP externas |
| Newsletter | Integraciones | Suscriptores y envío masivo con SMTP real |
| Ecommerce | Ecommerce | Tienda completa con Stripe y PayPal |
| Cupones | Ecommerce | Descuentos por porcentaje o monto fijo |
| Healthcheck | Sistema | Estado del servidor, DB y Redis |
| Backup | Sistema | Copias de seguridad con pg_dump |
| Actualizaciones | Sistema | git pull + cargo build desde el admin |
| Redirecciones | Sistema | 301/302 con contador de hits |
| Cache Redis | Sistema | Panel con limpieza por prefijo |
| CSV Import/Export | Sistema | Exportar datos e importar productos en bulk |
| Modo Mantenimiento | Sistema | Página pública con countdown y whitelist IPs |
| Roles y Permisos | Sistema | Gestión de roles y permisos por recurso |
| Log de Actividad | Sistema | Auditoría de acciones con filtros y paginación |

---

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

### Auth
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /auth/login | No | Login, retorna JWT |
| POST | /auth/register | No | Registro de usuario |
| GET | /auth/me | Sí | Perfil del usuario actual |

### Posts
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /posts | No | Listar posts publicados |
| POST | /posts | Sí | Crear post |
| GET | /posts/:id | No | Obtener post |
| PUT | /posts/:id | Sí | Editar post |
| DELETE | /posts/:id | Sí | Eliminar post |
| GET | /posts/stats | Sí | Estadísticas generales |
| GET | /posts/stats/views | Sí | Vistas por día para gráfica |
| POST | /posts/:slug/view | No | Incrementar contador de vistas |

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

### Búsqueda y Notificaciones
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /search?q=... | Sí | Búsqueda global |
| GET | /notifications/stream | Sí | SSE — pedidos y stock bajo |

### Nuevos endpoints de plugins
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /newsletter/subscribers | Sí | Listar suscriptores |
| POST | /newsletter/subscribe | No | Suscribirse al newsletter |
| GET | /newsletter/campaigns | Sí | Listar campañas |
| POST | /newsletter/campaigns/:id/send | Sí | Enviar campaña |
| GET | /contact/admin/forms | Sí | Listar formularios |
| POST | /contact/forms/:id/submit | No | Enviar mensaje de contacto |
| GET | /coupons | Sí | Listar cupones |
| GET | /coupons/validate/:code | No | Validar cupón |
| GET | /redirects | Sí | Listar redirecciones |
| GET | /cache/stats | Sí | Estadísticas de cache Redis |
| POST | /cache/flush | Sí | Limpiar toda la cache |
| GET | /csv/export/products | Sí | Exportar productos a CSV |
| POST | /csv/import/products | Sí | Importar productos desde CSV |
| GET | /maintenance/status | No | Estado del modo mantenimiento |
| GET | /roles | Sí | Listar roles |
| GET | /activity/logs | Sí | Log de actividad |

### Utilidades
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /sitemap.xml | No | Sitemap dinámico |
| GET | /robots.txt | No | Robots.txt con reglas SEO |
| GET | /health | No | Health check básico |
| GET | /health/detailed | No | Estado detallado de DB, Redis y stats |

---

## i18n (ES / EN)

Bilingüe con react-i18next. El selector de idioma está en el sidebar del admin y en el footer del sitio público.

Archivos de traducción:
- `frontend/src/locales/es/translation.json`
- `frontend/src/locales/en/translation.json`

---

## SEO

Implementado con react-helmet-async en todas las páginas públicas. Incluye title dinámico, meta description, Open Graph completo, Twitter Cards, canonical URLs, sitemap.xml dinámico desde la DB y robots.txt con Disallow en /admin y /api.

---

## Tests

\`\`\`bash
cd backend
cargo test
\`\`\`

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
\`\`\`env
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
\`\`\`

### Frontend (`frontend/.env`)
\`\`\`env
VITE_API_URL=/api/v1
\`\`\`

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

\`\`\`bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
docker compose up -d
cd backend && cp .env.example .env && cargo run
cd frontend && npm install --legacy-peer-deps && npm run dev
\`\`\`

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

\`\`\`bash
cp .env.prod.example .env.prod
nano .env.prod
./ssl-init.sh   # get SSL certificate (first time only)
./deploy.sh     # build and start all services
\`\`\`

---

## Available Plugins

| Plugin | Category | Description |
|--------|----------|-------------|
| Sliders | Content | Image carousel for homepage |
| Menus | Content | Customizable navigation |
| Comments | Content | Comment moderation |
| Categories | Content | Taxonomies for posts and products |
| Gallery | Content | Media grid with lightbox and drag & drop |
| Contact Forms | Content | Form builder with message inbox and email notification |
| Webhooks | Integrations | External HTTP notifications |
| Newsletter | Integrations | Subscribers and bulk email via real SMTP |
| Ecommerce | Ecommerce | Full store with Stripe and PayPal |
| Coupons | Ecommerce | Percentage or fixed amount discounts |
| Healthcheck | System | Server, DB and Redis status |
| Backup | System | Database backups with pg_dump |
| Updates | System | git pull + cargo build from the admin panel |
| Redirects | System | 301/302 with hit counter and toggle |
| Redis Cache | System | Cache panel with prefix-based clearing |
| CSV Import/Export | System | Export data and bulk import products |
| Maintenance Mode | System | Public page with countdown and IP whitelist |
| Roles & Permissions | System | Role management and resource-level permissions |
| Activity Log | System | Action audit log with filters and pagination |

---

## Tests

\`\`\`bash
cd backend && cargo test
\`\`\`

32 tests — 0 failed

---

## CI/CD

GitHub Actions at `.github/workflows/ci.yml`. Runs on every push and PR to `main`:
- **Backend**: `cargo build` + `cargo test` with PostgreSQL and Redis services
- **Frontend**: `npm ci --legacy-peer-deps` + `npm run build`

---

## Environment Variables

### Backend (`backend/.env`)
\`\`\`env
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
\`\`\`

---

## License

GPL-3.0 © 2026 Johan David — [github.com/johandavid77/rustpress](https://github.com/johandavid77/rustpress)
