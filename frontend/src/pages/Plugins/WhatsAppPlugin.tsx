import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { MessageCircle, Save, Eye, EyeOff } from 'lucide-react'

export default function WhatsAppPlugin() {
  const [config, setConfig] = useState({ phone: '', message: '', enabled: false, position: 'right' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    apiClient.get('/settings/whatsapp').then((r: any) => {
      const d = r?.data ?? r
      if (d?.value) setConfig(JSON.parse(d.value))
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await apiClient.post('/settings', { key: 'whatsapp', value: JSON.stringify(config) })
      setMsg('✓ Guardado')
    } catch(_) { setMsg('Error al guardar') }
    finally { setSaving(false) }
  }

  const previewUrl = `https://wa.me/${config.phone.replace(/\D/g,'')}?text=${encodeURIComponent(config.message)}`
  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]"

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-black text-white mb-6 flex items-center gap-3">
        <MessageCircle size={20} className="text-green-400" /> WhatsApp Button
      </h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <div>
            <p className="text-sm font-semibold text-white">Botón flotante activo</p>
            <p className="text-xs text-[#555566]">Muestra el botón en todas las páginas públicas</p>
          </div>
          <button onClick={() => setConfig(c => ({...c, enabled: !c.enabled}))}
            className={"w-11 h-6 rounded-full transition-colors " + (config.enabled ? 'bg-green-500' : 'bg-[#2a2a3a]')}>
            <div className={"w-4 h-4 rounded-full bg-white transition-transform mx-1 " + (config.enabled ? 'translate-x-5' : 'translate-x-0')} />
          </button>
        </div>

        <div>
          <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Número de WhatsApp</label>
          <input value={config.phone} onChange={e => setConfig(c => ({...c, phone: e.target.value}))}
            className={inputCls} placeholder="+57 300 123 4567" />
          <p className="text-xs text-[#444455] mt-1">Incluye código de país sin espacios: +573001234567</p>
        </div>

        <div>
          <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Mensaje predeterminado</label>
          <textarea value={config.message} onChange={e => setConfig(c => ({...c, message: e.target.value}))}
            className={inputCls + " resize-none h-20"} placeholder="Hola, me interesa saber más sobre..." />
        </div>

        <div>
          <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Posición del botón</label>
          <div className="flex gap-2">
            {['right','left'].map(pos => (
              <button key={pos} onClick={() => setConfig(c => ({...c, position: pos}))}
                className={"flex-1 py-2 rounded-xl text-sm font-semibold border transition-all " + (
                  config.position === pos
                    ? 'border-[#7c6aff] bg-[#7c6aff]/10 text-[#7c6aff]'
                    : 'border-[#2a2a3a] text-[#555566] hover:text-white'
                )}>
                {pos === 'right' ? '→ Derecha' : '← Izquierda'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {config.phone && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white hover:border-green-500/50 flex items-center gap-2 text-sm transition-all">
              <Eye size={15} /> Probar
            </a>
          )}
        </div>

        {msg && (
          <div className={"px-4 py-3 rounded-xl text-sm " + (msg.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
            {msg}
          </div>
        )}
      </div>

      {/* Preview del botón */}
      {config.enabled && config.phone && (
        <div className="mt-8 p-4 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <p className="text-xs text-[#555566] mb-3">Vista previa del botón:</p>
          <div className="relative h-16 bg-[#0a0a0f] rounded-xl overflow-hidden">
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              className={"absolute bottom-3 flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-500 hover:bg-green-400 text-white text-sm font-semibold shadow-lg transition-all " + (config.position === 'right' ? 'right-3' : 'left-3')}>
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
