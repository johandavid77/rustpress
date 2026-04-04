import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Plus, Trash2, Save, GripVertical } from 'lucide-react'

interface Props { productId: string }

export default function VariantsEditor({ productId }: Props) {
  const [variants, setVariants] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [adding, setAdding]     = useState(false)
  const [form, setForm]         = useState({
    name: '', sku: '', price: '', stock: '0', image: '',
    options: {} as Record<string,string>
  })
  const [optionKey, setOptionKey]   = useState('')
  const [optionVal, setOptionVal]   = useState('')

  useEffect(() => { load() }, [productId])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get(`/shop/products/${productId}/variants`)
      setVariants(Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const addOption = () => {
    if (!optionKey.trim() || !optionVal.trim()) return
    setForm(f => ({ ...f, options: { ...f.options, [optionKey]: optionVal } }))
    setOptionKey(''); setOptionVal('')
  }

  const removeOption = (k: string) => {
    setForm(f => { const o = {...f.options}; delete o[k]; return {...f, options: o} })
  }

  const create = async () => {
    if (!form.name.trim()) return alert('Nombre requerido')
    try {
      await apiClient.post(`/shop/products/${productId}/variants`, {
        name: form.name,
        options: form.options,
        sku: form.sku || null,
        price: form.price ? parseFloat(form.price) : null,
        stock: parseInt(form.stock) || 0,
        image: form.image || null,
        sort_order: variants.length,
      })
      setForm({ name: '', sku: '', price: '', stock: '0', image: '', options: {} })
      setAdding(false)
      load()
    } catch(e) { console.error(e) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar variante?')) return
    try {
      await apiClient.delete(`/shop/products/${productId}/variants/${id}`)
      load()
    } catch(e) { console.error(e) }
  }

  const updateStock = async (id: string, stock: number) => {
    try {
      const v = variants.find(v => v.id === id)
      await apiClient.put(`/shop/products/${productId}/variants/${id}`, { ...v, stock })
      load()
    } catch(e) { console.error(e) }
  }

  if (loading) return <p className="text-[#888899] text-sm">Cargando...</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-[#555566] uppercase tracking-widest">{variants.length} variantes</p>
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c6aff] rounded-lg text-xs font-bold hover:bg-[#6b5be6]">
          <Plus size={12} />Nueva variante
        </button>
      </div>

      {adding && (
        <div className="bg-[#1a1a24] border border-[#7c6aff]/30 rounded-xl p-4 flex flex-col gap-3">
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
            placeholder="Nombre (ej: Talla M / Azul) *"
            className="w-full px-3 py-2 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
          
          <div className="grid grid-cols-3 gap-2">
            <input value={form.sku} onChange={e => setForm(f => ({...f, sku: e.target.value}))}
              placeholder="SKU" className="px-3 py-2 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
            <input value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))}
              type="number" placeholder="Precio" className="px-3 py-2 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
            <input value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))}
              type="number" placeholder="Stock" className="px-3 py-2 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
          </div>

          <div>
            <p className="text-xs text-[#555566] mb-1.5">Atributos (talla, color, etc)</p>
            <div className="flex gap-2 mb-2">
              <input value={optionKey} onChange={e => setOptionKey(e.target.value)}
                placeholder="Atributo (ej: Color)" className="flex-1 px-3 py-2 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-xs outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
              <input value={optionVal} onChange={e => setOptionVal(e.target.value)}
                placeholder="Valor (ej: Azul)" className="flex-1 px-3 py-2 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-xs outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                onKeyDown={e => e.key === 'Enter' && addOption()} />
              <button onClick={addOption} className="px-3 py-2 bg-[#2a2a3a] rounded-lg hover:bg-[#3a3a4a]"><Plus size={12} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(form.options).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1 bg-[#2a2a3a] px-2 py-1 rounded-lg text-xs font-mono">
                  {k}: {v}
                  <button onClick={() => removeOption(k)} className="text-[#888899] hover:text-red-400 ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={create} className="flex items-center gap-1.5 px-4 py-2 bg-[#7c6aff] rounded-lg text-xs font-bold hover:bg-[#6b5be6]">
              <Save size={12} />Guardar
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-xs text-[#888899] hover:border-[#7c6aff]">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {variants.length === 0 && !adding && (
        <p className="text-center py-6 text-[#444455] text-sm">No hay variantes. Agrega tallas, colores, etc.</p>
      )}

      <div className="flex flex-col gap-2">
        {variants.map(v => (
          <div key={v.id} className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-3 flex items-center gap-3">
            <GripVertical size={14} className="text-[#333344] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{v.name}</p>
              <div className="flex gap-2 flex-wrap mt-0.5">
                {Object.entries(v.options || {}).map(([k, val]: any) => (
                  <span key={k} className="text-xs font-mono bg-[#2a2a3a] px-2 py-0.5 rounded text-[#888899]">{k}: {val}</span>
                ))}
                {v.sku && <span className="text-xs font-mono text-[#555566]">SKU: {v.sku}</span>}
                {v.price && <span className="text-xs font-mono text-[#7c6aff]">${v.price}</span>}
              </div>
            </div>
            <input type="number" value={v.stock} min="0"
              onChange={e => updateStock(v.id, parseInt(e.target.value))}
              className="w-16 px-2 py-1.5 bg-[#0f0f17] border border-[#2a2a3a] rounded-lg text-white text-xs text-center outline-none focus:border-[#7c6aff]" />
            <button onClick={() => remove(v.id)} className="p-1.5 text-[#555566] hover:text-red-400 rounded-lg transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
