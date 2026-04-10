import { useState, useEffect, useRef } from 'react'
import { Search, FileText, Package, Users, ShoppingBag, X, Loader2 } from 'lucide-react'
import { apiClient } from '../../api/client'

interface SearchResult {
  id: string
  kind: string
  title: string
  subtitle?: string
  url: string
  meta?: string
}

const kindIcon: Record<string, any> = {
  post: FileText,
  product: Package,
  user: Users,
  order: ShoppingBag,
}

const kindLabel: Record<string, string> = {
  post: 'Post',
  product: 'Producto',
  user: 'Usuario',
  order: 'Pedido',
}

const kindColor: Record<string, string> = {
  post: 'text-green-400 bg-green-500/10',
  product: 'text-orange-400 bg-orange-500/10',
  user: 'text-cyan-400 bg-cyan-500/10',
  order: 'text-blue-400 bg-blue-500/10',
}

export default function GlobalSearch({ onNavigate }: { onNavigate: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res: any = await apiClient.get('/search?q=' + encodeURIComponent(query))
        setResults(res?.results ?? [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
  }, [query])

  const go = (r: SearchResult) => {
    onNavigate(r.url)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a3a] text-[#555566] hover:text-white hover:border-[#3a3a4a] transition-all text-sm w-full">
        <Search size={14} />
        <span className="flex-1 text-left">Buscar...</span>
        <span className="text-[10px] bg-[#2a2a3a] px-1.5 py-0.5 rounded font-mono">Ctrl+K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[#13131f] border border-[#2a2a3a] rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3a]">
              {loading ? <Loader2 size={16} className="text-[#7c6aff] animate-spin shrink-0" /> : <Search size={16} className="text-[#555566] shrink-0" />}
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar posts, productos, usuarios, pedidos..."
                className="flex-1 bg-transparent text-white placeholder-[#555566] text-sm outline-none"
                autoComplete="off"
              />
              {query && <button onClick={() => { setQuery(''); setResults([]) }}><X size={14} className="text-[#555566] hover:text-white" /></button>}
            </div>
            {results.length > 0 && (
              <div className="max-h-80 overflow-y-auto divide-y divide-[#1e1e2e]">
                {results.map(r => {
                  const Icon = kindIcon[r.kind] ?? FileText
                  const colorClass = kindColor[r.kind] ?? 'text-[#888899] bg-[#2a2a3a]'
                  const iconColor = colorClass.split(' ')[0]
                  return (
                    <button key={r.id} onClick={() => go(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] text-left transition-colors">
                      <Icon size={16} className={iconColor} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{r.title}</div>
                        {r.subtitle && <div className="text-xs text-[#555566] truncate">{r.subtitle}</div>}
                      </div>
                      <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 " + colorClass}>
                        {kindLabel[r.kind] ?? r.kind}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="py-8 text-center text-[#555566] text-sm">Sin resultados para "{query}"</div>
            )}
            {!query && (
              <div className="py-6 text-center text-[#555566] text-xs">Escribe al menos 2 caracteres</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
