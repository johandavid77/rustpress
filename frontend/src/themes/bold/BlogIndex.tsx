import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import HeroSlider from '../../components/Slider/HeroSlider'
import { Slider } from '../../types/slider'

export default function BlogIndexBold() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sliders, setSliders] = useState<Slider[]>([])

  useEffect(() => {
    apiClient.get('/posts?status=published&per_page=20')
      .then((res: any) => setPosts(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false))

    fetch('/api/v1/sliders')
      .then(r => r.json())
      .then((res: any) => {
        setSliders(Array.isArray(res) ? res : (res?.data ?? []))
      })
      .catch(console.error)
  }, [])

  const colors = [
    'bg-yellow-400 text-black',
    'bg-violet-600 text-white',
    'bg-emerald-400 text-black',
    'bg-rose-500 text-white',
    'bg-orange-400 text-black',
    'bg-sky-500 text-white',
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b-4 border-yellow-400 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-yellow-400 text-3xl font-black">●</span>
            <span className="text-2xl font-black tracking-tighter uppercase">RustCMS</span>
          </Link>
          <Link to="/login" className="text-xs font-mono border-2 border-white px-3 py-1.5 hover:bg-white hover:text-black transition-all">
            Admin
          </Link>
        </div>
      </header>

      {/* Slider */}
      {sliders.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <HeroSlider sliders={sliders} autoPlayInterval={5000} />
        </div>
      )}

      {/* Hero title */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="inline-block bg-yellow-400 text-black px-4 py-1 text-xs font-black uppercase tracking-widest mb-4">
          Publicaciones
        </div>
        <h1 className="text-7xl font-black tracking-tighter uppercase leading-none mb-2">
          Blog
        </h1>
        <p className="text-gray-400 text-lg">Artículos, notas y experimentos.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-gray-900 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-24 text-gray-600">
          <p className="text-5xl mb-4 font-black">!</p>
          <p className="font-bold uppercase tracking-widest text-sm">No hay posts publicados aún</p>
        </div>
      )}

      {/* Cards grid */}
      <main className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post: any, i: number) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className={`group p-8 rounded-none border-2 border-transparent hover:border-yellow-400 transition-all ${i === 0 ? 'md:col-span-2 bg-gray-900' : 'bg-gray-900'}`}
            >
              <div className={`inline-block px-2 py-0.5 text-xs font-black uppercase tracking-widest mb-4 ${colors[i % colors.length]}`}>
                #{String(i + 1).padStart(2, '0')}
              </div>
              <h2 className={`font-black tracking-tight leading-tight group-hover:text-yellow-400 transition-colors ${i === 0 ? 'text-3xl mb-3' : 'text-xl mb-2'}`}>
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-gray-600">
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <span className="text-yellow-400 text-xs font-black group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}