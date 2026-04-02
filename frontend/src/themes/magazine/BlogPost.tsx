import { useState, useEffect } from 'react'
import Comments from '../../components/Comments/Comments'
import { Link, useParams, useNavigate } from 'react-router-dom'
import RelatedPosts from '../../components/RelatedPosts/RelatedPosts'
import ShareButtons from '../../components/ShareButtons/ShareButtons'
import TableOfContents from '../../components/TableOfContents/TableOfContents'
import { readingTime } from '../../utils/readingTime'
import { apiClient } from '../../api/client'

export default function BlogPostMagazine() {
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
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-gray-900">
      {/* Header estilo periódico */}
      <header className="border-b-4 border-black pt-4">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs font-mono text-gray-500 mb-3 border-b border-gray-300 pb-2">
            <span>Vol. I — RustCMS</span>
            <span>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <Link to="/blog" className="hover:text-black transition-colors font-mono">← Blog</Link>
          </div>
          <div className="text-center py-4 border-b-2 border-black">
            <Link to="/">
              <h1 className="text-5xl font-black tracking-tighter leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                RustCMS
              </h1>
            </Link>
          </div>
        </div>
      </header>

      {/* Article header */}
      <div className="border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-4 text-xs font-mono text-gray-400 uppercase tracking-widest">
            <span className="text-green-700 bg-green-100 px-2 py-0.5 border border-green-300">● Publicado</span>
            <span>
              {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} · {post.views ?? 0} vistas · {post.views ?? 0} vistas · {post.views ?? 0} vistas
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-black pl-5 italic" style={{ fontFamily: 'Georgia, serif' }}>
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Content — columnas estilo periódico */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <article
          className="prose prose-sm max-w-none text-gray-800
            prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:leading-relaxed prose-p:mb-4 prose-p:text-justify
            prose-a:text-gray-900 prose-a:underline hover:prose-a:no-underline
            prose-strong:text-gray-900
            prose-code:bg-gray-200 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
            prose-pre:bg-gray-100 prose-pre:border-2 prose-pre:border-black prose-pre:rounded-none
            prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:text-gray-600 prose-blockquote:italic
            prose-img:rounded-none prose-img:my-6 prose-img:border-2 prose-img:border-black
            prose-hr:border-black"
          style={{ fontFamily: 'Georgia, serif', columns: '2', columnGap: '2.5rem' }}
            <TableOfContents content={post.content} theme="magazine" />
          <div dangerouslySetInnerHTML={{ __html: post.content}}
          ></div>
          <Comments postId={post.id} theme="magazine"  />

        <div className="border-t-4 border-black mt-12 pt-6 flex items-center justify-between">
          <Link to="/blog" className="text-xs font-mono text-gray-500 hover:text-black transition-colors">
            ← Volver al blog
          </Link>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">RustCMS</span>
        </div>
      </main>

      <footer className="border-t-4 border-black py-4">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs font-mono text-gray-400">
          RustCMS — Todos los derechos reservados
        </div>
      </footer>
    </div>
  )
}