content = r"""# 🦀 RustPress

> CMS de alto rendimiento construido con **Rust + Actix-web** en el backend y **React + TypeScript** en el frontend.

![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Características

- 🔐 Autenticación JWT + 2FA (TOTP)
- 📝 Gestión de posts con editor rico
- 🛒 Ecommerce completo (productos, órdenes, cupones, carrito)
- 📊 Dashboard con drag & drop de widgets
- 📄 Reportes de ventas en PDF descargables
- 🔔 Notificaciones de pedidos pendientes en tiempo real
- 🗃️ Gestor de medios con imágenes
- 📧 Newsletter con campañas
- 🔒 Audit log de acciones
- 💾 Backup automático de base de datos
- 🌐 Modo mantenimiento configurable
- ⚡ Command Palette (Cmd+K)

---

## 🛠️ Requisitos

| Herramienta        | Versión mínima |
|--------------------|---------------|
| Rust               | 1.75+         |
| Node.js            | 18+           |
| PostgreSQL         | 14+           |
| Podman o Docker    | cualquiera    |

---

## 🚀 Instalación rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/johandavid77/rustpress.git
cd rustpress
```

### 2. Levantar la base de datos

```bash
# Con Podman
podman-compose up -d

# Con Docker
docker-compose up -d

# Verificar que PostgreSQL esté corriendo
podman ps
```

### 3. Configurar el backend

```bash
cd backend

cat > .env << 'ENVEOF'
DATABASE_URL=postgres://rustcms:rustcms_secret@localhost/rustcms
JWT_SECRET=cambia_esto_por_un_secreto_seguro
REDIS_URL=redis://localhost:6379
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@tudominio.com
APP_URL=http://localhost:8080
ENVEOF
```

### 4. Compilar y correr el backend

```bash
# Dentro de backend/
cargo build --release

# Desarrollo
DATABASE_URL="postgres://rustcms:rustcms_secret@localhost/rustcms" \
JWT_SECRET="cambia_esto_por_un_secreto_seguro" \
cargo run
```

> El backend estará en `http://localhost:8080`
> Verifica con: `curl http://localhost:8080/health`

### 5. Instalar y correr el frontend

```bash
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```

> El frontend estará en `http://localhost:5173`

### 6. Cargar datos de demostración

```bash
# Desde la raíz del proyecto
podman exec -i rustcms-postgres psql -U rustcms -d rustcms < seed.sql

# Con Docker
docker exec -i rustcms-postgres psql -U rustcms -d rustcms < seed.sql
```

#### Usuarios de prueba

| Usuario  | Email                | Contraseña  | Rol    |
|----------|----------------------|-------------|--------|
| admin    | admin@rustpress.dev  | password123 | Admin  |
| editor1  | editor@rustpress.dev | password123 | Editor |
| autor1   | autor@rustpress.dev  | password123 | Author |
| johndoe  | john@example.com     | password123 | Viewer |

---

## 📁 Estructura del proyecto

```
rustpress/
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   │   ├── auth.rs
│   │   │   ├── posts.rs
│   │   │   ├── products_shop.rs
│   │   │   ├── orders.rs
│   │   │   ├── reports.rs
│   │   │   ├── backup.rs
│   │   │   └── ...
│   │   ├── middleware/
│   │   ├── errors.rs
│   │   └── main.rs
│   ├── migrations/
│   └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── api/
│   └── package.json
├── docker-compose.yml
├── seed.sql
└── README.md
```

---

## 🔌 API Endpoints principales

### Auth
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/2fa/enable
```

### Posts
```
GET    /api/v1/posts
POST   /api/v1/posts
PUT    /api/v1/posts/:id
DELETE /api/v1/posts/:id
```

### Ecommerce
```
GET    /api/v1/products
POST   /api/v1/orders
GET    /api/v1/orders
POST   /api/v1/coupons/validate
```

### Reportes y Backup
```
GET    /api/v1/reports/sales/pdf
GET    /api/v1/reports/orders/pdf
POST   /api/v1/backup
GET    /api/v1/backup/list
GET    /api/v1/backup/status
```

---

## 🐳 Docker / Podman compose

El archivo `docker-compose.yml` levanta:

- **PostgreSQL 15** — puerto `5432`
- **Redis** — puerto `6379`
- **MailHog** (SMTP de pruebas) — puerto `1025` / UI en `8025`

```bash
# Levantar
podman-compose up -d

# Ver logs
podman-compose logs -f

# Detener
podman-compose down
```

---

## ⚙️ Variables de entorno

| Variable      | Descripción                    | Ejemplo                                  |
|---------------|--------------------------------|------------------------------------------|
| DATABASE_URL  | Conexión a PostgreSQL          | postgres://user:pass@localhost/rustcms   |
| JWT_SECRET    | Secreto para tokens JWT        | cadena aleatoria de 64+ caracteres       |
| REDIS_URL     | Conexión a Redis               | redis://localhost:6379                   |
| SMTP_HOST     | Servidor de correo saliente    | smtp.gmail.com                           |
| SMTP_PORT     | Puerto SMTP                    | 587                                      |
| SMTP_FROM     | Email remitente                | noreply@tudominio.com                    |
| APP_URL       | URL pública del backend        | https://api.tudominio.com                |
| S3_BUCKET     | Bucket para backups (opcional) | rustpress-backups                        |
| S3_ENDPOINT   | Endpoint S3/R2 (opcional)      | https://xxx.r2.cloudflarestorage.com     |

---

## 🔧 Comandos útiles

```bash
# Ver errores de compilación Rust
cargo build 2>&1 | grep "^error"

# Correr tests
cargo test

# Build producción frontend
cd frontend && npm run build

# Conectar a la DB
podman exec -it rustcms-postgres psql -U rustcms -d rustcms

# Limpiar y re-seedear
podman exec -i rustcms-postgres psql -U rustcms -d rustcms -c \
  "TRUNCATE users, posts, products, orders, media CASCADE;"
podman exec -i rustcms-postgres psql -U rustcms -d rustcms < seed.sql
```

---

## 📦 Tech Stack

**Backend**
- [Rust](https://www.rust-lang.org/) — lenguaje de sistemas
- [Actix-web 4](https://actix.rs/) — framework HTTP
- [SQLx](https://github.com/launchbadge/sqlx) — queries SQL async
- [PostgreSQL](https://www.postgresql.org/) — base de datos
- [printpdf](https://github.com/fschutt/printpdf) — generación de PDFs

**Frontend**
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [@dnd-kit](https://dndkit.com/) — drag & drop
- [Lucide Icons](https://lucide.dev/)

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crea tu rama: `git checkout -b feature/mi-feature`
3. Commit: `git commit -m "feat: descripción"`
4. Push: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

GPL3 © 2026 Johan David

---

<p align="center">Construido con 🦀 Rust y ❤️</p>
"""

with open('/home/johan/Desarrollo/Rust/rustpress/README.md', 'w') as f:
    f.write(content)

print("README.md escrito correctamente")
print(f"Líneas: {len(content.splitlines())}")
