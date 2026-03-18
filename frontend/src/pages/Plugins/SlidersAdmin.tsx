import { useState, useEffect } from 'react'
import { slidersApi } from '../../api/sliders'
import { Slider, CreateSliderDto } from '../../types/slider'
import { Plus, Trash2, GripVertical, Eye, EyeOff, Edit2, X, Check } from 'lucide-react'

export default function SlidersAdmin() {
  const [sliders, setSliders] = useState<Slider[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateSliderDto>({
    title: '', subtitle: '', button_text: '', button_url: '',
    image_url: '', order_index: 0, is_active: true
  })

  useEffect(() => { loadSliders() }, [])

  const loadSliders = async () => {
    setLoading(true)
    try {
      const res = await slidersApi.getAll()
      setSliders(Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const resetForm = () => {
    setForm({ title: '', subtitle: '', button_text: '', button_url: '', image_url: '', order_index: sliders.length, is_active: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.image_url) return
    try {
      if (editingId) {
        await slidersApi.update(editingId, form)
      } else {
        await slidersApi.create(form)
      }
      resetForm()
      loadSliders()
    } catch(e) { console.error(e) }
  }

  const handleEdit = (slider: Slider) => {
    setForm({
      title: slider.title, subtitle: slider.subtitle ?? '',
      button_text: slider.button_text ?? '', button_url: slider.button_url ?? '',
      image_url: slider.image_url, order_index: slider.order_index, is_active: slider.is_active
    })
    setEditingId(slider.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este slider?')) return
    try { await slidersApi.delete(id); loadSliders() } catch(e) { console.error(e) }
  }

  const toggleActive = async (slider: Slider) => {
    try { await slidersApi.update(slider.id, { is_active: !slider.is_active }); loadSliders() } catch(e) { console.error(e) }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Home Sliders</h1>
          <p className="text-[#888899] text-sm">Gestiona los slides del sitio público</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] transition-colors">
          <Plus size={16} /> Nuevo Slide
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">{editingId ? 'Editar Slide' : 'Nuevo Slide'}</h2>
            <button onClick={resetForm}><X size={16} className="text-[#888899] hover:text-white" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-[#888899] font-mono mb-1 block">Imagen URL *</label>
              <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})}
                placeholder="https://..."
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none" />
            </div>
            {form.image_url && (
              <div className="md:col-span-2">
                <img src={form.image_url} alt="preview" className="w-full h-40 object-cover rounded-lg border border-[#2a2a3a]"
                  onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">Título *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Título del slide"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">Subtítulo</label>
              <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})}
                placeholder="Descripción opcional"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">Texto del botón</label>
              <input value={form.button_text} onChange={e => setForm({...form, button_text: e.target.value})}
                placeholder="Ej: Ver más"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">URL del botón</label>
              <input value={form.button_url} onChange={e => setForm({...form, button_url: e.target.value})}
                placeholder="/blog"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none" />
            </div>
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">Orden</label>
              <input type="number" value={form.order_index} onChange={e => setForm({...form, order_index: parseInt(e.target.value)})}
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-4 h-4 accent-[#7c6aff]" />
                <span className="text-sm">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6]">
              <Check size={14} /> {editingId ? 'Guardar' : 'Crear'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm text-[#888899] hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando sliders...</p>}

      <div className="flex flex-col gap-3">
        {sliders.map((slider) => (
          <div key={slider.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all">
            <GripVertical size={16} className="text-[#444455] flex-shrink-0" />
            <img src={slider.image_url} alt={slider.title}
              className="w-20 h-14 object-cover rounded-lg flex-shrink-0 bg-[#1a1a24]"
              onError={e => (e.currentTarget.style.display='none')} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm truncate">{slider.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${slider.is_active ? 'bg-green-500/10 text-green-400' : 'bg-[#2a2a3a] text-[#888899]'}`}>
                  {slider.is_active ? 'activo' : 'inactivo'}
                </span>
              </div>
              {slider.subtitle && <p className="text-xs text-[#888899] truncate">{slider.subtitle}</p>}
              <p className="text-xs text-[#555566] font-mono mt-0.5">orden: {slider.order_index}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => toggleActive(slider)}
                className="p-2 text-[#888899] hover:text-white rounded-lg hover:bg-[#1a1a24] transition-all" title={slider.is_active ? 'Desactivar' : 'Activar'}>
                {slider.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button onClick={() => handleEdit(slider)}
                className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(slider.id)}
                className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && sliders.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <span className="text-6xl">⬡</span>
          <p className="font-bold">No hay slides aún</p>
        </div>
      )}
    </div>
  )
}
