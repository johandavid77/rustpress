# 🦀 RustCMS

CMS headless construido con Rust + React. Rápido, seguro y minimalista.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Rust + Actix-web 4 |
| Base de datos | PostgreSQL 16 |
| ORM | SQLx |
| Auth | JWT + bcrypt |
| Frontend | React 18 + TypeScript + Vite |
| Estado | Zustand |
| Estilos | Tailwind CSS |
| Editor | TipTap |
| Infra dev | Podman + podman-compose |

## Requisitos

- Rust 1.70+
- Node 18+
- Podman o Docker

## Inicio rápido
```bash
# 1. Levantar PostgreSQL
podman-compose up -d

# 2. Backend
cd backend
cp .env.example .env        # ajusta las variables
sqlx migrate run
cargo run

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

## URLs

| Servicio | URL |
|---------|-----|
| Blog público | http://localhost:5173/blog |
| Admin | http://localhost:5173/admin |
| API | http://localhost:8080/api/v1 |
| pgAdmin | http://localhost:5050 |

## Estructura
```
rustpress/
├── backend/
│   ├── src/
│   │   ├── handlers/     # auth, posts, media, users, plugins
│   │   ├── models/       # structs de BD
│   │   ├── services/     # lógica de negocio
│   │   ├── middleware/   # JWT auth
│   │   └── plugins/      # sistema de plugins
│   └── migrations/
└── frontend/
    └── src/
        ├── pages/        # Blog, Dashboard, Posts, Login
        ├── components/   # RichEditor (TipTap)
        ├── api/          # clientes HTTP
        └── store/        # Zustand auth store
```

## API
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me

GET    /api/v1/posts
POST   /api/v1/posts
GET    /api/v1/posts/stats
GET    /api/v1/posts/slug/:slug
GET    /api/v1/posts/:id
PUT    /api/v1/posts/:id
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/publish
POST   /api/v1/posts/:id/unpublish

POST   /api/v1/media/upload
GET    /api/v1/media
DELETE /api/v1/media/:id
```

## Variables de entorno
```env
HOST=0.0.0.0
PORT=8080
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
JWT_SECRET=cambia_esto_en_produccion
JWT_EXPIRY_HOURS=24
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=20
```
# rustpress
# rustpress
# rustpress
# rustpress
# rustpress
