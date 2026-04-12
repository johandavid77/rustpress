import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { MessageSquare, Plus, Trash2, Eye, EyeOff, Mail, Loader2, ChevronDown, ChevronUp, Check } from 'lucide-react'

interface Field { id: string; label: string; type: 'text' | 'email' | 'textarea' | 'tel' | 'select'; required: boolean; options?: string[] }
interface ContactForm { id: string; name: string; slug: string; fields: Field[]; email_to: string; active: boolean; created_at: string }
interface Submission { id: string; form_id: string; data: Record<string, string>; read: boolean; created_at: string }

type Tab = 'forms' | 'new-form'

const FIELD_TYPES = ['text', 'email', 'textarea', 'tel', 'select'] as const

export default function ContactFormsAdmin() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('forms')
  const [forms, setForms] = useState<ContactForm[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form builder state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [emailTo, setEmailTo] = useState('')
  const [fields, setFields] = useState<Field[]>([
    { id: '1', label: 'Nombre', type: 'text', required: true },
    { id: '2', label: 'Email', type: 'email', required: true },
    { id: '3', label: 'Mensaje', type: 'textarea', required: true },
  ])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/contact/admin/forms')
      setForms(Array.isArray(res) ? res : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const loadSubmissions = async (formId: string) => {
    if (submissions[formId]) { setExpanded(expanded === formId ? null : formId); return }
    try {
      const res: any = await apiClient.get('/contact/admin/forms/' + formId + '/submissions')
      setSubmissions(s => ({ ...s, [formId]: Array.isArray(res) ? res : [] }))
      setExpanded(formId)
    } catch {}
  }

  const addField = () => setFields(f => [...f, { id: Date.now().toString(), label: 'Nuevo campo', type: 'text', required: false }])
  const removeField = (id: string) => setFields(f => f.filter(x => x.id !== id))
  const updateField = (id: string, key: keyof Field, val: any) => setFields(f => f.map(x => x.id === id ? { ...x, [key]: val } : x))

  const createForm = async () => {
    if (!name || !slug || !emailTo || fields.length === 0) return
    setSaving(true)
    try {
      await apiClient.post('/contact/admin/forms', { name, slug, fields, email_to: emailTo })
      setName(''); setSlug(''); setEmailTo('')
      setFields([
        { id: '1', label: 'Nombre', type: 'text', required: true },
        { id: '2', label: 'Email', type: 'email', required: true },
        { id: '3', label: 'Mensaje', type: 'textarea', required: true },
      ])
      setTab('forms')
      await load()
    } catch {} finally { setSaving(false) }
  }

  const deleteForm = async (id: string) => {
    if (!confirm('Eliminar formulario y todos sus mensajes?')) return
    await apiClient.delete('/contact/admin/forms/' + id)
    setForms(f => f.filter(x => x.id !== id))
  }

  const markRead = async (subId: string, formId: string) => {
    await apiClient.post('/contact/admin/submissions/' + subId + '/read', {})
    setSubmissions(s => ({ ...s, [formId]: s[formId].map(x => x.id === subId ? { ...x, read: true } : x) }))
  }

  const deleteSub = async (subId: string, formId: string) => {
    await apiClient.delete('/contact/admin/submissions/' + subId)
    setSubmissions(s => ({ ...s, [formId]: s[formId].filter(x => x.id !== subId) }))
  }

  const unreadCount = (formId: string) => (submissions[formId] ?? []).filter(s => !s.read).length

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <MessageSquare size={24} className="text-[#7c6aff]" />Formularios de Contacto
        </h1>
        <p className="text-[#888899] text-sm">Crea formularios personalizables y gestiona los mensajes recibidos</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-[#0e0e1a] rounded-xl border border-[#2a2a3a] w-fit">
        {(['forms', 'new-form'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (tab === t ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white')}>
            {t === 'forms' ? 'Mis formularios' : '+ Nuevo formulario'}
          </button>
        ))}
      </div>

      {tab === 'forms' && (
        <div className="flex flex-col gap-4">
          {loading ? <div className="py-10 flex justify-center"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>
          : forms.length === 0 ? <div className="py-10 text-center text-[#555566] text-sm border border-[#2a2a3a] rounded-2xl">Sin formularios. Crea uno en &quot;+ Nuevo formulario&quot;.</div>
          : forms.map(form => (
            <div key={form.id} className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-[#0e0e1a]">
                <MessageSquare size={16} className="text-[#7c6aff] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{form.name}</div>
                  <div className="text-xs text-[#555566]">/{form.slug} · {form.email_to}</div>
                </div>
                <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (form.active ? 'bg-green-500/15 text-green-400' : 'bg-[#2a2a3a] text-[#555566]')}>
                  {form.active ? 'Activo' : 'Inactivo'}
                </span>
                {unreadCount(form.id) > 0 && (
                  <span className="bg-[#7c6aff] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount(form.id)} nuevo(s)
                  </span>
                )}
                <button onClick={() => loadSubmissions(form.id)} className="text-[#555566] hover:text-white transition-colors">
                  {expanded === form.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button onClick={() => deleteForm(form.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>

              {expanded === form.id && (
                <div className="divide-y divide-[#1e1e2e]">
                  {!submissions[form.id] ? (
                    <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin text-[#555566]" /></div>
                  ) : submissions[form.id].length === 0 ? (
                    <div className="py-6 text-center text-[#555566] text-sm">Sin mensajes recibidos aun.</div>
                  ) : submissions[form.id].map(sub => (
                    <div key={sub.id} className={"px-4 py-3 " + (!sub.read ? 'bg-[#7c6aff]/5' : '')}>
                      <div className="flex items-start gap-3">
                        <div className={"w-2 h-2 rounded-full mt-1.5 shrink-0 " + (!sub.read ? 'bg-[#7c6aff]' : 'bg-[#333344]')} />
                        <div className="flex-1 min-w-0">
                          {Object.entries(sub.data).map(([k, v]) => (
                            <div key={k} className="text-xs mb-1">
                              <span className="text-[#555566] font-medium">{k}: </span>
                              <span className="text-white">{v}</span>
                            </div>
                          ))}
                          <div className="text-[10px] text-[#444455] mt-1">{new Date(sub.created_at).toLocaleString('es-CO')}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {!sub.read && (
                            <button onClick={() => markRead(sub.id, form.id)} className="text-[#555566] hover:text-green-400 transition-colors" title="Marcar como leido">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteSub(sub.id, form.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'new-form' && (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest">Informacion del formulario</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={name} onChange={e => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) }}
                placeholder="Nombre del formulario"
                className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
              <input value={slug} onChange={e => setSlug(e.target.value)}
                placeholder="slug-del-formulario"
                className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] font-mono" />
            </div>
            <input value={emailTo} onChange={e => setEmailTo(e.target.value)}
              placeholder="Email donde recibir mensajes"
              className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
          </div>

          <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest">Campos del formulario</h2>
              <button onClick={addField} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c6aff]/15 border border-[#7c6aff]/30 text-[#7c6aff] text-xs font-semibold hover:bg-[#7c6aff]/25 transition-all">
                <Plus size={12} />Agregar campo
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-3 p-3 bg-[#1a1a2e] rounded-xl border border-[#2a2a3a]">
                  <span className="text-[#555566] text-xs font-mono w-4">{i + 1}</span>
                  <input value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white outline-none placeholder-[#555566]"
                    placeholder="Etiqueta del campo" />
                  <select value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)}
                    className="bg-[#0e0e1a] border border-[#2a2a3a] rounded-lg px-2 py-1 text-xs text-[#888899] outline-none">
                    {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-[#555566] cursor-pointer">
                    <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} />
                    Requerido
                  </label>
                  <button onClick={() => removeField(field.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={createForm} disabled={saving || !name || !emailTo || fields.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-semibold disabled:opacity-50 transition-all">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Crear formulario
          </button>
        </div>
      )}
    </div>
  )
}
