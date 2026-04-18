import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'

interface WishItem {
  id: string
  name: string
  price: number
  slug: string
  images: string[]
}

export default function Wishlist() {
  const [items, setItems] = useState<WishItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rustcms_wishlist')
      if (saved) setItems(JSON.parse(saved))
    } catch(_) {}
  }, [])

  const remove = (id: string) => {
    const next = items.filter(i => i.id !== id)
    setItems(next)
    localStorage.setItem('rustcms_wishlist', JSON.stringify(next))
  }

  const addToCart = (item: WishItem) => {
    try {
      const saved = localStorage.getItem('rustcms_cart')
      const cart: Record<string, number> = saved ? JSON.parse(saved) : {}
      cart[item.id] = (cart[item.id] || 0) + 1
      localStorage.setItem('rustcms_cart', JSON.stringify(cart))
    } catch(_) {}
  }

  if (items.length === 0) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-6">
      <Heart size={48} className="text-[#555566]" />
      <h1 className="text-2xl font-black">Tu lista de deseos está vacía</h1>
      <Link to="/shop" className="px-6 py-3 bg-[#7c6aff] rounded-xl text-white font-semibold hover:bg-[#6a58e8] transition-all">
        Ver productos
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/shop" className="text-xl font-black">
            RustCMS <span className="text-[#7c6aff]">Shop</span>
          </Link>
          <h1 className="font-black text-lg flex items-center gap-2">
            <Heart size={18} className="text-[#7c6aff]" /> Lista de deseos ({items.length})
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.id} className="group rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] overflow-hidden hover:border-[#7c6aff]/50 transition-all">
            <Link to={`/shop/${item.slug}`}>
              <div className="aspect-square bg-[#1a1a2e] overflow-hidden">
                {item.images[0]
                  ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  : <div className="w-full h-full flex items-center justify-center"><Heart size={24} className="text-[#333344]" /></div>
                }
              </div>
            </Link>
            <div className="p-3">
              <Link to={`/shop/${item.slug}`}>
                <h3 className="text-sm font-semibold text-white mb-1 truncate hover:text-[#7c6aff]">{item.name}</h3>
              </Link>
              <p className="text-[#7c6aff] font-black mb-3">${item.price.toFixed(2)}</p>
              <div className="flex gap-2">
                <button onClick={() => addToCart(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-xs font-bold transition-all">
                  <ShoppingCart size={12} /> Agregar
                </button>
                <button onClick={() => remove(item.id)}
                  className="p-1.5 rounded-lg border border-[#2a2a3a] text-[#555566] hover:text-red-400 hover:border-red-500/30 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
