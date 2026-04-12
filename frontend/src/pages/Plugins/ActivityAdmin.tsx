import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Activity, RefreshCw, Trash2, Loader2, User, Filter } from 'lucide-react'

interface Log {
  id: string
  user_id?: string
  username?: string
  action: string
  resource: string
  resource_id?: string
  details?: any
  ip_addr?: string
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  login:    'text-green-400 bg-green-500/10',
  logout:   'text-[#888899] bg-[#2a2a3a]',
  create:   'text-blue-400 bg-blue-500/10',
  update:   'text-yellow-400 bg-yellow-500/10',
  delete:   'text-red-400 bg-red-500/10',
  upload:   'text-purple-400 bg-purple-500/10',
  send:     'text-cyan-400 bg-cyan-500/10',
}

const RESOURCES = ['all', 'auth', 'posts', 'products', 'orders', 'media', 'users', 'settings']

export default function ActivityAdmin() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resource, setResource] = useState('all')
  const [offset, setOffset] = useState(0)
  const LIMIT = 50

  const load = async (res = resource, off = offset) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
      if (res !== 'all') params.set('resource', res)
      const data: any = await apiClient.get('/activity/logs?' + params)
      const d = data?.data ?? data
      setLogs(d?.logs ?? [])
      setTotal(d?.total ?? 0)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const changeResource = (r: string) => {
    setResource(r)
    setOffset(0)
    load(r, 0)
  }

  const clearOld = async () => {
    if (!confirm('Eliminar logs de mas de 30 dias?')) return
    await apiClient.post('/activity/logs/clear', {})
    load()
  }

  const fmt = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return 'hace ' + diff + 's'
    if (diff < 3600) return 'hace ' + Math.floor(diff/60) + 'm'
    if (diff < 86400) return 'hace ' + Math.floor(diff/3600) + 'h'
    return date.toLocaleDateString('es-CO')
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Activity size={24} className="text-[#7c6aff]" />Log de Actividad
          </h1>
          <p className="text-[#888899] text-sm">{total} eventos registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white text-sm transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={clearOld}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 text-sm transition-all">
            <Trash2 size={14} />Limpiar antiguos
          </button>
        </div>
      </div>

      {/* Filtro por recurso */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Filter size={14} className="text-[#555566] mt-2 shrink-0" />
        {RESOURCES.map(r => (
          <button key={r} onClick={() => changeResource(r)}
            className={"px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize " +
              (resource === r ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2a2a3a] text-[#555566] hover:text-white')}>
            {r === 'all' ? 'Todos' : r}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a] grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#555566]">
          <div className="col-span-2">Tiempo</div>
          <div className="col-span-2">Usuario</div>
          <div className="col-span-2">Accion</div>
          <div className="col-span-2">Recurso</div>
          <div className="col-span-3">ID / Detalles</div>
          <div className="col-span-1">IP</div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-[#555566] text-sm">Sin actividad registrada.</div>
        ) : (
          <div className="divide-y divide-[#1a1a2a]">
            {logs.map(log => {
              const actionColor = ACTION_COLORS[log.action] ?? 'text-[#888899] bg-[#2a2a3a]'
              return (
                <div key={log.id} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-white/[0.02] text-xs">
                  <div className="col-span-2 text-[#555566]">{fmt(log.created_at)}</div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <User size={11} className="text-[#555566] shrink-0" />
                    <span className="text-white truncate">{log.username ?? 'sistema'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + actionColor}>
                      {log.action}
                    </span>
                  </div>
                  <div className="col-span-2 text-[#888899] capitalize">{log.resource}</div>
                  <div className="col-span-3 text-[#555566] truncate font-mono text-[10px]">
                    {log.resource_id ?? (log.details ? JSON.stringify(log.details).slice(0, 40) : '—')}
                  </div>
                  <div className="col-span-1 text-[#444455] text-[10px] truncate">{log.ip_addr ?? '—'}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Paginacion */}
      {total > LIMIT && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[#555566]">Mostrando {offset + 1}–{Math.min(offset + LIMIT, total)} de {total}</span>
          <div className="flex gap-2">
            <button onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); load(resource, o) }}
              disabled={offset === 0}
              className="px-3 py-1.5 rounded-lg border border-[#2a2a3a] text-[#888899] hover:text-white text-xs disabled:opacity-40 transition-all">
              Anterior
            </button>
            <button onClick={() => { const o = offset + LIMIT; setOffset(o); load(resource, o) }}
              disabled={offset + LIMIT >= total}
              className="px-3 py-1.5 rounded-lg border border-[#2a2a3a] text-[#888899] hover:text-white text-xs disabled:opacity-40 transition-all">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
