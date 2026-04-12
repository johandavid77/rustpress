import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../api/client'

interface CartItem {
  id: string; product_id: string; name: string
  slug: string; images: string[]; quantity: number
  price: number; subtotal: number
}

export default function Cart() {
  const [items, setItems]     = useState<CartItem[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/cart')
      setItems(Array.isArray(res?.items) ? res.items : [])
      setTotal(res?.total || 0)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const update = async (id: string, quantity: number) => {
    try {
      await apiClient.put(`/cart/items/${id}`, { quantity })
      load()
    } catch(e) { console.error(e) }
  }

  const remove = async (id: string) => {
    try {
      await apiClient.delete(`/cart/items/${id}`)
      load()
    } catch(e) { console.error(e) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/shop" className="text-xl font-black tracking-tight">← <span className="text-[#7c6aff]">Tienda</span></Link>
          <h1 className="font-black">Carrito</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {loading && <p className="text-[#888899]">Cargando...</p>}
        {!loading && items.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <ShoppingCart size={48} className="mx-auto mb-4" />
            <p className="font-bold mb-4">Tu carrito está vacío</p>
            <Link to="/shop" className="text-[#7c6aff] hover:underline">Ver productos</Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-3">
              {items.map(item => (
                <div key={item.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#1a1a24] rounded-lg overflow-hidden shrink-0">
                    {item.images?.[0]
                      ? <img src={item.images[0]} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingCart size={20} className="text-[#333344]" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-[#7c6aff] font-mono text-sm">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => update(item.id, item.quantity - 1)}
                      className="w-7 h-7 border border-[#2a2a3a] rounded-lg flex items-center justify-center hover:border-[#7c6aff] transition-all">
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => update(item.id, item.quantity + 1)}
                      className="w-7 h-7 border border-[#2a2a3a] rounded-lg flex items-center justify-center hover:border-[#7c6aff] transition-all">
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="font-black text-sm w-16 text-right">${item.subtotal.toFixed(2)}</p>
                  <button onClick={() => remove(item.id)} className="text-[#555566] hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 h-fit">
              <h2 className="font-black mb-4">Resumen</h2>
              <div className="flex justify-between text-sm text-[#888899] mb-2">
                <span>Subtotal</span><span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-lg pt-3 border-t border-[#2a2a3a] mb-6">
                <span>Total</span><span className="text-[#7c6aff]">${total.toFixed(2)}</span>
              </div>
              <button onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] transition-all flex items-center justify-center gap-2">
                Proceder al pago <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
