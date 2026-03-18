import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email) { setError('Ingresa tu email'); return }
    setError(''); setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSuccess(true)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al enviar el correo')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,106,255,0.15),transparent)]" />
      <div className="relative w-[400px] bg-[#111118] border border-[#2a2a3a] rounded-2xl p-12 shadow-2xl text-center">
        <span className="text-5xl mb-4 block">📧</span>
        <h2 className="text-2xl font-black tracking-tight text-white mb-3">Revisa tu email</h2>
        <p className="text-[#888899] text-sm font-mono mb-6">
          Si el email existe en nuestro sistema, recibirás instrucciones para resetear tu contraseña.
        </p>
        <Link to="/login" className="text-[#7c6aff] text-sm hover:underline">← Volver al login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,106,255,0.15),transparent)]" />
      <div className="relative w-[400px] bg-[#111118] border border-[#2a2a3a] rounded-2xl p-12 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl text-[#7c6aff]">○</span>
          <span className="text-3xl font-black tracking-tight text-white">RustCMS</span>
        </div>
        <p className="text-[#888899] text-sm mb-9 font-mono">Recuperar contraseña</p>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Email</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="email" value={email} placeholder="tu@email.com"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-4 font-mono">{error}</p>}

        <button
          className="w-full py-3 bg-[#7c6aff] text-white rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 hover:bg-[#6b5be6]"
          onClick={handleSubmit} disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar instrucciones →'}
        </button>

        <p className="text-center text-[#888899] text-xs mt-6 font-mono">
          <Link to="/login" className="text-[#7c6aff] hover:underline">← Volver al login</Link>
        </p>
      </div>
    </div>
  )
}
