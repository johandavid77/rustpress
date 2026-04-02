import { useState, useEffect } from 'react'
import Comments from '../../components/Comments/Comments'
import { Link, useParams, useNavigate } from 'react-router-dom'
import RelatedPosts from '../../components/RelatedPosts/RelatedPosts'
import ShareButtons from '../../components/ShareButtons/ShareButtons'
import TableOfContents from '../../components/TableOfContents/TableOfContents'
import { readingTime } from '../../utils/readingTime'
import { apiClient } from '../../api/client'

export default function BlogPostMinimal() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Lazy loading para imágenes del contenido
  // Lazy loading para imágenes del contenido
  useEffect(() => {
    document.querySelectorAll('article img').forEach(img => {
      img.setAttribute('loading', 'lazy')
    })
  }, [post])

  useEffect(() => {
    document.querySelectorAll('article img').forEach(img => {
      img.setAttribute('loading', 'lazy')
    })
  }, [post])

  useEffect(() => {
    apiClient.get(`/posts/slug/${slug}`)
      .then((res: any) => setPost(res))
      .then((res: any) => {
        setPost(res)
        // Incrementar contador de visitas
        apiClient.post(`/posts/${slug}/view`, {}).catch(() => {})
      })
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!post) return
    document.title = `${post.seo_title ?? post.title} — RustCMS`
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el) }
      el.content = content
    }
    const setOg = (prop: string, content: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el) }
      el.content = content
    }
    setMeta("description", post.seo_description ?? post.excerpt ?? post.title)
    setOg("og:title", post.seo_title ?? post.title)
    setOg("og:description", post.seo_description ?? post.excerpt ?? post.title)
    setOg("og:type", "article")
    return () => { document.title = "RustCMS" }
  }, [post])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-100 py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tighter">RustCMS</Link>
          <Link to="/blog" className="text-xs text-gray-400 hover:text-gray-900 transition-colors font-mono">
            ← Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-mono text-green-600 bg-green-50 px-3 py-1 rounded-full">
              ● Publicado
            </span>
            <span className="text-xs text-gray-300 font-mono">
              {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} · {post.views ?? 0} vistas · {post.views ?? 0} vistas · {post.views ?? 0} vistas
            </span>
          </div>

          <h1 className="text-5xl font-black tracking-tighter leading-tight mb-8">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-400 leading-relaxed border-l-4 border-gray-200 pl-6 mb-10">
              {post.excerpt}
            </p>
          )}
        </div>

        <hr className="border-gray-100 mb-10" />

        <article
          className="prose prose-lg max-w-none text-gray-700
            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900
            prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
            prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-gray-900 prose-a:underline hover:prose-a:no-underline
            prose-strong:text-gray-900
            prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl
            prose-blockquote:border-l-4 prose-blockquote:border-gray-200 prose-blockquote:text-gray-400
            prose-img:rounded-xl prose-img:my-6
            prose-hr:border-gray-100"
          <TableOfContents content={post.content ?? ''} theme="minimal" />
          <div dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          ></div>
          <Comments postId={post.id} theme="minimal"  />

        <div className="border-t border-gray-100 mt-16 pt-8">
          <Link to="/blog" className="text-sm font-mono text-gray-400 hover:text-gray-900 transition-colors">
            ← Volver al blog
          </Link>
        </div>
      </main>
    </div>
  )
}