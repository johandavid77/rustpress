import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { AlertTriangle, Shield, Clock, Wifi, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'

interface MaintenanceConfig {
  enabled: boolean
  message: string
  ends_at?: string
  allowed_ips: string[]
  updated_at: string
}

export default function MaintenanceAdmin() {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [ipsText, setIpsText] = useState('')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/maintenance/status')
      const data = res?.data ?? res
      setConfig(data)
      setMessage(data.message ?? '')
      setEndsAt(data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : '')
      setIpsText((data.allowed_ips ?? []).join('
'))
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggle = async () => {
    if (!config) return
    const newEnabled = !config.enabled
    if (newEnabled && !confirm('Activar modo mantenimiento? El sitio publico no estara disponible para los visitantes.')) return
    setSaving(true)
    try {
      const res: any = await apiClient.put('/maintenance/status', { enabled: newEnabled })
      setConfig(res?.data ?? res)
    } catch {} finally { setSaving(false) }
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const ips = ipsText.split('
').map(s => s.trim()).filter(Boolean)
      const res: any = await apiClient.put('/maintenance/status', {
        message,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        allowed_ips: ips,
      })
      setConfig(res?.data ?? res)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Shield size={24} className="text-[#7c6aff]" />Modo Mantenimiento
        </h1>
        <p className="text-[#888899] text-sm">Muestra una pagina de mantenimiento a los visitantes del sitio</p>
      </div>

      {/* Toggle principal */}
      <div className={"p-5 rounded-2xl border mb-6 " + (config?.enabled ? 'border-red-500/30 bg-red-500/5' : 'border-[#2a2a3a] bg-[#0e0e1a]')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className={config?.enabled ? 'text-red-400' : 'text-[#555566]'} />
            <div>
              <div className={"font-bold " + (config?.enabled ? 'text-red-400' : 'text-white')}>
                {config?.enabled ? 'Modo mantenimiento ACTIVO' : 'Modo mantenimiento inactivo'}
              </div>
              <div className="text-xs text-[#888899]">
                {config?.enabled ? 'El sitio publico muestra la pagina de mantenimiento' : 'El sitio publico esta accesible normalmente'}
              </div>
            </div>
          </div>
          <button onClick={toggle} disabled={saving} className="shrink-0">
            {config?.enabled
              ? <ToggleRight size={36} className="text-red-400 hover:text-red-300 transition-colors" />
              : <ToggleLeft size={36} className="text-[#555566] hover:text-white transition-colors" />
            }
          </button>
        </div>
        {config?.enabled && (
          <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-red-400/70">
            Activado: {new Date(config.updated_at).toLocaleString('es-CO')}
          </div>
        )}
      </div>

      {/* Configuracion */}
      <div className="flex flex-col gap-5">
        <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={14} />Mensaje de mantenimiento
          </h2>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
            className="w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] resize-none"
            placeholder="Estamos trabajando en mejoras. Volvemos pronto." />
        </div>

        <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={14} />Fin del mantenimiento (opcional)
          </h2>
          <input value={endsAt} onChange={e => setEndsAt(e.target.value)} type="datetime-local"
            className="w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#7c6aff]" />
          <div className="text-xs text-[#555566] mt-2">Se mostrara un countdown en la pagina de mantenimiento</div>
        </div>

        <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Wifi size={14} />IPs con acceso completo
          </h2>
          <textarea value={ipsText} onChange={e => setIpsText(e.target.value)} rows={4}
            className="w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] resize-none font-mono"
            placeholder="192.168.1.1 / 10.0.0.1" />
          <div className="text-xs text-[#555566] mt-2">Una IP por linea. Estas IPs veran el sitio normal aunque el mantenimiento este activo.</div>
        </div>

        <button onClick={save} disabled={saving}
          className={"flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all " +
            (saved ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-[#7c6aff] hover:bg-[#6a58e8] text-white disabled:opacity-50')}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? 'Guardado correctamente' : 'Guardar configuracion'}
        </button>
      </div>
    </div>
  )
}
