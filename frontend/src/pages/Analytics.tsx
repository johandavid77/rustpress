import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, FunnelChart, Funnel, LabelList
} from 'recharts'
import { TrendingUp, TrendingDown, Users, Eye, ShoppingCart, DollarSign, Activity, Monitor, Smartphone, Tablet } from 'lucide-react'

const PURPLE = '#7c6aff'
const GREEN  = '#22c55e'
const ORANGE = '#f59e0b'

export default function Analytics() {
  const [days, setDays]         = useState(30)
  const [dash, setDash]         = useState<any>(null)
  const [monthly, setMonthly]   = useState<any[]>([])
  const [topSales, setTopSales]   = useState<any[]>([])
  const [topPosts, setTopPosts] = useState<any[]>([])
  const [topProds, setTopProds] = useState<any[]>([])
  const [funnel, setFunnel]     = useState<any[]>([])
  const [realtime, setRealtime] = useState<any>(null)
  const [tab, setTab]           = useState<'overview'|'content'|'shop'|'realtime'>('overview')

  useEffect(() => { loadAll() }, [days])
  useEffect(() => {
    if (tab !== 'realtime') return
    loadRealtime()
    const t = setInterval(loadRealtime, 30000)
    return () => clearInterval(t)
  }, [tab])

  const loadAll = async () => {
    try {
      const [d, tp, tpr, f] = await Promise.all([
        apiClient.get(`/analytics/dashboard?days=${days}`),
        apiClient.get(`/analytics/top-posts?days=${days}`),
        apiClient.get(`/analytics/top-products?days=${days}`),
        apiClient.get(`/analytics/funnel?days=${days}`),
      ])
      setDash(d)
      setTopPosts(Array.isArray(tp) ? tp : [])
      setTopProds(Array.isArray(tpr) ? tpr : [])
      setFunnel(Array.isArray((f as any)?.funnel) ? (f as any).funnel : [])
    } catch(e) { console.error(e) }
  }

  const loadRealtime = async () => {
    try {
      const r = await apiClient.get('/analytics/realtime')
      setRealtime(r)
    } catch(e) { console.error(e) }
  }

  const pct = (v: number) => {
    const pos = v >= 0
    return (
      <span className={`flex items-center gap-0.5 text-xs font-mono ${pos ? 'text-green-400' : 'text-red-400'}`}>
        {pos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {Math.abs(v).toFixed(1)}%
      </span>
    )
  }

  const StatCard = ({ icon: Icon, label, value, change, color = PURPLE }: any) => (
    <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Icon size={16} style={{color}} />
        {change !== undefined && pct(change)}
      </div>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-xs text-[#555566] font-mono">{label}</p>
    </div>
  )

  const s = dash?.summary

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Activity size={28} className="text-[#7c6aff]" />Analytics
          </h1>
          <p className="text-[#888899] text-sm">Métricas reales del sitio</p>
        </div>
        <select className="px-4 py-2.5 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
          value={days} onChange={e => setDays(+e.target.value)}>
          <option value={7}>7 días</option>
          <option value={30}>30 días</option>
          <option value={90}>90 días</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview','content','shop','realtime'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-mono capitalize transition-all ${tab === t ? 'bg-[#7c6aff] text-white' : 'border border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'}`}>
            {t === 'realtime' ? '🔴 Realtime' : t}
          </button>
        ))}
      </div>

      {tab === 'overview' && s && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Eye}          label="Vistas de página"   value={s.page_views.toLocaleString()}    change={s.pv_change_pct}  color={PURPLE} />
            <StatCard icon={Users}        label="Sesiones únicas"    value={s.unique_sessions.toLocaleString()} change={s.pv_change_pct} color={GREEN} />
            <StatCard icon={ShoppingCart} label="Compras"            value={s.purchases.toLocaleString()}     change={s.rev_change_pct} color={ORANGE} />
            <StatCard icon={DollarSign}   label="Revenue"            value={`$${s.revenue.toFixed(2)}`}       change={s.rev_change_pct} color={GREEN} />
          </div>

          {/* Gráfica diaria */}
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 mb-6">
            <p className="text-sm font-bold mb-4">Vistas por día</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dash.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                <XAxis dataKey="day" tick={{fontSize:10, fill:'#555566'}} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{fontSize:10, fill:'#555566'}} />
                <Tooltip contentStyle={{background:'#111118', border:'1px solid #2a2a3a', borderRadius:8}} />
                <Line type="monotone" dataKey="views" stroke={PURPLE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ingresos por mes - últimos 12 meses */}
        {monthly.length > 0 && (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5 mt-6">
            <p className="text-sm font-bold mb-4">Ingresos por mes (últimos 12 meses)</p>
            <BarChart width={600} height={220} data={monthly} style={{maxWidth:'100%'}}>
              <XAxis dataKey="month" tick={{fill:'#555566',fontSize:11}} />
              <YAxis tick={{fill:'#555566',fontSize:11}} tickFormatter={(v:number) => '$'+v.toFixed(0)} />
              <Tooltip contentStyle={{background:'#0e0e1a',border:'1px solid #2a2a3a',borderRadius:12}} />
              <Bar dataKey="revenue" fill="#7c6aff" radius={[4,4,0,0]} />
            </BarChart>
          </div>
        )}

        {/* Top productos más vendidos */}
        {topSales.length > 0 && (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5 mt-6">
            <p className="text-sm font-bold mb-4">Productos más vendidos</p>
            <div className="space-y-2">
              {topSales.slice(0,8).map((p:any, i:number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs text-[#555566] w-4">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white truncate">{p.name}</span>
                      <span className="text-xs text-[#7c6aff] font-bold ml-2 shrink-0">${p.total_revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7c6aff] rounded-full"
                        style={{width: `${Math.min(100, (p.total_sold / (topSales[0]?.total_sold||1)) * 100)}%`}} />
                    </div>
                  </div>
                  <span className="text-xs text-[#555566] w-12 text-right">{p.total_sold} uds</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue diario */}
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 mb-6">
            <p className="text-sm font-bold mb-4">Revenue por día</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dash.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                <XAxis dataKey="day" tick={{fontSize:10, fill:'#555566'}} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{fontSize:10, fill:'#555566'}} />
                <Tooltip contentStyle={{background:'#111118', border:'1px solid #2a2a3a', borderRadius:8}} />
                <Bar dataKey="revenue" fill={GREEN} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Dispositivos */}
          {dash.devices?.length > 0 && (
            <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
              <p className="text-sm font-bold mb-4">Dispositivos</p>
              <div className="flex gap-4">
                {dash.devices.map((d: any) => {
                  const Icon = d.device === 'mobile' ? Smartphone : d.device === 'tablet' ? Tablet : Monitor
                  return (
                    <div key={d.device} className="flex items-center gap-2">
                      <Icon size={14} className="text-[#7c6aff]" />
                      <span className="text-sm capitalize">{d.device}</span>
                      <span className="text-xs font-mono text-[#555566]">{d.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'content' && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
          <p className="text-sm font-bold mb-4">Posts más vistos</p>
          {topPosts.length === 0 && <p className="text-[#555566] text-sm">Sin datos aún</p>}
          <div className="flex flex-col gap-3">
            {topPosts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#555566] w-5">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{p.title}</p>
                  <p className="text-xs font-mono text-[#555566]">/blog/{p.slug}</p>
                </div>
                <span className="text-sm font-mono text-[#7c6aff]">{p.views.toLocaleString()} vistas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
            <p className="text-sm font-bold mb-4">Productos más vistos</p>
            {topProds.length === 0 && <p className="text-[#555566] text-sm">Sin datos aún</p>}
            <div className="flex flex-col gap-3">
              {topProds.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#555566] w-5">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs font-mono text-[#555566]">{p.views} vistas · {p.carts} carritos</p>
                  </div>
                  <span className="text-xs font-mono text-green-400">{p.conversion.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
            <p className="text-sm font-bold mb-4">Funnel de conversión</p>
            {funnel.length === 0 && <p className="text-[#555566] text-sm">Sin datos aún</p>}
            <div className="flex flex-col gap-3">
              {funnel.map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{f.step}</span>
                    <span className="font-mono text-[#7c6aff]">{f.sessions.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[#1a1a24] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7c6aff] rounded-full transition-all"
                      style={{width: `${f.rate}%`}} />
                  </div>
                  <p className="text-xs text-[#555566] font-mono mt-0.5">{f.rate.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'realtime' && realtime && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-sm font-bold">Sesiones activas (últimos 5 min)</p>
            </div>
            <p className="text-5xl font-black text-[#7c6aff]">{realtime.active_sessions}</p>
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6">
            <p className="text-sm font-bold mb-4">Eventos recientes</p>
            <div className="flex flex-col gap-2">
              {realtime.recent_events?.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[#7c6aff] shrink-0">{e.event}</span>
                  <span className="text-[#555566] truncate">{e.path}</span>
                  <span className="text-[#333344] shrink-0 ml-auto">{e.device}</span>
                </div>
              ))}
              {!realtime.recent_events?.length && <p className="text-[#555566] text-sm">Sin actividad reciente</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
