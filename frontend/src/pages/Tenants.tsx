import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { Globe, Plus, Trash2, Edit2, BarChart2, Check, X } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  plan: string
  is_active: boolean
  created_at: string
}

const PLAN_COLORS: Record<string, string> = {
  free:       'bg-gray-500/10 text-gray-400 border-gray-500/20',
  pro:        'bg-[#7c6aff]/10 text-[#7c6aff] border-[#7c6aff]/20',
  enterprise: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export default function Tenants() {
  const [tenants,  setTenants]  = useState<Tenant[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<Tenant | null>(null)
  const [stats,    setStats]    = useState<Record<string, any>>({})
  const [form, setForm] = useState({ name: '', slug: '', domain: '', plan: 'free' })

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/tenants')
      const list = Array.isArray(res?.data) ? res.data : []
      setTenants(list)
      // Cargar stats de cada tenant
      const statsMap: Record<string, any> = {}
      await Promise.all(list.map(async (t: Tenant) => {
        try {
          const s: any = await apiClient.get(`/tenants/${t.id}/stats`)
          statsMap[t.id] = s
        } catch(_) {}
      }))
      setStats(statsMap)
    } catch(_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    try {
      if (editing) {
        await apiClient.put(`/tenants/${editing.id}`, form)
      } else {
        await apiClient.post('/tenants', form)
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', slug: '', domain: '', plan: 'free' })
      load()
    } catch(e: any) {
      alert(e?.message ?? 'Error saving tenant')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this tenant? All its data will be lost.')) return
    try {
      await apiClient.delete(`/tenants/${id}`)
      setTenants(prev => prev.filter(t => t.id !== id))
    } catch(e: any) {
      alert(e?.message ?? 'Error')
    }
  }

  const toggleActive = async (t: Tenant) => {
    try {
      await apiClient.put(`/tenants/${t.id}`, { is_active: !t.is_active })
      setTenants(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x))
    } catch(_) {}
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]"

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Globe size={22} className="text-[#7c6aff]" /> Tenants
        </h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', domain: '', plan: 'free' }) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-bold transition-all">
          <Plus size={15} /> New Tenant
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-[#7c6aff]/30 bg-[#0e0e1a] p-6 mb-6 space-y-4">
          <h2 className="text-sm font-bold text-white">{editing ? 'Edit Tenant' : 'New Tenant'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className={inputCls} placeholder="My Store" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Slug *</label>
              <input value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')}))}
                className={inputCls} placeholder="my-store" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Domain</label>
              <input value={form.domain} onChange={e => setForm(f => ({...f, domain: e.target.value}))}
                className={inputCls} placeholder="mystore.com" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Plan</label>
              <select value={form.plan} onChange={e => setForm(f => ({...f, plan: e.target.value}))} className={inputCls}>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm">
              {editing ? 'Save Changes' : 'Create Tenant'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-4 py-2.5 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white text-sm transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-28 rounded-2xl bg-[#0e0e1a] border border-[#2a2a3a] animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {tenants.map(t => {
            const s = stats[t.id]
            return (
              <div key={t.id} className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center shrink-0">
                      <Globe size={18} className="text-[#7c6aff]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-white">{t.name}</p>
                        <span className={"px-2 py-0.5 rounded-lg border text-[10px] font-bold " + (PLAN_COLORS[t.plan] ?? '')}>{t.plan}</span>
                        {t.id === '00000000-0000-0000-0000-000000000001' && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">DEFAULT</span>
                        )}
                      </div>
                      <p className="text-xs text-[#555566]">
                        /{t.slug}{t.domain ? ` · ${t.domain}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(t)}
                      className={"w-8 h-8 rounded-lg flex items-center justify-center border transition-all " + (
                        t.is_active ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                      )}>
                      {t.is_active ? <Check size={13} /> : <X size={13} />}
                    </button>
                    <button onClick={() => { setEditing(t); setForm({ name: t.name, slug: t.slug, domain: t.domain ?? '', plan: t.plan }); setShowForm(true) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#2a2a3a] text-[#888899] hover:text-white hover:border-[#7c6aff]/50 transition-all">
                      <Edit2 size={13} />
                    </button>
                    {t.id !== '00000000-0000-0000-0000-000000000001' && (
                      <button onClick={() => remove(t.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                {s && (
                  <div className="flex items-center gap-4 mt-3 pl-13 text-xs text-[#555566]">
                    <span className="flex items-center gap-1"><BarChart2 size={11} /> {s.posts ?? 0} posts</span>
                    <span>{s.users ?? 0} users</span>
                    <span>{s.media ?? 0} media files</span>
                    <span className="ml-auto">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
