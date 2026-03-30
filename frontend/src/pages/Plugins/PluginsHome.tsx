import { Tag, Webhook, MessageSquare, SlidersHorizontal, Navigation, Zap, Activity } from 'lucide-react'

const plugins = [
  { id: 'sliders',    icon: <SlidersHorizontal size={24} />, title: 'Sliders',      description: 'Gestiona el carrusel de imágenes de la página principal.',          color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 hover:border-violet-500/50' },
  { id: 'menus',      icon: <Navigation size={24} />,        title: 'Menús',        description: 'Constructor de menús de navegación con items personalizables.',       color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 hover:border-blue-500/50' },
  { id: 'comments',   icon: <MessageSquare size={24} />,     title: 'Comentarios',  description: 'Modera los comentarios de los lectores. Aprueba o elimina.',         color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/50' },
  { id: 'categories', icon: <Tag size={24} />,               title: 'Categorías',   description: 'Organiza tus posts con categorías.',                                  color: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 hover:border-orange-500/50' },
  { id: 'webhooks',   icon: <Webhook size={24} />,           title: 'Webhooks',     description: 'Notifica a Slack, Discord u otros servicios al publicar.',            color: 'from-pink-500/20 to-pink-600/5 border-pink-500/20 hover:border-pink-500/50' },
  { id: 'health',     icon: <Activity size={24} />,          title: 'Healthcheck',  description: 'Monitorea el estado del servidor, base de datos y cache en tiempo real.', color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 hover:border-cyan-500/50' },
]

interface Props {
  onNavigate: (view: string) => void
}

export default function PluginsHome({ onNavigate }: Props) {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Zap size={28} className="text-[#7c6aff]" />
          Plugins
        </h1>
        <p className="text-[#888899] text-sm">Extiende las funcionalidades de tu CMS</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map(plugin => (
          <button key={plugin.id} onClick={() => onNavigate(plugin.id)}
            className={`text-left p-6 rounded-2xl border bg-gradient-to-br ${plugin.color} transition-all duration-200 group hover:scale-[1.02]`}>
            <div className="text-[#7c6aff] mb-4 group-hover:scale-110 transition-transform w-fit">
              {plugin.icon}
            </div>
            <h3 className="font-black text-lg mb-1 text-white">{plugin.title}</h3>
            <p className="text-sm text-[#888899] leading-relaxed">{plugin.description}</p>
            <div className="mt-4 text-xs font-mono text-[#555566] group-hover:text-[#7c6aff] transition-colors">Abrir →</div>
          </button>
        ))}
      </div>
    </div>
  )
}
