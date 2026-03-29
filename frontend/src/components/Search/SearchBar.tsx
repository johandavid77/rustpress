import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { Search, X } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
}

interface Props {
  theme?: 'dark' | 'minimal' | 'bold' | 'magazine'
}

const styles = {
  dark:     { input: 'w-full px-4 py-2.5 pl-10 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#555566]', results: 'absolute top-12 left-0 right-0 z-30 bg-[#111118] border border-[#2a2a3a] rounded-xl shadow-xl overflow-hidden', item: 'px-4 py-3 hover:bg-[#1a1a24] transition-colors border-b border-[#2a2a3a] last:border-0', title: 'text-sm font-bold text-white', excerpt: 'text-xs text-[#888899] line-clamp-1 mt-0.5', empty: 'px-4 py-6 text-center text-xs text-[#555566] font-mono' },
  minimal:  { input: 'w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-gray-900 placeholder-gray-300', results: 'absolute top-12 left-0 right-0 z-30 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden', item: 'px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0', title: 'text-sm font-bold text-gray-900', excerpt: 'text-xs text-gray-400 line-clamp-1 mt-0.5', empty: 'px-4 py-6 text-center text-xs text-gray-300 font-mono' },
  bold:     { input: 'w-full px-4 py-2.5 pl-10 bg-gray-900 border-2 border-gray-800 text-white text-sm outline-none focus:border-yellow-400 placeholder-gray-600', results: 'absolute top-12 left-0 right-0 z-30 bg-gray-900 border-2 border-gray-800 shadow-xl overflow-hidden', item: 'px-4 py-3 hover:bg-black transition-colors border-b-2 border-gray-800 last:border-0', title: 'text-sm font-black text-white uppercase', excerpt: 'text-xs text-gray-500 line-clamp-1 mt-0.5', empty: 'px-4 py-6 text-center text-xs text-gray-600 font-mono uppercase' },
  magazine: { input: 'w-full px-4 py-2.5 pl-10 bg-[#f5f0e8] border-2 border-black text-gray-900 text-sm outline-none placeholder-gray-400', results: 'absolute top-12 left-0 right-0 z-30 bg-[#f5f0e8] border-2 border-black shadow-xl overflow-hidden', item: 'px-4 py-3 hover:bg-white transition-colors border-b-2 border-black last:border-0', title: 'text-sm font-black text-gray-900', excerpt: 'text-xs text-gray-500 line-clamp-1 mt-0.5', empty: 'px-4 py-6 text-center text-xs text-gray-400 font-mono uppercase' },
}

export default function SearchBar({ theme = 'dark' }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)
  const s                     = styles[theme]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    const t = setTimeout(() => {
      setLoading(true)
      apiClient.get(`/posts?status=published&search=${encodeURIComponent(query)}&per_page=5`)
        .then((res: any) => {
          setResults(Array.isArray(res) ? res : (res?.data ?? []))
          setOpen(true)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="relative" ref={ref}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input className={s.input} placeholder="Buscar posts..."
        value={query} onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)} />
      {query && (
        <button onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
          <X size={14} />
        </button>
      )}
      {open && (
        <div className={s.results}>
          {loading && <p className={s.empty}>Buscando...</p>}
          {!loading && results.length === 0 && <p className={s.empty}>Sin resultados para "{query}"</p>}
          {!loading && results.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} onClick={() => setOpen(false)} className={`block ${s.item}`}>
              <p className={s.title}>{post.title}</p>
              {post.excerpt && <p className={s.excerpt}>{post.excerpt}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
