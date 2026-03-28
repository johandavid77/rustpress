import { useState } from 'react'
import { postsApi } from '../../api/posts'
import RichEditor from '../../components/Editor/RichEditor'

interface Props {
  onBack: () => void
  onCreated: () => void
}

export default function NewPost({ onBack, onCreated }: Props) {
  const [title, setTitle]               = useState('')
  const [excerpt, setExcerpt]           = useState('')
  const [content, setContent]           = useState('')
  const [seoTitle, setSeoTitle]         = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [ogImage, setOgImage]           = useState('')
  const [language, setLanguage]         = useState('es')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const handleSave = async (publish = false) => {
    if (!title.trim()) { setError('El título es requerido'); return }
    setSaving(true); setError('')
    try {
      const post = await postsApi.create({
        title, excerpt, content, post_type: 'post',
        seo_title: seoTitle || undefined,
        seo_description: seoDescription || undefined,
        og_image: ogImage || undefined,
        language,
      })
      if (publish) await postsApi.publish(post.id)
      onCreated()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack}
          className="text-[#888899] hover:text-white text-sm font-mono flex items-center gap-1">
          ← Volver
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight">Nuevo Post</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm font-bold text-[#888899] hover:text-white hover:border-[#7c6aff] disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="px-4 py-2 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-50">
            {saving ? 'Publicando...' : 'Publicar →'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm font-mono mb-4">{error}</p>}

      {/* Título */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Título</label>
        <input
          className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-lg font-bold outline-none focus:border-[#7c6aff] placeholder-[#444455]"
          placeholder="Título del post..."
          value={title} onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Excerpt */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Resumen <span className="normal-case text-[#555566]">(opcional)</span></label>
        <input
          className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
          placeholder="Breve descripción del post..."
          value={excerpt} onChange={e => setExcerpt(e.target.value)}
        />
      </div>

      {/* Editor */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Contenido</label>
        <RichEditor content={content} onChange={setContent} />
      </div>

      {/* SEO */}
      <div className="border-t border-[#2a2a3a] pt-6">
        <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-4">SEO & Open Graph</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">SEO Title <span className="normal-case text-[#555566]">(opcional)</span></label>
            <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="Título para buscadores..."
              value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">SEO Description <span className="normal-case text-[#555566]">(opcional)</span></label>
            <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="Meta description..."
              value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">OG Image URL <span className="normal-case text-[#555566]">(opcional)</span></label>
            <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="https://..."
              value={ogImage} onChange={e => setOgImage(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">Idioma</label>
            <select className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
              value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="es">🇨🇴 Español</option>
              <option value="en">🇺🇸 English</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="pt">🇧🇷 Português</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
