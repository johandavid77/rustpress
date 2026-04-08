# RustPress CMS

> CMS moderno construido con Rust (Actix-Web) + React (TypeScript) + PostgreSQL.
> Inspirado en WordPress pero mas rapido, mas seguro y extensible por diseno.

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Backend | Rust - Actix-Web 4 - SQLx - JWT - bcrypt |
| Frontend | React 18 - TypeScript - Vite - Tailwind CSS |
| Base de datos | PostgreSQL 16 |
| Cache | Redis |
| Infra | Docker - Nginx - pgAdmin |

---

## Inicio rapido

    git clone https://github.com/johandavid77/rustpress.git
    cd rustpress
    docker compose up -d db redis
    cd backend && cargo run
    cd frontend && npm install && npm run dev

Acceder en: http://localhost:5173

---

## Credenciales por defecto

| Rol | Email | Password |
|-----|-------|----------|
| Admin | johan@rustcms.dev | admin123 |
| Editor | editor@rustcms.dev | editor123 |

Cambiar antes de ir a produccion.

---

## Estructura

    rustpress/
    +-- backend/src/
    |   +-- main.rs
    |   +-- handlers/
    |       +-- auth.rs, posts.rs, media.rs, users.rs
    |       +-- plugins.rs, products_shop.rs
    |       +-- backup.rs, updates.rs
    +-- frontend/src/
    |   +-- pages/public/       Shop, Blog, ProductDetail
    |   +-- pages/Admin/        Dashboard, Users
    |   +-- pages/Shop/         Products CRUD, Orders
    |   +-- pages/Plugins/      SlidersAdmin, BackupAdmin, UpdatesAdmin
    |   +-- plugins/pluginRegistry.ts
    |   +-- api/
    +-- docker-compose.yml
    +-- nginx.conf

---

## Sistema de Plugins

Para agregar un nuevo plugin:

1. Crear componente en frontend/src/pages/Plugins/MiPlugin.tsx
2. Registrar en pluginRegistry.ts con lazy import
3. Insertar en DB con config JSON (title, icon, color, category)
4. Aparece automaticamente con toggle activo/inactivo

### Plugins activos

| Plugin | Categoria | Estado |
|--------|-----------|--------|
| Sliders | Contenido | Activo |
| Menus | Contenido | Activo |
| Comentarios | Contenido | Activo |
| Categorias | Contenido | Activo |
| Webhooks | Integraciones | Activo |
| Healthcheck | Sistema | Activo |
| Ecommerce | Ecommerce | Activo |
| Backup y Restore | Sistema | Funcional |
| Actualizaciones | Sistema | Funcional |

---

## API Endpoints — Base: /api/v1

### Auth
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /auth/login | Login -> JWT |
| POST | /auth/register | Registro |
| GET | /auth/me | Perfil actual |

### Posts
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /posts | Listar |
| POST | /posts | Crear |
| PUT | /posts/:id | Editar |
| DELETE | /posts/:id | Eliminar |

### Shop publico
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /shop/categories | Categorias |
| GET | /shop/products | Productos con filtros |
| GET | /shop/products/slug/:slug | Detalle por slug |
| GET | /shop/products/:id | Detalle por ID |

### Productos admin
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /products | Listar |
| POST | /products | Crear |
| PUT | /products/:id | Editar |
| DELETE | /products/:id | Eliminar |

### Plugins
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /plugins | Listar |
| POST | /plugins/:id/enable | Activar |
| POST | /plugins/:id/disable | Desactivar |
| DELETE | /plugins/:id | Eliminar |

### Backup
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /backup/list | Listar backups |
| POST | /backup/create | Crear (pg_dump) |
| GET | /backup/download/:filename | Descargar .sql |
| POST | /backup/restore | Restaurar multipart |
| DELETE | /backup/:filename | Eliminar |

### Actualizaciones
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /updates/status | Estado vs GitHub main |
| GET | /updates/changelog | Ultimos 10 commits |
| POST | /updates/apply | git pull + cargo build |

### Media
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /media/upload | Subir archivo |
| GET | /media | Listar |
| DELETE | /media/:id | Eliminar |

---

## Tests

    cd backend
    cargo test
    cargo test coupon
    cargo test -- --nocapture

32 tests — 0 failed

| Modulo | Tests | Que cubren |
|--------|-------|------------|
| coupon_tests | 6 | Descuentos, negativos |
| payments_tests | 6 | HMAC-SHA256, payload |
| reviews_tests | 7 | Gateways, PaymentStatus |
| auth_service | 7 | JWT, bcrypt, tokens |
| email_service | 6 | Plantillas, validacion |

---

## Roadmap

### Alta prioridad
- Dashboard Overview real (ventas, posts, stock bajo, visitas)
- SEO: meta tags, Open Graph, sitemap.xml, robots.txt
- Pasarela de pagos: Wompi Colombia + Stripe
- Plugin Analytics propio sin Google

### Media prioridad
- ProductEditor: subida de imagenes real, variantes, categorias
- Reviews y ratings (tabla y endpoint existen, falta UI)
- Editor Markdown con preview en tiempo real
- Media: drag and drop, redimensionado automatico
- Busqueda global en el admin
- Notificaciones tiempo real SSE/WebSocket para pedidos nuevos

### Plugins nuevos
- Formularios de contacto con constructor y email
- Newsletter: suscriptores y envio masivo
- Cache de respuestas con Redis middleware
- Redirecciones 301/302 desde el admin

### Infraestructura
- CI/CD con GitHub Actions
- .env.example completo
- SSL listo para produccion

---

## Bugs conocidos

- Actix-Web: muchas rutas en cadena pueden causar recursion en compilacion. Usar .configure() por modulo.
- Tooltips en Brave: el atributo title tiene delay. Pendiente CSS group-hover.
- JWT no se refresca automaticamente. Hacer logout/login al expirar.

---

## Variables de entorno

    DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=cambiar_en_produccion
    BACKUP_DIR=./backups
    PORT=8080

---

## Licencia

MIT
