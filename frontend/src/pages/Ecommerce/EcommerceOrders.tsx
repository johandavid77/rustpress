import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { ShoppingBag, ChevronRight, Clock, CheckCircle, XCircle, Truck, Download, Search } from 'lucide-react'

const SC: any = {
  pending:    { label:'Pendiente',   color:'text-yellow-400 bg-yellow-500/10', icon: Clock },
  paid:       { label:'Pagado',      color:'text-blue-400 bg-blue-500/10',     icon: CheckCircle },
  processing: { label:'Procesando',  color:'text-purple-400 bg-purple-500/10', icon: Clock },
  shipped:    { label:'Enviado',     color:'text-cyan-400 bg-cyan-500/10',     icon: Truck },
  delivered:  { label:'Entregado',   color:'text-green-400 bg-green-500/10',   icon: CheckCircle },
  cancelled:  { label:'Cancelado',   color:'text-red-400 bg-red-500/10',       icon: XCircle },
  refunded:   { label:'Reembolsado', color:'text-gray-400 bg-gray-500/10',     icon: XCircle },
}

export default function EcommerceOrders() {
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [search, setSearch]   = useState('')
  const [detail, setDetail]   = useState<any>(null)

  useEffect(() => { load() }, [status])

  const load = async () => {
    setLoading(true)
    try {
      const r: any = await apiClient.get(`/orders${status ? '?status='+status : ''}`)
      setOrders(Array.isArray(r?.data) ? r.data : [])
    } finally { setLoading(false) }
  }

  const loadDetail = async (id: string) => {
    const r = await apiClient.get(`/orders/${id}`)
    setDetail(r)
  }

  const updateStatus = async (id: string, s: string) => {
    await apiClient.put(`/orders/${id}/status`, { status: s })
    load()
    if (detail?.id === id) loadDetail(id)
  }

  const exportCsv = () => {
    window.open('/api/v1/orders/export', '_blank')
  }

  const filtered = orders.filter(o => !search || o.id.includes(search))

  if (detail) return (
    <div>
      <button onClick={() => setDetail(null)} className="text-sm text-[#888899] hover:text-white mb-6 flex items-center gap-1">← Volver</button>
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-2xl font-black">Pedido #{detail.id?.slice(0,8).toUpperCase()}</p>
            <p className="text-xs text-[#555566] mt-1">{new Date(detail.created_at).toLocaleString('es-CO')}</p>
          </div>
          <select value={detail.status} onChange={e => updateStatus(detail.id, e.target.value)}
            className="px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-sm text-white outline-none focus:border-[#7c6aff]">
            {Object.entries(SC).map(([k,v]: any) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {detail.shipping_addr && (
          <div className="mb-4 p-4 bg-[#1a1a24] rounded-xl">
            <p className="text-xs font-mono text-[#555566] uppercase mb-2">Envío</p>
            <p className="text-sm font-bold">{detail.shipping_addr.name}</p>
            <p className="text-xs text-[#888899]">{detail.shipping_addr.address}, {detail.shipping_addr.city}</p>
          </div>
        )}
        <div className="flex flex-col gap-2 mb-4">
          {detail.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between py-2 border-b border-[#1a1a24] text-sm">
              <span>{item.name} <span className="text-[#555566]">×{item.quantity}</span></span>
              <span className="font-mono text-[#7c6aff]">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-black text-lg">
          <span>Total</span>
          <span className="text-[#7c6aff]">${detail.total?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Pedidos</h1>
          <p className="text-[#888899] text-sm">{orders.length} pedidos</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2.5 border border-[#2a2a3a] rounded-xl text-sm text-[#888899] hover:border-[#7c6aff] hover:text-white transition-all">
          <Download size={14} />Exportar CSV
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3.5 text-[#555566]" />
          <input className="w-full pl-9 pr-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
            placeholder="Buscar por ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none">
          <option value="">Todos</option>
          {Object.entries(SC).map(([k,v]: any) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading && <p className="text-[#888899] text-sm">Cargando...</p>}
      <div className="flex flex-col gap-2">
        {filtered.map(o => {
          const cfg = SC[o.status] || SC.pending
          const Icon = cfg.icon
          return (
            <button key={o.id} onClick={() => loadDetail(o.id)}
              className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all text-left w-full">
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono ${cfg.color}`}>
                <Icon size={11}/>{cfg.label}
              </span>
              <span className="font-mono text-xs text-[#888899]">#{o.id?.slice(0,8).toUpperCase()}</span>
              <span className="flex-1 text-xs text-[#555566]">{new Date(o.created_at).toLocaleDateString('es-CO')}</span>
              <span className="font-black text-[#7c6aff]">${o.total?.toFixed(2)}</span>
              <ChevronRight size={14} className="text-[#555566]" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
