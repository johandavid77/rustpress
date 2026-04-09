import SEO from '../../components/SEO/SEO'
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

  useEffect(() => { load() }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${search}&status=active` : '?status=active'
      const res: any = await apiClient.get(`/shop/products${params}`)
      setProducts(Array.isArray(res?.data) ? res.data : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const addToCart = async (productId: string) => {
    try {
      await apiClient.post('/cart/items', { product_id: productId, quantity: 1 })
      setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
    } catch(e) { console.error(e) }
  }

  const totalInCart = Object.values(cart).reduce((a, b) => a + b, 0)

  return (
    <>
    <SEO title="Tienda" description="Explora nuestros productos. Envio rapido y seguro." type="website" url="/shop" />
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight">RustCMS <span className="text-[#7c6aff]">Shop</span></Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-[#555566]" />
              <input className="pl-9 pr-4 py-2 bg-[#111118] border border-[#2a2a3a] rounded-lg text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455] w-48"
                placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Link to="/cart" className="relative p-2 border border-[#2a2a3a] rounded-lg hover:border-[#7c6aff] transition-all">
              <ShoppingCart size={18} />
              {totalInCart > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#7c6aff] rounded-full text-[10px] flex items-center justify-center font-bold">
                  {totalInCart}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Productos */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black mb-8">Tienda</h1>
        {loading && <p className="text-[#888899]">Cargando productos...</p>}
        {!loading && products.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <ShoppingCart size={48} className="mx-auto mb-4" />
            <p className="font-bold">No hay productos disponibles</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-[#111118] border border-[#2a2a3a] rounded-2xl overflow-hidden hover:border-[#7c6aff]/50 transition-all group">
              <div className="aspect-square bg-[#1a1a24] relative overflow-hidden">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-[#333344]"><ShoppingCart size={32} /></div>
                }
                {p.compare_price && p.compare_price > p.price && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - p.price / p.compare_price) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm mb-1 truncate">{p.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-black text-[#7c6aff]">${p.price.toFixed(2)}</span>
                  {p.compare_price && p.compare_price > p.price && (
                    <span className="text-xs text-[#555566] line-through">${p.compare_price.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex gap-2 mb-2">
                  <Link to={`/shop/${p.slug}`}
                    className="flex-1 py-2 border border-[#2a2a3a] hover:border-[#7c6aff]/50 rounded-lg text-xs font-semibold text-[#888899] hover:text-white text-center transition-all">
                    Ver detalle
                  </Link>
                </div>
                <button onClick={() => addToCart(p.id)}
                  disabled={p.stock === 0}
                  className="w-full py-2 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {p.stock === 0 ? 'Agotado' : cart[p.id] ? `✓ En carrito (${cart[p.id]})` : 'Agregar al carrito'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
    </>
  )
}
