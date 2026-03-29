import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { X } from 'lucide-react'

export default function PostPreview() {
  const { id } = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get(`/posts/${id}/preview`)
      .then((res: any) => setPost(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Barra de preview */}
      <div className="sticky top-0 z-50 bg-yellow-500/10 border-b border-yellow-500/30 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">● Preview</span>
          <span className="text-yellow-400/60 text-xs font-mono">
            {post.status === 'published' ? 'Publicado' : 'Borrador — no visible al público'}
          </span>
        </div>
        <Link to={`/dashboard`}
          className="flex items-center gap-1.5 text-xs font-mono text-yellow-400/60 hover:text-yellow-400 transition-colors">
          <X size={14} /> Cerrar preview
        </Link>
      </div>

      {/* Contenido del post */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-8 text-sm font-mono text-[#555566]">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            post.status === 'published'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            {post.status === 'published' ? '● Publicado' : '○ Borrador'}
          </span>
          <span>{new Date(post.published_at ?? post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          {post.views > 0 && <span>{post.views} vistas</span>}
        </div>

        <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">{post.title}</h1>

        {post.seo_title && (
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 mb-6 text-xs font-mono">
            <p className="text-[#555566] mb-1">SEO Title</p>
            <p className="text-[#7c6aff]">{post.seo_title}</p>
            {post.seo_description && <>
              <p className="text-[#555566] mt-2 mb-1">SEO Description</p>
              <p className="text-[#888899]">{post.seo_description}</p>
            </>}
          </div>
        )}

        {post.excerpt && (
          <p className="text-xl text-[#888899] leading-relaxed border-l-4 border-[#7c6aff] pl-6 mb-10">
            {post.excerpt}
          </p>
        )}

        <article
          className="prose prose-invert max-w-none text-[#ccccdd]
            prose-headings:font-black prose-headings:text-white
            prose-a:text-[#7c6aff] prose-code:text-[#7c6aff]
            prose-pre:bg-[#111118] prose-pre:border prose-pre:border-[#2a2a3a]
            prose-blockquote:border-l-4 prose-blockquote:border-[#7c6aff]
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />
      </div>
    </div>
  )
}
