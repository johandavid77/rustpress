# RustCMS — CMS de alto rendimiento construido con Rust

> Panel de administración completo con backend en Rust (Actix-web + SQLx) y frontend en React + TypeScript.

---

## 🏗️ Arquitectura del Proyecto

```
rustpress/
├── backend/          # API REST en Rust
│   ├── src/
│   │   ├── handlers/     # Controladores HTTP
│   │   ├── models/       # Structs y DTOs
│   │   ├── middleware/   # Auth JWT, rate limiting
│   │   ├── errors/       # Manejo de errores centralizado
│   │   └── main.rs       # Entry point y configuración de rutas
│   ├── migrations/       # Migraciones SQL (SQLx)
│   └── Cargo.toml
└── frontend/         # SPA en React
    ├── src/
    │   ├── api/          # Clientes de API (axios)
    │   ├── components/   # Componentes reutilizables
    │   ├── pages/        # Vistas del admin y público
    │   ├── store/        # Estado global (Zustand)
    │   └── types/        # TypeScript interfaces
    └── vite.config.ts
```

---

## 🦀 Backend — Stack Técnico

| Componente | Librería / Versión |
|------------|-------------------|
| Framework web | `actix-web 4` |
| Base de datos | `PostgreSQL` vía `sqlx 0.7` |
| Caché / Sesiones | `Redis` vía `redis 0.25` |
| Autenticación | JWT (`jsonwebtoken`) + bcrypt (`bcrypt`) |
| Rate limiting | `actix-governor` |
| Migraciones | `sqlx migrate` |
| Serialización | `serde / serde_json` |
| UUIDs | `uuid 1` |
| Email | `lettre` (SMTP) |
| Slugify | función interna custom |

### ⚠️ Nota importante sobre routing en actix-web 4

Actix-web tiene un **límite silencioso de rutas encadenadas** dentro de un `web::scope`. Si se registran demasiados `.configure()` en el mismo scope, las rutas al final de la cadena son ignoradas sin error. La solución es registrar rutas críticas **al inicio** del scope `/api/v1`, antes de los demás `.configure()`.

---

## ⚛️ Frontend — Stack Técnico

| Componente | Librería |
|------------|----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| Estado global | Zustand |
| HTTP client | Axios |
| Editor de texto | TipTap |
| Iconos | Lucide React |
| i18n | i18next |
| CSS | Tailwind CSS |

---

## 🗄️ Base de Datos — Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `users` | Usuarios con `role_id` FK a `roles` |
| `roles` | Roles con `permissions` (array JSON) |
| `posts` | Posts del blog con revisiones |
| `post_revisions` | Historial de versiones de posts |
| `media` | Archivos multimedia subidos |
| `sliders` | Slides del carrusel de la home |
| `menus` | Menús de navegación |
| `categories` | Categorías de posts y blog |
| `products` | Productos de la tienda |
| `product_categories` | Categorías de productos |
| `orders` | Órdenes de compra |
| `carts` | Carritos de compra |
| `reviews` | Reseñas de productos |
| `bookings` | Reservas/citas |
| `comments` | Comentarios de posts |
| `analytics_events` | Eventos de analítica |
| `api_keys` | Claves de API para integraciones |
| `webhooks` | Webhooks configurados |
| `plugins` | Registro de plugins |
| `password_reset_tokens` | Tokens de recuperación de contraseña |

---

## 🔌 Endpoints de la API

### Base URL
```
http://localhost:8080/api/v1
```

### 🔐 Autenticación (`/auth`)
```
POST   /auth/login              # Login → devuelve JWT token + user
POST   /auth/register           # Registro de usuario
GET    /auth/me                 # Perfil del usuario autenticado
POST   /auth/forgot-password    # Solicitar reset de contraseña
POST   /auth/reset-password     # Resetear contraseña con token
```

### 📝 Posts (`/posts`)
```
GET    /posts                   # Listar posts (paginado)
POST   /posts                   # Crear post
GET    /posts/:id               # Obtener post por ID
PUT    /posts/:id               # Actualizar post
DELETE /posts/:id               # Eliminar post
GET    /posts/:id/revisions     # Historial de revisiones
POST   /posts/preview           # Preview de post
```

### 🛒 Shop — Productos (`/shop`) ✅ NUEVO
```
GET    /shop/products           # Listar productos (paginado, filtros)
GET    /shop/products/:id       # Obtener producto por ID
POST   /shop/products           # Crear producto [AUTH]
PUT    /shop/products/:id       # Actualizar producto [AUTH] (pendiente)
DELETE /shop/products/:id       # Eliminar producto [AUTH] (pendiente)
GET    /shop/categories         # Listar categorías de productos
POST   /shop/categories         # Crear categoría [AUTH]
PUT    /shop/categories/:id     # Actualizar categoría [AUTH] (pendiente)
DELETE /shop/categories/:id     # Eliminar categoría [AUTH] (pendiente)
```

### 🎨 Sliders (`/sliders`)
```
GET    /sliders                 # Listar sliders activos
POST   /sliders                 # Crear slider [AUTH]
PUT    /sliders/:id             # Actualizar slider [AUTH]
DELETE /sliders/:id             # Eliminar slider [AUTH]
POST   /sliders/reorder         # Reordenar sliders [AUTH]
```

### 👥 Usuarios (`/users`)
```
GET    /users                   # Listar usuarios [AUTH]
GET    /users/:id               # Obtener usuario
PUT    /users/:id               # Actualizar usuario [AUTH]
DELETE /users/:id               # Eliminar usuario [AUTH]
```

### 🎭 Roles (`/roles`)
```
GET    /roles                   # Listar roles [AUTH]
POST   /roles                   # Crear rol [AUTH]
PUT    /roles/:id               # Actualizar rol [AUTH]
DELETE /roles/:id               # Eliminar rol [AUTH]
```

### 🖼️ Media (`/media`)
```
POST   /media/upload            # Subir archivo [AUTH]
GET    /media                   # Listar archivos [AUTH]
DELETE /media/:id               # Eliminar archivo [AUTH]
```

### 📂 Categorías (`/categories`)
```
GET    /categories              # Listar categorías
POST   /categories              # Crear categoría [AUTH]
DELETE /categories/:id          # Eliminar categoría [AUTH]
GET    /categories/:slug/posts  # Posts de una categoría
```

### 🔗 Menús (`/menus`)
```
GET    /menus                   # Listar menús
POST   /menus                   # Crear menú [AUTH]
PUT    /menus/:id               # Actualizar menú [AUTH]
DELETE /menus/:id               # Eliminar menú [AUTH]
```

### 💬 Comentarios (`/comments`)
```
GET    /comments                # Listar comentarios [AUTH]
POST   /comments                # Crear comentario
DELETE /comments/:id            # Eliminar comentario [AUTH]
```

### ⚙️ Configuración
```
GET    /settings                # Obtener configuración del sitio
PUT    /settings                # Actualizar configuración [AUTH]
GET    /plugins                 # Listar plugins
GET    /webhooks                # Listar webhooks [AUTH]
POST   /webhooks                # Crear webhook [AUTH]
GET    /api-keys                # Listar API keys [AUTH]
POST   /api-keys                # Crear API key [AUTH]
```

### 📊 Analítica
```
GET    /analytics               # Datos de analítica [AUTH]
POST   /analytics/event         # Registrar evento
```

### 🛍️ Órdenes y Carrito
```
GET    /orders                  # Listar órdenes [AUTH]
GET    /cart                    # Ver carrito
POST   /cart                    # Agregar al carrito
DELETE /cart/:id                # Remover del carrito
```

### 🔧 Sistema
```
GET    /health                  # Health check
GET    /health/detailed         # Health check detallado (DB, Redis)
```

---

## 🚀 Cómo ejecutar el proyecto

### Requisitos previos
- Rust 1.94+
- PostgreSQL 14+
- Redis
- Node.js 18+
- Podman o Docker

### Backend

```bash
# 1. Levantar servicios
podman start <postgres-container>
podman start <redis-container>

# 2. Variables de entorno (backend/.env)
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=tu_secreto_jwt
FRONTEND_URL=http://localhost:5173

# 3. Ejecutar migraciones
cd backend
sqlx migrate run

# 4. Compilar y ejecutar
cargo build
./target/debug/rustcms

# O en modo desarrollo
cargo run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Usuario admin por defecto
```
Email:    johan@rustcms.dev
Password: admin123
```

> ⚠️ El hash bcrypt se genera con `python3 -c "import bcrypt; print(bcrypt.hashpw(b'admin123', bcrypt.gensalt(12)).decode())"` y se inserta directamente en la DB si es necesario resetear la contraseña.

---

## 🏠 Rutas del Frontend (Admin)

El dashboard usa un sistema de vistas con estado (no React Router para subrutas), donde el sidebar cambia el `view` activo:

| View | Componente | Descripción |
|------|-----------|-------------|
| `home` | Dashboard Overview | Resumen general |
| `posts` | PostsView | CRUD de posts del blog |
| `media` | MediaAdmin | Gestión de archivos |
| `users` | UsersAdmin | Gestión de usuarios |
| `themes` | ThemesAdmin | Selector de tema visual |
| `plugins` | PluginsHome | Hub de plugins |
| `sliders` | SlidersAdmin | Gestión de slides |
| `menus` | MenusAdmin | Gestión de menús |
| `comments` | CommentsAdmin | Moderación de comentarios |
| `categories` | CategoriesAdmin | Categorías del blog |
| `webhooks` / `health` | WebhooksAdmin | Webhooks y health |
| `shop-products` | Products | Productos de la tienda |
| `shop-orders` | Orders | Órdenes |
| `shop-reviews` | Reviews | Reseñas |
| `shop-coupons` | Coupons | Cupones |
| `shop-inventory` | Inventory | Inventario |
| `analytics` | Analytics | Analítica |

### Rutas públicas
```
/              → Blog home
/blog          → Lista de posts
/blog/:slug    → Post individual
/shop          → Tienda pública
/shop/:slug    → Detalle de producto
/cart          → Carrito
/checkout      → Checkout
/bookings      → Reservas
/login         → Login admin
/register      → Registro
```

---

## 🔧 Configuración del Proxy (Vite)

El frontend usa un proxy en `vite.config.ts` que redirige:
- `/api/*` → `http://localhost:8080` (el prefijo `/v1` está en el baseURL del cliente axios)
- `/uploads/*` → `http://localhost:8080`

El cliente axios tiene `baseURL = '/api/v1'`, por lo que todas las llamadas como `/sliders` resultan en `http://localhost:8080/api/v1/sliders`.

---

## 🔐 Sistema de Autenticación

- JWT almacenado en `localStorage` con key `access_token`
- El `authStore` (Zustand) gestiona el estado del usuario en memoria
- El interceptor de axios agrega automáticamente `Authorization: Bearer <token>` en cada request
- En caso de 401, el interceptor limpia el token y redirige a `/login`
- Los roles tienen `permissions` como array JSON (ej: `["posts:read", "posts:write", "users:read"]`)

---

## ✅ Funcionalidades implementadas

### Backend
- [x] Autenticación JWT con bcrypt
- [x] Sistema de roles y permisos granulares
- [x] CRUD completo de posts con revisiones
- [x] Upload de media (imágenes)
- [x] Gestión de sliders
- [x] Gestión de menús
- [x] Categorías (blog y productos)
- [x] Comentarios
- [x] Webhooks
- [x] API Keys
- [x] Rate limiting con Governor + Redis
- [x] Analítica básica de eventos
- [x] Health check con estado de DB y Redis
- [x] Migraciones automáticas con SQLx
- [x] **Shop: listado y creación de productos** ✅ NUEVO
- [x] **Shop: listado y creación de categorías de productos** ✅ NUEVO
- [x] Reset de contraseña por email
- [x] Plugins básicos
- [x] Órdenes y carrito (estructura base)
- [x] Reseñas de productos (estructura base)
- [x] Bookings / Reservas (estructura base)
- [x] Variantes de productos (estructura base)

### Frontend
- [x] Login con JWT y persistencia en localStorage
- [x] Dashboard con navegación por vistas
- [x] CRUD de posts con editor TipTap
- [x] Gestión de media
- [x] Gestión de usuarios y roles
- [x] **SlidersAdmin funcionando** ✅ FIXED
- [x] Menús admin
- [x] Categorías admin
- [x] Comentarios admin
- [x] Selector de temas visuales
- [x] **Tienda → Productos (10 productos visibles)** ✅ NUEVO
- [x] Tienda pública con detalle de producto
- [x] Carrito de compras
- [x] Checkout
- [x] i18n (ES / EN)
- [x] Soporte multilenguaje en la interfaz

---

## 🚧 Pendientes / TODO

### Backend — Alta prioridad
- [ ] `PUT /shop/products/:id` — actualizar producto (handler implementado, ruta pendiente de registrar)
- [ ] `DELETE /shop/products/:id` — eliminar producto (idem)
- [ ] `PUT /shop/categories/:id` — actualizar categoría de producto
- [ ] `DELETE /shop/categories/:id` — eliminar categoría de producto
- [ ] Hacer funciones de shop `pub` para exposición directa desde main.rs
- [ ] Endpoint de búsqueda de productos con filtros completos (precio, categoría, stock)
- [ ] Upload de imágenes de productos
- [ ] Sistema de cupones y descuentos
- [ ] Cálculo de envío en checkout
- [ ] Pasarela de pagos (Stripe / MercadoPago)

### Backend — Media prioridad
- [ ] Variantes de productos (talla, color, etc.)
- [ ] Inventario con alertas de stock bajo
- [ ] Sistema de reseñas con moderación
- [ ] Notificaciones por email en nuevas órdenes
- [ ] Exportar órdenes a CSV
- [ ] Logs de auditoría de acciones admin
- [ ] Paginación cursor-based para mejor performance
- [ ] Caché de respuestas frecuentes en Redis

### Backend — Baja prioridad
- [ ] GraphQL endpoint opcional
- [ ] Soporte multi-tenant
- [ ] CDN para media uploads
- [ ] Compresión de imágenes automática
- [ ] Sistema de tags para posts y productos

### Frontend — Alta prioridad
- [ ] Formulario de creación/edición de productos con upload de imagen
- [ ] Vista de detalle y edición de órdenes
- [ ] Dashboard Overview con métricas reales (ventas, usuarios, posts)
- [ ] Búsqueda global en el admin
- [ ] Notificaciones en tiempo real (WebSocket o polling)

### Frontend — Media prioridad
- [ ] Editor de variantes de producto
- [ ] Gestión de cupones desde el admin
- [ ] Vista de inventario con alertas
- [ ] Página de perfil de usuario editable
- [ ] Sistema de comentarios en tiempo real
- [ ] Preview del tema antes de aplicar

### Frontend — Baja prioridad
- [ ] Modo oscuro/claro toggle
- [ ] Exportar datos a CSV/Excel desde el admin
- [ ] Drag & drop para reordenar productos y categorías
- [ ] Integración con Google Analytics

### Infraestructura
- [ ] Dockerfile y docker-compose para producción
- [ ] Variables de entorno documentadas para deploy
- [ ] CI/CD con GitHub Actions
- [ ] Backups automáticos de PostgreSQL
- [ ] HTTPS con Let's Encrypt
- [ ] Nginx como reverse proxy

---

## 🐛 Bugs conocidos / Workarounds aplicados

### 1. actix-web: límite silencioso de rutas encadenadas
**Problema:** En actix-web 4, cuando se encadenan más de ~15 `.configure()` en el mismo `web::scope`, las rutas registradas al final son ignoradas silenciosamente (dan 404 sin error de compilación).

**Workaround aplicado:** Las rutas del shop se registran **al inicio** del scope `/api/v1`, antes de los demás handlers, usando `.route()` directo en lugar de `.configure()`.

```rust
// En main.rs — las rutas del shop van primero
web::scope("/api/v1")
    .configure(handlers::auth::configure)
    .route("/shop/categories", web::get().to(handlers::products_shop::list_categories))
    .route("/shop/products", web::get().to(handlers::products_shop::list_products))
    // ... resto de handlers
```

### 2. Frontend: token JWT no persistido
**Problema:** El `authStore` de Zustand guardaba el token en memoria pero el interceptor de axios lo leía de `localStorage`. Tras recargar la página, el token se perdía.

**Fix aplicado:** Se agregó `localStorage.setItem('access_token', token)` en el handler de login (`Login.tsx`). El `authStore` ya tenía la lógica pero no se invocaba correctamente desde el componente.

### 3. Dashboard: vistas de plugins no renderizadas
**Problema:** El sistema de vistas del Dashboard no tenía registradas las vistas `sliders`, por lo que al navegar desde PluginsHome, el contenido quedaba en blanco.

**Fix aplicado:** Se agregaron las condiciones de render faltantes en `Dashboard.tsx`:
```tsx
{view === 'sliders' && <SlidersAdmin />}
{view === 'menus'   && <MenusAdmin />}
```

---

## 📦 Migraciones pendientes

```sql
-- Agregar sort_order a product_categories si no existe
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Agregar columnas faltantes a products si es necesario
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
```

---

## 📝 Notas de desarrollo

- El backend compila en ~15s (incremental) con `cargo build`
- El binario de producción se genera con `cargo build --release`
- Las migraciones se aplican automáticamente al arrancar si `SQLX_OFFLINE=false`
- El rate limiter usa Redis; si Redis no está disponible, el backend no arranca
- Los logs de debug se activan con `RUST_LOG=actix_web=debug,rustcms=debug`
- La contraseña de admin se puede resetear generando un hash bcrypt desde Python:
  ```bash
  python3 -c "import bcrypt; print(bcrypt.hashpw(b'nueva_pass', bcrypt.gensalt(12)).decode())"
  ```
  Y actualizando directamente en la DB:
  ```sql
  UPDATE users SET password='$2b$12$...' WHERE email='admin@ejemplo.com';
  ```
