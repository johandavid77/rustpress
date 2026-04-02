import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'
import RelatedPosts from '../../components/RelatedPosts/RelatedPosts'
import ShareButtons from '../../components/ShareButtons/ShareButtons'
import TableOfContents from '../../components/TableOfContents/TableOfContents'
import { readingTime } from '../../utils/readingTime'
import Comments from '../../components/Comments/Comments'

export default function BlogPost() {
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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#2a2a3a] bg-[#111118]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[#7c6aff] text-xl">⬡</span>
            <span className="text-xl font-black tracking-tight">RustCMS</span>
          </Link>
          <Link to="/blog" className="text-xs font-mono text-[#888899] hover:text-white">← Blog</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-green-500/10 text-green-400 font-semibold">● Publicado</span>
          <span className="text-xs text-[#888899] font-mono">
            {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} · {post.views ?? 0} vistas · {post.views ?? 0} vistas · {post.views ?? 0} vistas
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-[#888899] mb-10 leading-relaxed border-l-4 border-[#7c6aff] pl-4">{post.excerpt}</p>
        )}
        <div className="border-t border-[#2a2a3a] mb-10" />
        <article
          className="prose prose-invert max-w-none text-[#ccccdd]
            prose-headings:font-black prose-headings:text-white
            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
            prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-[#7c6aff] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:bg-[#1a1a24] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[#ff6a9b] prose-code:text-sm prose-code:font-mono
            prose-pre:bg-[#111118] prose-pre:border prose-pre:border-[#2a2a3a] prose-pre:rounded-xl
            prose-blockquote:border-l-4 prose-blockquote:border-[#7c6aff] prose-blockquote:text-[#888899]
            prose-img:rounded-xl prose-img:my-6
            prose-hr:border-[#2a2a3a]"
          <TableOfContents content={post.content ?? ''} theme="dark" />
          <div dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />
        <Comments postId={post.id} theme="dark"
        />
        <div className="border-t border-[#2a2a3a] mt-16 pt-8">
          <Link to="/blog" className="text-sm font-mono text-[#888899] hover:text-white">← Volver al blog</Link>
        </div>
      </main>
    </div>
  )
}
