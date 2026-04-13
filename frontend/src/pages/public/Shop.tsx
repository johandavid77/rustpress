import SEO from '../../components/SEO/SEO'
import NewsletterWidget from '../../components/Newsletter/NewsletterWidget'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Search, Filter } from 'lucide-react'
import { apiClient } from '../../api/client'

interface Product {
  id: string; name: string; slug: string; price: number
  compare_price: number | null; stock: number; images: string[]
  status: string
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [cart, setCart]         = useState<Record<string, number>>({})

  useEffect(() => {
    try {
      const s = localStorage.getItem('rustcms_cart')
      if (s) setCart(JSON.parse(s))
    } catch(_) {}
    load()
  }, [])

  useEffect(() => { load() }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${search}&status=active` : '?status=active'
      const res: any = await apiClient.get(`/shop/products${params}`)
      setProducts(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const addToCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev, [productId]: (prev[productId] || 0) + 1 }
      try { localStorage.setItem('rustcms_cart', JSON.stringify(next)) } catch(_) {}
      return next
    })
  }

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <SEO title="Tienda" description="Productos disponibles en nuestra tienda" />

      {/* Header */}
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-black shrink-0">
            RustCMS <span className="text-[#7c6aff]">Shop</span>
          </Link>
          <div className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]"
            />
          </div>
          <Link to="/cart" className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2a2a3a] hover:border-[#7c6aff] transition-all">
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#7c6aff] text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <span className="text-sm hidden sm:block">Carrito</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">Tienda</h1>
          <p className="text-[#888899] text-sm">{products.length} productos disponibles</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] overflow-hidden animate-pulse">
                <div className="aspect-square bg-[#1a1a2e]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#1a1a2e] rounded w-3/4" />
                  <div className="h-4 bg-[#1a1a2e] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-[#555566] border border-[#2a2a3a] rounded-2xl">
            <Filter size={32} className="mx-auto mb-3 opacity-30" />
            <p>No hay productos disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => {
              const inCart = cart[product.id] || 0
              const discount = product.compare_price && product.compare_price > product.price
                ? Math.round((1 - product.price / product.compare_price) * 100)
                : null

              return (
                <div key={product.id} className="group rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] overflow-hidden hover:border-[#7c6aff]/50 transition-all">
                  <Link to={`/shop/${product.slug}`} className="block">
                    <div className="aspect-square bg-[#1a1a2e] relative overflow-hidden">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart size={32} className="text-[#333344]" />
                        </div>
                      )}
                      {discount && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-green-500 text-white text-xs font-bold">
                          -{discount}%
                        </div>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#888899]">Agotado</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link to={`/shop/${product.slug}`}>
                      <h3 className="text-sm font-semibold text-white mb-1 truncate hover:text-[#7c6aff] transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-black text-[#7c6aff]">${product.price.toFixed(2)}</span>
                      {product.compare_price && (
                        <span className="text-xs text-[#555566] line-through">${product.compare_price.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock === 0}
                      className={"w-full py-2 rounded-xl text-xs font-bold transition-all " + (
                        inCart > 0
                          ? 'bg-[#7c6aff]/20 border border-[#7c6aff] text-[#7c6aff]'
                          : 'bg-[#7c6aff] hover:bg-[#6a58e8] text-white disabled:opacity-40 disabled:cursor-not-allowed'
                      )}>
                      {inCart > 0 ? `En carrito (${inCart})` : 'Agregar al carrito'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-20">
          <NewsletterWidget />
        </div>
      </main>
    </div>
  )
}
