# Changelog — RustPress CMS

All notable changes to this project will be documented in this file.
Todos los cambios notables de este proyecto se documentarán en este archivo.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] / [Sin publicar]

### Planned / Planificado
- Rich text editor / Editor de texto enriquecido (TipTap)
- Image optimization on upload / Optimización de imágenes al subir
- Production Docker setup / Setup de Docker para producción
- CI/CD pipeline
- SEO meta tags per post
- RSS feed

---

## [0.3.0] — 2026-03-19

### Added / Agregado

#### Frontend
- **Media section** — full media library with drag & drop upload, image gallery preview, file type filters (All, Images, Video, Audio, Docs), detail panel with copy URL, pagination, and delete
- **`media.ts` API client** — list, upload (multipart), delete with helpers `formatBytes` and `isImage`
- **i18n / Internationalization** — full bilingual support (Spanish + English) using `i18next` + `react-i18next` + `i18next-browser-languagedetector`
  - Auto-detects browser language
  - Manual selector in admin sidebar with flag buttons (🇪🇸 ES / 🇺🇸 EN)
  - Persists preference in `localStorage`
  - Covers: auth, nav, dashboard, posts, users, menus, sliders, blog, media
  - Architecture ready for adding new languages (FR, PT, etc.)
- **Translation files** — `src/locales/es/translation.json` and `src/locales/en/translation.json`
- **`LanguageSelector` component** — compact flag selector shown in admin sidebar
- **Admin top header** — fixed header bar showing current section name + "Preview site" button
- **"Preview site" button** — opens public blog in new tab directly from admin panel
- **Users admin section** (`UsersAdmin`) — manage pending and active users with approve/deactivate/delete actions
- **`users.ts` API client** — getAll, approve, deactivate, delete
- Role assignment fix — admin role correctly assigned via DB update to enable `users:write` permission

#### Backend fixes
- Fixed `handlers::menus::configure` outside `/api/v1` scope (was causing 404)
- Fixed `AuthUserWithRole` FromRequest using `Pin<Box<dyn Future>>` for async DB queries
- Fixed duplicate `use validator::Validate` in `users.rs`
- Fixed `auth.0.user_id` field reference in `posts.rs`
- Fixed `.fetch_optional + .await` chain in `auth.rs` middleware

---

## [0.2.0] — 2026-03-18

### Added / Agregado

#### Backend
- Navigation menus system (`/api/v1/menus`, `/api/v1/menu-items`) with full CRUD
- Menu items support `label`, `url`, `target`, `icon`, `order_index`, `is_active`, `parent_id`

#### Frontend
- `MenusAdmin` component — full menu management UI
- `menus.ts` API client
- `Register.tsx` — public registration page with validation
- `ForgotPassword.tsx` — password recovery request page
- `ResetPassword.tsx` — password reset with token from URL
- Updated `Login.tsx` — links to register and forgot password
- Updated `auth.ts` API — `forgotPassword` and `resetPassword`
- Updated `App.tsx` router — `/register`, `/forgot-password`, `/reset-password`
- Plugins section shows both `SlidersAdmin` and `MenusAdmin`

---

## [0.1.0] — 2026-03-07

### Added / Agregado

#### Backend (Rust + Actix-Web)
- Initial project setup with Actix-Web 4
- PostgreSQL integration via SQLx with async queries
- JWT authentication system (login, register, token validation)
- Password hashing with bcrypt
- Role-based access control middleware (`AuthUser`, `AuthUserWithRole`)
- Posts CRUD with slug, status (draft/published), excerpt, meta
- Post statistics endpoint (`/posts/stats`)
- Media upload and management system
- Users management with role assignment
- Sliders CRUD for home page carousel
- Plugin registry system
- Email service using Lettre + SMTP (MailHog for dev)
- Password reset flow with token + email
- Centralized error handling (`AppError`)
- Environment-based configuration (`AppConfig`)
- Database migrations with SQLx migrate
- Health check endpoint (`/health`)
- CORS configuration
- Request compression middleware
- Tracing/logging

#### Frontend (React + TypeScript)
- Vite + TypeScript setup
- React Router v6
- Zustand auth state
- Axios API client with JWT interceptor
- Login, Dashboard, Stats, PostsView, NewPost, EditPost
- SlidersAdmin, BlogIndex, BlogPost
- API clients: auth, posts, sliders, media, client

#### Infrastructure
- `docker-compose.yml` with PostgreSQL 16 and MailHog
- `.env.example`
- `.gitignore`
