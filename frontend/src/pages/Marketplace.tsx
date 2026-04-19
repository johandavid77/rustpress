import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { Search, Star, Download, Package, Zap, ShoppingBag, BarChart2, Globe, LogIn, MessageSquare, Check, ExternalLink } from 'lucide-react'

const ICONS: Record<string, any> = { Search, Star, Download, Package, Zap, ShoppingBag, BarChart2, Globe, LogIn, MessageSquare, Check, Sparkles: Zap, FormInput: Package }

const CATEGORIES = [
  { id: '', label: 'Todos' },
  { id: 'content', label: 'Contenido' },
  { id: 'seo', label: 'SEO' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'integrations', label: 'Integraciones' },
  { id: 'auth', label: 'Auth' },
]

export default function Marketplace() {
  const [plugins, setPlugins]     = useState<any[]>([])
  const [installed, setInstalled] = useState<Set<string>>(new Set())
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('')
  const [installing, setInstalling] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiClient.get('/marketplace').catch(() => ({ data: [] })),
      apiClient.get('/plugins').catch(() => ({ data: [] })),
    ]).then(([market, inst]: any[]) => {
      const marketList = Array.isArray(market?.data) ? market.data : []
      const instList   = Array.isArray(inst?.data)   ? inst.data   : Array.isArray(inst) ? inst : []
      setPlugins(marketList)
      setInstalled(new Set(instList.map((p: any) => p.name)))
    }).finally(() => setLoading(false))
  }, [])

  const install = async (plugin: any) => {
    setInstalling(plugin.id)
    try {
      await apiClient.post('/plugins', {
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        is_enabled: true,
        config: JSON.stringify({
          title: plugin.title,
          icon: plugin.icon,
          color: plugin.color,
          category: plugin.category,
        })
      })
      setInstalled(prev => new Set([...prev, plugin.name]))
    } catch(e) {
      console.error(e)
    } finally {
      setInstalling(null)
    }
  }

  const filtered = plugins.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || p.tags?.some((t: string) => t.includes(search.toLowerCase()))
    const matchCat = !category || p.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-3">
          <Package size={22} className="text-[#7c6aff]" /> Marketplace de Plugins
        </h1>
        <p className="text-[#888899] text-sm">Extiende RustPress con plugins de la comunidad</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555566]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar plugins..."
            className="w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={"px-3 py-2 rounded-xl text-xs font-semibold border transition-all " + (
                category === cat.id
                  ? 'bg-[#7c6aff]/20 border-[#7c6aff] text-[#7c6aff]'
                  : 'border-[#2a2a3a] text-[#888899] hover:text-white hover:border-[#7c6aff]/30'
              )}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(plugin => {
            const Icon = ICONS[plugin.icon] ?? Package
            const isInstalled = installed.has(plugin.name)
            const isInstalling = installing === plugin.id

            return (
              <div key={plugin.id} className={"rounded-2xl border bg-gradient-to-br p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] " + plugin.color}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{plugin.title}</h3>
                      <p className="text-xs text-white/50">v{plugin.version}</p>
                    </div>
                  </div>
                  {plugin.price === 'premium' && (
                    <span className="px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-[10px] font-bold border border-yellow-500/30 shrink-0">PRO</span>
                  )}
                </div>

                <p className="text-xs text-white/60 leading-relaxed flex-1">{plugin.description}</p>

                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Star size={11} className="text-yellow-400" fill="currentColor" />
                    {plugin.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download size={11} />
                    {plugin.downloads.toLocaleString()}
                  </span>
                  <span className="ml-auto text-white/30">{plugin.author}</span>
                </div>

                <div className="flex gap-2">
                  {isInstalled ? (
                    <div className="flex-1 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Check size={13} /> Instalado
                    </div>
                  ) : (
                    <button onClick={() => install(plugin)} disabled={!!isInstalling}
                      className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                      {isInstalling ? (
                        <span className="animate-pulse">Instalando...</span>
                      ) : (
                        <><Download size={13} /> Instalar</>
                      )}
                    </button>
                  )}
                  <button className="px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all">
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center text-[#555566] border border-[#2a2a3a] rounded-2xl">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p>No se encontraron plugins con esos filtros</p>
        </div>
      )}

      <div className="mt-10 p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] text-center">
        <p className="text-sm font-semibold text-white mb-1">¿Tienes un plugin que compartir?</p>
        <p className="text-xs text-[#555566] mb-3">Publica tu plugin en el marketplace de RustPress</p>
        <a href="https://github.com/johandavid77/rustpress" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2a2a3a] text-sm text-[#888899] hover:text-white hover:border-[#7c6aff]/50 transition-all">
          <ExternalLink size={14} /> Contribuir en GitHub
        </a>
      </div>
    </div>
  )
}
