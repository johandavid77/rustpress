import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Mail, Users, Send, Trash2, Plus, Loader2, CheckCircle, FileText } from 'lucide-react'

interface Subscriber { id: string; email: string; name?: string; active: boolean; created_at: string }
interface Campaign { id: string; subject: string; body: string; status: string; sent_count: number; sent_at?: string; created_at: string }

type Tab = 'subscribers' | 'campaigns' | 'new-campaign'

export default function NewsletterAdmin() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, c]: any = await Promise.all([
        apiClient.get('/newsletter/subscribers'),
        apiClient.get('/newsletter/campaigns'),
      ])
      setSubscribers(s?.subscribers ?? s ?? [])
      setCampaigns(Array.isArray(c) ? c : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const deleteSub = async (id: string) => {
    if (!confirm('Eliminar suscriptor?')) return
    await apiClient.delete('/newsletter/subscribers/' + id)
    setSubscribers(s => s.filter(x => x.id !== id))
  }

  const createCampaign = async () => {
    if (!subject.trim() || !body.trim()) return
    setSaving(true)
    try {
      await apiClient.post('/newsletter/campaigns', { subject, body })
      setSubject(''); setBody('')
      setTab('campaigns')
      await loadAll()
    } catch {} finally { setSaving(false) }
  }

  const sendCampaign = async (id: string) => {
    if (!confirm('Enviar campaña a todos los suscriptores activos?')) return
    setSending(id)
    try {
      const res: any = await apiClient.post('/newsletter/campaigns/' + id + '/send', {})
      alert('Enviado a ' + (res?.sent_to ?? res?.data?.sent_to ?? 0) + ' suscriptores')
      await loadAll()
    } catch {} finally { setSending(null) }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Eliminar campaña?')) return
    await apiClient.delete('/newsletter/campaigns/' + id)
    setCampaigns(c => c.filter(x => x.id !== id))
  }

  const activeSubs = subscribers.filter(s => s.active).length

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Mail size={24} className="text-[#7c6aff]" />Newsletter
        </h1>
        <p className="text-[#888899] text-sm">Gestiona suscriptores y envía campañas de email</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Suscriptores', value: subscribers.length, sub: activeSubs + ' activos', icon: Users, color: 'text-[#7c6aff]' },
          { label: 'Campañas', value: campaigns.length, sub: campaigns.filter(c => c.status === 'sent').length + ' enviadas', icon: Mail, color: 'text-green-400' },
          { label: 'Emails enviados', value: campaigns.reduce((a, c) => a + c.sent_count, 0), sub: 'total histórico', icon: Send, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
            <s.icon size={18} className={s.color + ' mb-2'} />
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-[#888899]">{s.label}</div>
            <div className="text-[10px] text-[#555566]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#0e0e1a] rounded-xl border border-[#2a2a3a] w-fit">
        {(['subscribers', 'campaigns', 'new-campaign'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (tab === t ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white')}>
            {t === 'subscribers' ? 'Suscriptores' : t === 'campaigns' ? 'Campañas' : '+ Nueva campaña'}
          </button>
        ))}
      </div>

      {/* Suscriptores */}
      {tab === 'subscribers' && (
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">{subscribers.length} suscriptores</span>
          </div>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>
          ) : subscribers.length === 0 ? (
            <div className="py-10 text-center text-[#555566] text-sm">Sin suscriptores aún. Agrega el widget de suscripción al sitio público.</div>
          ) : (
            <div className="divide-y divide-[#1e1e2e]">
              {subscribers.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]">
                  <div className={"w-2 h-2 rounded-full shrink-0 " + (s.active ? 'bg-green-400' : 'bg-[#333344]')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{s.email}</div>
                    <div className="text-xs text-[#555566]">{s.name ?? 'Sin nombre'} · {new Date(s.created_at).toLocaleDateString('es-CO')}</div>
                  </div>
                  <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (s.active ? 'bg-green-500/15 text-green-400' : 'bg-[#2a2a3a] text-[#555566]')}>
                    {s.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => deleteSub(s.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campañas */}
      {tab === 'campaigns' && (
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">{campaigns.length} campañas</span>
          </div>
          {campaigns.length === 0 ? (
            <div className="py-10 text-center text-[#555566] text-sm">Sin campañas. Crea una en "+ Nueva campaña".</div>
          ) : (
            <div className="divide-y divide-[#1e1e2e]">
              {campaigns.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.02]">
                  <FileText size={16} className={c.status === 'sent' ? 'text-green-400' : 'text-[#7c6aff]'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">{c.subject}</div>
                    <div className="text-xs text-[#555566]">
                      {c.status === 'sent' ? 'Enviado a ' + c.sent_count + ' · ' + new Date(c.sent_at!).toLocaleDateString('es-CO') : 'Borrador · ' + new Date(c.created_at).toLocaleDateString('es-CO')}
                    </div>
                  </div>
                  <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (c.status === 'sent' ? 'bg-green-500/15 text-green-400' : 'bg-[#7c6aff]/15 text-[#7c6aff]')}>
                    {c.status === 'sent' ? 'Enviada' : 'Borrador'}
                  </span>
                  {c.status !== 'sent' && (
                    <button onClick={() => sendCampaign(c.id)} disabled={sending === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c6aff]/15 border border-[#7c6aff]/30 text-[#7c6aff] text-xs font-semibold hover:bg-[#7c6aff]/25 disabled:opacity-50 transition-all">
                      {sending === c.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Enviar
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(c.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nueva campaña */}
      {tab === 'new-campaign' && (
        <div className="p-6 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest">Nueva campaña</h2>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Asunto del email"
            className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Contenido del email (HTML o texto plano)..."
            rows={10}
            className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] resize-none font-mono" />
          <button onClick={createCampaign} disabled={saving || !subject || !body}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-semibold disabled:opacity-50 transition-all">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Guardar borrador
          </button>
        </div>
      )}
    </div>
  )
}
