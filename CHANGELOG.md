# Changelog — RustCMS / RustPress

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

Todos los cambios notables de este proyecto están documentados aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased] / [Sin publicar]

### Planned / Planeado
- Pending user approval UI in admin panel
- Rich text editor (WYSIWYG)
- SEO metadata per post
- OpenAPI / Swagger documentation

---

## [0.2.0] — 2026-03-18

### Added / Agregado

#### Backend
- **Menus system** — Full CRUD for navigation menus (`/api/v1/menus`)
- **Menu items** — Nested items per menu with `label`, `url`, `target`, `icon`, `order_index` (`/api/v1/menu-items/:menu_id`)
- **Auth routes** — `/auth/forgot-password` and `/auth/reset-password` with token-based flow
- **User registration** — `/auth/register` endpoint with validation (username min 3, password min 8)
- **Password reset tokens** — Stored in `password_reset_tokens` table with expiry
- **Email service** — Lettre SMTP integration with MailHog support for development

#### Frontend
- **MenusAdmin component** — Full admin UI for managing menus and their items, with `target` (`_self`/`_blank`) and `icon` fields
- **menus.ts API client** — Typed client matching backend routes exactly
- **Register page** (`/register`) — Public registration form with success state showing pending approval message
- **ForgotPassword page** (`/forgot-password`) — Email form with success confirmation
- **ResetPassword page** (`/reset-password?token=...`) — New password form with token validation
- **Login page updated** — Added "Forgot password?" and "Don't have an account? Register" links
- **Login success banner** — Green confirmation message when arriving from `/login?reset=ok`
- **auth.ts updated** — Added `forgotPassword` and `resetPassword` methods

### Fixed / Corregido

#### Backend
- `handlers::menus::configure` was registered outside the `/api/v1` scope in `main.rs` — moved inside, fixing 404 on all menu endpoints
- `AuthUserWithRole::from_request` changed from sync closure to `Pin<Box<dyn Future>>` to allow `.await` inside, fixing `E0728` compile error
- Duplicate `use validator::Validate` in `users.rs` causing `E0252` compile error — removed duplicate import and validate call
- `auth.0.sub` field access on `AuthUserWithRole` in `posts.rs` — changed to `auth.user_id` matching the struct definition
- `.fetch_optional(&pool)` in `auth.rs` — changed to `.fetch_optional(pool.get_ref()).await` fixing `E0277` trait bound error

#### Frontend
- `import authApi from '../api/auth'` in Login.tsx — changed to named import `{ authApi }` since there is no default export
- `MenusAdmin.tsx` import path `../../api/menus` — `menus.ts` file was missing, created and placed at `./frontend/src/api/menus.ts`
- `createItem` API call signature — corrected to pass `menuId` as path parameter, not query string

---

## [0.1.0] — 2026-03-07

### Added / Agregado

#### Backend
- Initial Rust + Actix-Web 4 project setup
- PostgreSQL integration with SQLx and automatic migrations on startup
- JWT authentication with Argon2 password hashing
- `AuthUser` and `AuthUserWithRole` middleware extractors
- Role-based permissions system with JSON `permissions` field
- **Posts** — Full CRUD with status (`draft`/`published`), slug, excerpt, post type, and stats endpoint
- **Media** — File upload and management with `/uploads` static file serving
- **Users** — Admin-only user creation and management
- **Sliders** — Home page slider CRUD with `order_index` and `is_active` toggle
- **Plugins** — Plugin registry with `before_post_save` hook
- CORS configuration with allowed origins from environment
- Request compression middleware
- Structured logging with `tracing` + `tracing-actix-web`
- Docker Compose setup for PostgreSQL and MailHog
- Health check endpoint (`GET /health`)

#### Frontend
- React 18 + TypeScript + Vite project setup
- Tailwind CSS dark theme (`#0a0a0f` base, `#7c6aff` accent)
- **Login page** — JWT authentication with token stored in localStorage
- **Dashboard** — Side navigation with Home, Posts, Media, Users, Plugins views
- **Stats component** — Cards showing total posts, published, drafts, media files + recent posts list
- **Posts admin** — List, create, edit, delete posts with status badges
- **NewPost / EditPost** — Full post editor with title, slug (auto-generated), content, excerpt, status
- **Blog frontend** — Public blog at `/blog` with post list and individual post view (`/blog/:slug`)
- **SlidersAdmin** — Drag-handle list, image preview, create/edit/delete sliders
- Zustand auth store for global session state
- Axios client with JWT interceptor (auto-attach token, redirect to `/login` on 401)
- React Router v6 with `PrivateRoute` wrapper
- API clients: `auth.ts`, `posts.ts`, `media.ts`, `sliders.ts`, `plugins.ts`

---

*Formato: `[versión] — fecha` · Secciones: Added, Changed, Fixed, Removed*
*Format: `[version] — date` · Sections: Added, Changed, Fixed, Removed*
