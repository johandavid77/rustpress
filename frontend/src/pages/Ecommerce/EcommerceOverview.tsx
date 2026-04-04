import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { DollarSign, ShoppingBag, Users, TrendingUp, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function EcommerceOverview() {
  const [stats, setStats] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [daily, setDaily] = useState<any[]>([])

  useEffect(() => {
    apiClient.get('/analytics/dashboard?days=30').then((r: any) => {
      setStats(r?.summary)
      setDaily(Array.isArray(r?.daily) ? r.daily : [])
    }).catch(console.error)
    apiClient.get('/orders?limit=5').then((r: any) => {
      setOrders(Array.isArray(r?.data) ? r.data : [])
    }).catch(console.error)
  }, [])

  const Card = ({ icon: Icon, label, value, color = '#7c6aff' }: any) => (
    <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: color + '20'}}>
          <Icon size={18} style={{color}} />
        </div>
        <p className="text-xs font-mono text-[#555566] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-black">{value ?? '—'}</p>
    </div>
  )

  const statusIcon: any = { paid: CheckCircle, shipped: Truck, cancelled: XCircle, pending: Clock }
  const statusColor: any = { paid: 'text-green-400', shipped: 'text-blue-400', cancelled: 'text-red-400', pending: 'text-yellow-400' }

  return (
    <div>
      <h1 className="text-3xl font-black mb-1">Resumen</h1>
      <p className="text-[#888899] text-sm mb-8">Últimos 30 días</p>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card icon={DollarSign} label="Revenue"  value={stats ? `$${stats.revenue?.toFixed(2)}` : '—'} color="#22c55e" />
        <Card icon={ShoppingBag} label="Pedidos"  value={stats?.purchases ?? '—'} color="#7c6aff" />
        <Card icon={Users}       label="Sesiones" value={stats?.unique_sessions ?? '—'} color="#f59e0b" />
        <Card icon={TrendingUp}  label="Vistas"   value={stats?.page_views ?? '—'} color="#06b6d4" />
      </div>

      <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 mb-6">
        <p className="text-sm font-bold mb-4">Revenue por día</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
            <XAxis dataKey="day" tick={{fontSize:10, fill:'#555566'}} tickFormatter={d => d?.slice(5)} />
            <YAxis tick={{fontSize:10, fill:'#555566'}} />
            <Tooltip contentStyle={{background:'#111118', border:'1px solid #2a2a3a', borderRadius:8}} />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6">
        <p className="text-sm font-bold mb-4">Pedidos recientes</p>
        {orders.length === 0 && <p className="text-[#555566] text-sm">Sin pedidos aún</p>}
        <div className="flex flex-col gap-2">
          {orders.map((o: any) => {
            const Icon = statusIcon[o.status] || Clock
            return (
              <div key={o.id} className="flex items-center gap-3 py-2 border-b border-[#1a1a24] last:border-0">
                <Icon size={14} className={statusColor[o.status] || 'text-[#888899]'} />
                <span className="font-mono text-xs text-[#888899]">#{o.id?.slice(0,8).toUpperCase()}</span>
                <span className="flex-1 text-xs text-[#555566]">{new Date(o.created_at).toLocaleDateString('es-CO')}</span>
                <span className="font-black text-sm text-[#7c6aff]">${o.total?.toFixed(2)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
