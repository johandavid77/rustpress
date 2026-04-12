import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink, Loader2, ArrowRight } from 'lucide-react'

interface Redirect {
  id: string
  from_path: string
  to_path: string
  status_code: number
  active: boolean
  hits: number
}

export default function RedirectsAdmin() {
  const { t } = useTranslation()
  const [redirects, setRedirects] = useState<Redirect[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [code, setCode] = useState<301 | 302>(301)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const res: any = await apiClient.get('/redirects')
      setRedirects(Array.isArray(res) ? res : res?.data ?? [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!from.trim() || !to.trim()) return
    setSaving(true)
    try {
      await apiClient.post('/redirects', { from_path: from, to_path: to, status_code: code })
      setFrom(''); setTo(''); setCode(301)
      await load()
    } catch {} finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Eliminar redirección?')) return
    await apiClient.delete('/redirects/' + id)
    setRedirects(r => r.filter(x => x.id !== id))
  }

  const toggle = async (id: string) => {
    const res: any = await apiClient.post('/redirects/' + id + '/toggle', {})
    setRedirects(r => r.map(x => x.id === id ? (res?.data ?? res) : x))
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <ExternalLink size={24} className="text-[#7c6aff]" />Redirecciones
        </h1>
        <p className="text-[#888899] text-sm">Gestiona redirecciones 301 y 302 desde el admin</p>
      </div>

      {/* Formulario */}
      <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] mb-6">
        <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest mb-4">Nueva redirección</h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <input value={from} onChange={e => setFrom(e.target.value)}
              placeholder="/ruta-antigua"
              className="flex-1 bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
            <ArrowRight size={16} className="text-[#555566] shrink-0" />
            <input value={to} onChange={e => setTo(e.target.value)}
              placeholder="/ruta-nueva o https://..."
              className="flex-1 bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              {([301, 302] as const).map(c => (
                <button key={c} onClick={() => setCode(c)}
                  className={"px-4 py-2 rounded-xl text-sm font-semibold border transition-all " + (code === c ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]/50')}>
                  {c} {c === 301 ? 'Permanente' : 'Temporal'}
                </button>
              ))}
            </div>
            <button onClick={create} disabled={saving || !from || !to}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-semibold disabled:opacity-50 transition-all">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a]">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">
            {redirects.length} redirección(es)
          </span>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>
        ) : redirects.length === 0 ? (
          <div className="py-10 text-center text-[#555566] text-sm">Sin redirecciones. Agrega una arriba.</div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {redirects.map(r => (
              <div key={r.id} className={"flex items-center gap-3 px-4 py-3 " + (!r.active ? 'opacity-50' : '')}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <code className="text-[#7c6aff] truncate">{r.from_path}</code>
                    <ArrowRight size={12} className="text-[#555566] shrink-0" />
                    <code className="text-white truncate">{r.to_path}</code>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (r.status_code === 301 ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400')}>
                      {r.status_code}
                    </span>
                    <span className="text-[10px] text-[#555566]">{r.hits} hits</span>
                  </div>
                </div>
                <button onClick={() => toggle(r.id)} className="text-[#555566] hover:text-white transition-colors">
                  {r.active ? <ToggleRight size={20} className="text-[#7c6aff]" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => remove(r.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
