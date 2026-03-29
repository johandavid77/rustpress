import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useActiveTheme } from '../../themes/ThemeLoader'

export default function AuthorProfile() {
  const { id } = useParams()
  const { theme } = useActiveTheme()
  const [author, setAuthor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(`/users/${id}/profile`)
      .then((res: any) => setAuthor(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const styles: Record<string, any> = {
    dark:     { bg: 'min-h-screen bg-[#0a0a0f] text-white', header: 'border-b border-[#2a2a3a] bg-[#111118] py-4', logo: 'text-[#7c6aff] text-2xl font-black', main: 'max-w-3xl mx-auto px-6 py-16', avatar: 'w-20 h-20 rounded-full bg-[#7c6aff] flex items-center justify-center text-3xl font-black', name: 'text-4xl font-black tracking-tight mt-4 mb-1', meta: 'text-[#888899] text-sm font-mono', card: 'bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 hover:border-[#7c6aff] transition-all group', cardTitle: 'font-bold group-hover:text-[#7c6aff] transition-colors', cardDate: 'text-xs text-[#555566] font-mono mt-1', divider: 'border-[#2a2a3a]' },
    minimal:  { bg: 'min-h-screen bg-white text-gray-900', header: 'border-b border-gray-100 py-6', logo: 'text-2xl font-black tracking-tighter', main: 'max-w-3xl mx-auto px-6 py-20', avatar: 'w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center text-3xl font-black text-white', name: 'text-4xl font-black tracking-tighter mt-4 mb-1', meta: 'text-gray-400 text-sm font-mono', card: 'py-6 border-b border-gray-100 group', cardTitle: 'font-bold group-hover:text-gray-500 transition-colors', cardDate: 'text-xs text-gray-300 font-mono mt-1', divider: 'border-gray-100' },
    bold:     { bg: 'min-h-screen bg-black text-white', header: 'border-b-4 border-yellow-400 py-4', logo: 'text-2xl font-black tracking-tighter uppercase text-white', main: 'max-w-4xl mx-auto px-6 py-12', avatar: 'w-20 h-20 bg-yellow-400 flex items-center justify-center text-3xl font-black text-black', name: 'text-5xl font-black tracking-tighter uppercase mt-4 mb-1', meta: 'text-gray-500 text-sm font-mono', card: 'bg-gray-900 border border-gray-800 p-6 hover:border-yellow-400 transition-all group', cardTitle: 'font-black uppercase group-hover:text-yellow-400 transition-colors', cardDate: 'text-xs text-gray-600 font-mono mt-1', divider: 'border-gray-800' },
    magazine: { bg: 'min-h-screen bg-[#f5f0e8] text-gray-900', header: 'border-b-4 border-black py-4', logo: 'text-2xl font-black tracking-tighter', main: 'max-w-4xl mx-auto px-6 py-10', avatar: 'w-20 h-20 border-4 border-black flex items-center justify-center text-3xl font-black bg-white', name: 'text-4xl font-black mt-4 mb-1', meta: 'text-gray-500 text-sm font-mono', card: 'border-b-2 border-black py-5 group', cardTitle: 'font-black group-hover:underline', cardDate: 'text-xs text-gray-400 font-mono mt-1', divider: 'border-black' },
  }
  const s = styles[theme] || styles.dark

  if (loading) return (
    <div className={s.bg + ' flex items-center justify-center'}>
      <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-30" />
    </div>
  )

  if (!author) return (
    <div className={s.bg + ' flex items-center justify-center'}>
      <p className="opacity-30 font-mono text-sm">Autor no encontrado</p>
    </div>
  )

  return (
    <div className={s.bg}>
      <header className={s.header}>
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className={s.logo}>RustCMS</Link>
          <Link to="/blog" className="text-sm font-mono opacity-50 hover:opacity-100 transition-opacity">← Blog</Link>
        </div>
      </header>

      <main className={s.main}>
        {/* Avatar y datos */}
        <div className="mb-12">
          <div className={s.avatar}>{author.username?.[0]?.toUpperCase()}</div>
          <h1 className={s.name}>{author.username}</h1>
          <p className={s.meta}>
            {author.post_count} {author.post_count === 1 ? 'post' : 'posts'} publicados · 
            Miembro desde {new Date(author.created_at).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Posts del autor */}
        <div>
          <p className="text-xs font-mono opacity-40 uppercase tracking-widest mb-6">Posts de {author.username}</p>
          {author.posts.length === 0 && (
            <p className="opacity-30 text-sm font-mono">Sin posts publicados aún</p>
          )}
          <div className="flex flex-col gap-2">
            {author.posts.map((post: any) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className={s.card}>
                <p className={s.cardTitle}>{post.title}</p>
                {post.excerpt && <p className="text-sm opacity-60 mt-1 line-clamp-1">{post.excerpt}</p>}
                <p className={s.cardDate}>
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
