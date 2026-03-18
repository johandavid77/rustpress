import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'

export default function Login() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const resetOk = searchParams.get('reset') === 'ok'

  const handleLogin = async () => {
    setLoading(true); setError('')
    try {
      const data = await authApi.login({ email, password })
      setAuth(data.user, data.token)
      navigate('/admin')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al iniciar sesión')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,106,255,0.15),transparent)]" />
      <div className="relative w-[400px] bg-[#111118] border border-[#2a2a3a] rounded-2xl p-12 shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl text-[#7c6aff]">○</span>
          <span className="text-3xl font-black tracking-tight text-white">RustCMS</span>
        </div>
        <p className="text-[#888899] text-sm mb-9 font-mono">Panel de administración</p>

        {resetOk && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3 mb-6">
            <p className="text-green-400 text-xs font-mono">✅ Contraseña actualizada. Ya puedes iniciar sesión.</p>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Email</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="email" value={email} placeholder="tu@email.com"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div className="mb-2">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Contraseña</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="password" value={password} placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <div className="flex justify-end mb-6">
          <Link to="/forgot-password" className="text-xs text-[#7c6aff] hover:underline font-mono">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-red-400 text-xs mb-4 font-mono">{error}</p>}

        <button
          className="w-full py-3 bg-[#7c6aff] text-white rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 hover:bg-[#6b5be6]"
          onClick={handleLogin} disabled={loading}
        >
          {loading ? 'Ingresando...' : 'Ingresar →'}
        </button>

        <p className="text-center text-[#888899] text-xs mt-6 font-mono">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-[#7c6aff] hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
