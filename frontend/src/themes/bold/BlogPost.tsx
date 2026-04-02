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

  useEffect(() => {
    apiClient.get(`/posts/${slug}`)
      .then((res: any) => {
        setPost(res)
        apiClient.post(`/posts/${slug}/view`, {}).catch(() => {})
      })
      .catch(() => navigate('/blog'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!post) return
    document.title = `${post.seo_title ?? post.title} — RustCMS`
  }, [post])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#111111]">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link to="/blog" className="text-sm font-mono text-[#f59e0b] hover:underline">← Blog</Link>
        <ShareButtons title={post.title} url={window.location.href} />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="text-lg text-gray-500 mb-6 leading-relaxed">{post.excerpt}</p>
          )}
          <div className="text-xs text-gray-400 font-mono">
            {new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}{readingTime(post.content ?? '')} min lectura
          </div>
        </div>

        <TableOfContents content={post.content} theme="bold" />

        <article className="prose  max-w-none prose-headings:uppercase">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        <Comments postId={post.id} theme="bold" />

        <div className="border-t border-gray-200 mt-16 pt-8">
          <Link to="/blog" className="text-sm font-mono text-gray-400 hover:text-[#f59e0b]">← Volver al blog</Link>
        </div>

        <RelatedPosts postId={post.id} theme="bold" />
      </main>
    </div>
  )
}
