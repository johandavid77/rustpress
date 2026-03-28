import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Tag, Trash2, Plus } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [name, setName]             = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => { loadCategories() }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/categories')
      setCategories(Array.isArray(res) ? res : (res?.data ?? []))
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const create = async () => {
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      await apiClient.post('/categories', { name })
      setName('')
      loadCategories()
    } catch(e: any) {
      setError(e?.response?.data?.error || 'Error al crear')
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await apiClient.delete(`/categories/${id}`)
      loadCategories()
    } catch(e) { console.error(e) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Tag size={28} className="text-[#7c6aff]" />
          Categorías
        </h1>
        <p className="text-[#888899] text-sm">Organiza tus posts por categoría</p>
      </div>

      {/* Crear nueva */}
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-6">
        <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-3">Nueva categoría</p>
        <div className="flex gap-3">
          <input
            className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
            placeholder="Nombre de la categoría..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
          />
          <button onClick={create} disabled={saving || !name.trim()}
            className="px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] disabled:opacity-50 flex items-center gap-2">
            <Plus size={15} />
            {saving ? 'Creando...' : 'Crear'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs font-mono mt-2">{error}</p>}
      </div>

      {/* Lista */}
      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}

      {!loading && categories.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 opacity-30">
          <Tag size={36} />
          <p className="font-bold text-sm">No hay categorías aún</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {categories.map(cat => (
          <div key={cat.id}
            className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-3 flex items-center justify-between hover:border-[#3a3a4a] transition-all">
            <div>
              <p className="font-bold text-sm">{cat.name}</p>
              <p className="text-xs text-[#555566] font-mono">/{cat.slug}</p>
            </div>
            <button onClick={() => remove(cat.id)}
              className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
