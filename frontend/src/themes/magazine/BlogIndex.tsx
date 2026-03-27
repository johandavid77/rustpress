import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import HeroSlider from '../../components/Slider/HeroSlider'
import { Slider } from '../../types/slider'

export default function BlogIndexMagazine() {
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
    <div className="min-h-screen bg-[#f5f0e8] text-gray-900">
      {/* Header estilo periódico */}
      <header className="border-b-4 border-black pt-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-3 border-b border-gray-300 pb-2">
            <span>Vol. I — RustCMS</span>
            <span>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <Link to="/login" className="hover:text-black transition-colors">Admin</Link>
          </div>
          <div className="text-center py-4 border-b-2 border-black mb-0">
            <Link to="/">
              <h1 className="text-6xl font-black tracking-tighter leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                RustCMS
              </h1>
            </Link>
            <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-widest">
              Artículos · Notas · Experimentos
            </p>
          </div>
        </div>
      </header>

      {/* Slider */}
      {sliders.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <HeroSlider sliders={sliders} autoPlayInterval={5000} />
        </div>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {loading && (
          <div className="grid grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-32 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-4xl mb-4" style={{ fontFamily: 'Georgia, serif' }}>∅</p>
            <p className="text-sm font-mono uppercase tracking-widest">No hay posts publicados aún</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t-2 border-black">

            {/* Post principal — ocupa 2 columnas */}
            {posts[0] && (
              <Link
                to={`/blog/${posts[0].slug}`}
                className="md:col-span-2 border-r-2 border-black p-6 group"
              >
                <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-300 pb-2">
                  Destacado
                </div>
                <h2 className="text-3xl font-black leading-tight mb-3 group-hover:underline" style={{ fontFamily: 'Georgia, serif' }}>
                  {posts[0].title}
                </h2>
                {posts[0].excerpt && (
                  <p className="text-gray-600 leading-relaxed text-sm mb-4">{posts[0].excerpt}</p>
                )}
                <p className="text-xs font-mono text-gray-400">
                  {new Date(posts[0].published_at ?? posts[0].created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </Link>
            )}

            {/* Columna lateral — posts 2 y 3 */}
            <div className="flex flex-col border-black">
              {posts.slice(1, 3).map((post: any, i: number) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className={`p-5 group ${i === 0 ? 'border-b-2 border-black' : ''}`}
                >
                  <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                    #{String(i + 2).padStart(2, '0')}
                  </div>
                  <h3 className="font-black text-base leading-tight group-hover:underline mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {post.title}
                  </h3>
                  <p className="text-xs font-mono text-gray-400">
                    {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>

            {/* Resto de posts — 3 columnas */}
            {posts.slice(3).map((post: any, i: number) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="border-t-2 border-black p-5 group"
              >
                <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">
                  #{String(i + 4).padStart(2, '0')}
                </div>
                <h3 className="font-bold text-sm leading-tight group-hover:underline mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">{post.excerpt}</p>
                )}
                <p className="text-xs font-mono text-gray-400">
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t-4 border-black py-4">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs font-mono text-gray-400">
          RustCMS — Todos los derechos reservados
        </div>
      </footer>
    </div>
  )
}