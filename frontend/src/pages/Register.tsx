import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleRegister = async () => {
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (username.length < 3)  { setError('El usuario debe tener al menos 3 caracteres'); return }
    setLoading(true)
    try {
      await authApi.register({ username, email, password })
      setSuccess(true)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al registrarse')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(124,106,255,0.15),transparent)]" />
      <div className="relative w-[400px] bg-[#111118] border border-[#2a2a3a] rounded-2xl p-12 shadow-2xl text-center">
        <span className="text-5xl mb-4 block">✅</span>
        <h2 className="text-2xl font-black tracking-tight text-white mb-3">¡Registro enviado!</h2>
        <p className="text-[#888899] text-sm font-mono mb-6">
          Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada.
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
        <p className="text-[#888899] text-sm mb-9 font-mono">Crear nueva cuenta</p>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Usuario</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="text" value={username} placeholder="johndoe"
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Email</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="email" value={email} placeholder="tu@email.com"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Contraseña</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="password" value={password} placeholder="••••••••"
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Confirmar contraseña</label>
          <input
            className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
            type="password" value={confirm} placeholder="••••••••"
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-4 font-mono">{error}</p>}

        <button
          className="w-full py-3 bg-[#7c6aff] text-white rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 hover:bg-[#6b5be6]"
          onClick={handleRegister} disabled={loading}
        >
          {loading ? 'Registrando...' : 'Crear cuenta →'}
        </button>

        <p className="text-center text-[#888899] text-xs mt-6 font-mono">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-[#7c6aff] hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
