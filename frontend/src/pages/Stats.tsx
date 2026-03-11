import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../api/client'
import { FileText, Globe, FileEdit, Image, Clock, ArrowRight } from 'lucide-react'

export default function Stats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/posts/stats')
      .then((res: any) => setStats(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cards = [
    { label: 'Total Posts', value: stats?.total_posts ?? 0, icon: FileText, color: 'text-[#7c6aff]', bg: 'bg-[#7c6aff]/10' },
    { label: 'Publicados', value: stats?.published_posts ?? 0, icon: Globe, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Borradores', value: stats?.draft_posts ?? 0, icon: FileEdit, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Archivos Media', value: stats?.total_media ?? 0, icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ]

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7c6aff] bg-[#7c6aff]/10 px-3 py-1.5 rounded-full mb-4">
          <span>⬡</span> Panel de control
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Resumen</h1>
        <p className="text-[#888899] text-sm">Estado actual de tu CMS</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 flex flex-col gap-3 hover:border-[#3a3a4a] transition-all">
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon size={18} className={card.color} />
              </div>
              <div>
                <p className="text-2xl font-black">{card.value}</p>
                <p className="text-xs text-[#888899] font-mono mt-0.5">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Último publicado */}
      {stats?.last_published_at && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-xs text-[#888899] font-mono">Última publicación</p>
            <p className="text-sm font-bold mt-0.5">
              {new Date(stats.last_published_at).toLocaleDateString('es-CO', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      )}

      {/* Posts recientes */}
      {stats?.recent_posts?.length > 0 && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a]">
            <p className="text-sm font-bold">Posts recientes</p>
            <span className="text-xs text-[#888899] font-mono">{stats.recent_posts.length} más recientes</span>
          </div>
          {stats.recent_posts.map((post: any, i: number) => (
            <div key={post.id}
              className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#1a1a24] transition-all
                ${i !== stats.recent_posts.length - 1 ? 'border-b border-[#2a2a3a]' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0
                  ${post.status === 'published' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <p className="text-sm font-semibold truncate">{post.title}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-[#888899] font-mono">
                  {new Date(post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </span>
                <ArrowRight size={14} className="text-[#555566]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
