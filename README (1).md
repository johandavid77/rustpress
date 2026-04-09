# 🦀 RustPress CMS

> WordPress mutante en Rust — CMS headless de alto rendimiento con backend en Rust/actix-web y frontend en React/TypeScript.

[![Rust](https://img.shields.io/badge/Rust-1.82-orange)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 📋 Tabla de contenido

- [Stack](#-stack)
- [Arquitectura](#-arquitectura)
- [Funcionalidades implementadas](#-funcionalidades-implementadas)
- [API Endpoints](#-api-endpoints)
- [Sistema de Plugins](#-sistema-de-plugins)
- [Base de datos](#-base-de-datos)
- [Configuración](#-configuración)
- [Desarrollo](#-desarrollo)
- [Credenciales](#-credenciales)
- [Tests](#-tests)
- [Bugs conocidos y workarounds](#-bugs-conocidos-y-workarounds)
- [Roadmap](#-roadmap)

---

## 🛠 Stack

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Rust | 1.82 | Lenguaje principal |
| actix-web | 4 | Framework HTTP |
| SQLx | 0.8 | ORM async para PostgreSQL |
| Redis | 0.25 | Caché y sesiones |
| jsonwebtoken | 9 | Auth JWT |
| bcrypt | 0.15 | Hash de contraseñas |
| tokio | 1 | Runtime async |
| serde / serde_json | 1 | Serialización |
| actix-multipart | 0.6 | Upload de archivos |
| chrono | 0.4 | Manejo de fechas |
| uuid | 1 | UUIDs v4 |
| tracing | 0.1 | Logging estructurado |

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18 | UI framework |
| TypeScript | 5 | Tipado estático |
| Vite | 5 | Build tool + dev server |
| Tailwind CSS | 3 | Estilos utility-first |
| Zustand | 4 | State management |
| Axios | 1 | HTTP client |
| React Router | 6 | Navegación |
| Lucide React | 0.383 | Iconos |

### Infraestructura
| Tecnología | Uso |
|-----------|-----|
| PostgreSQL 16 | Base de datos principal |
| Redis | Caché, sesiones, rate limiting |
| pg_dump / psql | Backup y restauración |
| Git | Control de versiones + sistema de updates |

---

## 🏗 Arquitectura

```
rustpress/
├── backend/                    # Rust / actix-web 4
│   ├── src/
│   │   ├── main.rs             # Entry point, rutas, config
│   │   ├── backup.rs           # Job automático de backup cada 24h
│   │   ├── handlers/           # Controladores HTTP
│   │   │   ├── auth.rs         # Login, registro, JWT
│   │   │   ├── posts.rs        # CRUD de posts/blog
│   │   │   ├── sliders.rs      # Carrusel de imágenes
│   │   │   ├── media.rs        # Gestión de archivos
│   │   │   ├── users.rs        # Gestión de usuarios
│   │   │   ├── categories.rs   # Categorías de blog
│   │   │   ├── menus.rs        # Menús de navegación
│   │   │   ├── webhooks.rs     # Webhooks externos
│   │   │   ├── plugins.rs      # Sistema de plugins
│   │   │   ├── backup.rs       # API de backup/restore
│   │   │   ├── updates.rs      # Sistema de actualizaciones
│   │   │   ├── products_shop.rs # Tienda — productos y categorías
│   │   │   ├── orders.rs       # Pedidos
│   │   │   ├── cart.rs         # Carrito de compras
│   │   │   ├── coupons.rs      # Cupones de descuento
│   │   │   ├── reviews.rs      # Reseñas de productos
│   │   │   └── analytics.rs    # Analytics básico
│   │   ├── middleware/
│   │   │   └── auth.rs         # Middleware JWT
│   │   ├── models/             # Structs de DB (SQLx)
│   │   ├── errors.rs           # Manejo centralizado de errores
│   │   └── plugins/
│   │       └── registry.rs     # Registro de plugins del backend
│   ├── backups/                # Dumps SQL automáticos (últimos 30)
│   ├── uploads/                # Archivos subidos
│   │   └── slider/             # Imágenes de sliders
│   └── Cargo.toml
│
└── frontend/                   # React 18 + TypeScript + Vite
    └── src/
        ├── api/                # Clientes HTTP por módulo
        │   ├── client.ts       # Axios con interceptores JWT
        │   ├── auth.ts
        │   ├── sliders.ts
        │   ├── plugins.ts      # Plugin API con tipo Plugin
        │   └── ...
        ├── plugins/
        │   └── pluginRegistry.ts  # ⭐ Registro central de plugins
        ├── pages/
        │   ├── Dashboard.tsx   # Admin principal (sistema de vistas)
        │   ├── Login.tsx
        │   ├── Plugins/        # Plugins del admin
        │   │   ├── PluginsHome.tsx    # Lista de plugins desde DB
        │   │   ├── SlidersAdmin.tsx
        │   │   ├── MenusAdmin.tsx
        │   │   ├── CommentsAdmin.tsx
        │   │   ├── CategoriesAdmin.tsx
        │   │   ├── WebhooksAdmin.tsx
        │   │   ├── BackupAdmin.tsx    # ⭐ Backup & Restore UI
        │   │   └── UpdatesAdmin.tsx   # ⭐ Sistema de actualizaciones
        │   ├── Shop/
        │   │   ├── Products.tsx       # CRUD de productos admin
        │   │   └── ProductEditor.tsx  # Editor de producto
        │   ├── Ecommerce/
        │   └── public/
        │       ├── Shop.tsx           # Tienda pública
        │       └── ProductDetail.tsx  # Detalle de producto por slug
        ├── store/
        │   └── authStore.ts    # Zustand auth store
        └── components/
```

---

## ✅ Funcionalidades implementadas

### 🔐 Autenticación
- [x] Login con email/contraseña
- [x] JWT con expiración configurable
- [x] Hash bcrypt (rounds=12)
- [x] Middleware de auth por rol
- [x] Token guardado en localStorage + Zustand store
- [x] Refresh de sesión automático

### 📝 Blog / Posts
- [x] CRUD completo de posts
- [x] Slugs auto-generados
- [x] Estados: draft, published, archived
- [x] Categorías y tags
- [x] Editor de post en el admin

### 🖼 Media
- [x] Upload de archivos (imágenes)
- [x] Galería en el admin
- [x] Servir archivos estáticos desde `/uploads/`

### 🎠 Sliders
- [x] CRUD de slides
- [x] Imágenes desde Unsplash
- [x] Control de orden y estado activo/inactivo
- [x] Vista admin completa

### 🛍 Tienda / Ecommerce
- [x] Catálogo de productos con imágenes
- [x] Categorías de productos
- [x] Variantes de producto
- [x] Carrito de compras
- [x] Cupones de descuento (% y monto fijo)
- [x] Gestión de pedidos
- [x] Reseñas y ratings
- [x] Inventario / stock
- [x] Página pública de tienda (`/shop`)
- [x] Página de detalle por slug (`/shop/:slug`)
- [x] CRUD de productos en el admin
- [x] Búsqueda y filtro por estado

### 🔌 Sistema de Plugins
- [x] Tabla `plugins` en DB con config JSONB
- [x] `pluginRegistry.ts` — registro central de componentes
- [x] PluginsHome conectado a DB (no hardcodeado)
- [x] Activar / Desactivar plugins desde la UI
- [x] Eliminar plugins con confirmación
- [x] Plugins agrupados por categoría (Contenido, Ecommerce, Integraciones, Sistema)
- [x] Lazy loading de componentes de plugin
- [x] Para agregar nuevo plugin: solo agregar entrada en `pluginRegistry.ts`

### 💾 Backup & Restore
- [x] Job automático cada 24h con `pg_dump`
- [x] API `POST /api/v1/backup/create` — backup manual
- [x] API `GET /api/v1/backup/list` — listar backups
- [x] API `GET /api/v1/backup/download/:filename` — descargar
- [x] API `DELETE /api/v1/backup/:filename` — eliminar
- [x] API `POST /api/v1/backup/restore` — restaurar desde archivo `.sql`
- [x] UI admin completa: crear, listar, descargar, eliminar, restaurar
- [x] Limpieza automática (mantiene últimos 30 backups)

### 🔄 Sistema de Actualizaciones
- [x] API `GET /api/v1/updates/status` — commit local vs remoto
- [x] API `POST /api/v1/updates/apply` — git pull + recompila en background
- [x] API `GET /api/v1/updates/changelog` — últimos 10 commits de main
- [x] UI admin: badge actualizado/disponible, botón aplicar, changelog
- [x] Compara commit local vs `origin/main`

### 🔗 Webhooks
- [x] Configurar URLs de notificación
- [x] Disparar al publicar post
- [x] Soporte Slack, Discord, genérico

### 👥 Usuarios
- [x] CRUD de usuarios
- [x] Roles (admin, editor, viewer)
- [x] Gestión desde el admin

### 📊 Analytics
- [x] Pageviews básico
- [x] Visitantes únicos
- [x] Vista en admin

---

## 🌐 API Endpoints

Base URL: `http://localhost:8080/api/v1`

### Auth
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | ❌ | Login, retorna JWT |
| POST | `/auth/register` | ❌ | Registro de usuario |
| GET | `/auth/me` | ✅ | Perfil del usuario actual |

### Posts
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/posts` | ❌ | Listar posts publicados |
| GET | `/posts/:slug` | ❌ | Detalle de post |
| POST | `/posts` | ✅ | Crear post |
| PUT | `/posts/:id` | ✅ | Actualizar post |
| DELETE | `/posts/:id` | ✅ | Eliminar post |

### Sliders
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/sliders` | ❌ | Listar sliders activos |
| POST | `/sliders` | ✅ | Crear slider |
| PUT | `/sliders/:id` | ✅ | Actualizar slider |
| DELETE | `/sliders/:id` | ✅ | Eliminar slider |

### Tienda — Productos
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/shop/categories` | ❌ | Categorías de productos |
| POST | `/shop/categories` | ✅ | Crear categoría |
| GET | `/shop/products` | ❌ | Listar productos (paginado) |
| POST | `/shop/products` | ✅ | Crear producto |
| GET | `/shop/products/slug/:slug` | ❌ | Producto por slug |
| GET | `/shop/products/:id` | ❌ | Producto por ID |
| PUT | `/shop/products/:id` | ✅ | Actualizar producto |
| DELETE | `/shop/products/:id` | ✅ | Eliminar producto |

### Carrito
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/cart` | ✅ | Ver carrito |
| POST | `/cart/items` | ✅ | Agregar item |
| PUT | `/cart/items/:id` | ✅ | Actualizar cantidad |
| DELETE | `/cart/items/:id` | ✅ | Eliminar item |

### Pedidos
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/orders` | ✅ | Listar pedidos |
| POST | `/orders` | ✅ | Crear pedido |
| GET | `/orders/:id` | ✅ | Detalle de pedido |
| PUT | `/orders/:id/status` | ✅ | Cambiar estado |

### Cupones
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/coupons` | ✅ | Listar cupones |
| POST | `/coupons` | ✅ | Crear cupón |
| POST | `/coupons/validate` | ❌ | Validar cupón |

### Plugins
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/plugins` | ❌ | Listar todos los plugins |
| POST | `/plugins/:id/enable` | ✅ | Activar plugin |
| POST | `/plugins/:id/disable` | ✅ | Desactivar plugin |
| GET | `/plugins/:id/config` | ✅ | Config de plugin |
| PUT | `/plugins/:id/config` | ✅ | Actualizar config |
| DELETE | `/plugins/:id` | ✅ | Eliminar plugin |

### Backup
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/backup/list` | ✅ | Listar backups disponibles |
| POST | `/backup/create` | ✅ | Crear backup ahora |
| GET | `/backup/download/:filename` | ✅ | Descargar archivo SQL |
| POST | `/backup/restore` | ✅ | Restaurar desde `.sql` (multipart) |
| DELETE | `/backup/:filename` | ✅ | Eliminar backup |

### Actualizaciones
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/updates/status` | ✅ | Estado: commit local vs remoto |
| POST | `/updates/apply` | ✅ | Aplicar update (git pull + build) |
| GET | `/updates/changelog` | ✅ | Últimos 10 commits de main |

### Otros
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | ❌ | Health check del servidor |
| GET | `/sliders` | ❌ | Sliders activos |
| GET | `/categories` | ❌ | Categorías de blog |
| GET | `/media` | ✅ | Listar archivos |
| POST | `/media/upload` | ✅ | Subir archivo |

---

## 🔌 Sistema de Plugins

### Cómo agregar un nuevo plugin

**1. Crear el componente React:**
```bash
# frontend/src/pages/Plugins/MiPlugin.tsx
export default function MiPlugin() {
  return <div>Mi Plugin</div>
}
```

**2. Registrar en `pluginRegistry.ts`:**
```typescript
// frontend/src/plugins/pluginRegistry.ts
const MiPlugin = lazy(() => import('../pages/Plugins/MiPlugin'))

export const PLUGIN_REGISTRY = {
  // ...plugins existentes...
  mi-plugin: { id: 'mi-plugin', component: MiPlugin },
}
```

**3. Insertar en la DB:**
```sql
INSERT INTO plugins (id, name, version, description, is_enabled, config)
VALUES (
  gen_random_uuid(),
  'mi-plugin',
  '1.0.0',
  'Descripción del plugin',
  true,
  '{"title":"Mi Plugin","icon":"Zap","color":"from-purple-500/20 to-purple-600/5 border-purple-500/20","category":"content"}'
);
```

¡Listo! El plugin aparece automáticamente en el admin sin tocar `Dashboard.tsx`.

### Plugins disponibles

| Plugin | Categoría | Estado |
|--------|-----------|--------|
| sliders | Contenido | ✅ Activo |
| menus | Contenido | ✅ Activo |
| comments | Contenido | ✅ Activo |
| categories | Contenido | ✅ Activo |
| ecommerce | Ecommerce | ✅ Activo |
| webhooks | Integraciones | ✅ Activo |
| health | Sistema | ✅ Activo |
| backup | Sistema | ✅ Activo |
| updates | Sistema | ✅ Activo |

---

## 🗄 Base de datos

### Tablas principales

```sql
users               -- Usuarios del sistema
roles               -- Roles (admin, editor, viewer)
posts               -- Posts del blog
categories          -- Categorías de blog
tags                -- Tags de blog
sliders             -- Slides del carrusel
media               -- Archivos subidos
menus               -- Menús de navegación
menu_items          -- Items de menú
plugins             -- Sistema de plugins
products            -- Productos de la tienda
product_categories  -- Categorías de productos
product_variants    -- Variantes de producto
cart_items          -- Items del carrito
orders              -- Pedidos
order_items         -- Items de pedido
coupons             -- Cupones de descuento
reviews             -- Reseñas de productos
webhooks            -- Configuración de webhooks
analytics_events    -- Eventos de analytics
```

### Conexión
```
postgres://rustcms:rustcms_secret@localhost:5432/rustcms
```

---

## ⚙️ Configuración

### Variables de entorno (backend)
```env
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
BACKUP_DIR=./backups
PORT=8080
```

### Proxy Vite (frontend)
```typescript
// frontend/vite.config.ts
proxy: {
  '/api': 'http://localhost:8080'
}
// baseURL del cliente: '/api/v1'
```

---

## 🚀 Desarrollo

### Backend
```bash
cd backend
cargo build                    # compilar debug
cargo build --release          # compilar release
cargo run                      # ejecutar
cargo test                     # correr tests
./target/debug/rustcms         # ejecutar binario directamente
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # dev server en :5173
npm run build                  # build producción
```

### Base de datos
```bash
# Conectar
psql "postgres://rustcms:rustcms_secret@localhost:5432/rustcms"

# Backup manual
pg_dump postgres://rustcms:rustcms_secret@localhost:5432/rustcms > backup.sql

# Restaurar
psql postgres://rustcms:rustcms_secret@localhost:5432/rustcms < backup.sql
```

---

## 🔑 Credenciales

| Campo | Valor |
|-------|-------|
| Email admin | `johan@rustcms.dev` |
| Contraseña | `admin123` |
| DB URL | `postgres://rustcms:rustcms_secret@localhost:5432/rustcms` |
| Backend | `http://localhost:8080` |
| Frontend | `http://localhost:5173` |

### Resetear contraseña de admin
```bash
pip install bcrypt --break-system-packages -q
HASH=$(python3 -c "import bcrypt; print(bcrypt.hashpw(b'admin123', bcrypt.gensalt(12)).decode())")
psql "postgres://rustcms:rustcms_secret@localhost:5432/rustcms" \
  -c "UPDATE users SET password='$HASH' WHERE email='johan@rustcms.dev';"
```

---

## 🧪 Tests

```bash
cargo test                     # todos los tests
cargo test coupon              # filtrar por módulo
cargo test -- --nocapture      # ver println! en tests
```

**32 tests — 0 failed**

| Módulo | Tests | Qué cubren |
|--------|-------|------------|
| `coupon_tests` | 6 | Descuentos %, fixed, protección contra negativos |
| `payments_tests` | 6 | HMAC-SHA256, payload adulterado |
| `reviews_tests` | 7 | Gateways Stripe/PayPal, PaymentStatus |
| `auth_service` | 7 | JWT, bcrypt, tokens |
| `email_service` | 6 | Plantillas, validación |

---

## 🐛 Bugs conocidos y workarounds

### actix-web — límite de rutas encadenadas
**Problema:** actix-web 4 silenciosamente ignora rutas registradas más allá de cierto límite cuando se encadenan con `.route()` en un scope.

**Síntoma:** Las rutas devuelven 404 aunque el código es correcto.

**Solución aplicada:** Registrar las rutas críticas al **inicio** del scope `/api/v1`, antes de los `.configure()` de otros handlers.

```rust
// main.rs — rutas de shop van primero
.route("/shop/categories", web::get().to(handlers::products_shop::list_categories))
.route("/shop/products",   web::get().to(handlers::products_shop::list_products))
// ... luego los configure()
.configure(handlers::auth::configure)
```

### JWT ExpieredSignature
**Problema:** El token JWT expira y el frontend muestra "No se pudieron cargar los plugins".

**Solución:** Hacer logout y login nuevamente. El token se renueva automáticamente al hacer login.

---

## 🗺 Roadmap

### 🔴 Alta prioridad

| Feature | Descripción | Complejidad |
|---------|-------------|-------------|
| **Wompi / Stripe** | Pasarela de pago real para Colombia | Alta |
| **Dashboard Overview** | Métricas reales: ventas, posts, stock bajo, visitas | Media |
| **SEO** | Meta tags, Open Graph, sitemap.xml, robots.txt | Media |
| **ProductEditor completo** | Subida de imágenes real, variantes, categorías | Media |
| **Reviews conectadas** | La tabla existe, falta conectar el frontend | Baja |

### 🟡 Media prioridad

| Feature | Descripción | Complejidad |
|---------|-------------|-------------|
| **Búsqueda global admin** | Buscar en posts, productos, usuarios desde el header | Media |
| **Editor Markdown** | Preview en tiempo real para posts | Media |
| **Notificaciones real-time** | SSE/WebSocket para pedidos nuevos | Alta |
| **Media mejorada** | Drag & drop, redimensionado automático, WebP | Media |
| **Backup ZIP** | Incluir /uploads además del SQL | Baja |
| **Tooltips en admin** | CSS tooltips instantáneos en botones de acción | Baja |

### 🟢 Nuevos plugins

| Plugin | Descripción |
|--------|-------------|
| **Formularios** | Constructor de formularios de contacto con envío por email |
| **Newsletter** | Suscriptores + envío masivo |
| **Analytics propio** | Pageviews, visitantes únicos, sin Google |
| **Caché** | Redis middleware para cachear respuestas de la API |
| **Redirecciones** | Gestión de 301/302 desde el admin |
| **API Keys** | Gestión de keys para acceso a la API |

### 🔵 Infraestructura

| Feature | Descripción |
|---------|-------------|
| **Docker Compose producción** | Nginx + SSL + backups automáticos |
| **GitHub Actions CI/CD** | Build + test automático en cada push |
| **`.env.example`** | Documentación completa de variables de entorno |
| **Rate limiting** | Redis-based rate limiting por IP/usuario |
| **Logs estructurados** | JSON logs para producción con niveles configurables |

---

## 📦 Estructura de rutas del frontend

### Admin (`/admin`)
El Dashboard usa un sistema de **vistas con estado** (no React Router nested).

| Vista | Componente | Descripción |
|-------|-----------|-------------|
| `home` | Overview | Métricas generales |
| `posts` | PostsList | Lista de posts |
| `media` | MediaAdmin | Galería de archivos |
| `users` | UsersAdmin | Gestión de usuarios |
| `themes` | ThemesAdmin | Temas del blog |
| `plugins` | PluginsHome | Lista de plugins (desde DB) |
| `sliders` | SlidersAdmin | Gestión de sliders |
| `menus` | MenusAdmin | Constructor de menús |
| `comments` | CommentsAdmin | Moderación de comentarios |
| `categories` | CategoriesAdmin | Categorías de blog |
| `webhooks` | WebhooksAdmin | Configuración de webhooks |
| `health` | WebhooksAdmin | Estado del servidor |
| `backup` | BackupAdmin | Backup & Restore |
| `updates` | UpdatesAdmin | Sistema de actualizaciones |
| `shop-products` | Products | CRUD de productos |
| `shop-orders` | Orders | Gestión de pedidos |
| `shop-coupons` | Coupons | Cupones de descuento |
| `shop-inventory` | Inventory | Control de inventario |
| `analytics` | Analytics | Estadísticas |
| `profile` | Profile | Perfil del usuario |
| `roles` | RolesAdmin | Gestión de roles |
| `api-keys` | ApiKeys | API Keys |

### Tienda pública
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/shop` | Shop | Catálogo de productos |
| `/shop/:slug` | ProductDetail | Detalle de producto |
| `/cart` | Cart | Carrito de compras |

---

## 🤝 Repositorio

```
https://github.com/johandavid77/rustpress
```

```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
```

---

*Construido con 🦀 Rust + ⚛️ React — Johan David, 2026*
