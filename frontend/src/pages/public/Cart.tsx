import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  slug: string
  images: string[]
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([])
  const navigate = useNavigate()

  useEffect(() => { loadFromStorage() }, [])

  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('rustcms_cart')
      const cartMap: Record<string, number> = saved ? JSON.parse(saved) : {}
      const cartItems: CartItem[] = Object.entries(cartMap).map(([id, qty]) => ({
        id,
        name: id,
        price: 0,
        quantity: qty,
        slug: id,
        images: [],
      }))
      setItems(cartItems)

      // Enriquecer con datos reales de productos
      Object.keys(cartMap).forEach(async (pid) => {
        try {
          const res = await fetch('/api/v1/shop/products/' + pid)
          const p = await res.json()
          if (p?.id) {
            setItems(prev => prev.map(item =>
              item.id === pid
                ? { ...item, name: p.name, price: p.price, slug: p.slug, images: p.images ?? [] }
                : item
            ))
          }
        } catch(_) {}
      })
    } catch(_) {}
  }

  const update = (id: string, quantity: number) => {
    try {
      const saved = localStorage.getItem('rustcms_cart')
      const cartMap: Record<string, number> = saved ? JSON.parse(saved) : {}
      if (quantity <= 0) delete cartMap[id]
      else cartMap[id] = quantity
      localStorage.setItem('rustcms_cart', JSON.stringify(cartMap))
      loadFromStorage()
    } catch(_) {}
  }

  const remove = (id: string) => update(id, 0)

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  const handleCheckout = () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  if (items.length === 0) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-6">
      <ShoppingCart size={48} className="text-[#555566]" />
      <h1 className="text-2xl font-black">Tu carrito esta vacio</h1>
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
          <h1 className="font-black text-lg">Carrito ({totalItems})</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-4">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a2e] shrink-0">
              {item.images[0]
                ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ShoppingCart size={20} className="text-[#555566]" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{item.name || item.id}</div>
              <div className="text-[#7c6aff] font-bold">${item.price > 0 ? item.price.toFixed(2) : '...'}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => update(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] flex items-center justify-center hover:border-[#7c6aff] transition-all">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold">{item.quantity}</span>
              <button onClick={() => update(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-lg bg-[#1a1a2e] border border-[#2a2a3a] flex items-center justify-center hover:border-[#7c6aff] transition-all">
                <Plus size={14} />
              </button>
            </div>
            <div className="w-20 text-right font-bold">
              {item.price > 0 ? '$' + (item.price * item.quantity).toFixed(2) : '...'}
            </div>
            <button onClick={() => remove(item.id)} className="text-[#555566] hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <div className="mt-4 p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#888899]">Total</span>
            <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
          </div>
          <button onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#7c6aff] hover:bg-[#6a58e8] rounded-xl text-white font-bold transition-all">
            Proceder al pago <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
