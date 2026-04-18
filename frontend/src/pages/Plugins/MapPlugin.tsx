import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { MapPin, Save, ExternalLink } from 'lucide-react'

export default function MapPlugin() {
  const [cfg, setCfg] = useState({ lat: '', lng: '', address: '', zoom: '15', enabled: false })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  useEffect(() => {
    apiClient.get('/settings/map_location').then((r: any) => {
      const d = r?.data ?? r
      if (d?.value) setCfg(JSON.parse(d.value))
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await apiClient.post('/settings', { key: 'map_location', value: JSON.stringify(cfg) })
      setMsg('✓ Guardado')
    } catch(_) { setMsg('Error al guardar') }
    finally { setSaving(false) }
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]"
  const mapsUrl = cfg.lat && cfg.lng ? `https://www.openstreetmap.org/?mlat=${cfg.lat}&mlon=${cfg.lng}#map=${cfg.zoom}/${cfg.lat}/${cfg.lng}` : ''
  const embedUrl = cfg.lat && cfg.lng ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(cfg.lng)-0.01},${parseFloat(cfg.lat)-0.01},${parseFloat(cfg.lng)+0.01},${parseFloat(cfg.lat)+0.01}&layer=mapnik&marker=${cfg.lat},${cfg.lng}` : ''

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-black text-white mb-6 flex items-center gap-3">
        <MapPin size={20} className="text-[#7c6aff]" /> Ubicación del negocio
      </h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a]">
          <div>
            <p className="text-sm font-semibold text-white">Mostrar mapa en el sitio</p>
            <p className="text-xs text-[#555566]">Aparece en la página de contacto</p>
          </div>
          <button onClick={() => setCfg(c => ({...c, enabled: !c.enabled}))}
            className={"w-11 h-6 rounded-full transition-colors relative " + (cfg.enabled ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]')}>
            <div className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-all " + (cfg.enabled ? 'left-6' : 'left-1')} />
          </button>
        </div>

        <div>
          <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Dirección completa</label>
          <input value={cfg.address} onChange={e => setCfg(c => ({...c, address: e.target.value}))}
            className={inputCls} placeholder="Calle 123 #45-67, Cali, Colombia" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Latitud</label>
            <input value={cfg.lat} onChange={e => setCfg(c => ({...c, lat: e.target.value}))}
              className={inputCls} placeholder="3.4516" />
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Longitud</label>
            <input value={cfg.lng} onChange={e => setCfg(c => ({...c, lng: e.target.value}))}
              className={inputCls} placeholder="-76.5320" />
          </div>
        </div>

        <p className="text-xs text-[#444455]">
          💡 Busca tu dirección en{' '}
          <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer"
            className="text-[#7c6aff] hover:underline">openstreetmap.org</a>,
          haz clic derecho → "Mostrar dirección" para obtener las coordenadas.
        </p>

        <div>
          <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Zoom (1-19)</label>
          <input type="range" min="10" max="19" value={cfg.zoom}
            onChange={e => setCfg(c => ({...c, zoom: e.target.value}))}
            className="w-full accent-[#7c6aff]" />
          <div className="flex justify-between text-xs text-[#444455] mt-1">
            <span>Ciudad</span><span>Zoom: {cfg.zoom}</span><span>Edificio</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white hover:border-[#7c6aff]/50 flex items-center gap-2 text-sm transition-all">
              <ExternalLink size={15} /> Ver
            </a>
          )}
        </div>

        {msg && (
          <div className={"px-4 py-3 rounded-xl text-sm " + (msg.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
            {msg}
          </div>
        )}

        {embedUrl && (
          <div className="mt-2 rounded-2xl overflow-hidden border border-[#2a2a3a]">
            <p className="text-xs text-[#555566] px-4 py-2 border-b border-[#2a2a3a]">Vista previa del mapa</p>
            <iframe src={embedUrl} width="100%" height="250" className="block"
              title="Mapa de ubicación" loading="lazy" />
          </div>
        )}
      </div>
    </div>
  )
}
