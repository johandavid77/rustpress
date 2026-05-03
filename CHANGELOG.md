# Changelog

## [Unreleased]

## [0.1.0] - 2025-05-02

### Added
- Autenticación JWT con refresh tokens y 2FA TOTP
- Gestión completa de posts con editor TipTap (rich text)
- Ecommerce: productos, órdenes, cupones, carrito, checkout
- Variantes de productos (talla, color, etc.)
- Sistema de reviews y comentarios
- Gestor de medios con upload, optimización de imágenes y thumbnails automáticos
- Soporte S3/Cloudflare R2 para almacenamiento de archivos
- GraphQL API además de REST
- Vector search con pgvector para búsqueda semántica
- WebSockets para chat en tiempo real y notificaciones
- Multi-tenancy
- Dashboard con drag & drop de widgets
- Reportes de ventas en PDF
- Backup automático de DB cada 24h
- Monitor de uptime integrado
- Rate limiting diferenciado por endpoint
- Audit log de acciones de usuarios
- Sistema de plugins
- Newsletter con campañas
- Formularios de contacto
- Cupones y descuentos
- Sistema de bookings/reservas
- Webhooks configurables
- API Keys para acceso externo
- Roles y permisos granulares
- Redirects gestionables
- Sliders/Hero configurables
- Menús dinámicos
- Sitemap XML automático
- RSS/Atom feed
- SEO: og:image, meta tags, preview
- i18n (internacionalización)
- Command Palette (Cmd+K)
- Modo oscuro/claro
- OpenAPI / Swagger UI en /api-docs
- Tests e2e con Playwright
- Migraciones automáticas con SQLx
- pgAdmin incluido en docker-compose

### Security
- bcrypt para hashing de contraseñas
- Rate limiting con actix-governor
- CORS configurado
- Validación de MIME types en uploads
- SHA2 para API keys
- Dependencias auditadas con cargo-audit
