import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Check, Trash2, MessageSquare } from 'lucide-react'

interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  status: string
  created_at: string
}

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending')

  useEffect(() => { loadComments() }, [])

  const loadComments = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/comments/all')
      setComments(Array.isArray(res) ? res : (res?.data ?? []))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const approve = async (id: string) => {
    try {
      await apiClient.put(`/comments/${id}/approve`, {})
      loadComments()
    } catch(e) { console.error(e) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este comentario?')) return
    try {
      await apiClient.delete(`/comments/${id}`)
      loadComments()
    } catch(e) { console.error(e) }
  }

  const filtered = comments.filter(c => c.status === filter)
  const pendingCount = comments.filter(c => c.status === 'pending').length

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            Comentarios
            {pendingCount > 0 && (
              <span className="text-sm bg-yellow-500/10 text-yellow-400 font-mono px-2 py-0.5 rounded-full">
                {pendingCount} pendientes
              </span>
            )}
          </h1>
          <p className="text-[#888899] text-sm">Modera los comentarios del blog</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all
              ${filter === f
                ? 'bg-[#1a1a24] text-white border border-[#7c6aff]'
                : 'text-[#888899] border border-[#2a2a3a] hover:text-white'
              }`}
          >
            {f === 'pending' ? 'Pendientes' : 'Aprobados'}
          </button>
        ))}
      </div>

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <MessageSquare size={40} />
          <p className="font-bold text-sm">
            {filter === 'pending' ? 'No hay comentarios pendientes' : 'No hay comentarios aprobados'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map(comment => (
          <div key={comment.id}
            className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 flex items-start gap-4 hover:border-[#3a3a4a] transition-all">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold
                  ${comment.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-green-500/10 text-green-400'
                  }`}>
                  {comment.status === 'pending' ? 'Pendiente' : 'Aprobado'}
                </span>
                <span className="text-xs text-[#555566] font-mono">
                  {new Date(comment.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
              <p className="text-sm text-[#ccccdd] leading-relaxed mb-2">{comment.content}</p>
              <p className="text-xs text-[#555566] font-mono">post: {comment.post_id}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {comment.status === 'pending' && (
                <button onClick={() => approve(comment.id)}
                  className="p-2 text-[#888899] hover:text-green-400 rounded-lg hover:bg-[#1a1a24] transition-all"
                  title="Aprobar">
                  <Check size={15} />
                </button>
              )}
              <button onClick={() => remove(comment.id)}
                className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all"
                title="Eliminar">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
