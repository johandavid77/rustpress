import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../api/client'
import { Globe, Mail, Image, Package, ArrowRight, Check } from 'lucide-react'

const STEPS = [
  { id: 'site',    label: 'Tu sitio',   icon: Globe },
  { id: 'smtp',    label: 'Email',      icon: Mail },
  { id: 'media',   label: 'Logo',       icon: Image },
  { id: 'done',    label: 'Listo',      icon: Check },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [site, setSite]   = useState({ name: '', description: '', url: '', language: 'es' })
  const [smtp, setSmtp]   = useState({ host: '', port: '587', user: '', pass: '', from: '' })

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]"

  const saveSite = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(site)) {
        if (value) await apiClient.post('/settings', { key: 'site_' + key, value })
      }
      setStep(1)
    } catch(_) { setStep(1) }
    finally { setSaving(false) }
  }

  const saveSmtp = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(smtp)) {
        if (value) await apiClient.post('/settings', { key: 'smtp_' + key, value })
      }
      setStep(2)
    } catch(_) { setStep(2) }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-2">
            Bienvenido a <span className="text-[#7c6aff]">RustCMS</span>
          </h1>
          <p className="text-[#888899] text-sm">Configuremos tu sitio en 3 pasos rápidos</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all " + (
                  done   ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  active ? 'bg-[#7c6aff]/20 text-[#7c6aff] border border-[#7c6aff]/50' :
                           'bg-[#1a1a2e] text-[#444455] border border-[#2a2a3a]'
                )}>
                  <Icon size={12} />
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-[#2a2a3a]" />}
              </div>
            )
          })}
        </div>

        {/* Step 0: Sitio */}
        {step === 0 && (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-6 space-y-4">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2"><Globe size={18} className="text-[#7c6aff]" /> Información del sitio</h2>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Nombre del sitio *</label>
              <input value={site.name} onChange={e => setSite(s => ({...s, name: e.target.value}))}
                className={inputCls} placeholder="Mi tienda" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Descripción</label>
              <input value={site.description} onChange={e => setSite(s => ({...s, description: e.target.value}))}
                className={inputCls} placeholder="La mejor tienda online" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">URL del sitio</label>
              <input value={site.url} onChange={e => setSite(s => ({...s, url: e.target.value}))}
                className={inputCls} placeholder="https://mitienda.com" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Idioma</label>
              <select value={site.language} onChange={e => setSite(s => ({...s, language: e.target.value}))}
                className={inputCls}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <button onClick={saveSite} disabled={saving || !site.name}
              className="w-full py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
              {saving ? 'Guardando...' : 'Continuar'} <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Step 1: SMTP */}
        {step === 1 && (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-6 space-y-4">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2"><Mail size={18} className="text-[#7c6aff]" /> Configurar email (SMTP)</h2>
            <p className="text-xs text-[#555566] -mt-2">Para enviar newsletters y notificaciones. Puedes saltarlo y configurarlo después.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Servidor SMTP</label>
                <input value={smtp.host} onChange={e => setSmtp(s => ({...s, host: e.target.value}))}
                  className={inputCls} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Puerto</label>
                <input value={smtp.port} onChange={e => setSmtp(s => ({...s, port: e.target.value}))}
                  className={inputCls} placeholder="587" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Usuario</label>
              <input value={smtp.user} onChange={e => setSmtp(s => ({...s, user: e.target.value}))}
                className={inputCls} placeholder="tu@gmail.com" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Contraseña / App Password</label>
              <input type="password" value={smtp.pass} onChange={e => setSmtp(s => ({...s, pass: e.target.value}))}
                className={inputCls} placeholder="••••••••••••••••" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white text-sm font-semibold transition-all">
                Saltar
              </button>
              <button onClick={saveSmtp} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Continuar'} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Logo */}
        {step === 2 && (
          <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-6 text-center space-y-4">
            <h2 className="text-lg font-black mb-2 flex items-center justify-center gap-2"><Image size={18} className="text-[#7c6aff]" /> Sube tu logo</h2>
            <p className="text-xs text-[#555566]">Puedes hacerlo ahora o más tarde desde Ajustes → Medios</p>
            <div className="border-2 border-dashed border-[#2a2a3a] rounded-2xl p-10 hover:border-[#7c6aff]/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('logo-input')?.click()}>
              <Image size={32} className="text-[#333344] mx-auto mb-2" />
              <p className="text-sm text-[#555566]">Haz clic para subir tu logo</p>
              <p className="text-xs text-[#333344] mt-1">PNG, JPG, SVG — max 2MB</p>
              <input id="logo-input" type="file" accept="image/*" className="hidden"
                onChange={async e => {
                  if (!e.target.files?.[0]) return
                  const fd = new FormData()
                  fd.append('file', e.target.files[0])
                  try {
                    const r: any = await apiClient.post('/media/upload', fd)
                    const url = r?.data?.url ?? r?.url ?? ''
                    if (url) await apiClient.post('/settings', { key: 'site_logo', value: url })
                  } catch(_) {}
                  setStep(3)
                }} />
            </div>
            <button onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white text-sm font-semibold transition-all">
              Saltar por ahora
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto">
              <Check size={28} className="text-green-400" />
            </div>
            <h2 className="text-xl font-black text-white">¡Todo listo!</h2>
            <p className="text-[#888899] text-sm">Tu RustCMS está configurado. Empieza creando tu primer post o agregando productos.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => navigate('/admin/posts/new')}
                className="flex-1 py-3 rounded-xl border border-[#2a2a3a] text-sm text-[#888899] hover:text-white transition-all font-semibold">
                Crear primer post
              </button>
              <button onClick={() => navigate('/admin')}
                className="flex-1 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2">
                Ir al Dashboard <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
