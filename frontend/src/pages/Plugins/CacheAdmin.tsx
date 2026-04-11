import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Zap, Trash2, RefreshCw, Loader2, Database, BarChart2 } from 'lucide-react'

interface CacheStats {
  total_keys: number
  by_prefix: Record<string, number>
  keys: string[]
}

const PREFIX_COLORS: Record<string, string> = {
  posts: 'text-green-400 bg-green-500/10',
  shop: 'text-blue-400 bg-blue-500/10',
  products: 'text-orange-400 bg-orange-500/10',
  analytics: 'text-purple-400 bg-purple-500/10',
  other: 'text-[#888899] bg-[#2a2a3a]',
}

export default function CacheAdmin() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [flushing, setFlushing] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/cache/stats')
      setStats(res?.data ?? res)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const flushAll = async () => {
    if (!confirm('Limpiar TODA la cache? Los proximos requests seran mas lentos temporalmente.')) return
    setFlushing('all')
    try {
      await apiClient.post('/cache/flush', {})
      await load()
    } catch {} finally { setFlushing(null) }
  }

  const flushPrefix = async (prefix: string) => {
    setFlushing(prefix)
    try {
      await apiClient.post('/cache/flush/' + prefix, {})
      await load()
    } catch {} finally { setFlushing(null) }
  }

  const prefixes = stats ? Object.entries(stats.by_prefix).sort((a, b) => b[1] - a[1]) : []
  const maxVal = prefixes.length > 0 ? Math.max(...prefixes.map(([, v]) => v)) : 1

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Zap size={24} className="text-[#7c6aff]" />Cache Redis
        </h1>
        <p className="text-[#888899] text-sm">Panel de administracion del cache de respuestas</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <Database size={18} className="text-[#7c6aff] mb-2" />
          <div className="text-2xl font-black text-white">{stats?.total_keys ?? 0}</div>
          <div className="text-xs text-[#888899]">Keys en cache</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <BarChart2 size={18} className="text-green-400 mb-2" />
          <div className="text-2xl font-black text-white">{prefixes.length}</div>
          <div className="text-xs text-[#888899]">Prefijos activos</div>
        </div>
        <div className="p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <Zap size={18} className="text-yellow-400 mb-2" />
          <div className="text-2xl font-black text-white">{stats?.total_keys ? 'Activo' : 'Vacio'}</div>
          <div className="text-xs text-[#888899]">Estado del cache</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white hover:border-[#3a3a4a] text-sm transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Actualizar
        </button>
        <button onClick={flushAll} disabled={flushing === 'all' || !stats?.total_keys}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold disabled:opacity-50 transition-all">
          {flushing === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Limpiar todo
        </button>
      </div>

      {/* Por prefijo */}
      <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a]">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">Cache por prefijo</span>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>
        ) : prefixes.length === 0 ? (
          <div className="py-10 text-center text-[#555566] text-sm">Cache vacio. Los endpoints publicos se cachearan automaticamente.</div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {prefixes.map(([prefix, count]) => {
              const color = PREFIX_COLORS[prefix] ?? PREFIX_COLORS.other
              const pct = Math.round((count / maxVal) * 100)
              return (
                <div key={prefix} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02]">
                  <span className={"text-xs font-bold px-2 py-0.5 rounded-full shrink-0 " + color}>{prefix}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7c6aff] rounded-full transition-all" style={{ width: pct + '%' }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0">{count}</span>
                  <button onClick={() => flushPrefix(prefix)} disabled={flushing === prefix}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 text-xs transition-all disabled:opacity-50">
                    {flushing === prefix ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Limpiar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Keys list */}
      {stats && stats.keys.length > 0 && (
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">Keys almacenadas</span>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-[#1a1a2e]">
            {stats.keys.map(k => (
              <div key={k} className="px-4 py-2 text-xs font-mono text-[#888899] hover:text-white hover:bg-white/[0.02]">{k}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
