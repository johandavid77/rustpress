import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../api/client'
import {
  FileText, Globe, FileEdit, Image, ShoppingBag, Clock,
  AlertTriangle, XCircle, Users, TrendingUp, DollarSign,
  Package, ArrowRight, Loader2
} from 'lucide-react'

export default function Stats({ onNavigate }: { onNavigate?: (v: string) => void }) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/posts/stats')
      .then((res: any) => {
        // interceptor ya hace res.data, llega directo
        setStats(res)
        console.log('stats data:', res)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-[#888899]">
      <Loader2 size={20} className="animate-spin" /><span className="text-sm">Cargando métricas...</span>
    </div>
  )

  const fmt = (n: number) => new Intl.NumberFormat('es-CO').format(n)
  const fmtMoney = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const statusColor: Record<string, string> = {
    pending:    'bg-yellow-500/20 text-yellow-400',
    paid:       'bg-green-500/20 text-green-400',
    processing: 'bg-blue-500/20 text-blue-400',
    shipped:    'bg-purple-500/20 text-purple-400',
    delivered:  'bg-emerald-500/20 text-emerald-400',
    cancelled:  'bg-red-500/20 text-red-400',
    refunded:   'bg-gray-500/20 text-gray-400',
  }

  const topCards = [
    { label: t('overview.totalRevenue'),  value: fmtMoney(stats?.revenue_total ?? 0),  sub: `${t("overview.revenueToday")}: ${fmtMoney(stats?.revenue_today ?? 0)}`,  icon: DollarSign, color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20', iconColor: 'text-violet-400' },
    { label: t('overview.totalOrders'),   value: fmt(stats?.orders_total ?? 0),         sub: `${t("overview.ordersToday")}: ${fmt(stats?.orders_today ?? 0)} · ${t("overview.ordersPending")}: ${fmt(stats?.orders_pending ?? 0)}`, icon: ShoppingBag, color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20', iconColor: 'text-blue-400' },
    { label: t('overview.publishedPosts'),  value: fmt(stats?.published_posts ?? 0),      sub: `${t('posts.draft')}: ${fmt(stats?.draft_posts ?? 0)} · ${t('overview.total')}: ${fmt(stats?.total_posts ?? 0)}`, icon: Globe, color: 'from-green-500/20 to-green-600/5 border-green-500/20', iconColor: 'text-green-400' },
    { label: t('overview.products'),         value: fmt(stats?.total_products ?? 0),       sub: `${t("overview.lowStock")}: ${fmt(stats?.low_stock ?? 0)} · ${t("overview.outOfStock")}: ${fmt(stats?.out_of_stock ?? 0)}`, icon: Package, color: 'from-orange-500/20 to-orange-600/5 border-orange-500/20', iconColor: 'text-orange-400' },
    { label: t('overview.mediaFiles'),    value: fmt(stats?.total_media ?? 0),          sub: 't("overview.media")', icon: Image, color: 'from-pink-500/20 to-pink-600/5 border-pink-500/20', iconColor: 'text-pink-400' },
    { label: t('overview.users'),          value: fmt(stats?.total_users ?? 0),          sub: '{t("overview.users")}', icon: Users, color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20', iconColor: 'text-cyan-400' },
  ]

  const alerts = [
    stats?.out_of_stock > 0 && { type: 'error',   icon: XCircle,       msg: `${stats.out_of_stock} producto(s) sin stock`, action: 'shop-products' },
    stats?.low_stock > 0    && { type: 'warning',  icon: AlertTriangle, msg: `${stats.low_stock} producto(s) con stock bajo (< 5)`, action: 'shop-products' },
    stats?.orders_pending > 0 && { type: 'info',  icon: Clock,         msg: `${stats.orders_pending} pedido(s) pendiente(s) de atender`, action: 'orders' },
  ].filter(Boolean) as any[]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <p className="text-[#888899] text-sm">{t("overview.subtitle")}</p>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
              a.type === 'error'   ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              a.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                     'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <a.icon size={16} />
              <span className="flex-1">{a.msg}</span>
              {onNavigate && (
                <button onClick={() => onNavigate(a.action)}
                  className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100">
                  Ver <ArrowRight size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cards principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {topCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`p-5 rounded-2xl border bg-gradient-to-br ${card.color}`}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={card.iconColor} />
              </div>
              <div className="text-2xl font-black text-white mb-1">{card.value}</div>
              <div className="text-xs text-[#888899] font-medium mb-0.5">{card.label}</div>
              <div className="text-[10px] text-[#555566]">{card.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Pedidos recientes + Posts recientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Pedidos recientes */}
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] bg-[#1a1a2e]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">{t('overview.recentOrders')}</span>
            {onNavigate && (
              <button onClick={() => onNavigate('orders')} className="text-[#555566] hover:text-white transition-colors">
                <ArrowRight size={14} />
              </button>
            )}
          </div>
          {!stats?.recent_orders?.length ? (
            <div className="py-8 text-center text-[#555566] text-sm">
              <ShoppingBag size={24} className="mx-auto mb-2 opacity-30" />{t("overview.noOrders")}
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e2e]">
              {stats.recent_orders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-[#888899] truncate">#{o.id.slice(0,8)}</div>
                    <div className="text-xs text-[#555566]">{new Date(o.created_at).toLocaleDateString('es-CO')}</div>
                  </div>
                  <div className="text-sm font-bold text-white">{fmtMoney(o.total)}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[o.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {o.status === 'published' ? t('posts.published') : o.status === 'draft' ? t('posts.draft') : o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Posts recientes */}
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] bg-[#1a1a2e]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">{t('overview.recentPosts')}</span>
            {onNavigate && (
              <button onClick={() => onNavigate('posts')} className="text-[#555566] hover:text-white transition-colors">
                <ArrowRight size={14} />
              </button>
            )}
          </div>
          {!stats?.recent_posts?.length ? (
            <div className="py-8 text-center text-[#555566] text-sm">
              <FileText size={24} className="mx-auto mb-2 opacity-30" />{t("overview.noPosts")}
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e2e]">
              {stats.recent_posts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{p.title}</div>
                    <div className="text-xs text-[#555566]">{new Date(p.created_at).toLocaleDateString('es-CO')}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>{p.status === 'published' ? t('posts.published') : p.status === 'draft' ? t('posts.draft') : p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
