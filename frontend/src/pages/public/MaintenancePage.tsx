import { useState, useEffect } from 'react'
import { Shield, Clock, RefreshCw } from 'lucide-react'

export default function MaintenancePage() {
  const [config, setConfig] = useState<{ message: string; ends_at?: string } | null>(null)
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    fetch('/api/v1/maintenance/status')
      .then(r => r.json())
      .then(d => setConfig(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!config?.ends_at) return
    const tick = () => {
      const diff = Math.max(0, new Date(config.ends_at!).getTime() - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ h, m, s })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [config?.ends_at])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-[#7c6aff] flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">RustCMS</span>
        </div>

        {/* Icono principal */}
        <div className="w-20 h-20 rounded-2xl bg-[#7c6aff]/15 border border-[#7c6aff]/20 flex items-center justify-center mx-auto mb-6">
          <RefreshCw size={32} className="text-[#7c6aff] animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
          Sitio en mantenimiento
        </h1>

        <p className="text-[#888899] text-lg mb-8 leading-relaxed">
          {config?.message ?? 'Estamos trabajando en mejoras. Volvemos pronto.'}
        </p>

        {/* Countdown */}
        {timeLeft && (
          <div className="mb-8">
            <div className="text-xs text-[#555566] uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
              <Clock size={12} />Tiempo estimado de regreso
            </div>
            <div className="flex items-center justify-center gap-3">
              {[
                { val: timeLeft.h, label: 'horas' },
                { val: timeLeft.m, label: 'minutos' },
                { val: timeLeft.s, label: 'segundos' },
              ].map(({ val, label }, i) => (
                <div key={label}>
                  <div className="w-20 h-20 rounded-2xl bg-[#0e0e1a] border border-[#2a2a3a] flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white font-mono">{pad(val)}</span>
                    <span className="text-[9px] text-[#555566] uppercase tracking-wider">{label}</span>
                  </div>
                  {i < 2 && <span className="text-[#555566] text-2xl font-bold mx-1">:</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra animada */}
        <div className="h-1 bg-[#1a1a2e] rounded-full overflow-hidden mb-8 mx-auto max-w-xs">
          <div className="h-full bg-gradient-to-r from-[#7c6aff] to-[#a855f7] rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>

        <p className="text-[#444455] text-sm">
          Si tienes dudas, contacta al administrador.
        </p>
      </div>
    </div>
  )
}
