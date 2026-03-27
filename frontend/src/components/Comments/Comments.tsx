import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { useAuthStore } from '../../store/authStore'

interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  status: string
  created_at: string
}

interface Props {
  postId: string
  theme?: 'dark' | 'minimal' | 'bold' | 'magazine'
}

export default function Comments({ postId, theme = 'dark' }: Props) {
  const { token, user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = () => {
    setLoading(true)
    apiClient.get(`/posts/${postId}/comments`)
      .then((res: any) => setComments(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const submitComment = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      await apiClient.post(`/posts/${postId}/comments`, { content })
      setContent('')
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  // Estilos según el theme
  const s = {
    dark: {
      wrapper:   'border-t border-[#2a2a3a] pt-10 mt-10',
      title:     'text-lg font-black mb-6 text-white',
      empty:     'text-[#555566] text-sm font-mono py-6',
      card:      'bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 mb-3',
      author:    'text-xs font-mono text-[#7c6aff] mb-1',
      text:      'text-sm text-[#ccccdd] leading-relaxed',
      date:      'text-xs text-[#555566] font-mono mt-2',
      textarea:  'w-full bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 text-sm text-white placeholder-[#555566] resize-none focus:outline-none focus:border-[#7c6aff]',
      btn:       'px-5 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-50',
      login:     'text-sm text-[#888899] font-mono',
      loginLink: 'text-[#7c6aff] hover:underline',
      sent:      'text-xs text-green-400 font-mono',
    },
    minimal: {
      wrapper:   'border-t border-gray-100 pt-10 mt-10',
      title:     'text-lg font-black mb-6 text-gray-900',
      empty:     'text-gray-300 text-sm font-mono py-6',
      card:      'border-b border-gray-100 py-4 mb-2',
      author:    'text-xs font-mono text-gray-400 mb-1',
      text:      'text-sm text-gray-700 leading-relaxed',
      date:      'text-xs text-gray-300 font-mono mt-2',
      textarea:  'w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-900',
      btn:       'px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-gray-700 disabled:opacity-50',
      login:     'text-sm text-gray-400 font-mono',
      loginLink: 'text-gray-900 hover:underline',
      sent:      'text-xs text-green-600 font-mono',
    },
    bold: {
      wrapper:   'border-t-2 border-gray-800 pt-10 mt-10',
      title:     'text-lg font-black mb-6 text-white uppercase tracking-tight',
      empty:     'text-gray-600 text-sm font-mono py-6',
      card:      'bg-gray-900 border border-gray-800 p-4 mb-3',
      author:    'text-xs font-mono text-yellow-400 mb-1',
      text:      'text-sm text-gray-300 leading-relaxed',
      date:      'text-xs text-gray-600 font-mono mt-2',
      textarea:  'w-full bg-gray-900 border-2 border-gray-800 p-4 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-yellow-400',
      btn:       'px-5 py-2.5 bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300 disabled:opacity-50',
      login:     'text-sm text-gray-500 font-mono',
      loginLink: 'text-yellow-400 hover:underline',
      sent:      'text-xs text-green-400 font-mono',
    },
    magazine: {
      wrapper:   'border-t-2 border-black pt-10 mt-10',
      title:     'text-lg font-black mb-6 text-gray-900',
      empty:     'text-gray-400 text-sm font-mono py-6',
      card:      'border-b border-gray-200 py-4 mb-2',
      author:    'text-xs font-mono text-gray-400 mb-1',
      text:      'text-sm text-gray-700 leading-relaxed',
      date:      'text-xs text-gray-400 font-mono mt-2',
      textarea:  'w-full border-2 border-black p-4 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none bg-[#f5f0e8]',
      btn:       'px-5 py-2.5 bg-black text-white text-sm font-black hover:bg-gray-800 disabled:opacity-50',
      login:     'text-sm text-gray-500 font-mono',
      loginLink: 'text-black underline hover:no-underline',
      sent:      'text-xs text-green-700 font-mono',
    },
  }[theme]

  return (
    <div className={s.wrapper}>
      <h3 className={s.title}>
        Comentarios {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Lista de comentarios */}
      {loading && <p className={s.empty}>Cargando comentarios...</p>}
      {!loading && comments.length === 0 && (
        <p className={s.empty}>Sé el primero en comentar.</p>
      )}
      {comments.map(comment => (
        <div key={comment.id} className={s.card}>
          <p className={s.author}>{user?.email ?? 'Usuario'}</p>
          <p className={s.text}>{comment.content}</p>
          <p className={s.date}>
            {new Date(comment.created_at).toLocaleDateString('es-CO', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </p>
        </div>
      ))}

      {/* Formulario */}
      <div className="mt-8">
        {!token ? (
          <p className={s.login}>
            <Link to="/login" className={s.loginLink}>Inicia sesión</Link> para dejar un comentario.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              className={s.textarea}
              rows={4}
              placeholder="Escribe tu comentario..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="flex items-center gap-4">
              <button
                className={s.btn}
                onClick={submitComment}
                disabled={sending || !content.trim()}
              >
                {sending ? 'Enviando...' : 'Comentar'}
              </button>
              {sent && (
                <span className={s.sent}>
                  ✓ Comentario enviado, pendiente de aprobación
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
