import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Activity, Database, Zap, RefreshCw, FileText, Users, Image } from 'lucide-react'

interface HealthData {
  status: string
  timestamp: number
  services: {
    database: { status: string }
    redis:    { status: string }
  }
  stats: {
    posts: number
    users: number
    media: number
  }
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'ok'
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
      {ok ? '● online' : '● error'}
    </span>
  )
}

export default function HealthDashboard() {
  const [data, setData]           = useState<HealthData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/health/detailed')
      setData(res)
      setLastCheck(new Date())
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t) }, [])

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Activity size={28} className="text-[#7c6aff]" />Healthcheck
          </h1>
          <p className="text-[#888899] text-sm">
            Estado del servidor · Auto-actualiza cada 30s
            {lastCheck && <span className="ml-2 text-[#555566]">· {lastCheck.toLocaleTimeString('es-CO')}</span>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm font-mono text-[#888899] hover:text-white hover:border-[#7c6aff] disabled:opacity-50 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Actualizar
        </button>
      </div>

      {loading && !data && (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#111118] rounded-xl animate-pulse" />)}
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-4">
          <div className={`p-5 rounded-xl border ${data.status === 'ok' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity size={20} className={data.status === 'ok' ? 'text-green-400' : 'text-red-400'} />
                <div>
                  <p className="font-black text-lg">Sistema</p>
                  <p className="text-xs text-[#888899] font-mono">{new Date(data.timestamp * 1000).toLocaleString('es-CO')}</p>
                </div>
              </div>
              <StatusBadge status={data.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: <Database size={18} />, label: 'PostgreSQL', sub: 'Base de datos', status: data.services.database.status },
              { icon: <Zap size={18} />,      label: 'Redis',      sub: 'Cache',         status: data.services.redis.status },
            ].map(svc => (
              <div key={svc.label} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-[#7c6aff]">{svc.icon}</div>
                  <div><p className="font-bold text-sm">{svc.label}</p><p className="text-xs text-[#555566] font-mono">{svc.sub}</p></div>
                </div>
                <StatusBadge status={svc.status} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: <FileText size={18} />, label: 'Posts',    value: data.stats.posts },
              { icon: <Users size={18} />,    label: 'Usuarios', value: data.stats.users },
              { icon: <Image size={18} />,    label: 'Media',    value: data.stats.media },
            ].map(stat => (
              <div key={stat.label} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 text-center">
                <div className="text-[#7c6aff] flex justify-center mb-2">{stat.icon}</div>
                <p className="text-3xl font-black">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-[#555566] font-mono mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
