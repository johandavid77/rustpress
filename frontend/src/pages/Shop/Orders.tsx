import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { ShoppingBag, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'

interface Order {
  id: string; status: string; total: number
  currency: string; payment_method: string | null; created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Pendiente',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
  paid:       { label: 'Pagado',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       icon: CheckCircle },
  processing: { label: 'Procesando',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Clock },
  shipped:    { label: 'Enviado',     color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',       icon: Truck },
  delivered:  { label: 'Entregado',   color: 'text-green-400 bg-green-500/10 border-green-500/20',    icon: CheckCircle },
  cancelled:  { label: 'Cancelado',   color: 'text-red-400 bg-red-500/10 border-red-500/20',          icon: XCircle },
  refunded:   { label: 'Reembolsado', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',       icon: XCircle },
}

export default function Orders() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [detail, setDetail]   = useState<any>(null)

  useEffect(() => { load() }, [status])

  const load = async () => {
    setLoading(true)
    try {
      const params = status ? `?status=${status}` : ''
      const res: any = await apiClient.get(`/orders${params}`)
      setOrders(Array.isArray(res?.data) ? res.data : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadDetail = async (id: string) => {
    try {
      const res = await apiClient.get(`/orders/${id}`)
      setDetail(res)
    } catch(e) { console.error(e) }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.put(`/orders/${id}/status`, { status: newStatus })
      load()
      if (detail?.id === id) loadDetail(id)
    } catch(e) { console.error(e) }
  }

  if (detail) return (
    <div className="max-w-2xl">
      <button onClick={() => setDetail(null)} className="text-[#888899] text-sm font-mono hover:text-white mb-6 flex items-center gap-1">
        ← Volver a órdenes
      </button>
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono text-[#555566] mb-1">ORDEN #{detail.id.slice(0,8).toUpperCase()}</p>
            <p className="text-xs text-[#555566]">{new Date(detail.created_at).toLocaleString('es-CO')}</p>
          </div>
          <select
            value={detail.status}
            onChange={e => updateStatus(detail.id, e.target.value)}
            className="px-3 py-1.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-sm outline-none focus:border-[#7c6aff] text-white">
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 mb-4">
          {detail.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-[#1a1a24]">
              <div>
                <p className="text-sm font-bold">{item.name}</p>
                {item.sku && <p className="text-xs font-mono text-[#555566]">SKU: {item.sku}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm">{item.quantity} × ${item.price?.toFixed(2)}</p>
                <p className="text-xs font-mono text-[#7c6aff]">${item.total?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-[#888899]"><span>Subtotal</span><span>${detail.subtotal?.toFixed(2)}</span></div>
          {detail.discount > 0 && <div className="flex justify-between text-green-400"><span>Descuento</span><span>-${detail.discount?.toFixed(2)}</span></div>}
          <div className="flex justify-between font-black text-lg pt-2 border-t border-[#2a2a3a]"><span>Total</span><span className="text-[#7c6aff]">${detail.total?.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <ShoppingBag size={28} className="text-[#7c6aff]" />Órdenes
          </h1>
          <p className="text-[#888899] text-sm">Historial de pedidos</p>
        </div>
        <select className="px-4 py-2.5 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
          value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 opacity-30">
          <ShoppingBag size={40} /><p className="font-bold">No hay órdenes</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {orders.map(o => {
          const cfg = statusConfig[o.status] || statusConfig.pending
          const Icon = cfg.icon
          return (
            <button key={o.id} onClick={() => loadDetail(o.id)}
              className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all text-left w-full">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono shrink-0 ${cfg.color}`}>
                <Icon size={11} />{cfg.label}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[#555566]">#{o.id.slice(0,8).toUpperCase()}</p>
                <p className="text-xs text-[#555566]">{new Date(o.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <p className="font-black text-[#7c6aff]">${o.total?.toFixed(2)}</p>
              <ChevronRight size={14} className="text-[#555566]" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
