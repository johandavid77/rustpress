import { useState } from 'react'
import { postsApi } from '../../api/posts'
import RichEditor from '../../components/Editor/RichEditor'

interface Props {
  post: any
  onBack: () => void
  onSaved: () => void
}

export default function EditPost({ post, onBack, onSaved }: Props) {
  const [title, setTitle]     = useState(post.title)
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '')
  const [content, setContent] = useState(post.content ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es requerido'); return }
    setSaving(true); setError('')
    try {
      await postsApi.update(post.id, { title, excerpt, content })
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleTogglePublish = async () => {
    setSaving(true)
    try {
      if (post.status === 'published') await postsApi.unpublish(post.id)
      else await postsApi.publish(post.id)
      onSaved()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack}
          className="text-[#888899] hover:text-white text-sm font-mono flex items-center gap-1">
          ← Volver
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight">Editar Post</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleTogglePublish} disabled={saving}
            className={`px-4 py-2 border rounded-lg text-sm font-bold disabled:opacity-50
              ${post.status === 'published'
                ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
            {post.status === 'published' ? '○ Despublicar' : '● Publicar'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm font-mono mb-4">{error}</p>}

      <div className="mb-2 flex items-center gap-3">
        <span className={`text-xs font-mono px-3 py-1 rounded-full font-semibold
          ${post.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
          {post.status === 'published' ? '● Publicado' : '○ Borrador'}
        </span>
        <span className="text-xs text-[#888899] font-mono">/{post.slug}</span>
      </div>

      <div className="mb-5 mt-5">
        <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Título</label>
        <input
          className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-lg font-bold outline-none focus:border-[#7c6aff]"
          value={title} onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Resumen</label>
        <input
          className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
          value={excerpt} onChange={e => setExcerpt(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Contenido</label>
        <RichEditor content={content} onChange={setContent} />
      </div>
    </div>
  )
}
