import { useState, useEffect, useRef } from 'react'
import { Bell, ShoppingBag, AlertTriangle, X, Check } from 'lucide-react'

interface NotifData {
  pending_orders: number
  total_orders: number
  new_order: boolean
  low_stock: number
}

interface Toast {
  id: number
  msg: string
  type: 'order' | 'stock'
}

export default function NotificationBell({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [data, setData] = useState<NotifData | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [open, setOpen] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const toastId = useRef(0)

  const addToast = (msg: string, type: 'order' | 'stock') => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000)
  }

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    const connect = () => {
      const es = new EventSource('/api/v1/notifications/stream?token=' + token)
      esRef.current = es
      es.onmessage = (e) => {
        try {
          const d: NotifData = JSON.parse(e.data)
          setData(prev => {
            if (d.new_order) addToast('Nuevo pedido recibido', 'order')
            if (prev && d.low_stock > prev.low_stock) addToast(d.low_stock + ' producto(s) con stock bajo', 'stock')
            return d
          })
        } catch(_) {}
      }
      es.onerror = () => { es.close(); setTimeout(connect, 10000) }
    }
    connect()
    return () => esRef.current?.close()
  }, [])

  const total = (data?.pending_orders ?? 0) + (data?.low_stock ?? 0)

  return (
    <div className="relative">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={"pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium " + (t.type === 'order' ? 'bg-[#13131f] border-[#7c6aff]/40 text-white' : 'bg-[#13131f] border-yellow-500/40 text-white')}>
            {t.type === 'order' ? <ShoppingBag size={15} className="text-[#7c6aff] shrink-0" /> : <AlertTriangle size={15} className="text-yellow-400 shrink-0" />}
            <span className="flex-1">{t.msg}</span>
            <button onClick={() => setToasts(x => x.filter(i => i.id !== t.id))}><X size={13} className="text-[#555566] hover:text-white" /></button>
          </div>
        ))}
      </div>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
        <Bell size={18} className={total > 0 ? 'text-[#7c6aff]' : 'text-[#555566]'} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#7c6aff] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-72 bg-[#13131f] border border-[#2a2a3a] rounded-2xl shadow-2xl z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">Notificaciones</span>
            <button onClick={() => setOpen(false)}><X size={13} className="text-[#555566] hover:text-white" /></button>
          </div>
          {!data ? (
            <div className="py-8 text-center text-[#555566] text-sm">Conectando...</div>
          ) : (
            <div className="divide-y divide-[#1e1e2e]">
              {data.pending_orders > 0 ? (
                <button onClick={() => { onNavigate('shop-orders'); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] text-left">
                  <ShoppingBag size={15} className="text-[#7c6aff] shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-white">{data.pending_orders} pedido(s) pendiente(s)</div>
                    <div className="text-xs text-[#555566]">Requieren atencion</div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Check size={15} className="text-green-400 shrink-0" />
                  <div className="text-sm text-[#888899]">Sin pedidos pendientes</div>
                </div>
              )}
              {data.low_stock > 0 ? (
                <button onClick={() => { onNavigate('shop-products'); setOpen(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] text-left">
                  <AlertTriangle size={15} className="text-yellow-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-white">{data.low_stock} producto(s) con stock bajo</div>
                    <div className="text-xs text-[#555566]">Stock menor a 5 unidades</div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Check size={15} className="text-green-400 shrink-0" />
                  <div className="text-sm text-[#888899]">Stock en niveles normales</div>
                </div>
              )}
              <div className="px-4 py-2 text-[10px] text-[#333344] text-center">
                {data.total_orders} pedidos totales · Actualiza cada 15s
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
