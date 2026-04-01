<div align="center">

# 🦀 RustPress CMS

**A fast, modern, full-stack CMS built with Rust + React**

[![Rust](https://img.shields.io/badge/Rust-1.94-orange?logo=rust)](https://www.rust-lang.org/)
[![Actix Web](https://img.shields.io/badge/Actix--Web-4-red)](https://actix.rs/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/johandavid77/rustpress/actions/workflows/backend.yml/badge.svg)](https://github.com/johandavid77/rustpress/actions)

[English](#english) · [Español](#español)

</div>

---

## English

### What is RustPress?

RustPress is a headless CMS with a built-in admin dashboard, built entirely with Rust on the backend and React + TypeScript on the frontend. It is designed to be a fast, lightweight, self-hosted alternative to WordPress — with a modern developer experience.

### Why Rust?

- **Speed**: Rust compiles to native code — the API responds in microseconds, not milliseconds
- **Safety**: Memory safety without a garbage collector — no null pointer exceptions, no data races
- **Reliability**: If it compiles, it works — Rust's type system catches bugs at compile time
- **Low resource usage**: Runs on minimal RAM compared to Node.js or Python equivalents

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend language | **Rust 1.94** | Core language — fast, safe, compiled |
| Web framework | **Actix-Web 4** | HTTP server, routing, middleware |
| Rate limiting | **actix-governor 0.7** | 60 req/min per IP, abuse protection |
| Database ORM | **SQLx** | Async SQL queries with compile-time checking |
| Database | **PostgreSQL 16** | Primary data store |
| Cache | **Redis 7** | Post cache with 5min TTL, auto-invalidation |
| Migrations | **SQLx migrate** | Version-controlled schema migrations |
| Auth | **JWT (jsonwebtoken)** | Stateless authentication tokens |
| Password hashing | **bcrypt** | Secure password storage |
| Email | **Lettre + SMTP** | Password reset emails |
| Image processing | **image 0.25** | Auto-resize & optimize JPEG/PNG/WebP on upload |
| HTTP client | **reqwest 0.12** | Outbound HTTP for webhooks |
| Frontend language | **TypeScript 5** | Type-safe React development |
| UI framework | **React 18** | Component-based UI |
| Styling | **Tailwind CSS** | Utility-first CSS |
| State management | **Zustand** | Lightweight global state |
| HTTP client | **Axios** | API communication with JWT interceptor |
| Routing | **React Router v6** | Client-side navigation |
| Rich text editor | **TipTap** | WYSIWYG editor with extensions |
| i18n | **i18next + react-i18next** | Bilingual UI (ES/EN), auto-detects browser language |
| Build tool | **Vite** | Fast frontend bundler |
| Dev email | **MailHog** | Local SMTP server for testing |
| Containerization | **Docker / Podman Compose** | Local development environment |
| Production | **Docker Compose prod** | Multi-stage builds, Nginx, SSL/Certbot |
| CI/CD | **GitHub Actions** | Auto build & test on every push |

### Features

- ✅ **Authentication** — JWT login, public register (with admin approval), password reset via email
- ✅ **Posts** — CRUD with slug management, drafts, publish/unpublish, language per post
- ✅ **SEO per post** — Custom `seo_title`, `seo_description`, `og_image` fields + dynamic meta tags
- ✅ **Categories** — Full CRUD, assign multiple categories per post, filter blog by category
- ✅ **Media library** — Drag & drop upload, auto image optimization (resize to 1920px, JPEG 85%), gallery, copy URL
- ✅ **Users** — Role-based access control, pending approval, activate/deactivate
- ✅ **Comments** — Authenticated comments with admin moderation (approve/delete)
- ✅ **Sliders** — Home page carousel management with image preview
- ✅ **Menus** — Navigation menu builder with items (label, URL, target, icon, order)
- ✅ **Theme system** — 4 built-in themes (Dark, Minimal, Bold, Magazine), switchable from admin
- ✅ **Search** — Full-text search in public blog with debounce (300ms, 5 results)
- ✅ **Pagination** — 10 posts per page across all 4 themes
- ✅ **Related posts** — Shows related posts by category at end of each BlogPost
- ✅ **Author profile** — Public author page at `/author/:id` with post list and join date
- ✅ **View counter** — Post visit counter, increments on read, visible in BlogPost header
- ✅ **Post preview** — Preview any post (including drafts) before publishing
- ✅ **RSS feed** — `/api/v1/feed.xml` with latest 20 published posts
- ✅ **Multi-language content** — Language selector per post (es, en, fr, pt)
- ✅ **API rate limiting** — 60 req/min per IP with actix-governor
- ✅ **Redis cache** — Published posts cached with 5min TTL, auto-invalidated on write
- ✅ **Webhooks** — Notify Slack/Discord/any URL on post publish — CRUD + toggle + background fire
- ✅ **Scheduled publishing** — Set a future `publish_at` date; background scheduler publishes automatically every 60s
- ✅ **DB auto-backup** — Automatic `pg_dump` every 24h, keeps last 30 backups, configurable path
- ✅ **Settings** — Persistent key-value settings in DB (active theme, etc.)
- ✅ **Plugin system** — Extensible plugin dashboard with navigation cards
- ✅ **Stats dashboard** — Post counts, recent activity overview
- ✅ **i18n admin UI** — Full bilingual dashboard (ES/EN)
- ✅ **CI/CD** — GitHub Actions: Rust build + PostgreSQL tests + TypeScript build check
- ✅ **Docker production** — Multi-stage builds, Nginx reverse proxy, SSL with Certbot

### Project Structure

```
rustpress/
├── backend/                      # Rust Actix-Web API
│   ├── src/
│   │   ├── handlers/             # Route handlers
│   │   │   ├── auth.rs           # Auth endpoints
│   │   │   ├── posts.rs          # Posts CRUD + search + pagination + cache
│   │   │   ├── media.rs          # Media upload + image optimization
│   │   │   ├── categories.rs     # Categories CRUD + post assignment
│   │   │   ├── comments.rs       # Comments + moderation
│   │   │   ├── menus.rs          # Navigation menus
│   │   │   ├── sliders.rs        # Home sliders
│   │   │   ├── users.rs          # User management + author profile
│   │   │   ├── webhooks.rs       # Webhooks CRUD + fire on publish
│   │   │   ├── settings.rs       # App settings (active theme, etc.)
│   │   │   └── feed.rs           # RSS feed
│   │   ├── middleware/           # JWT auth middleware
│   │   ├── models/               # Database models & DTOs
│   │   ├── services/             # Business logic (auth, email, media)
│   │   ├── plugins/              # Plugin registry system
│   │   ├── cache.rs              # Redis cache helpers (get/set/invalidate)
│   │   ├── scheduler.rs          # Scheduled publishing (every 60s)
│   │   ├── backup.rs             # Auto pg_dump every 24h
│   │   ├── errors.rs             # Centralized error handling
│   │   ├── config.rs             # Environment config
│   │   └── main.rs               # App entry point & route registration
│   ├── migrations/               # SQL migration files
│   └── Dockerfile                # Multi-stage production build
├── frontend/                     # React + TypeScript SPA
│   ├── src/
│   │   ├── api/                  # API client modules
│   │   ├── components/           # Shared components
│   │   │   ├── Comments/         # Comments widget (4 themes)
│   │   │   ├── CategorySelector/ # Category picker for post editor
│   │   │   ├── RelatedPosts/     # Related posts widget (4 themes)
│   │   │   ├── Search/           # SearchBar with debounce (4 themes)
│   │   │   ├── Editor/           # TipTap rich text editor
│   │   │   └── Slider/           # Hero slider component
│   │   ├── locales/              # i18n translations (es/, en/)
│   │   ├── pages/                # Page components
│   │   │   ├── Posts/            # NewPost, EditPost (SEO + categories + language + schedule)
│   │   │   ├── Blog/             # AuthorProfile, PostPreview
│   │   │   ├── Plugins/          # PluginsHome, SlidersAdmin, MenusAdmin,
│   │   │   │                     # CommentsAdmin, CategoriesAdmin, WebhooksAdmin
│   │   │   ├── Media/            # MediaAdmin
│   │   │   └── Users/            # UsersAdmin
│   │   ├── themes/               # Theme system
│   │   │   ├── dark/             # Dark theme (BlogIndex + BlogPost)
│   │   │   ├── minimal/          # Minimal theme
│   │   │   ├── bold/             # Bold theme
│   │   │   ├── magazine/         # Magazine theme
│   │   │   └── ThemeLoader.tsx   # Dynamic lazy theme loader
│   │   ├── store/                # Zustand global state
│   │   ├── types/                # TypeScript type definitions
│   │   └── App.tsx               # Router
│   ├── Dockerfile                # Multi-stage production build
│   └── nginx.conf                # Nginx config for SPA routing
├── nginx/
│   └── nginx.conf                # Production Nginx (HTTPS + reverse proxy)
├── scripts/
│   └── backup.sh                 # Manual pg_dump helper script
├── .github/
│   └── workflows/
│       ├── backend.yml           # Rust CI (build + migrations + tests)
│       └── frontend.yml          # TypeScript CI (build check)
├── compose.yml                   # Local dev (PostgreSQL + MailHog + Redis)
├── docker-compose.prod.yml       # Production stack
├── .env.prod.example             # Production env template
└── README.md
```

### Local Installation

#### Prerequisites

- [Rust](https://rustup.rs/) 1.70+
- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) or [Podman](https://podman.io/) + Compose
- [sqlx-cli](https://github.com/launchbadge/sqlx): `cargo install sqlx-cli`

#### 1. Clone the repo

```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
```

#### 2. Start services (PostgreSQL + MailHog + Redis)

```bash
podman-compose up -d
# or with Docker:
docker compose up -d
```

#### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
JWT_SECRET=your-super-secret-key-change-this
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=test
SMTP_PASSWORD=test
SMTP_FROM=noreply@rustcms.dev
FRONTEND_URL=http://localhost:5173
HOST=0.0.0.0
PORT=8080
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=10
REDIS_URL=redis://127.0.0.1:6379
BACKUP_DIR=./backups
```

#### 4. Run migrations

```bash
cd backend
sqlx migrate run
```

#### 5. Start the backend

```bash
cargo run
# API available at http://localhost:8080
```

#### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

#### 7. Monitor emails (MailHog)

Open [http://localhost:8025](http://localhost:8025) to see all outgoing emails.

#### 8. First admin setup

Register at `/register`, then assign the admin role via DB:

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'your@email.com';
```

### Production Deploy

```bash
# 1. Clone on your VPS
git clone https://github.com/johandavid77/rustpress.git
cd rustpress

# 2. Configure environment
cp .env.prod.example .env.prod
nano .env.prod  # fill in your real values

# 3. Start all services
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. Get SSL certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  --email you@email.com --agree-tos -d yourdomain.com
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register new user |
| POST | `/api/v1/auth/login` | ❌ | Login, returns JWT |
| POST | `/api/v1/auth/forgot-password` | ❌ | Send reset email |
| POST | `/api/v1/auth/reset-password` | ❌ | Reset with token |
| GET | `/api/v1/auth/me` | ✅ | Current user info |
| GET | `/api/v1/posts` | ❌ | List posts (page, per_page, search, status) |
| POST | `/api/v1/posts` | ✅ | Create post |
| PUT | `/api/v1/posts/:id` | ✅ | Update post (incl. SEO, language, publish_at) |
| DELETE | `/api/v1/posts/:id` | ✅ | Delete post |
| GET | `/api/v1/posts/slug/:slug` | ❌ | Get post by slug |
| POST | `/api/v1/posts/slug/:slug/view` | ❌ | Increment view counter |
| GET | `/api/v1/posts/:id/preview` | ✅ | Preview post (includes drafts) |
| GET | `/api/v1/posts/stats` | ✅ | Post statistics |
| GET | `/api/v1/posts/:id/categories` | ❌ | Get post categories |
| POST | `/api/v1/posts/:id/categories/:cat_id` | ✅ | Add category to post |
| DELETE | `/api/v1/posts/:id/categories/:cat_id` | ✅ | Remove category from post |
| GET | `/api/v1/posts/:id/comments` | ❌ | List approved comments |
| POST | `/api/v1/posts/:id/comments` | ✅ | Add comment |
| GET | `/api/v1/categories` | ❌ | List all categories |
| POST | `/api/v1/categories` | ✅ | Create category |
| DELETE | `/api/v1/categories/:id` | ✅ | Delete category |
| GET | `/api/v1/categories/:slug/posts` | ❌ | Posts by category |
| GET | `/api/v1/comments/all` | ✅ | All comments (admin) |
| PUT | `/api/v1/comments/:id/approve` | ✅ | Approve comment |
| DELETE | `/api/v1/comments/:id` | ✅ | Delete comment |
| GET | `/api/v1/media` | ✅ | List media files |
| POST | `/api/v1/media/upload` | ✅ | Upload + auto-optimize image |
| DELETE | `/api/v1/media/:id` | ✅ | Delete media |
| GET/POST | `/api/v1/menus` | ❌/✅ | List / create menus |
| PUT/DELETE | `/api/v1/menus/:id` | ✅ | Update / delete menu |
| GET/POST | `/api/v1/menu-items/:menu_id` | ❌/✅ | Menu items |
| GET/POST | `/api/v1/sliders` | ❌/✅ | Sliders |
| GET/PUT/DELETE | `/api/v1/users/:id` | ✅ | User management |
| GET | `/api/v1/users/:id/profile` | ❌ | Public author profile |
| GET | `/api/v1/webhooks` | ✅ | List webhooks |
| POST | `/api/v1/webhooks` | ✅ | Create webhook |
| DELETE | `/api/v1/webhooks/:id` | ✅ | Delete webhook |
| POST | `/api/v1/webhooks/:id/toggle` | ✅ | Toggle webhook active/inactive |
| GET | `/api/v1/settings/active-theme` | ❌ | Get active theme |
| PUT | `/api/v1/settings/active-theme` | ✅ | Set active theme |
| GET | `/api/v1/feed.xml` | ❌ | RSS feed |
| GET | `/health` | ❌ | Health check |

### Roadmap

- [x] Rich text editor (TipTap)
- [x] Theme system (Dark, Minimal, Bold, Magazine)
- [x] Comments with admin moderation
- [x] Persistent settings in DB
- [x] Image optimization — auto-resize to 1920px, JPEG 85%, PNG, WebP
- [x] Multi-language content — language selector per post (es, en, fr, pt)
- [x] API rate limiting — 60 req/min per IP with actix-governor
- [x] SEO meta tags per post — seo_title, seo_description, og_image + dynamic meta tags
- [x] RSS feed — `/api/v1/feed.xml` with latest 20 posts
- [x] CI/CD pipeline — GitHub Actions for backend (Rust + PostgreSQL) and frontend (TypeScript)
- [x] Docker production setup — multi-stage builds, Nginx, SSL with Certbot
- [x] Categories & Tags — full CRUD, selector in editor, admin panel, filter by category
- [x] Search — full-text search in public blog (debounce 300ms, 5 results)
- [x] Pagination — 10 posts per page across all 4 themes
- [x] Related posts — posts related by category at end of BlogPost (all 4 themes)
- [x] Author profile — public page `/author/:id` with post list and join date
- [x] View counter — increments on read, visible in BlogPost header
- [x] Post preview — preview any post (including drafts) before publishing
- [x] Redis cache — 5min TTL on list_posts, auto-invalidated on create/update/delete
- [x] Webhooks — notify Slack/Discord on publish, CRUD panel, toggle active/inactive
- [x] Scheduled publishing — `publish_at` field + background scheduler every 60s
- [x] DB auto-backup — automatic pg_dump every 24h, keeps last 30, configurable path
- [x] **Healthcheck dashboard** — real-time DB, Redis & stats monitoring panel


### Next — Pre-ecommerce improvements

#### Quality & Robustness
- [ ] **Unit & integration tests** — cargo test suite for handlers, models and services
- [x] **Differentiated rate limiting** — stricter on auth endpoints, relaxed on reads
- [x] **Structured logs** — info/warn/error levels, exportable format

#### Admin UX
- [ ] **Drag & drop post ordering** — reorder posts from the list view
- [x] **Autosave editor** — auto-save draft every 30s while writing
- [x] **Bulk actions** — publish/delete/unpublish multiple posts at once
- [x] **Visits chart** — bar chart of daily visits for last 30 days on home dashboard

#### Public Blog
- [x] **Table of contents** — auto-generated TOC for long posts
- [ ] **Reading mode** — distraction-free reading with optimized typography
- [x] **Social share buttons** — native share for Twitter/X, LinkedIn, WhatsApp
- [x] **Reading time** — estimated read time shown on each post

#### SEO & Performance
- [x] **Sitemap.xml** — auto-generated sitemap with all published posts
- [x] **Lazy loading images** — lazy load in all 4 themes
- [x] **Open Graph preview** — preview OG card before publishing

#### Pre-ecommerce
- [x] **Granular permissions** — custom roles with fine-grained permissions
- [x] **API keys** — external API access with scoped keys
- [x] **Multi-author support** — multiple authors with public profiles

---

### Ecommerce (WooCommerce-style module)
- [x] **Products** — CRUD with images, variants, stock, price
- [x] **Categories** — product categories separate from blog categories
- [x] **Shopping cart** — persistent cart with localStorage + DB sync
- [ ] **Checkout** — order flow with address and payment
- [x] **Orders** — order management in admin (pending, processing, shipped, delivered)
- [ ] **Payment gateways** (arquitectura modular lista) — Stripe + PayPal integration
- [ ] **Inventory** — stock tracking, low stock alerts
- [ ] **Discounts & coupons** — percentage and fixed amount coupons
- [ ] **Product reviews** — authenticated reviews with rating
- [ ] **Order emails** — confirmation and status update emails

---

## Español

### ¿Qué es RustPress?

RustPress es un CMS headless con panel de administración integrado, construido con Rust en el backend y React + TypeScript en el frontend. Es una alternativa moderna, rápida y auto-hospedada a WordPress.

### ¿Por qué Rust?

- **Velocidad**: Rust compila a código nativo — la API responde en microsegundos, no milisegundos
- **Seguridad**: Memoria segura sin garbage collector — sin null pointers, sin data races
- **Confiabilidad**: Si compila, funciona — el sistema de tipos de Rust detecta bugs en tiempo de compilación
- **Bajo consumo**: Usa mucha menos RAM que equivalentes en Node.js o Python

### Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Lenguaje backend | **Rust 1.94** | Rápido, seguro, compilado |
| Framework web | **Actix-Web 4** | Servidor HTTP, rutas, middleware |
| Rate limiting | **actix-governor 0.7** | 60 req/min por IP, protección anti-abuso |
| ORM | **SQLx** | Consultas SQL async verificadas en compilación |
| Base de datos | **PostgreSQL 16** | Almacén principal |
| Cache | **Redis 7** | Cache de posts con TTL 5min, invalidación automática |
| Auth | **JWT** | Tokens sin estado |
| Email | **Lettre + SMTP** | Recuperación de contraseña |
| Procesamiento imágenes | **image 0.25** | Resize y optimización JPEG/PNG/WebP al subir |
| Cliente HTTP | **reqwest 0.12** | Llamadas salientes para webhooks |
| Frontend | **React 18 + TypeScript** | UI basada en componentes |
| Editor de texto | **TipTap** | Editor WYSIWYG con extensiones |
| Estilos | **Tailwind CSS** | Utilidades CSS |
| Estado | **Zustand** | Estado global ligero |
| i18n | **i18next + react-i18next** | Bilingüe ES/EN, detecta idioma del navegador |
| Build | **Vite** | Bundler rápido |
| Email dev | **MailHog** | SMTP local para pruebas |
| Contenedores | **Docker / Podman Compose** | Entorno de desarrollo local |
| Producción | **Docker Compose prod** | Multi-stage builds, Nginx, SSL/Certbot |
| CI/CD | **GitHub Actions** | Build y tests automáticos en cada push |

### Funcionalidades

- ✅ **Autenticación** — Login JWT, registro público con aprobación admin, reset de contraseña por email
- ✅ **Posts** — CRUD con slugs, borradores, publicar/despublicar, idioma por post
- ✅ **SEO por post** — Campos `seo_title`, `seo_description`, `og_image` + meta tags dinámicos
- ✅ **Categorías** — CRUD completo, asignar múltiples categorías por post, filtrar blog por categoría
- ✅ **Media** — Subida drag & drop, optimización automática de imágenes (resize 1920px, JPEG 85%), galería, copiar URL
- ✅ **Usuarios** — Control de acceso por roles, aprobación de pendientes, activar/desactivar
- ✅ **Comentarios** — Comentarios autenticados con moderación admin (aprobar/eliminar)
- ✅ **Sliders** — Carrusel de la página principal con preview de imagen
- ✅ **Menús** — Constructor de menús de navegación con items personalizables
- ✅ **Sistema de themes** — 4 themes incluidos (Dark, Minimal, Bold, Magazine), cambiable desde el admin
- ✅ **Búsqueda** — Full-text search en el blog público con debounce (300ms, 5 resultados)
- ✅ **Paginación** — 10 posts por página en los 4 themes
- ✅ **Posts relacionados** — Posts relacionados por categoría al final de cada BlogPost
- ✅ **Perfil de autor** — Página pública `/author/:id` con lista de posts y fecha de registro
- ✅ **Contador de visitas** — Se incrementa al leer, visible en el encabezado del BlogPost
- ✅ **Preview de post** — Previsualiza cualquier post (incluso borradores) antes de publicar
- ✅ **RSS feed** — `/api/v1/feed.xml` con los últimos 20 posts publicados
- ✅ **Contenido multiidioma** — Selector de idioma por post (es, en, fr, pt)
- ✅ **Rate limiting** — 60 req/min por IP con actix-governor
- ✅ **Cache con Redis** — TTL 5min en list_posts, invalidación automática en escrituras
- ✅ **Webhooks** — Notifica Slack/Discord/cualquier URL al publicar — CRUD, toggle, fire en background
- ✅ **Publicación programada** — Campo `publish_at` + scheduler automático cada 60s
- ✅ **Backup automático** — `pg_dump` automático cada 24h, conserva los últimos 30, ruta configurable
- ✅ **Settings** — Configuración persistente en DB (theme activo, etc.)
- ✅ **Panel de plugins** — Dashboard con tarjetas de navegación para cada plugin
- ✅ **Dashboard de stats** — Resumen de actividad y conteos
- ✅ **UI bilingüe** — Dashboard completo en ES/EN
- ✅ **CI/CD** — GitHub Actions: build Rust + PostgreSQL + TypeScript
- ✅ **Docker producción** — Multi-stage builds, Nginx reverse proxy, SSL con Certbot

### Instalación Rápida

```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
podman-compose up -d                              # PostgreSQL + MailHog + Redis
cd backend && sqlx migrate run                    # Migraciones
cargo run                                         # Backend en :8080
cd ../frontend && npm install && npm run dev      # Frontend en :5173
```

### Roadmap

- [x] Editor de texto enriquecido (TipTap)
- [x] Sistema de themes (Dark, Minimal, Bold, Magazine)
- [x] Comentarios con moderación admin
- [x] Settings persistentes en DB
- [x] Optimización de imágenes — resize automático 1920px, JPEG 85%, PNG, WebP
- [x] Contenido multiidioma — selector de idioma por post (es, en, fr, pt)
- [x] Rate limiting — 60 req/min por IP con actix-governor
- [x] SEO por post — seo_title, seo_description, og_image + meta tags dinámicos
- [x] RSS feed — `/api/v1/feed.xml` con los últimos 20 posts
- [x] CI/CD — GitHub Actions para backend (Rust + PostgreSQL) y frontend (TypeScript)
- [x] Docker producción — multi-stage builds, Nginx, SSL con Certbot
- [x] Categorías y tags — CRUD completo, selector en editor, panel admin, filtro por categoría
- [x] Búsqueda — full-text search en el blog público (debounce 300ms, 5 resultados)
- [x] Paginación — 10 posts por página en los 4 themes
- [x] Posts relacionados — posts relacionados por categoría al final del BlogPost
- [x] Perfil de autor — página pública `/author/:id` con posts y fecha de registro
- [x] Contador de visitas — se incrementa al leer, visible en el BlogPost
- [x] Preview de post — previsualizar cualquier post (incluso borradores) antes de publicar
- [x] Cache con Redis — TTL 5min en list_posts, invalidación en create/update/delete
- [x] Webhooks — notificaciones al publicar (Slack, Discord), CRUD + fire en background
- [x] Publicación programada — campo `publish_at` + scheduler automático cada 60s
- [x] Backup automático — pg_dump cada 24h, conserva los últimos 30, ruta configurable
- [x] **Dashboard de monitoreo** — panel en tiempo real: estado DB, Redis y estadísticas


### Siguiente — Mejoras pre-ecommerce

#### Calidad y robustez
- [ ] **Tests unitarios e integración** — suite cargo test para handlers, modelos y servicios
- [x] **Rate limiting diferenciado** — más estricto en auth, más permisivo en lectura
- [x] **Logs estructurados** — niveles info/warn/error, formato exportable

#### UX del admin
- [ ] **Drag & drop de posts** — reordenar posts desde la lista
- [x] **Autosave en editor** — guardar borrador automáticamente cada 30s
- [ ] **Acciones en masa** — publicar/eliminar/despublicar varios posts a la vez
- [ ] **Gráfica de visitas** — barras de visitas diarias últimos 30 días en el home

#### Blog público
- [x] **Tabla de contenidos** — TOC automático en posts largos
- [ ] **Modo lectura** — tipografía optimizada sin distracciones
- [x] **Botones de compartir** — compartir nativo en Twitter/X, LinkedIn, WhatsApp
- [x] **Tiempo de lectura** — estimado visible en cada post

#### SEO y performance
- [x] **Sitemap.xml** — sitemap automático con todos los posts publicados
- [x] **Lazy loading de imágenes** — carga diferida en los 4 themes
- [x] **Preview Open Graph** — previsualizar tarjeta OG antes de publicar

#### Pre-ecommerce
- [x] **Permisos granulares** — roles custom con permisos detallados
- [x] **API keys** — acceso externo con claves de API con alcance definido
- [x] **Soporte multi-autor** — múltiples autores con perfiles públicos

---

### Ecommerce (módulo estilo WooCommerce)
- [ ] **Productos** — CRUD con imágenes, variantes, stock, precio
- [ ] **Categorías de productos** — separadas de las categorías del blog
- [ ] **Carrito de compras** — carrito persistente con localStorage + sync DB
- [ ] **Checkout** — flujo de pedido con dirección y pago
- [ ] **Pedidos** — gestión en admin (pendiente, procesando, enviado, entregado)
- [ ] **Pasarelas de pago** — integración Stripe + PayPal
- [ ] **Inventario** — seguimiento de stock, alertas de stock bajo
- [ ] **Descuentos y cupones** — cupones de porcentaje y monto fijo
- [ ] **Reseñas de productos** — reseñas autenticadas con calificación
- [ ] **Emails de pedidos** — confirmación y actualización de estado por email

---

## License / Licencia

GPL-3.0 © 2026 Johan Montes

## Estadísticas de visitas
![Visitas](https://komarev.com/ghpvc/?username=johan&color=green&style=flat-square&label=VISITANTES)
![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fjohan%2Ftu-repo&count_bg=%23FFD700&title_bg=%23FF0000&icon=&icon_color=%23E7E7E7&title=HITS&edge_flat=true)

