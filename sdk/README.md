# @rustpress/sdk

JavaScript/TypeScript SDK para la API de RustPress CMS.

## Instalación

```bash
npm install @rustpress/sdk
# o
pnpm add @rustpress/sdk
```

## Uso rápido

```typescript
import { createClient } from '@rustpress/sdk'

const client = createClient({
  baseUrl: 'https://tu-sitio.com',
  token: 'tu-jwt-token', // opcional, para endpoints protegidos
})

// Auth
const { token, user } = await client.login('admin@ejemplo.com', 'password')

// Posts
const posts = await client.getPosts({ page: 1, limit: 10 })
const post  = await client.getPostBySlug('mi-primer-post')

// Tienda
const products = await client.getProducts({ sort: 'newest', min_price: 10 })
const product  = await client.getProductBySlug('camiseta-azul')

// Orden y pago
const order = await client.createOrder([{ product_id: product.id, quantity: 2 }])
const pay   = await client.initPayment(order.id, 'stripe')
window.location.href = pay.url!

// Media
const file = document.querySelector('input[type=file]').files[0]
const { url } = await client.uploadMedia(file)

// Analytics
await client.trackEvent('page_view', { path: '/shop' })

// Newsletter
await client.subscribe('usuario@ejemplo.com', 'Juan')

// Búsqueda
const results = await client.search('zapatillas')
```

## Métodos disponibles

| Módulo | Método | Auth |
|--------|--------|------|
| Auth | `login(email, password)` | No |
| Auth | `register(username, email, password)` | No |
| Auth | `me()` | Sí |
| Posts | `getPosts(params?)` | No |
| Posts | `getPostBySlug(slug)` | No |
| Posts | `createPost(post)` | Sí |
| Posts | `updatePost(id, post)` | Sí |
| Posts | `deletePost(id)` | Sí |
| Shop | `getProducts(params?)` | No |
| Shop | `getProductBySlug(slug)` | No |
| Shop | `getCategories()` | No |
| Orders | `createOrder(items)` | Sí |
| Orders | `initPayment(orderId, provider)` | Sí |
| Media | `uploadMedia(file)` | Sí |
| Analytics | `trackEvent(event, data?)` | No |
| Analytics | `getDashboard()` | Sí |
| Newsletter | `subscribe(email, name?)` | No |
| Search | `search(query)` | Sí |
| Health | `health()` | No |
| Health | `uptime()` | Sí |

## Licencia

GPL-3.0 © 2026 Johan David
