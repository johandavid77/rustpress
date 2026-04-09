# RustPress CMS

> CMS moderno construido con Rust (Actix-Web) + React (TypeScript) + PostgreSQL.
> Inspirado en WordPress pero mas rapido, mas seguro y extensible por diseno.

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Backend | Rust 1.75+ - Actix-Web 4 - SQLx - JWT - bcrypt |
| Frontend | React 18 - TypeScript - Vite - Tailwind CSS - recharts |
| Base de datos | PostgreSQL 16 |
| Cache | Redis |
| Infra | Docker - Nginx - pgAdmin |
| i18n | react-i18next (ES / EN) |
| SEO | react-helmet-async - Open Graph - Twitter Cards |
| Pagos | Stripe - PayPal |
| Analytics | Propio (pageviews, top posts, top productos, funnel, realtime) |

---

## Inicio rapido

    git clone https://github.com/johandavid77/rustpress.git
    cd rustpress
    docker compose up -d db redis
    cd backend && cargo run
    cd frontend && npm install && npm run dev

Acceder en: http://localhost:5173

Con Docker completo:

    docker compose up -d

---

## Credenciales por defecto

| Rol | Email | Password |
|-----|-------|----------|
| Admin | johan@rustcms.dev | admin123 |
| Editor | editor@rustcms.dev | editor123 |

Cambiar antes de ir a produccion.

---

## Estructura del proyecto

    rustpress/
    +-- backend/
    |   +-- src/
    |   |   +-- main.rs               Punto de entrada y rutas
    |   |   +-- config.rs             Variables de entorno
    |   |   +-- errors.rs             Manejo centralizado de errores
    |   |   +-- handlers/
    |   |   |   +-- auth.rs           Login, registro, perfil
    |   |   |   +-- posts.rs          CRUD posts + stats + views
    |   |   |   +-- media.rs          Subida y gestion de archivos
    |   |   |   +-- users.rs          CRUD usuarios y roles
    |   |   |   +-- plugins.rs        Sistema de plugins dinamico
    |   |   |   +-- products_shop.rs  Tienda publica + CRUD admin
    |   |   |   +-- orders.rs         Pedidos y estado
    |   |   |   +-- payments.rs       Stripe + PayPal
    |   |   |   +-- analytics.rs      Tracking y dashboard analitico
    |   |   |   +-- backup.rs         Backup y restore (pg_dump)
    |   |   |   +-- updates.rs        Actualizaciones via git pull
    |   |   |   +-- sliders.rs        Sliders de la home
    |   |   |   +-- webhooks.rs       Notificaciones externas
    |   |   +-- payments/
    |   |   |   +-- stripe.rs         Gateway Stripe
    |   |   |   +-- paypal.rs         Gateway PayPal
    |   |   |   +-- gateway.rs        Trait PaymentGateway
    |   |   +-- services/
    |   |       +-- auth_service.rs   JWT y bcrypt
    |   |       +-- email_service.rs  Plantillas de email
    |   +-- Cargo.toml
    +-- frontend/
    |   +-- src/
    |   |   +-- pages/
    |   |   |   +-- public/           Blog, Shop, ProductDetail, Checkout
    |   |   |   +-- Admin/            Dashboard, Users, CategoriesAdmin
    |   |   |   +-- Shop/             Products CRUD, ProductEditor, Orders
    |   |   |   +-- Plugins/          SlidersAdmin, BackupAdmin, UpdatesAdmin
    |   |   |   +-- Ecommerce/        EcommerceHome, OrdersAdmin
    |   |   |   +-- Analytics.tsx     Dashboard analitico con recharts
    |   |   |   +-- Stats.tsx         Overview con metricas en tiempo real
    |   |   +-- plugins/
    |   |   |   +-- pluginRegistry.ts Registro central de plugins
    |   |   +-- components/
    |   |   |   +-- SEO/SEO.tsx       Meta tags, Open Graph, Twitter Cards
    |   |   |   +-- Editor/           RichEditor con TipTap
    |   |   +-- locales/
    |   |   |   +-- es/translation.json
    |   |   |   +-- en/translation.json
    |   |   +-- api/                  Clientes API tipados
    |   |   +-- App.tsx
    |   +-- package.json
    +-- docker-compose.yml
    +-- docker-compose.prod.yml
    +-- nginx.conf
    +-- README.md

---

## Sistema de Plugins

Los plugins se registran en la DB y en un registry central. El Dashboard y PluginsHome los cargan automaticamente con lazy loading.

Para agregar un nuevo plugin:

1. Crear el componente: frontend/src/pages/Plugins/MiPlugin.tsx
2. Registrar en frontend/src/plugins/pluginRegistry.ts
3. Insertar en la DB:

    INSERT INTO plugins (id, name, version, description, is_enabled, config)
    VALUES (
      gen_random_uuid(), 'mi-plugin', '1.0.0', 'Descripcion', true,
      '{"title":"Mi Plugin","icon":"Zap","color":"from-blue-500/20 to-blue-600/5 border-blue-500/20","category":"content"}'
    );

Listo, aparece automaticamente en Plugins con toggle activo/inactivo.

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

## API Endpoints

Base URL: http://localhost:8080/api/v1

### Auth
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /auth/login | No | Login, retorna JWT |
| POST | /auth/register | No | Registro de usuario |
| GET | /auth/me | Si | Perfil del usuario actual |

### Posts
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /posts | No | Listar posts publicados |
| POST | /posts | Si | Crear post |
| GET | /posts/:id | No | Obtener post |
| PUT | /posts/:id | Si | Editar post |
| DELETE | /posts/:id | Si | Eliminar post |
| GET | /posts/stats | Si | Estadisticas de posts |
| GET | /posts/stats/views | Si | Vistas por dia (grafica) |
| POST | /posts/:slug/view | No | Incrementar contador de vistas |

### Shop (publico)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /shop/categories | No | Categorias de productos |
| GET | /shop/products | No | Productos con filtros y paginacion |
| GET | /shop/products/slug/:slug | No | Detalle por slug |
| GET | /shop/products/:id | No | Detalle por ID |

### Productos (admin)
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /products | Si | Listar todos |
| POST | /products | Si | Crear producto |
| PUT | /products/:id | Si | Editar producto |
| DELETE | /products/:id | Si | Eliminar producto |

### Pedidos
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /orders | Si | Listar pedidos |
| POST | /orders | Si | Crear pedido |
| GET | /orders/:id | Si | Detalle de pedido |
| PUT | /orders/:id/status | Si | Actualizar estado |

### Pagos
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /payments/init | Si | Iniciar pago (Stripe o PayPal) |
| POST | /payments/stripe/webhook | No | Webhook de Stripe |
| POST | /payments/paypal/webhook | No | Webhook de PayPal |
| GET | /payments/status/:order_id | Si | Estado del pago |

### Plugins
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /plugins | No | Listar plugins |
| POST | /plugins/:id/enable | Si | Activar plugin |
| POST | /plugins/:id/disable | Si | Desactivar plugin |
| DELETE | /plugins/:id | Si | Eliminar plugin |

### Backup
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /backup/list | Si | Listar backups disponibles |
| POST | /backup/create | Si | Crear backup con pg_dump |
| GET | /backup/download/:filename | Si | Descargar archivo .sql |
| POST | /backup/restore | Si | Restaurar DB (multipart .sql) |
| DELETE | /backup/:filename | Si | Eliminar backup |

### Actualizaciones
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /updates/status | Si | Estado vs GitHub main |
| GET | /updates/changelog | Si | Ultimos 10 commits |
| POST | /updates/apply | Si | git pull + cargo build |

### Analytics
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /analytics/track | No | Registrar evento |
| GET | /analytics/dashboard | Si | Metricas generales |
| GET | /analytics/top-posts | Si | Posts mas vistos |
| GET | /analytics/top-products | Si | Productos mas vistos |
| GET | /analytics/funnel | Si | Funnel de conversion |
| GET | /analytics/realtime | Si | Visitantes en tiempo real |

### Media
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| POST | /media/upload | Si | Subir archivo (multipart) |
| GET | /media | Si | Listar archivos |
| DELETE | /media/:id | Si | Eliminar archivo |

### Sliders
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /sliders | No | Listar sliders activos |
| POST | /sliders | Si | Crear slider |
| PUT | /sliders/:id | Si | Editar slider |
| DELETE | /sliders/:id | Si | Eliminar slider |

### Utilidades
| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | /sitemap.xml | No | Sitemap generado dinamicamente |
| GET | /robots.txt | No | Robots.txt con reglas SEO |

---

## SEO

Implementado con react-helmet-async en todas las paginas publicas:

- Title dinamico por pagina
- Meta description unica por ruta
- Open Graph (og:title, og:description, og:image, og:url)
- Twitter Cards (summary_large_image)
- Canonical URLs
- sitemap.xml generado dinamicamente desde la DB (posts y productos)
- robots.txt con Disallow en /admin y /api

Uso del componente SEO:

    import SEO from '../../components/SEO/SEO'

    <SEO
      title="Mi pagina"
      description="Descripcion para buscadores"
      image="/og-image.jpg"
      url="/mi-pagina"
      type="article"
      publishedAt="2026-04-09"
    />

---

## Internacionalizacion (i18n)

El sistema es completamente bilingue ES/EN usando react-i18next.

Namespaces disponibles: overview, shop, payment, backup, updates, plugins, blog, sliders, menus, language.

Uso en componentes:

    import { useTranslation } from 'react-i18next'
    const { t } = useTranslation()
    <p>{t('shop.addToCart')}</p>

Para agregar nuevas traducciones editar:
- frontend/src/locales/es/translation.json
- frontend/src/locales/en/translation.json

---

## Pagos

### Stripe
Implementado con Checkout Session (redirect). El usuario es redirigido a la pagina de pago de Stripe y vuelve a /checkout/success o /checkout/cancel.

Configurar en backend/.env:

    STRIPE_SECRET_KEY=sk_live_...
    STRIPE_WEBHOOK_SECRET=whsec_...

### PayPal
Implementado con PayPal Orders API. Soporta sandbox y produccion.

Configurar en backend/.env:

    PAYPAL_CLIENT_ID=...
    PAYPAL_CLIENT_SECRET=...
    PAYPAL_SANDBOX=true

### Flujo de pago
1. Usuario va a /checkout
2. Selecciona Stripe o PayPal
3. Frontend llama POST /payments/init con order_id y gateway
4. Backend crea la sesion y retorna checkout_url
5. Usuario completa el pago en la pasarela
6. Webhook actualiza el estado del pedido en la DB
7. Usuario llega a /checkout/success

---

## Analytics

Dashboard analitico propio sin Google. Accesible desde Admin > Analitica.

Tabs disponibles:
- Overview: pageviews totales, usuarios unicos, tasa de rebote, tiempo promedio
- Contenido: posts mas leidos con grafica de vistas por dia
- Tienda: productos mas vistos, tasa de conversion, funnel
- Tiempo real: visitantes activos en los ultimos 5 minutos (polling cada 30s)

Tracking automatico: el componente SEO envia un evento a POST /analytics/track en cada cambio de ruta.

---

## Tests

    cd backend
    cargo test                    # Todos los tests
    cargo test coupon             # Por modulo
    cargo test -- --nocapture     # Ver println!

32 tests --- 0 failed

| Modulo | Tests | Que cubren |
|--------|-------|------------|
| coupon_tests | 6 | Descuentos porcentaje y fijo, proteccion contra negativos |
| payments_tests | 6 | HMAC-SHA256 Stripe, payload adulterado, rating math |
| reviews_tests | 7 | Gateways Stripe/PayPal, PaymentStatus Display/Eq |
| auth_service | 7 | JWT, bcrypt, tokens |
| email_service | 6 | Plantillas, validacion |

---

## Roadmap

### Completado
- Sistema de plugins dinamico conectado a DB
- Dashboard Overview con metricas en tiempo real
- SEO completo con sitemap.xml y robots.txt
- i18n ES/EN para todos los modulos
- Backup y Restore con pg_dump
- Actualizaciones estilo WordPress via git
- CRUD completo de productos con subida real de imagenes
- Pagina de detalle de producto por slug
- Stripe y PayPal implementados (faltan keys reales)
- Analytics propio con recharts
- JWT con duracion de 30 dias

### Pendiente
- Reviews y ratings de productos (tabla y endpoint existen, falta UI)
- Editor de posts con Markdown y preview en tiempo real
- Busqueda global en el admin (posts, productos, clientes)
- Notificaciones en tiempo real (SSE/WebSocket) para pedidos nuevos
- Plugin de formularios de contacto
- Plugin de newsletter (suscriptores y envio masivo)
- Cache de respuestas con Redis middleware
- Redirecciones 301/302 desde el admin
- CI/CD con GitHub Actions
- .env.example completo
- SSL listo para produccion

---

## Bugs conocidos

- Actix-Web: muchas rutas en cadena pueden causar recursion en compilacion. Usar .configure() por modulo.
- Tooltips en Brave: el atributo title tiene delay. Implementar CSS group-hover de Tailwind.
- Analytics tracking: el componente SEO debe integrarse con el tracker para envio automatico de pageviews.

---

## Variables de entorno

Backend (backend/.env):

    DATABASE_URL=postgres://rustcms:rustcms_secret@localhost:5432/rustcms
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=cambiar_en_produccion
    JWT_EXPIRY_HOURS=720
    BACKUP_DIR=./backups
    PORT=8080
    SITE_URL=http://localhost:5173
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    PAYPAL_CLIENT_ID=...
    PAYPAL_CLIENT_SECRET=...
    PAYPAL_SANDBOX=true

Frontend (frontend/.env):

    VITE_API_URL=/api/v1

---

## Licencia

MIT
