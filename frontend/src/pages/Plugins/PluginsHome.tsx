import { ShoppingBag, SlidersHorizontal, Navigation, MessageSquare, Tag, Webhook, Activity, Zap } from 'lucide-react'

interface Props { onNavigate: (view: string) => void }

const plugins = [
  { id: 'ecommerce', title: 'Tienda / Ecommerce', description: 'Productos, pedidos, clientes, cupones, inventario y pasarelas de pago.', icon: ShoppingBag, color: 'from-violet-500/20 to-violet-600/5 border-violet-500/30', badge: 'Activo' },
  { id: 'sliders',   title: 'Sliders',             description: 'Carrusel de imágenes para la página principal.',                          icon: SlidersHorizontal, color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20' },
  { id: 'menus',     title: 'Menús',               description: 'Constructor de menús de navegación.',                                     icon: Navigation, color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20' },
  { id: 'comments',  title: 'Comentarios',         description: 'Modera comentarios de lectores.',                                         icon: MessageSquare, color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20' },
  { id: 'categories',title: 'Categorías',          description: 'Organiza posts con categorías y tags.',                                   icon: Tag, color: 'from-orange-500/20 to-orange-600/5 border-orange-500/20' },
  { id: 'webhooks',  title: 'Webhooks',            description: 'Notifica a Slack, Discord y otros al publicar.',                          icon: Webhook, color: 'from-pink-500/20 to-pink-600/5 border-pink-500/20' },
  { id: 'health',    title: 'Healthcheck',         description: 'Monitorea el estado del servidor.',                                       icon: Activity, color: 'from-gray-500/20 to-gray-600/5 border-gray-500/20' },
]

export default function PluginsHome({ onNavigate }: Props) {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Zap size={28} className="text-[#7c6aff]" />Plugins
        </h1>
        <p className="text-[#888899] text-sm">Activa y configura funcionalidades de tu sitio</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map(p => {
          const Icon = p.icon
          return (
            <button key={p.id} onClick={() => onNavigate(p.id)}
              className={`text-left p-6 rounded-2xl border bg-gradient-to-br ${p.color} transition-all duration-200 group hover:scale-[1.02]`}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-[#7c6aff] group-hover:scale-110 transition-transform">
                  <Icon size={24} />
                </div>
                {p.badge && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono">{p.badge}</span>}
              </div>
              <h3 className="font-black text-lg mb-1 text-white">{p.title}</h3>
              <p className="text-sm text-[#888899] leading-relaxed">{p.description}</p>
              <p className="mt-4 text-xs font-mono text-[#555566] group-hover:text-[#7c6aff] transition-colors">Abrir →</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
