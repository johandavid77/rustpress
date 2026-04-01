# 🦀 RustPress — CMS + Ecommerce en Rust

CMS headless y plataforma ecommerce construida con Rust (Actix-web) + React + PostgreSQL. Arquitectura modular pensada para escalar hacia tours, reservas, hospedaje y pasarelas de pago intercambiables.

---

## 🏗️ Stack

### Backend
| Tecnología | Uso |
|---|---|
| Rust + Actix-web 4 | Framework HTTP |
| SQLx 0.8 + PostgreSQL | Base de datos + migraciones |
| Redis | Cache de posts (5min TTL) |
| JWT (jsonwebtoken) | Autenticación |
| Argon2 | Hash de contraseñas |
| actix-governor | Rate limiting diferenciado |
| tracing + tracing-subscriber | Logs estructurados (JSON/pretty) |
| lettre | Emails transaccionales |
| sha2 | Hash de API keys |
| tokio-cron-scheduler | Publicación programada + backups |
| reqwest | Webhooks HTTP client |
| serde / serde_json | Serialización |

### Frontend
| Tecnología | Uso |
|---|---|
| React 18 + TypeScript | UI |
| Vite 5 | Build tool |
| Tailwind CSS | Estilos |
| TipTap | Editor rich text |
| @dnd-kit | Drag & drop |
| react-i18next | Internacionalización (ES/EN) |
| recharts | Gráficas (ViewsChart) |
| lucide-react | Iconos |
| axios | HTTP client |

---

## 🚀 API Endpoints

### Auth — `/api/v1/auth`
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/register` | Registro de usuario |
| POST | `/login` | Login → JWT |
| GET | `/me` | Perfil propio |
| POST | `/forgot-password` | Solicitar reset |
| POST | `/reset-password` | Confirmar reset |

### Posts — `/api/v1/posts`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar posts (paginado, filtros) |
| POST | `/` | Crear post |
| GET | `/:id` | Obtener post |
| PUT | `/:id` | Actualizar post |
| DELETE | `/:id` | Eliminar post |
| GET | `/stats` | Stats globales |
| GET | `/stats/views` | Vistas por día (30 días) |
| GET | `/:slug/view` | Incrementar contador de vistas |
| POST | `/bulk` | Acciones masivas (publish/delete) |

### Media — `/api/v1/media`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar archivos |
| POST | `/upload` | Subir archivo |
| DELETE | `/:id` | Eliminar archivo |

### Users — `/api/v1/users`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar usuarios |
| POST | `/` | Crear usuario |
| PUT | `/:id` | Actualizar usuario |
| DELETE | `/:id` | Eliminar usuario |
| PUT | `/me/profile` | Actualizar perfil propio |

### Authors — `/api/v1/authors`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/:username` | Perfil público de autor |

### Categories & Tags — `/api/v1`
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/categories` | CRUD categorías |
| GET/POST | `/tags` | CRUD tags |

### Roles & Permisos — `/api/v1`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/roles` | Listar roles |
| GET/PUT | `/roles/:id/permissions` | Ver/actualizar permisos de rol |
| GET | `/permissions` | Listar permisos disponibles |

### API Keys — `/api/v1/api-keys`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar API keys |
| POST | `/` | Crear API key |
| DELETE | `/:id` | Revocar API key |

### Webhooks — `/api/v1/webhooks`
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/` | CRUD webhooks |
| PUT/DELETE | `/:id` | Actualizar/eliminar |

### Plugins — `/api/v1/plugins`
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/` | CRUD plugins |

### Settings — `/api/v1/settings`
| Método | Ruta | Descripción |
|---|---|---|
| GET/PUT | `/` | Configuración global |
| GET | `/active-theme` | Tema activo |

### Ecommerce — `/api/v1/shop`
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/products` | CRUD productos |
| GET/PUT/DELETE | `/products/:id` | Producto individual |
| GET/POST | `/categories` | Categorías de productos |

### Carrito — `/api/v1/cart`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Ver carrito |
| POST | `/items` | Agregar item |
| PUT | `/items/:id` | Actualizar cantidad |
| DELETE | `/items/:id` | Eliminar item |
| DELETE | `/` | Vaciar carrito |

### Órdenes — `/api/v1/orders`
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Listar órdenes |
| POST | `/` | Crear orden desde carrito |
| GET | `/:id` | Detalle de orden |
| PUT | `/:id/status` | Actualizar estado |

### Reservas (Bookings) — `/api/v1` *(en desarrollo)*
| Recurso | Descripción |
|---|---|
| `booking_services` | Tours, hospedaje, restaurante, eventos |
| `booking_slots` | Disponibilidad por fecha/hora |
| `bookings` | Reservas con estado y pagos |

### Misceláneos
| Ruta | Descripción |
|---|---|
| GET `/api/v1/health` | Healthcheck DB + Redis |
| GET `/sitemap.xml` | Sitemap automático |
| GET `/api/v1/feed.xml` | RSS feed |

---

## ✅ Funcionalidades implementadas

### CMS Core
- [x] CRUD posts con editor rich text (TipTap)
- [x] Categorías y tags con selector en editor
- [x] Autosave cada 30s mientras se escribe
- [x] Publicación programada (`publish_at`)
- [x] Bulk actions (publish/unpublish/delete)
- [x] Drag & drop ordenamiento de posts
- [x] Vistas counter por post
- [x] Reading time estimado
- [x] Table of Contents auto-generado
- [x] Open Graph preview antes de publicar
- [x] Social share buttons (Twitter, LinkedIn, WhatsApp)

### Temas
- [x] 4 temas públicos: Bold, Dark, Magazine, Minimal
- [x] Lazy loading de imágenes en todos los temas
- [x] Related posts al final de cada post

### Media
- [x] Upload de archivos
- [x] Galería de medios en admin

### SEO & Rendimiento
- [x] Sitemap.xml automático
- [x] RSS feed
- [x] Redis cache (5min TTL en list_posts)
- [x] OG tags en BlogPost

### Auth & Seguridad
- [x] JWT con refresh
- [x] Rate limiting diferenciado (auth: 10 req/min, API: 200 req/min)
- [x] Logs estructurados JSON (`LOG_FORMAT=json`)
- [x] Reset de contraseña por email
- [x] Roles granulares con permisos por recurso/acción
- [x] API Keys con scopes

### Multi-autor
- [x] Perfiles públicos de autor (bio, avatar, social links)
- [x] Panel de edición de perfil propio
- [x] Página pública `/autor/:username`

### Ecommerce
- [x] Productos (CRUD, variantes, stock, imágenes, SKU)
- [x] Categorías de productos (árbol, parent/child)
- [x] Carrito persistente por usuario con validación de stock
- [x] Órdenes con cupones, descuentos, historial
- [x] Panel admin: productos, órdenes, estado
- [x] Módulo de reservas: tours, hospedaje, restaurante, eventos

### Infraestructura
- [x] DB auto-backup (pg_dump cada 24h, retención 30 días)
- [x] CI/CD GitHub Actions (backend Rust + frontend TypeScript)
- [x] Docker production setup (multi-stage, Nginx, Certbot)
- [x] Healthcheck dashboard (DB + Redis + stats en tiempo real)
- [x] Webhooks (Slack/Discord on publish)

---

## 🔜 Próximos pasos

- [ ] Checkout frontend público (`/shop`, `/cart`, `/checkout`)
- [ ] Integración Stripe / Wompi (Colombia)
- [ ] Frontend de reservas (tours, hospedaje)
- [ ] Reviews y ratings de productos
- [ ] Unit & integration tests (cargo test)
- [ ] Panel de analytics avanzado

---

## 🚀 Desarrollo local
```bash
# Backend
cd backend
cp .env.example .env
cargo run

# Frontend
cd frontend
npm install
npm run dev
```

Variables de entorno requeridas: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SMTP_*`
