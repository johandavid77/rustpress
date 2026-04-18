import { Link, useNavigate } from 'react-router-dom'
import { Home, Search, ArrowLeft, Frown } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  const suggestions = [
    { label: 'Inicio', to: '/', icon: Home },
    { label: 'Tienda', to: '/shop', icon: Search },
    { label: 'Blog', to: '/blog', icon: Search },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 rounded-3xl bg-[#7c6aff]/10 border border-[#7c6aff]/20 flex items-center justify-center mx-auto mb-8">
          <Frown size={40} className="text-[#7c6aff]" />
        </div>

        <h1 className="text-8xl font-black text-[#7c6aff] mb-4 leading-none">404</h1>
        <h2 className="text-2xl font-black text-white mb-3">Página no encontrada</h2>
        <p className="text-[#888899] mb-10">
          La página que buscas no existe o fue movida a otra dirección.
        </p>

        <div className="flex flex-col gap-3 mb-10">
          {suggestions.map(({ label, to }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between px-5 py-3 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a] hover:border-[#7c6aff]/50 hover:bg-[#7c6aff]/5 transition-all group">
              <span className="text-sm font-medium text-[#888899] group-hover:text-white transition-colors">{label}</span>
              <ArrowLeft size={14} className="text-[#555566] group-hover:text-[#7c6aff] rotate-180 transition-colors" />
            </Link>
          ))}
        </div>

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#555566] hover:text-white transition-colors mx-auto">
          <ArrowLeft size={14} />
          Volver a la página anterior
        </button>
      </div>
    </div>
  )
}
