import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    if (!token)               { setError('Token inválido o expirado'); return }
    if (password.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirm)  { setError('Las contraseñas no coinciden'); return }
    setError(''); setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      navigate('/login?reset=ok')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Token inválido o expirado')
    } finally { setLoading(false) }
  }

  if (!token) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 font-mono mb-4">Token inválido o expirado.</p>
        <Link to="/forgot-password" className="text-[#7c6aff] text-sm hover:underline">Solicitar nuevo enlace</Link>
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
        <p className="text-[#888899] text-sm mb-9 font-mono">Nueva contraseña</p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Nueva contraseña</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="password" value={password} placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Confirmar contraseña</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="password" value={confirm} placeholder="••••••••"
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-4 font-mono">{error}</p>}

        <button
          className="w-full py-3 bg-[#7c6aff] text-white rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 hover:bg-[#6b5be6]"
          onClick={handleSubmit} disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar contraseña →'}
        </button>
      </div>
    </div>
  )
}
