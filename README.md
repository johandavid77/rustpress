<div align="center">

# 🦀 RustCMS / RustPress

**A fast, modern, full-stack CMS built with Rust + React**

[![Rust](https://img.shields.io/badge/Rust-1.94-orange?logo=rust)](https://www.rust-lang.org/)
[![Actix Web](https://img.shields.io/badge/Actix--Web-4-red)](https://actix.rs/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[🇪🇸 Español](#español) · [🇬🇧 English](#english)

</div>

---

## 🇪🇸 Español

### ¿Qué es RustCMS?

RustCMS es un sistema de gestión de contenidos (CMS) de código abierto construido con **Rust** en el backend y **React + TypeScript** en el frontend. Está diseñado para ser rápido, seguro y fácil de extender, con soporte para posts, medios, usuarios, menús de navegación, sliders y un sistema de plugins.

### 🛠️ Stack tecnológico

#### Backend — `./backend`
| Tecnología | Uso |
|---|---|
| **Rust** | Lenguaje principal. Elegido por su rendimiento, seguridad de memoria y confiabilidad en producción |
| **Actix-Web 4** | Framework HTTP asíncrono de alto rendimiento para construir la API REST |
| **SQLx** | ORM/query builder async con verificación de queries en tiempo de compilación |
| **PostgreSQL** | Base de datos principal. Robusta, confiable y con soporte nativo en SQLx |
| **JWT (jsonwebtoken)** | Autenticación stateless mediante tokens. Cada request valida el token sin consultar la DB |
| **Argon2** | Hashing seguro de contraseñas. Estándar moderno resistente a ataques de fuerza bruta |
| **Lettre + MailHog** | Servicio de emails. MailHog captura emails en desarrollo para pruebas sin enviar correos reales |
| **Tokio** | Runtime async para Rust. Permite manejar miles de conexiones concurrentes eficientemente |
| **Tracing** | Logging estructurado y trazabilidad de requests |
| **Docker** | Contenedorización para PostgreSQL y MailHog en desarrollo |

#### Frontend — `./frontend`
| Tecnología | Uso |
|---|---|
| **React 18** | UI library. Componentes reutilizables con hooks modernos |
| **TypeScript** | Tipado estático para detectar errores en tiempo de desarrollo, no en producción |
| **Vite** | Build tool ultra-rápido. Hot Module Replacement instantáneo durante desarrollo |
| **Tailwind CSS** | Utilidades CSS inline. Permite diseñar sin salir del componente |
| **Axios** | Cliente HTTP con interceptores para manejar tokens JWT automáticamente |
| **Zustand** | Estado global minimalista. Maneja la sesión del usuario (token, datos) |
| **React Router v6** | Navegación SPA con rutas protegidas (PrivateRoute) |
| **Lucide React** | Iconos modernos y consistentes en toda la interfaz |

### 🏗️ Arquitectura del proyecto

```
rustpress/
├── backend/                    # API REST en Rust
│   ├── src/
│   │   ├── main.rs             # Entry point, configuración del servidor
│   │   ├── config.rs           # Variables de entorno (AppConfig)
│   │   ├── errors.rs           # Manejo centralizado de errores (AppError)
│   │   ├── lib.rs              # Exports del crate
│   │   ├── handlers/           # Controladores HTTP por dominio
│   │   │   ├── auth.rs         # Login, register, forgot/reset password
│   │   │   ├── posts.rs        # CRUD posts + stats
│   │   │   ├── media.rs        # Upload y gestión de archivos
│   │   │   ├── users.rs        # Gestión de usuarios
│   │   │   ├── menus.rs        # Menús de navegación + ítems
│   │   │   ├── sliders.rs      # Sliders del home público
│   │   │   └── plugins.rs      # Sistema de plugins
│   │   ├── middleware/
│   │   │   └── auth.rs         # AuthUser y AuthUserWithRole (extrae JWT del request)
│   │   ├── models/             # Structs de base de datos y DTOs
│   │   ├── services/
│   │   │   ├── auth_service.rs # Hash/verify passwords, generar/validar JWT
│   │   │   └── email_service.rs# Envío de emails (reset password, bienvenida)
│   │   └── plugins/
│   │       └── registry.rs     # Plugin registry (hooks before_post_save, etc.)
│   └── migrations/             # Migraciones SQL (SQLx)
│
├── frontend/                   # SPA React + TypeScript
│   ├── src/
│   │   ├── App.tsx             # Router principal con rutas públicas y privadas
│   │   ├── api/                # Clientes HTTP por dominio
│   │   │   ├── client.ts       # Axios base con interceptor JWT y manejo 401
│   │   │   ├── auth.ts         # login, register, forgotPassword, resetPassword
│   │   │   ├── posts.ts        # CRUD posts
│   │   │   ├── media.ts        # Upload media
│   │   │   ├── sliders.ts      # CRUD sliders
│   │   │   └── menus.ts        # CRUD menús e ítems
│   │   ├── pages/
│   │   │   ├── Login.tsx       # Autenticación
│   │   │   ├── Register.tsx    # Registro público (requiere aprobación)
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── ResetPassword.tsx
│   │   │   ├── Dashboard.tsx   # Panel admin principal
│   │   │   ├── Stats.tsx       # Estadísticas del CMS
│   │   │   ├── Blog/           # Frontend público del blog
│   │   │   ├── Posts/          # CRUD posts en el admin
│   │   │   └── Plugins/
│   │   │       ├── SlidersAdmin.tsx  # Gestión de sliders
│   │   │       └── MenusAdmin.tsx    # Gestión de menús y sus ítems
│   │   ├── store/
│   │   │   └── authStore.ts    # Estado global de sesión (Zustand)
│   │   └── types/              # TypeScript interfaces
│
├── docker-compose.yml          # PostgreSQL + MailHog
└── README.md
```

### 🚀 Instalación local

#### Prerrequisitos
- [Rust](https://rustup.rs/) >= 1.75
- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) (para PostgreSQL y MailHog)

#### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/rustpress.git
cd rustpress
```

#### 2. Levantar servicios con Docker
```bash
docker-compose up -d
```
Esto inicia:
- **PostgreSQL** en `localhost:5432`
- **MailHog** en `localhost:8025` (interfaz web para ver emails)

#### 3. Configurar variables de entorno del backend
```bash
cd backend
cp .env.example .env
```
Edita `.env` con tus valores (ver sección Variables de Entorno).

#### 4. Ejecutar el backend
```bash
cd backend
cargo run
# El servidor inicia en http://localhost:8080
# Las migraciones se aplican automáticamente al arrancar
```

#### 5. Configurar e iniciar el frontend
```bash
cd frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

### ⚙️ Variables de entorno

Crea `backend/.env` basándote en `.env.example`:

```env
# Base de datos
DATABASE_URL=postgres://postgres:postgres@localhost:5432/rustcms

# Servidor
HOST=127.0.0.1
PORT=8080

# JWT — cambia esto en producción
JWT_SECRET=tu_secreto_super_seguro_aqui

# Frontend (para CORS y links en emails)
FRONTEND_URL=http://localhost:5173

# SMTP (MailHog en desarrollo)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@rustcms.dev

# Uploads
UPLOAD_DIR=./uploads
```

### 🔐 Autenticación y roles

El sistema usa **JWT stateless**. El token se almacena en `localStorage` del browser y se envía como `Authorization: Bearer <token>` en cada request.

El middleware `AuthUserWithRole` carga el rol del usuario desde la DB en cada request autenticado, permitiendo control granular de permisos.

**Roles disponibles:**
- `admin` — acceso completo
- `editor` — gestión de contenido
- (extensible mediante la tabla `roles` y el campo `permissions` JSON)

### 📡 API Endpoints principales

```
POST   /api/v1/auth/register          Registro de usuario
POST   /api/v1/auth/login             Login → devuelve JWT
GET    /api/v1/auth/me                Perfil del usuario autenticado
POST   /api/v1/auth/forgot-password   Solicitar reset de contraseña
POST   /api/v1/auth/reset-password    Resetear contraseña con token

GET    /api/v1/posts                  Listar posts (público)
POST   /api/v1/posts                  Crear post (autenticado)
PUT    /api/v1/posts/:id              Editar post
DELETE /api/v1/posts/:id              Eliminar post
GET    /api/v1/posts/stats            Estadísticas

GET    /api/v1/menus                  Listar menús
POST   /api/v1/menus                  Crear menú
GET    /api/v1/menu-items/:menu_id    Ítems de un menú
POST   /api/v1/menu-items/:menu_id    Agregar ítem

GET    /api/v1/sliders                Listar sliders
POST   /api/v1/sliders                Crear slider

GET    /health                        Health check
```

### 🗺️ Roadmap

- [ ] Aprobación de usuarios pendientes desde el admin
- [ ] Editor de contenido enriquecido (WYSIWYG)
- [ ] SEO metadata por post
- [ ] Sistema de comentarios
- [ ] Múltiples idiomas (i18n)
- [ ] API pública documentada con OpenAPI/Swagger
- [ ] Deploy en producción (Docker + nginx)
- [ ] Tests unitarios e integración

---

## 🇬🇧 English

### What is RustCMS?

RustCMS is an open-source Content Management System built with **Rust** on the backend and **React + TypeScript** on the frontend. It's designed to be fast, secure, and easy to extend — with support for posts, media, users, navigation menus, sliders, and a plugin system.

### 🛠️ Tech Stack

#### Backend — `./backend`
| Technology | Purpose |
|---|---|
| **Rust** | Primary language. Chosen for its performance, memory safety, and production reliability |
| **Actix-Web 4** | High-performance async HTTP framework for building the REST API |
| **SQLx** | Async ORM/query builder with compile-time query verification |
| **PostgreSQL** | Primary database. Robust and natively supported by SQLx |
| **JWT** | Stateless authentication. Each request validates the token without a DB call |
| **Argon2** | Secure password hashing. Modern standard resistant to brute-force attacks |
| **Lettre + MailHog** | Email service. MailHog captures emails in dev without sending real messages |
| **Tokio** | Async runtime for Rust. Handles thousands of concurrent connections efficiently |
| **Tracing** | Structured logging and request tracing |
| **Docker** | Containerization for PostgreSQL and MailHog in development |

#### Frontend — `./frontend`
| Technology | Purpose |
|---|---|
| **React 18** | UI library with modern hooks |
| **TypeScript** | Static typing to catch errors at development time, not in production |
| **Vite** | Ultra-fast build tool with instant HMR during development |
| **Tailwind CSS** | Inline CSS utilities for styling without leaving the component |
| **Axios** | HTTP client with interceptors for automatic JWT token handling |
| **Zustand** | Minimal global state management for user session |
| **React Router v6** | SPA navigation with protected routes (PrivateRoute) |
| **Lucide React** | Consistent modern icons throughout the UI |

### 🚀 Local Setup

#### Prerequisites
- [Rust](https://rustup.rs/) >= 1.75
- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) (for PostgreSQL and MailHog)

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/rustpress.git
cd rustpress
```

#### 2. Start services with Docker
```bash
docker-compose up -d
```

#### 3. Configure backend environment variables
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

#### 4. Run the backend
```bash
cd backend
cargo run
# Server starts at http://localhost:8080
# Migrations are applied automatically on startup
```

#### 5. Set up and start the frontend
```bash
cd frontend
npm install
npm run dev
# Available at http://localhost:5173
```

### ⚙️ Environment Variables

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/rustcms
HOST=127.0.0.1
PORT=8080
JWT_SECRET=your_super_secret_key_here
FRONTEND_URL=http://localhost:5173
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=noreply@rustcms.dev
UPLOAD_DIR=./uploads
```

### 🗺️ Roadmap

- [ ] Pending user approval from admin panel
- [ ] Rich text editor (WYSIWYG)
- [ ] SEO metadata per post
- [ ] Comments system
- [ ] Internationalization (i18n)
- [ ] Public API documentation with OpenAPI/Swagger
- [ ] Production deployment (Docker + nginx)
- [ ] Unit and integration tests

---

<div align="center">
Built with 🦀 Rust + ⚛️ React · MIT License
</div>
