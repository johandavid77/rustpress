import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import HeroSlider from '../../components/Slider/HeroSlider'
import { Slider } from '../../types/slider'

export default function BlogIndexMinimal() {
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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">RustCMS</span>
          </Link>
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">
            Admin
          </Link>
        </div>
      </header>

      {/* Slider */}
      {sliders.length > 0 && (
        <div className="max-w-3xl mx-auto px-6 pt-10">
          <HeroSlider sliders={sliders} autoPlayInterval={5000} />
        </div>
      )}

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-16">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Blog</p>
          <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none">
            Artículos
          </h1>
          <p className="text-lg text-gray-400">Notas, ideas y experimentos.</p>
        </div>

        {loading && (
          <div className="flex flex-col gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-24 text-gray-300">
            <p className="text-5xl mb-4">○</p>
            <p className="text-sm">No hay posts publicados aún</p>
          </div>
        )}

        <div className="flex flex-col divide-y divide-gray-100">
          {posts.map((post: any, i: number) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="flex items-start justify-between gap-6 py-8 group"
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 group-hover:text-gray-500 transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right pt-1">
                <p className="text-xs text-gray-300 font-mono whitespace-nowrap">
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}