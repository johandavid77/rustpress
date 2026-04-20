import { useState, useEffect } from 'react'
import { apiClient } from '../api/client'
import { MessageSquare, Check, Trash2, Eye, Clock, User } from 'lucide-react'

interface Comment {
  id: string
  post_id: string
  author_id?: string
  content: string
  status: string
  created_at: string
  post_title?: string
  author_name?: string
  author_email?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-green-500/10  text-green-400  border-green-500/20',
  rejected: 'bg-red-500/10    text-red-400    border-red-500/20',
}

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [acting,   setActing]   = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/comments/all')
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setComments(list)
    } catch(_) {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    setActing(id)
    try {
      await apiClient.put(`/comments/${id}/approve`, {})
      setComments(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c))
    } catch(_) {}
    finally { setActing(null) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este comentario?')) return
    setActing(id)
    try {
      await apiClient.delete(`/comments/${id}`)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch(_) {}
    finally { setActing(null) }
  }

  const filtered = filter === 'all' ? comments : comments.filter(c => c.status === filter)
  const counts = {
    all:      comments.length,
    pending:  comments.filter(c => c.status === 'pending').length,
    approved: comments.filter(c => c.status === 'approved').length,
    rejected: comments.filter(c => c.status === 'rejected').length,
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <MessageSquare size={22} className="text-[#7c6aff]" /> Comments
        </h1>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-[#2a2a3a] text-xs text-[#888899] hover:text-white transition-all">
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-[#0e0e1a] rounded-xl p-1 border border-[#2a2a3a]">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={"flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 " + (
              filter === f ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white'
            )}>
            {f === 'pending' && <Clock size={11} />}
            {f === 'approved' && <Check size={11} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[#0e0e1a] border border-[#2a2a3a] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[#555566] border border-[#2a2a3a] rounded-2xl">
          <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p>No comments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comment => (
            <div key={comment.id} className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#1a1a2e] flex items-center justify-center shrink-0">
                    <User size={14} className="text-[#555566]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {comment.author_name ?? comment.author_email ?? 'Anonymous'}
                    </p>
                    <p className="text-xs text-[#555566]">
                      {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={"px-2 py-0.5 rounded-lg border text-[10px] font-bold " + (STATUS_COLORS[comment.status] ?? '')}>
                    {comment.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#ccccdd] leading-relaxed mb-3 pl-10">{comment.content}</p>

              {comment.post_title && (
                <p className="text-xs text-[#444455] pl-10 mb-3 flex items-center gap-1">
                  <Eye size={10} /> Post: {comment.post_title}
                </p>
              )}

              <div className="flex items-center gap-2 pl-10">
                {comment.status !== 'approved' && (
                  <button onClick={() => approve(comment.id)} disabled={acting === comment.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/20 transition-all disabled:opacity-50">
                    <Check size={12} /> Approve
                  </button>
                )}
                <button onClick={() => remove(comment.id)} disabled={acting === comment.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-all disabled:opacity-50">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
