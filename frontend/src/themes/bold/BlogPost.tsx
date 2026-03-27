import { useState, useEffect } from 'react'
import Comments from '../../components/Comments/Comments'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Comments from '../../components/Comments/Comments'
import { apiClient } from '../../api/client'

export default function BlogPostBold() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(`/posts/slug/${slug}`)
      .then((res: any) => setPost(res))
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b-4 border-yellow-400 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-yellow-400 text-2xl font-black">●</span>
            <span className="text-xl font-black tracking-tighter uppercase">RustCMS</span>
          </Link>
          <Link to="/blog" className="text-xs font-mono border-2 border-white px-3 py-1.5 hover:bg-white hover:text-black transition-all">
            ← Blog
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b-2 border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-yellow-400 text-black text-xs font-black uppercase px-3 py-1">
              ● Publicado
            </span>
            <span className="text-xs font-mono text-gray-500">
              {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-tight mb-6">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-xl text-gray-400 leading-relaxed border-l-4 border-yellow-400 pl-6">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <article
          className="prose prose-invert max-w-none text-gray-300
            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-white prose-headings:uppercase
            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
            prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-yellow-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:bg-gray-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-yellow-400 prose-code:text-sm prose-code:font-mono
            prose-pre:bg-gray-900 prose-pre:border-2 prose-pre:border-gray-800 prose-pre:rounded-none
            prose-blockquote:border-l-4 prose-blockquote:border-yellow-400 prose-blockquote:text-gray-400
            prose-img:rounded-none prose-img:my-6 prose-img:border-2 prose-img:border-gray-800
            prose-hr:border-gray-800"
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />
          <Comments postId={post.id} theme="bold" 
        />

        <div className="border-t-2 border-gray-800 mt-16 pt-8 flex items-center justify-between">
          <Link to="/blog" className="text-xs font-mono border-2 border-gray-700 px-4 py-2 hover:border-yellow-400 hover:text-yellow-400 transition-all">
            ← Volver al blog
          </Link>
          <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">RustCMS</span>
        </div>
      </main>
    </div>
  )
}