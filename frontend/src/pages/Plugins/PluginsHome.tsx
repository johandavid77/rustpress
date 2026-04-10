import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShoppingBag, SlidersHorizontal, Navigation, MessageSquare,
  Tag, Webhook, Activity, Zap, HardDrive, RefreshCw,
  Power, PowerOff, Trash2, Settings, AlertCircle, Loader2
} from 'lucide-react'
import { pluginsApi, type Plugin } from '../../api/plugins'

interface Props { onNavigate: (view: string) => void }

const ICON_MAP: Record<string, any> = {
  ShoppingBag, SlidersHorizontal, Navigation, MessageSquare,
  Tag, Webhook, Activity, Zap, HardDrive, RefreshCw,
}

const CATEGORY_LABELS: Record<string, string> = {
  content:      'content',
  ecommerce:    'ecommerce',
  integrations: 'integrations',
  system:       'system',
}

export default function PluginsHome({ onNavigate }: Props) {
  const { t } = useTranslation()
  const [plugins, setPlugins]   = useState<Plugin[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { loadPlugins() }, [])

  async function loadPlugins() {
    try {
      setLoading(true); setError(null)
      const data = await pluginsApi.list()
      const list = Array.isArray(data) ? data : (data as any)?.data ?? []
      setPlugins(list)
    } catch { setError('No se pudieron cargar los plugins') }
    finally { setLoading(false) }
  }

  async function togglePlugin(plugin: Plugin) {
    setToggling(plugin.id)
    try {
      plugin.is_enabled ? await pluginsApi.disable(plugin.id) : await pluginsApi.enable(plugin.id)
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, is_enabled: !p.is_enabled } : p))
    } catch { setError(`No se pudo cambiar el estado de ${plugin.config?.title}`) }
    finally { setToggling(null) }
  }

  async function deletePlugin(id: string) {
    setDeleting(id)
    try {
      await pluginsApi.delete(id)
      setPlugins(prev => prev.filter(p => p.id !== id))
      setConfirmDelete(null)
    } catch { setError('No se pudo eliminar el plugin') }
    finally { setDeleting(null) }
  }

  const grouped = plugins.reduce((acc, p) => {
    const cat = p.config?.category ?? 'system'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, Plugin[]>)

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Zap size={28} className="text-[#7c6aff]" />Plugins
        </h1>
        <p className="text-[#888899] text-sm">{t("plugins.subtitle")}</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-[#888899] py-12 justify-center">
          <Loader2 size={20} className="animate-spin" /><span>Cargando plugins...</span>
        </div>
      )}

      {!loading && ['content','ecommerce','integrations','system'].map(cat => {
        const group = grouped[cat]
        if (!group?.length) return null
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[#555566] mb-3 px-1">
              {t(`plugins.categories.${cat}`) || CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.map(plugin => {
                const Icon = ICON_MAP[plugin.config?.icon] ?? Zap
                const isBusy = toggling === plugin.id || deleting === plugin.id
                return (
                  <div key={plugin.id} className={`relative p-5 rounded-2xl border bg-gradient-to-br
                    ${plugin.config?.color ?? 'from-gray-500/20 to-gray-600/5 border-gray-500/20'}
                    transition-all duration-200 min-h-[160px] flex flex-col ${!plugin.is_enabled ? 'opacity-50 grayscale' : ''}`}>

                    {plugin.config?.badge && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">
                        {plugin.config.badge}
                      </span>
                    )}

                    <button onClick={() => plugin.is_enabled && onNavigate(plugin.name)}
                      disabled={!plugin.is_enabled} className="w-full text-left group flex-1">
                      <Icon size={24} className="mb-3 text-white/70 group-hover:text-white transition-colors" />
                      <div className="font-bold text-white text-sm mb-1">{plugin.config?.title ?? plugin.name}</div>
                      <div className="text-[#888899] text-xs leading-relaxed line-clamp-2">{plugin.description}</div>
                    </button>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                      <button onClick={() => togglePlugin(plugin)} disabled={isBusy}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                          ${plugin.is_enabled
                            ? 'bg-green-500/15 text-green-400 hover:bg-red-500/15 hover:text-red-400'
                            : 'bg-[#2a2a3a] text-[#888899] hover:bg-green-500/15 hover:text-green-400'}`}>
                        {toggling === plugin.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : plugin.is_enabled ? <Power size={12} /> : <PowerOff size={12} />}
                        {plugin.is_enabled ? t('plugins.active') : t('plugins.inactive')}
                      </button>

                      {plugin.is_enabled && (
                        <button onClick={() => onNavigate(plugin.name)}
                          className="p-1.5 rounded-lg text-[#666677] hover:text-white hover:bg-white/5 transition-all">
                          <Settings size={13} />
                        </button>
                      )}

                      <button onClick={() => setConfirmDelete(plugin.id)}
                        className="p-1.5 rounded-lg text-[#666677] hover:text-red-400 hover:bg-red-500/10 transition-all ml-auto">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {confirmDelete && (() => {
        const p = plugins.find(x => x.id === confirmDelete)
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{t('plugins.deleteConfirm')}</div>
                  <div className="text-[#888899] text-xs">{p?.config?.title ?? p?.name}</div>
                </div>
              </div>
              <p className="text-[#888899] text-xs mb-5">{t('plugins.deleteWarning')}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#2a2a3a] text-[#888899] hover:text-white text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={() => deletePlugin(confirmDelete)} disabled={!!deleting}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-medium flex items-center justify-center gap-2">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
