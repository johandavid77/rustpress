import { useState, useEffect } from 'react'
import { Tag, Webhook, MessageSquare, SlidersHorizontal, Navigation, Zap, Activity, ToggleLeft, ToggleRight, Trash2, Settings } from 'lucide-react'
import { apiClient } from '../../api/client'

const iconMap: Record<string, any> = {
  sliders: SlidersHorizontal, menus: Navigation, comments: MessageSquare,
  categories: Tag, webhooks: Webhook, health: Activity,
}

const builtinPlugins = [
  { id: 'sliders',    title: 'Sliders',      description: 'Carrusel de imágenes para la página principal.',      color: 'from-violet-500/20 to-violet-600/5 border-violet-500/20' },
  { id: 'menus',      title: 'Menús',        description: 'Constructor de menús de navegación personalizables.', color: 'from-blue-500/20 to-blue-600/5 border-blue-500/20' },
  { id: 'comments',   title: 'Comentarios',  description: 'Modera los comentarios de los lectores.',             color: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20' },
  { id: 'categories', title: 'Categorías',   description: 'Organiza tus posts con categorías y tags.',           color: 'from-orange-500/20 to-orange-600/5 border-orange-500/20' },
  { id: 'webhooks',   title: 'Webhooks',     description: 'Notifica a Slack, Discord y otros al publicar.',      color: 'from-pink-500/20 to-pink-600/5 border-pink-500/20' },
  { id: 'health',     title: 'Healthcheck',  description: 'Monitorea el estado del servidor y base de datos.',   color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20' },
]

interface Props { onNavigate: (view: string) => void }

export default function PluginsHome({ onNavigate }: Props) {
  const [dbPlugins, setDbPlugins] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'builtin'|'installed'>('builtin')

  useEffect(() => { loadPlugins() }, [])

  const loadPlugins = async () => {
    try {
      const res: any = await apiClient.get('/plugins')
      setDbPlugins(Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggle = async (id: string, enabled: boolean) => {
    try {
      await apiClient.post(`/plugins/${id}/${enabled ? 'enable' : 'disable'}`, {})
      loadPlugins()
    } catch(e) { console.error(e) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar plugin?')) return
    try {
      await apiClient.delete(`/plugins/${id}`)
      loadPlugins()
    } catch(e) { console.error(e) }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Zap size={28} className="text-[#7c6aff]" />Plugins
        </h1>
        <p className="text-[#888899] text-sm">Extiende las funcionalidades de tu CMS</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['builtin', 'installed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${tab === t ? 'bg-[#7c6aff] text-white' : 'border border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'}`}>
            {t === 'builtin' ? '🧩 Módulos integrados' : `📦 Instalados (${dbPlugins.length})`}
          </button>
        ))}
      </div>

      {tab === 'builtin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {builtinPlugins.map(plugin => {
            const Icon = iconMap[plugin.id] || Zap
            return (
              <button key={plugin.id} onClick={() => onNavigate(plugin.id)}
                className={`text-left p-6 rounded-2xl border bg-gradient-to-br ${plugin.color} transition-all duration-200 group hover:scale-[1.02]`}>
                <div className="text-[#7c6aff] mb-4 group-hover:scale-110 transition-transform w-fit">
                  <Icon size={24} />
                </div>
                <h3 className="font-black text-lg mb-1 text-white">{plugin.title}</h3>
                <p className="text-sm text-[#888899] leading-relaxed">{plugin.description}</p>
                <div className="mt-4 text-xs font-mono text-[#555566] group-hover:text-[#7c6aff] transition-colors">Abrir →</div>
              </button>
            )
          })}
        </div>
      )}

      {tab === 'installed' && (
        <div>
          {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
          {!loading && dbPlugins.length === 0 && (
            <div className="text-center py-20 opacity-30">
              <Zap size={40} className="mx-auto mb-3" />
              <p className="font-bold">No hay plugins instalados</p>
              <p className="text-sm mt-1">Los plugins se instalan via API o archivo de configuración</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {dbPlugins.map(p => (
              <div key={p.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{p.name}</p>
                    <span className="text-xs font-mono text-[#555566]">v{p.version}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${p.enabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      {p.enabled ? 'activo' : 'inactivo'}
                    </span>
                  </div>
                  {p.description && <p className="text-sm text-[#888899]">{p.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggle(p.id, !p.enabled)}
                    className={`p-2 rounded-lg transition-all ${p.enabled ? 'text-green-400 hover:bg-green-500/10' : 'text-[#555566] hover:bg-[#1a1a24]'}`}>
                    {p.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => onNavigate(`plugin-config-${p.id}`)}
                    className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all">
                    <Settings size={14} />
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
