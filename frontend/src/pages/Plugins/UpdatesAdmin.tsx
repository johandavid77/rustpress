import { useState, useEffect } from 'react'
import { RefreshCw, GitCommit, CheckCircle2, AlertCircle, Loader2, Download, Clock, User } from 'lucide-react'
import { apiClient } from '../../api/client'

interface UpdateStatus {
  current_commit:  string
  current_version: string
  remote_commit:   string
  remote_message:  string
  up_to_date:      boolean
  has_update:      boolean
}

interface Commit {
  hash:    string
  message: string
  date:    string
  author:  string
}

export default function UpdatesAdmin() {
  const [status, setStatus]       = useState<UpdateStatus | null>(null)
  const [commits, setCommits]     = useState<Commit[]>([])
  const [loading, setLoading]     = useState(true)
  const [checking, setChecking]   = useState(false)
  const [applying, setApplying]   = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([
        apiClient.get<UpdateStatus>('/updates/status'),
        apiClient.get<any>('/updates/changelog'),
      ])
      setStatus(s as any)
      setCommits((c as any)?.commits ?? [])
    } catch (e: any) {
      setError('No se pudo verificar el estado de actualizaciones')
    } finally { setLoading(false) }
  }

  async function checkUpdates() {
    setChecking(true); setError(null)
    try {
      const s = await apiClient.get<UpdateStatus>('/updates/status')
      setStatus(s as any)
    } catch { setError('Error al verificar actualizaciones') }
    finally { setChecking(false) }
  }

  async function applyUpdate() {
    setApplying(true); setError(null); setSuccess(null)
    try {
      const res = await apiClient.post<any>('/updates/apply', {})
      setSuccess((res as any)?.message ?? 'Actualización aplicada correctamente')
      await loadAll()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al aplicar la actualización')
    } finally { setApplying(false) }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <RefreshCw size={28} className="text-teal-400" />Actualizaciones
          </h1>
          <p className="text-[#888899] text-sm">Mantén RustCMS al día con los últimos cambios</p>
        </div>
        <button onClick={checkUpdates} disabled={checking || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 hover:bg-teal-500/25 font-semibold text-sm transition-all disabled:opacity-50">
          {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Verificar
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 size={16} />{success}
          <button onClick={() => setSuccess(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* Status card */}
      {loading ? (
        <div className="flex items-center gap-3 text-[#888899] py-12 justify-center">
          <Loader2 size={20} className="animate-spin" /><span className="text-sm">Verificando...</span>
        </div>
      ) : status && (
        <div className={`mb-6 rounded-2xl border p-5 ${
          status.up_to_date
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-yellow-500/5 border-yellow-500/20'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                status.up_to_date ? 'bg-green-500/15' : 'bg-yellow-500/15'
              }`}>
                {status.up_to_date
                  ? <CheckCircle2 size={20} className="text-green-400" />
                  : <Download size={20} className="text-yellow-400" />
                }
              </div>
              <div>
                <div className={`font-bold text-sm ${status.up_to_date ? 'text-green-400' : 'text-yellow-400'}`}>
                  {status.up_to_date ? 'Sistema actualizado' : 'Actualización disponible'}
                </div>
                <div className="text-xs text-[#555566] mt-0.5">
                  {status.up_to_date
                    ? `v${status.current_version} · commit ${status.current_commit}`
                    : `${status.current_commit} → ${status.remote_commit}`
                  }
                </div>
                {status.has_update && (
                  <div className="text-xs text-[#888899] mt-1 italic">"{status.remote_message}"</div>
                )}
              </div>
            </div>

            {status.has_update && (
              <button onClick={applyUpdate} disabled={applying}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 font-semibold text-sm transition-all disabled:opacity-50 whitespace-nowrap">
                {applying ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {applying ? 'Aplicando...' : 'Aplicar update'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Changelog */}
      <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#1a1a2e]">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">
            Últimos commits en main
          </span>
        </div>
        {commits.length === 0 ? (
          <div className="py-10 text-center text-[#555566] text-sm">
            <GitCommit size={28} className="mx-auto mb-2 opacity-30" />
            No se pudo obtener el historial
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {commits.map((c, i) => (
              <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  <code className="text-xs text-teal-400 font-mono mt-0.5 shrink-0">{c.hash}</code>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{c.message}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#555566]">
                      <span className="flex items-center gap-1"><User size={10} />{c.author}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{c.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
