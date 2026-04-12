import { useState } from 'react'
import { Mail, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  title?: string
  subtitle?: string
  placeholder?: string
  buttonText?: string
  className?: string
}

export default function NewsletterWidget({
  title = 'Suscribete al newsletter',
  subtitle = 'Recibe las ultimas novedades directamente en tu email.',
  placeholder = 'tu@email.com',
  buttonText = 'Suscribirse',
  className = '',
}: Props) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const subscribe = async () => {
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      if (res.ok) {
        setDone(true)
        setEmail('')
        setName('')
      } else {
        const data = await res.json()
        setError(data?.message ?? 'Error al suscribirse')
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className={"flex flex-col items-center gap-3 py-8 px-6 rounded-2xl border border-green-500/20 bg-green-500/5 text-center " + className}>
        <CheckCircle size={32} className="text-green-400" />
        <div className="text-white font-semibold">Suscrito correctamente</div>
        <div className="text-sm text-[#888899]">Gracias por suscribirte. Recibiras nuestras novedades pronto.</div>
      </div>
    )
  }

  return (
    <div className={"flex flex-col gap-4 py-8 px-6 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] " + className}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#7c6aff]/15 border border-[#7c6aff]/20">
          <Mail size={18} className="text-[#7c6aff]" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">{title}</div>
          <div className="text-[#888899] text-xs">{subtitle}</div>
        </div>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Tu nombre (opcional)"
        className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] transition-colors"
      />
      <div className="flex gap-2">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && subscribe()}
          placeholder={placeholder}
          type="email"
          className="flex-1 bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] transition-colors"
        />
        <button
          onClick={subscribe}
          disabled={loading || !email}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-semibold disabled:opacity-50 transition-all shrink-0">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
          {buttonText}
        </button>
      </div>

      {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

      <div className="text-[10px] text-[#444455] text-center">
        Sin spam. Puedes desuscribirte cuando quieras.
      </div>
    </div>
  )
}
