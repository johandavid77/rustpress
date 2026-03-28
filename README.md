<div align="center">

# 🦀 RustPress CMS

**A fast, modern, full-stack CMS built with Rust + React**

[![Rust](https://img.shields.io/badge/Rust-1.94-orange?logo=rust)](https://www.rust-lang.org/)
[![Actix Web](https://img.shields.io/badge/Actix--Web-4-red)](https://actix.rs/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

[English](#english) · [Español](#español)

</div>

---

## English

### What is RustPress?

RustPress is a headless CMS (Content Management System) with a built-in admin dashboard, built entirely with Rust on the backend and React + TypeScript on the frontend. It is designed to be a fast, lightweight, self-hosted alternative to WordPress — with a modern developer experience.

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
| Rate limiting | **actix-governor 0.7** | 60 req/min por IP, protección contra abuso | | HTTP server, routing, middleware |
| Database ORM | **SQLx** | Async SQL queries with compile-time checking |
| Database | **PostgreSQL 16** | Primary data store |
| Migrations | **SQLx migrate** | Version-controlled schema migrations |
| Auth | **JWT (jsonwebtoken)** | Stateless authentication tokens |
| Password hashing | **bcrypt** | Secure password storage |
| Email | **Lettre + SMTP** | Password reset emails |
| Frontend language | **TypeScript 5** | Type-safe React development |
| UI framework | **React 18** | Component-based UI |
| Styling | **Tailwind CSS** | Utility-first CSS |
| State management | **Zustand** | Lightweight global state |
| HTTP client | **Axios** | API communication with JWT interceptor |
| Routing | **React Router v6** | Client-side navigation |
| i18n | **i18next + react-i18next** | Bilingual support (ES/EN) |
| Image processing | **image 0.25** | Resize & optimize JPEG/PNG/WebP on upload |
| Build tool | **Vite** | Fast frontend bundler |
| Dev email | **MailHog** | Local SMTP server for testing emails |
| Containerization | **Docker / Podman Compose** | Local development environment |

### Features

- ✅ **Authentication** — JWT login, public register (with admin approval), password reset via email
- ✅ **Posts** — Create, edit, publish/draft blog posts with slug management
- ✅ **Media library** — Drag & drop upload, image gallery, file type filters, copy URL, delete
- ✅ **Users** — Role-based access control, pending user approval, activate/deactivate
- ✅ **Sliders** — Home page slider/carousel management with image preview
- ✅ **Menus** — Navigation menu builder with items (label, URL, target, icon, order)
- ✅ **Plugin system** — Extensible architecture for adding functionality
- ✅ **Stats dashboard** — Post counts, recent activity overview
- ✅ **Public blog** — SEO-friendly blog frontend
- ✅ **i18n** — Full bilingual UI (Spanish + English), auto-detects browser language
- ✅ **Preview button** — Open public site from admin panel in one click
- ✅ **Theme system** — 4 built-in themes (Dark, Minimal, Bold, Magazine), switchable from admin
- ✅ **Comments** — Authenticated comments with admin moderation (approve/delete)
- ✅ **Settings** — Persistent key-value settings stored in DB (active theme, etc.)

### Project Structure
```
rustpress/
├── backend/                    # Rust Actix-Web API
│   └── src/
│       ├── handlers/           # Route handlers
│       │   ├── auth.rs         # Auth endpoints
│       │   ├── posts.rs        # Posts CRUD
│       │   ├── media.rs        # Media upload
│       │   ├── menus.rs        # Menus admin
│       │   ├── sliders.rs      # Sliders admin
│       │   ├── users.rs        # Users admin
│       │   ├── comments.rs     # Comments + moderation
│       │   └── settings.rs     # App settings (themes, etc.)
│       ├── middleware/         # JWT auth middleware (AuthUser, AuthUserWithRole)
│       ├── models/             # Database models & DTOs
│       ├── services/           # Business logic (auth, email, media)
│       ├── plugins/            # Plugin registry system
│       ├── errors.rs           # Centralized error handling
│       ├── config.rs           # Environment config
│       └── main.rs             # App entry point & route registration
│   └── migrations/             # SQL migration files
├── frontend/                   # React + TypeScript SPA
│   └── src/
│       ├── api/                # API client modules
│       ├── components/         # Shared components
│       │   └── Comments/       # Reusable comments component (4 themes)
│       ├── locales/            # i18n translation files (es/, en/)
│       ├── pages/              # Page components
│       │   ├── Blog/           # Public blog (BlogIndex, BlogPost)
│       │   ├── Media/          # Media library admin
│       │   ├── Posts/          # Post management (NewPost, EditPost)
│       │   ├── Plugins/        # Sliders, Menus & Comments admin
│       │   └── Users/          # User management & approval
│       ├── themes/             # Theme system
│       │   ├── dark/           # Dark theme (BlogIndex, BlogPost)
│       │   ├── minimal/        # Minimal theme
│       │   ├── bold/           # Bold theme
│       │   ├── magazine/       # Magazine theme
│       │   └── ThemeLoader.tsx # Dynamic theme loader
│       ├── store/              # Zustand global state
│       ├── types/              # TypeScript type definitions
│       ├── i18n.ts             # i18next configuration
│       └── App.tsx             # Router
├── docker-compose.yml          # PostgreSQL + MailHog services
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

#### 2. Start services (PostgreSQL + MailHog)
```bash
docker compose up -d
# or with Podman:
podman-compose up -d
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
UPDATE users SET role_id = '<admin-role-id>' WHERE email = 'your@email.com';
-- Get the admin role id with:
SELECT id FROM roles WHERE name = 'admin';
```

### API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/v1/auth/register` | ❌ |
| POST | `/api/v1/auth/login` | ❌ |
| POST | `/api/v1/auth/forgot-password` | ❌ |
| POST | `/api/v1/auth/reset-password` | ❌ |
| GET | `/api/v1/auth/me` | ✅ |
| GET/POST | `/api/v1/posts` | ❌/✅ |
| PUT/DELETE | `/api/v1/posts/:id` | ✅ |
| GET | `/api/v1/posts/stats` | ✅ |
| GET | `/api/v1/posts/slug/:slug` | ❌ |
| GET | `/api/v1/media` | ✅ |
| POST | `/api/v1/media/upload` | ✅ |
| DELETE | `/api/v1/media/:id` | ✅ |
| GET/POST | `/api/v1/menus` | ❌/✅ |
| PUT/DELETE | `/api/v1/menus/:id` | ✅ |
| GET/POST | `/api/v1/menu-items/:menu_id` | ❌/✅ |
| GET/POST | `/api/v1/sliders` | ❌/✅ |
| GET/PUT/DELETE | `/api/v1/users/:id` | ✅ |
| GET | `/api/v1/posts/:post_id/comments` | ❌ |
| POST | `/api/v1/posts/:post_id/comments` | ✅ |
| PUT | `/api/v1/comments/:id/approve` | ✅ |
| DELETE | `/api/v1/comments/:id` | ✅ |
| GET | `/api/v1/comments/all` | ✅ |
| GET | `/api/v1/settings/active-theme` | ❌ |
| PUT | `/api/v1/settings/active-theme` | ✅ |
| GET | `/health` | ❌ |

### Roadmap

- [x] Rich text editor (TipTap)
- [x] Theme system (Dark, Minimal, Bold, Magazine)
- [x] Comments with moderation
- [x] Persistent settings (DB)
- [x] **Image optimization** — Auto-resize a 1920px y compresión al subir media (JPEG 85%, PNG, WebP)
- [ ] Multi-language content (per-post language)
- [x] **API rate limiting** — 60 req/min por IP con actix-governor
- [ ] Docker production setup
- [x] **CI/CD pipeline** — GitHub Actions para backend (Rust + PostgreSQL) y frontend (TypeScript)
- [ ] SEO meta tags per post
- [ ] RSS feed

---

## Español

### ¿Qué es RustPress?

RustPress es un CMS headless con panel de administración integrado, construido con Rust en el backend y React + TypeScript en el frontend. Es una alternativa moderna, rápida y auto-hospedada a WordPress.

### Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Lenguaje backend | **Rust 1.94** | Rápido, seguro, compilado |
| Framework web | **Actix-Web 4** | Servidor HTTP, rutas, middleware |
| ORM | **SQLx** | Consultas SQL async verificadas en compilación |
| Base de datos | **PostgreSQL 16** | Almacén principal |
| Auth | **JWT** | Tokens sin estado |
| Email | **Lettre + SMTP** | Recuperación de contraseña |
| Frontend | **React 18 + TypeScript** | UI basada en componentes |
| Estilos | **Tailwind CSS** | Utilidades CSS |
| Estado | **Zustand** | Estado global ligero |
| i18n | **i18next + react-i18next** | Bilingüe ES/EN, extensible |
| Procesamiento de imágenes | **image 0.25** | Resize y optimización JPEG/PNG/WebP al subir |
| Build | **Vite** | Bundler rápido |
| Email dev | **MailHog** | SMTP local para pruebas |
| Contenedores | **Docker / Podman Compose** | Entorno de desarrollo |

### Funcionalidades

- ✅ **Autenticación** — Login JWT, registro público con aprobación, reset de contraseña por email
- ✅ **Posts** — CRUD con slugs, borradores y publicados
- ✅ **Media** — Subida drag & drop, galería, filtros por tipo, copiar URL
- ✅ **Usuarios** — Roles, aprobación de pendientes, activar/desactivar
- ✅ **Sliders** — Carrusel de la página principal
- ✅ **Menús** — Constructor de menús de navegación
- ✅ **Sistema de plugins** — Arquitectura extensible
- ✅ **Dashboard de stats** — Resumen de actividad
- ✅ **Blog público** — Frontend amigable con SEO
- ✅ **i18n** — UI bilingüe (ES/EN), detecta idioma del navegador
- ✅ **Botón Preview** — Abre el sitio público desde el admin
- ✅ **Sistema de themes** — 4 themes incluidos (Dark, Minimal, Bold, Magazine), cambiable desde el admin
- ✅ **Comentarios** — Comentarios autenticados con moderación admin (aprobar/eliminar)
- ✅ **Settings** — Configuración persistente en DB (theme activo, etc.)

### Instalación Rápida
```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
podman-compose up -d          # PostgreSQL + MailHog
cd backend && sqlx migrate run # Migraciones
cargo run                      # Backend en :8080
cd ../frontend && npm install && npm run dev  # Frontend en :5173
```

---

## License / Licencia

GPL-3.0 © 2026 Johan Montes
