import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Key, Trash2, Plus, Copy, Check } from 'lucide-react'

interface ApiKey {
  id: string; name: string; prefix: string
  scopes: string[]; last_used: string | null
  expires_at: string | null; created_at: string
}

export default function ApiKeys() {
  const [keys, setKeys]         = useState<ApiKey[]>([])
  const [loading, setLoading]   = useState(true)
  const [name, setName]         = useState('')
  const [saving, setSaving]     = useState(false)
  const [newKey, setNewKey]     = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/api-keys')
      setKeys(Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const create = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res: any = await apiClient.post('/api-keys', { name, scopes: ['read', 'write'] })
      setNewKey(res.key)
      setName('')
      load()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Revocar esta API key?')) return
    try { await apiClient.delete(`/api-keys/${id}`); load() }
    catch(e) { console.error(e) }
  }

  const copy = () => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Key size={28} className="text-[#7c6aff]" />API Keys
        </h1>
        <p className="text-[#888899] text-sm">Acceso externo a la API con claves de alcance definido</p>
      </div>

      {/* Nueva key mostrada una sola vez */}
      {newKey && (
        <div className="mb-6 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
          <p className="text-xs font-mono text-green-400 mb-2">✓ API key creada — cópiala ahora, no se mostrará de nuevo</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-[#1a1a24] px-3 py-2 rounded-lg text-green-300 font-mono break-all">{newKey}</code>
            <button onClick={copy} className="p-2 border border-[#2a2a3a] rounded-lg hover:border-green-500/50 transition-all">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-[#888899]" />}
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs font-mono text-[#555566] mt-2 hover:text-white">
            Ya la copié ✕
          </button>
        </div>
      )}

      {/* Crear nueva */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-6">
        <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-3">Nueva API key</p>
        <div className="flex gap-3">
          <input className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
            placeholder="Nombre (ej: Mi app, Postman...)"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()} />
          <button onClick={create} disabled={saving || !name.trim()}
            className="px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-50 flex items-center gap-2">
            <Plus size={14} />{saving ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
      {!loading && keys.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 opacity-30">
          <Key size={36} /><p className="font-bold text-sm">No hay API keys</p>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {keys.map(k => (
          <div key={k.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#3a3a4a] transition-all">
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-sm">{k.name}</p>
                <code className="text-xs font-mono text-[#7c6aff] bg-[#7c6aff]/10 px-2 py-0.5 rounded">{k.prefix}...</code>
              </div>
              <div className="flex items-center gap-3">
                {k.scopes.map(s => (
                  <span key={s} className="text-xs font-mono text-[#555566] bg-[#1a1a24] px-2 py-0.5 rounded">{s}</span>
                ))}
                {k.last_used && <span className="text-xs text-[#555566] font-mono">Usado: {new Date(k.last_used).toLocaleDateString('es-CO')}</span>}
              </div>
            </div>
            <button onClick={() => remove(k.id)}
              className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
