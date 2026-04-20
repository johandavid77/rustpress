# RustPress Mobile Admin

App móvil para gestionar RustPress CMS desde Android e iOS.

## Funcionalidades

- 🔐 Login con URL configurable del servidor
- 📊 Dashboard con KPIs en tiempo real (posts, orders, revenue, uptime)
- 📝 Gestión de posts — ver, eliminar
- 🛍️ Pedidos con estado y totales
- 🔄 Pull-to-refresh en todas las pantallas
- 🌙 Dark theme nativo

## Instalación

```bash
npm install
npx expo start
```

## Build

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

## Configuración

Al abrir la app, ingresa la URL de tu servidor RustPress (ej: `https://tudominio.com`).
