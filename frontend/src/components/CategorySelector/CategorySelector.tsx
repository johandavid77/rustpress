import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Tag, X, Plus } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Props {
  postId?: string
  onChange?: (categories: Category[]) => void
}

export default function CategorySelector({ postId, onChange }: Props) {
  const [all, setAll]           = useState<Category[]>([])
  const [selected, setSelected] = useState<Category[]>([])
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    apiClient.get('/categories')
      .then((res: any) => setAll(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!postId) return
    apiClient.get(`/posts/${postId}/categories`)
      .then((res: any) => {
        const cats = Array.isArray(res) ? res : (res?.data ?? [])
        setSelected(cats)
        onChange?.(cats)
      })
      .catch(console.error)
  }, [postId])

  const toggle = async (cat: Category) => {
    const isSelected = selected.some(s => s.id === cat.id)
    if (postId) {
      if (isSelected) await apiClient.delete(`/posts/${postId}/categories/${cat.id}`)
      else await apiClient.post(`/posts/${postId}/categories/${cat.id}`, {})
    }
    const next = isSelected ? selected.filter(s => s.id !== cat.id) : [...selected, cat]
    setSelected(next)
    onChange?.(next)
  }

  const available = all.filter(c => !selected.some(s => s.id === c.id))

  return (
    <div>
      <label className="block text-xs font-semibold text-[#888899] uppercase tracking-widest mb-2 font-mono">
        Categorías
      </label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-8">
        {selected.map(cat => (
          <span key={cat.id} className="flex items-center gap-1.5 px-3 py-1 bg-[#7c6aff]/10 border border-[#7c6aff]/30 rounded-full text-xs font-mono text-[#7c6aff]">
            <Tag size={10} />{cat.name}
            <button onClick={() => toggle(cat)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-xs text-[#444455] font-mono">Sin categorías</span>}
      </div>
      {available.length > 0 && (
        <div className="relative">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#2a2a3a] rounded-lg text-xs font-mono text-[#888899] hover:text-white hover:border-[#7c6aff] transition-all">
            <Plus size={12} /> Agregar categoría
          </button>
          {open && (
            <div className="absolute top-8 left-0 z-20 bg-[#111118] border border-[#2a2a3a] rounded-xl shadow-xl min-w-48 py-1">
              {available.map(cat => (
                <button key={cat.id} onClick={() => { toggle(cat); setOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#1a1a24] transition-colors flex items-center gap-2 text-[#ccccdd]">
                  <Tag size={12} className="text-[#555566]" />{cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
