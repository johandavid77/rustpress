import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import SearchBar from '../../components/Search/SearchBar'
import { apiClient } from '../../api/client'
import HeroSlider from '../../components/Slider/HeroSlider'
import { Slider } from '../../types/slider'

const PER_PAGE = 10

export default function BlogIndex() {
  const [posts, setPosts]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sliders, setSliders] = useState<Slider[]>([])
  const [page, setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    apiClient.get(`/posts?status=published&per_page=${PER_PAGE}&page=${page}`)
      .then((res: any) => {
        setPosts(Array.isArray(res) ? res : (res?.data ?? []))
        setTotalPages(res?.total_pages ?? 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    fetch('/api/v1/sliders')
      .then(r => r.json())
      .then((res: any) => setSliders(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#2a2a3a] bg-[#111118]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-[#7c6aff] text-2xl group-hover:rotate-12 transition-transform">○</span>
            <span className="text-lg font-black tracking-tight">RustCMS</span>
          </Link>
          <div className="w-64"><SearchBar theme="dark" /></div>
          <Link to="/login" className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-[#2a2a3a] rounded-lg text-[#888899] hover:text-white hover:border-[#7c6aff] transition-all">
            <Lock size={12} />Admin
          </Link>
        </div>
      </header>

      {sliders.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-8">
          <HeroSlider sliders={sliders} autoPlayInterval={5000} />
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7c6aff] bg-[#7c6aff]/10 px-3 py-1.5 rounded-full mb-4">
            <span>+</span> Publicaciones
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-white to-[#888899] bg-clip-text text-transparent">Blog</h1>
          <p className="text-[#888899]">Artículos, notas y experimentos</p>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-[#111118] rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-24 opacity-30">
            <p className="text-6xl mb-4">+</p>
            <p className="font-bold">No hay posts publicados aún</p>
          </div>
        )}

        <div className="flex flex-col gap-px border border-[#2a2a3a] rounded-xl overflow-hidden">
          {posts.map((post: any, i: number) => (
            <Link key={post.id} to={`/blog/${post.slug}`}
              className={`flex items-start justify-between gap-6 p-6 bg-[#111118] hover:bg-[#1a1a24] transition-all group ${i !== posts.length - 1 ? 'border-b border-[#2a2a3a]' : ''}`}>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base mb-1 group-hover:text-[#7c6aff] transition-colors truncate">{post.title}</h2>
                {post.excerpt && <p className="text-sm text-[#888899] leading-relaxed line-clamp-2">{post.excerpt}</p>}
                <p className="text-xs text-[#555566] font-mono mt-2">{post.slug}</p>
              </div>
              <div className="flex-shrink-0 text-right pt-1">
                <p className="text-xs text-[#888899] font-mono whitespace-nowrap">
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-[#7c6aff] mt-1 font-mono group-hover:translate-x-1 transition-transform">→</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm font-mono text-[#888899] hover:text-white hover:border-[#7c6aff] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              ← Anterior
            </button>
            <span className="text-xs font-mono text-[#555566]">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm font-mono text-[#888899] hover:text-white hover:border-[#7c6aff] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              Siguiente →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
