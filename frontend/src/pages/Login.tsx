import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'

export default function Login() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const resetOk = searchParams.get('reset') === 'ok'

  const handleLogin = async () => {
    setLoading(true); setError('')
    try {
      const data = await authApi.login({ email, password })
      setAuth((data as any).user, (data as any).token);
        localStorage.setItem('access_token', (data as any).token)
      // Sincronizar carrito localStorage → backend
      try {
        const cartRaw = localStorage.getItem('rustcms_cart')
        if (cartRaw) {
          const cartMap: Record<string, number> = JSON.parse(cartRaw)
          for (const [productId, quantity] of Object.entries(cartMap)) {
            await fetch('/api/v1/cart/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (data as any).token },
              body: JSON.stringify({ product_id: productId, quantity })
            })
          }
        }
      } catch(_) {}

      // Redirigir al redirect param o al admin
      const params = new URLSearchParams(location.search)
      const redirect = params.get('redirect') || '/admin'
      navigate(redirect)
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
          <div className="relative">
            <input
              className="w-full px-4 py-3 pr-11 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
              type={showPass ? 'text' : 'password'} value={password} placeholder="••••••••" autoComplete="new-password"
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555566] hover:text-[#7c6aff] transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
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

        {/* OAuth */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-[#2a2a3a]" />
          <span className="text-xs text-[#444455]">o continúa con</span>
          <div className="flex-1 h-px bg-[#2a2a3a]" />
        </div>
        <a href="/api/v1/auth/google"
          className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a] text-sm text-white hover:border-[#7c6aff]/50 hover:bg-[#7c6aff]/5 transition-all font-medium">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </a>

        <p className="text-center text-[#888899] text-xs mt-6 font-mono">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-[#7c6aff] hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
