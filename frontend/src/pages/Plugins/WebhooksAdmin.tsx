import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Webhook, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react'

interface WebhookItem {
  id: string
  name: string
  url: string
  event: string
  active: boolean
  created_at: string
}

export default function WebhooksAdmin() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [name, setName]         = useState('')
  const [url, setUrl]           = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/webhooks')
      setWebhooks(Array.isArray(res) ? res : (res?.data ?? []))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const create = async () => {
    if (!name.trim() || !url.trim()) return
    setSaving(true); setError('')
    try {
      await apiClient.post('/webhooks', { name, url, event: 'post.published' })
      setName(''); setUrl('')
      load()
    } catch(e: any) {
      setError(e?.response?.data?.error || 'Error al crear')
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este webhook?')) return
    try { await apiClient.delete(`/webhooks/${id}`); load() }
    catch(e) { console.error(e) }
  }

  const toggle = async (id: string) => {
    try { await apiClient.post(`/webhooks/${id}/toggle`, {}); load() }
    catch(e) { console.error(e) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Webhook size={28} className="text-[#7c6aff]" />
          Webhooks
        </h1>
        <p className="text-[#888899] text-sm">Notifica servicios externos al publicar un post (Slack, Discord, etc.)</p>
      </div>

      {/* Crear nuevo */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-6">
        <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-3">Nuevo webhook</p>
        <div className="flex flex-col gap-3">
          <input className="px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
            placeholder="Nombre (ej: Slack #blog)..." value={name} onChange={e => setName(e.target.value)} />
          <div className="flex gap-3">
            <input className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="https://hooks.slack.com/..." value={url} onChange={e => setUrl(e.target.value)} />
            <button onClick={create} disabled={saving || !name.trim() || !url.trim()}
              className="px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-50 flex items-center gap-2">
              <Plus size={15} />{saving ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-xs font-mono mt-2">{error}</p>}
      </div>

      {/* Lista */}
      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
      {!loading && webhooks.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 opacity-30">
          <Webhook size={36} /><p className="font-bold text-sm">No hay webhooks aún</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {webhooks.map(wh => (
          <div key={wh.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#3a3a4a] transition-all">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm">{wh.name}</p>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${wh.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                  {wh.active ? '● activo' : '○ inactivo'}
                </span>
              </div>
              <p className="text-xs text-[#555566] font-mono truncate">{wh.url}</p>
              <p className="text-xs text-[#7c6aff] font-mono mt-0.5">{wh.event}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(wh.id)}
                className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all">
                {wh.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              <button onClick={() => remove(wh.id)}
                className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
