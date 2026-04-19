import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Activity, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function UptimeMonitor() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r: any = await apiClient.get('/uptime')
      setData(r?.data ?? r)
    } catch(_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const pct = data?.uptime_pct ?? 100
  const color = pct >= 99 ? 'text-green-400' : pct >= 95 ? 'text-yellow-400' : 'text-red-400'
  const bgColor = pct >= 99 ? 'bg-green-500/10 border-green-500/20' : pct >= 95 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black text-white flex items-center gap-3">
          <Activity size={20} className="text-[#7c6aff]" /> Monitor de Uptime
        </h1>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a3a] text-[#888899] hover:text-white text-xs transition-all disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {loading && !data ? (
        <div className="text-center py-20 text-[#555566]">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {/* Uptime % */}
          <div className={"rounded-2xl border p-6 text-center " + bgColor}>
            <p className={"text-5xl font-black mb-1 " + color}>{pct.toFixed(2)}%</p>
            <p className="text-[#888899] text-sm">Uptime últimas 24h ({data?.total_checks ?? 0} checks)</p>
          </div>

          {/* Historial */}
          {data?.events?.length > 0 && (
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5">
              <p className="text-sm font-bold text-white mb-4">Historial reciente</p>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {data.events.slice(0, 50).map((e: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[#1a1a2e] last:border-0">
                    {e.status === 'up'
                      ? <CheckCircle size={14} className="text-green-400 shrink-0" />
                      : <XCircle size={14} className="text-red-400 shrink-0" />
                    }
                    <span className={"text-xs font-semibold " + (e.status === 'up' ? 'text-green-400' : 'text-red-400')}>
                      {e.status === 'up' ? 'Online' : 'Offline'}
                    </span>
                    <span className="text-xs text-[#555566] ml-auto">
                      {new Date(e.checked_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!data?.events || data.events.length === 0) && (
            <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-8 text-center text-[#555566]">
              <Activity size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin datos aún — el monitor registra checks cada 5 minutos</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
