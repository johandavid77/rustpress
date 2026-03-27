import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import { apiClient } from '../../api/client'
import HeroSlider from '../../components/Slider/HeroSlider'
import { Slider } from '../../types/slider'

interface Post {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  created_at: string;
  published_at?: string;
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [sliders, setSliders] = useState<Slider[]>([])

  useEffect(() => {
    // Carga de Posts - Usando res.data según el Response de Rust
    apiClient.get('/posts?status=published&per_page=20')
      .then((res: any) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPosts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Carga de Sliders
    apiClient.get('/sliders')
      .then((res: any) => {
        const sliderData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : (res?.data ?? []));
        setSliders(sliderData);
      })
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#2a2a3a] bg-[#111118]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-[#7c6aff] text-2xl group-hover:rotate-12 transition-transform">⬡</span>
            <span className="text-lg font-black tracking-tight">RustCMS</span>
          </Link>
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

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#111118] border border-[#2a2a3a] rounded-xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 opacity-30 border border-dashed border-[#2a2a3a] rounded-xl">
            <p className="text-6xl mb-4">+</p>
            <p className="font-bold uppercase tracking-widest text-xs">No hay posts publicados aún</p>
          </div>
        ) : (
          <div className="flex flex-col border border-[#2a2a3a] rounded-xl overflow-hidden shadow-2xl shadow-black">
            {posts.map((post, i) => (
              <Link key={post.id} to={`/blog/${post.slug}`}
                className={`flex items-start justify-between gap-6 p-6 bg-[#111118] hover:bg-[#15151f] transition-all group ${i !== posts.length - 1 ? 'border-b border-[#2a2a3a]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg mb-1 group-hover:text-[#7c6aff] transition-colors truncate">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-[#888899] leading-relaxed line-clamp-2">{post.excerpt}</p>}
                  <p className="text-[10px] text-[#444455] font-mono mt-3 uppercase tracking-widest">/{post.slug}</p>
                </div>
                <div className="flex-shrink-0 text-right flex flex-col justify-between h-full min-h-[60px]">
                  <p className="text-[10px] text-[#888899] font-mono whitespace-nowrap bg-[#1a1a24] px-2 py-1 rounded">
                    {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[#7c6aff] group-hover:translate-x-1 transition-transform self-end"><ArrowRight size={18} /></p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
