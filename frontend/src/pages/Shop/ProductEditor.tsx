import { useState, useEffect, useRef } from 'react'
import { apiClient } from '../../api/client'
import { Save, X, Plus, Trash2, Package, UploadCloud, Loader2, Link } from 'lucide-react'

interface Props {
  productId?: string
  onClose: () => void
  onSaved: () => void
}

export default function ProductEditor({ productId, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', compare_price: '',
    stock: '0', sku: '', status: 'draft', track_stock: true,
    images: [] as string[],
  })
  const [variants, setVariants] = useState<any[]>([])
  const [saving, setSaving]     = useState(false)
  const [tab, setTab]           = useState<'general'|'variants'|'images'>('general')
  const [newImg, setNewImg]     = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (productId) loadProduct()
  }, [productId])

  const loadProduct = async () => {
    try {
      const res: any = await apiClient.get(`/shop/products/${productId}`)
      setForm({
        name: res.name || '', slug: res.slug || '',
        description: res.description || '',
        price: res.price?.toString() || '',
        compare_price: res.compare_price?.toString() || '',
        stock: res.stock?.toString() || '0',
        sku: res.sku || '', status: res.status || 'draft',
        track_stock: res.track_stock ?? true,
        images: res.images || [],
      })
    } catch(e) { console.error(e) }
  }

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res: any = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      } as any)
      const url = res?.url ?? res?.data?.url ?? ''
      if (url) setForm(f => ({ ...f, images: [...f.images, url] }))
    } catch (e) {
      console.error('Upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.name.trim()) return alert('El nombre es requerido')
    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        price: parseFloat(form.price) || 0,
        compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
        stock: parseInt(form.stock) || 0,
      }
      if (productId) {
        await apiClient.put(`/shop/products/${productId}`, payload)
      } else {
        await apiClient.post('/shop/products', payload)
      }
      onSaved()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const addImage = () => {
    if (!newImg.trim()) return
    setForm(f => ({...f, images: [...f.images, newImg.trim()]}))
    setNewImg('')
  }

  const removeImage = (i: number) => setForm(f => ({...f, images: f.images.filter((_, idx) => idx !== i)}))

  const Field = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f17] border border-[#2a2a3a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a]">
          <h2 className="font-black flex items-center gap-2">
            <Package size={18} className="text-[#7c6aff]" />
            {productId ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="text-[#555566] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-4">
          {(['general','images','variants'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono capitalize transition-all ${tab === t ? 'bg-[#7c6aff] text-white' : 'border border-[#2a2a3a] text-[#888899]'}`}>
              {t === 'general' ? '📋 General' : t === 'images' ? '🖼️ Imágenes' : '🔀 Variantes'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-4">
          {tab === 'general' && <>
            <Field label="Nombre *" value={form.name} onChange={(v: string) => setForm(f => ({...f, name: v, slug: slugify(v)}))} />
            <Field label="Slug" value={form.slug} onChange={(v: string) => setForm(f => ({...f, slug: v}))} />
            <div>
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1.5 block">Descripción</label>
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3}
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Precio *" value={form.price} onChange={(v: string) => setForm(f => ({...f, price: v}))} type="number" placeholder="0.00" />
              <Field label="Precio anterior" value={form.compare_price} onChange={(v: string) => setForm(f => ({...f, compare_price: v}))} type="number" placeholder="0.00" />
              <Field label="SKU" value={form.sku} onChange={(v: string) => setForm(f => ({...f, sku: v}))} />
              <Field label="Stock" value={form.stock} onChange={(v: string) => setForm(f => ({...f, stock: v}))} type="number" />
            </div>
            <div>
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1.5 block">Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]">
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-bold">Controlar inventario</p>
                <p className="text-xs text-[#555566]">Validar stock antes de agregar al carrito</p>
              </div>
              <button onClick={() => setForm(f => ({...f, track_stock: !f.track_stock}))}
                className={`w-11 h-6 rounded-full transition-all relative ${form.track_stock ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.track_stock ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </>}

          {tab === 'images' && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input value={newImg} onChange={e => setNewImg(e.target.value)}
                  placeholder="URL de imagen (https://...)"
                  className="flex-1 px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                  onKeyDown={e => e.key === 'Enter' && addImage()} />
                <button onClick={addImage} className="px-4 py-3 bg-[#7c6aff] rounded-xl hover:bg-[#6b5be6]">
                  <Plus size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square bg-[#1a1a24] rounded-xl overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={12} />
                    </button>
                    {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-[#7c6aff] px-2 py-0.5 rounded-full font-mono">Principal</span>}
                  </div>
                ))}
                {form.images.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-[#444455]">
                    <Package size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Agrega URLs de imágenes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'variants' && (
            <div className="text-center py-10 opacity-40">
              <p className="font-bold mb-1">Variantes</p>
              <p className="text-sm text-[#888899]">Talla, color, material — próximamente</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#2a2a3a] flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] disabled:opacity-50 transition-all">
            <Save size={14} />{saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border border-[#2a2a3a] rounded-xl text-[#888899] hover:border-[#7c6aff] transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
