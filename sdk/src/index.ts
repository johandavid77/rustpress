/**
 * RustPress CMS SDK
 * @version 1.0.0
 * @license GPL-3.0
 */

export interface RustPressConfig {
  baseUrl: string
  token?: string
  timeout?: number
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  status: 'draft' | 'published'
  author_id: string
  created_at: string
  updated_at: string
  views: number
  cover_image?: string
  tags?: string[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  compare_price?: number
  stock: number
  images: string[]
  status: 'active' | 'inactive'
  category_id?: string
}

export interface Order {
  id: string
  status: string
  total: number
  currency: string
  items: OrderItem[]
  created_at: string
}

export interface OrderItem {
  id: string
  product_id: string
  name: string
  quantity: number
  price: number
  total: number
}

export interface User {
  id: string
  username: string
  email: string
  role_id?: string
  role_name?: string
  avatar?: string
  bio?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
  message?: string
  status: number
}

class RustPressError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'RustPressError'
    this.status = status
  }
}

export class RustPressClient {
  private baseUrl: string
  private token: string | null
  private timeout: number

  constructor(config: RustPressConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') + '/api/v1'
    this.token = config.token ?? null
    this.timeout = config.timeout ?? 10000
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isFormData = false
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {}

    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    if (!isFormData) headers['Content-Type'] = 'application/json'

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new RustPressError(err.error ?? err.message ?? 'API Error', res.status)
      }

      if (res.status === 204) return undefined as T
      return res.json()
    } catch (e) {
      if (e instanceof RustPressError) throw e
      throw new RustPressError((e as Error).message, 0)
    }
  }

  /** Set auth token after login */
  setToken(token: string) { this.token = token }
  clearToken() { this.token = null }

  // ==================== AUTH ====================

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('POST', '/auth/login', { email, password })
    this.token = res.token
    return res
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return this.request('POST', '/auth/register', { username, email, password })
  }

  async me(): Promise<User> {
    return this.request('GET', '/auth/me')
  }

  // ==================== POSTS ====================

  async getPosts(params?: {
    search?: string
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedResponse<Post>> {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return this.request('GET', `/posts${q ? '?' + q : ''}`)
  }

  async getPost(id: string): Promise<Post> {
    return this.request('GET', `/posts/${id}`)
  }

  async getPostBySlug(slug: string): Promise<Post> {
    return this.request('GET', `/posts/slug/${slug}`)
  }

  async createPost(post: Partial<Post>): Promise<Post> {
    return this.request('POST', '/posts', post)
  }

  async updatePost(id: string, post: Partial<Post>): Promise<Post> {
    return this.request('PUT', `/posts/${id}`, post)
  }

  async deletePost(id: string): Promise<void> {
    return this.request('DELETE', `/posts/${id}`)
  }

  async trackView(slug: string): Promise<void> {
    return this.request('POST', `/posts/${slug}/view`)
  }

  // ==================== SHOP ====================

  async getProducts(params?: {
    search?: string
    category?: string
    min_price?: number
    max_price?: number
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Product>> {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return this.request('GET', `/shop/products${q ? '?' + q : ''}`)
  }

  async getProduct(id: string): Promise<Product> {
    return this.request('GET', `/shop/products/${id}`)
  }

  async getProductBySlug(slug: string): Promise<Product> {
    return this.request('GET', `/shop/products/slug/${slug}`)
  }

  async getCategories(): Promise<{ id: string; name: string; slug: string }[]> {
    return this.request('GET', '/shop/categories')
  }

  // ==================== ORDERS ====================

  async getOrders(): Promise<Order[]> {
    return this.request('GET', '/orders')
  }

  async createOrder(items: { product_id: string; quantity: number }[]): Promise<Order> {
    return this.request('POST', '/orders', { items })
  }

  async initPayment(orderId: string, provider: 'stripe' | 'paypal'): Promise<{ url?: string; client_secret?: string }> {
    return this.request('POST', '/payments/init', { order_id: orderId, provider })
  }

  // ==================== MEDIA ====================

  async uploadMedia(file: File): Promise<{ url: string; filename: string; size: number }> {
    const fd = new FormData()
    fd.append('file', file)
    return this.request('POST', '/media/upload', fd, true)
  }

  async getMedia(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<{ id: string; url: string; filename: string; mime_type: string; size: number }>> {
    const q = new URLSearchParams(params as Record<string, string>).toString()
    return this.request('GET', `/media${q ? '?' + q : ''}`)
  }

  // ==================== ANALYTICS ====================

  async trackEvent(event: string, data?: Record<string, unknown>): Promise<void> {
    return this.request('POST', '/analytics/track', { event, ...data })
  }

  async getDashboard(): Promise<Record<string, unknown>> {
    return this.request('GET', '/analytics/dashboard')
  }

  async getRevenueMonthly(): Promise<{ month: string; revenue: number; orders: number }[]> {
    const res: any = await this.request('GET', '/analytics/revenue-monthly')
    return res?.data ?? res
  }

  async getTopProducts(): Promise<{ id: string; name: string; total_sold: number; total_revenue: number }[]> {
    const res: any = await this.request('GET', '/analytics/top-products-sales')
    return res?.data ?? res
  }

  // ==================== SETTINGS ====================

  async getSettings(): Promise<Record<string, string>> {
    return this.request('GET', '/settings')
  }

  async setSetting(key: string, value: string): Promise<void> {
    return this.request('POST', '/settings', { key, value })
  }

  // ==================== NEWSLETTER ====================

  async subscribe(email: string, name?: string): Promise<void> {
    return this.request('POST', '/newsletter/subscribe', { email, name })
  }

  // ==================== SEARCH ====================

  async search(query: string): Promise<{ posts: Post[]; products: Product[] }> {
    return this.request('GET', `/search?q=${encodeURIComponent(query)}`)
  }

  // ==================== HEALTH ====================

  async health(): Promise<{ status: string; version: string }> {
    return this.request('GET', '/health')
  }

  async uptime(): Promise<{ uptime_pct: number; total_checks: number; events: { status: string; checked_at: string }[] }> {
    return this.request('GET', '/uptime')
  }
}

/** Create a RustPress client instance */
export function createClient(config: RustPressConfig): RustPressClient {
  return new RustPressClient(config)
}

export default RustPressClient
