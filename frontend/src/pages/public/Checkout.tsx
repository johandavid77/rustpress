import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, CreditCard, Tag } from 'lucide-react'
import { apiClient } from '../../api/client'

export default function Checkout() {
  const [cart, setCart]       = useState<any>(null)
  const [coupon, setCoupon]   = useState('')
  const [notes, setNotes]     = useState('')
  const [name, setName]       = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity]       = useState('')
  const [gateway, setGateway] = useState('stripe')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [done, setDone]       = useState<any>(null)

  useEffect(() => {
    fetch('/api/v1/shop/products?' + Object.keys(JSON.parse(localStorage.getItem('rustcms_cart') || '{}')).map(id => 'ids[]=' + id).join('&'))
      .then(r => r.json())
      .then((prods: any) => {
        const cartMap: Record<string, number> = JSON.parse(localStorage.getItem('rustcms_cart') || '{}')
        const prodList = Array.isArray(prods?.data) ? prods.data : Array.isArray(prods) ? prods : []
        const items = Object.entries(cartMap).map(([id, qty]) => {
          const p = prodList.find((x: any) => x.id === id)
          return p ? { id, product_id: id, name: p.name, price: p.price, quantity: qty, subtotal: p.price * qty } : null
        }).filter(Boolean)
        const total = items.reduce((acc: number, i: any) => acc + i.subtotal, 0)
        setCart({ items, total, coupon_discount: 0 })
      }).catch(() => setLoading(false))
  }, [])

  const place = async () => {
    if (!name.trim()) return alert('Ingresa tu nombre')
    setPlacing(true)
    try {
      const order: any = await apiClient.post('/orders', {
        coupon_code:   coupon || undefined,
        notes:         notes || undefined,
        shipping_addr: { name, address, city },
      })
      // Iniciar pago con pasarela seleccionada
      const payment: any = await apiClient.post('/payments/init', {
        order_id: order.order_id,
        gateway,
      })
      if (payment.checkout_url) {
        window.location.href = payment.checkout_url
      } else {
        setDone(order)
      }
    } catch(e: any) {
      alert(e?.response?.data?.error || 'Error al procesar el pago')
    } finally { setPlacing(false) }
  }

  if (done) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-black mb-2">¡Orden creada!</h1>
        <p className="text-[#888899] mb-2">Orden #{done.order_id?.slice(0,8).toUpperCase()}</p>
        <p className="text-2xl font-black text-[#7c6aff] mb-8">${done.total?.toFixed(2)}</p>
        <Link to="/shop" className="px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6]">
          Seguir comprando
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/cart" className="text-xl font-black">← <span className="text-[#7c6aff]">Carrito</span></Link>
          <h1 className="font-black flex items-center gap-2"><CreditCard size={18} /> Checkout</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {loading ? <p className="text-[#888899]">Cargando...</p> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-5">
              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
                <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-4">Datos de envío</p>
                <div className="flex flex-col gap-3">
                  <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                    placeholder="Nombre completo *" value={name} onChange={e => setName(e.target.value)} />
                  <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                    placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} />
                  <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                    placeholder="Ciudad" value={city} onChange={e => setCity(e.target.value)} />
                  <textarea className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455] resize-none"
                    rows={2} placeholder="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
                <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-3 flex items-center gap-2"><Tag size={11} />Cupón</p>
                <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455] font-mono"
                  placeholder="CODIGO" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} />
              </div>

              <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
                <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-3">Método de pago</p>
                <div className="flex gap-3">
                  {[{id:'stripe',label:'💳 Stripe'},{id:'paypal',label:'🅿️ PayPal'}].map(g => (
                    <button key={g.id} onClick={() => setGateway(g.id)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${gateway === g.id ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 h-fit">
              <h2 className="font-black mb-4">Tu orden</h2>
              <div className="flex flex-col gap-2 mb-4">
                {cart?.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[#888899] truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
                    <span className="font-mono shrink-0">${item.subtotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-black text-lg pt-3 border-t border-[#2a2a3a] mb-6">
                <span>Total</span><span className="text-[#7c6aff]">${cart?.total?.toFixed(2)}</span>
              </div>
              <button onClick={place} disabled={placing || !cart?.items?.length}
                className="w-full py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                <CreditCard size={16} />{placing ? 'Procesando...' : `Pagar con ${gateway === 'stripe' ? 'Stripe' : 'PayPal'}`}
              </button>
              <p className="text-xs text-[#555566] text-center mt-3">Serás redirigido a la pasarela de pago</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
