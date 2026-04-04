import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Package, Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight, X, Save } from 'lucide-react'

export default function EcommerceProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState<any>({})
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [search, status])

  const load = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (status) p.set('status', status)
      const r: any = await apiClient.get(`/shop/products?${p}`)
      setProducts(Array.isArray(r?.data) ? r.data : [])
    } finally { setLoading(false) }
  }

  const openNew = () => {
    setForm({ name:'', slug:'', description:'', price:'', compare_price:'', stock:'0', sku:'', status:'draft', images:[] })
    setEditing('new')
  }

  const openEdit = async (p: any) => {
    setForm({...p, price: p.price?.toString(), compare_price: p.compare_price?.toString()||'', stock: p.stock?.toString(), images: p.images||[]})
    setEditing(p.id)
  }

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

  const save = async () => {
    if (!form.name?.trim()) return alert('Nombre requerido')
    setSaving(true)
    try {
      const payload = { ...form, slug: form.slug || slugify(form.name), price: parseFloat(form.price)||0, compare_price: form.compare_price ? parseFloat(form.compare_price) : null, stock: parseInt(form.stock)||0 }
      if (editing === 'new') await apiClient.post('/shop/products', payload)
      else await apiClient.put(`/shop/products/${editing}`, payload)
      setEditing(null); load()
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return
    await apiClient.delete(`/shop/products/${id}`); load()
  }

  const toggle = async (p: any) => {
    await apiClient.put(`/shop/products/${p.id}`, { status: p.status === 'active' ? 'draft' : 'active' }); load()
  }

  const F = ({ label, value, onChange, type='text', placeholder='' }: any) => (
    <div>
      <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">{label}</label>
      <input type={type} value={value||''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
    </div>
  )

  return (
    <div>
      {editing !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f17] border border-[#2a2a3a] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a]">
              <h2 className="font-black">{editing === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
              <button onClick={() => setEditing(null)}><X size={18} className="text-[#555566]" /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
              <F label="Nombre *" value={form.name} onChange={(v:string) => setForm((f:any) => ({...f, name:v, slug:slugify(v)}))} />
              <F label="Slug" value={form.slug} onChange={(v:string) => setForm((f:any) => ({...f, slug:v}))} />
              <div>
                <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Descripción</label>
                <textarea value={form.description||''} onChange={e => setForm((f:any) => ({...f, description:e.target.value}))} rows={3}
                  className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Precio *" value={form.price} onChange={(v:string) => setForm((f:any) => ({...f, price:v}))} type="number" />
                <F label="Precio anterior" value={form.compare_price} onChange={(v:string) => setForm((f:any) => ({...f, compare_price:v}))} type="number" />
                <F label="SKU" value={form.sku} onChange={(v:string) => setForm((f:any) => ({...f, sku:v}))} />
                <F label="Stock" value={form.stock} onChange={(v:string) => setForm((f:any) => ({...f, stock:v}))} type="number" />
              </div>
              <div>
                <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Estado</label>
                <select value={form.status||'draft'} onChange={e => setForm((f:any) => ({...f, status:e.target.value}))}
                  className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]">
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#2a2a3a] flex gap-3">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6aff] rounded-xl font-bold text-sm hover:bg-[#6b5be6] disabled:opacity-50">
                <Save size={14} />{saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 border border-[#2a2a3a] rounded-xl text-sm text-[#888899]">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Productos</h1>
          <p className="text-[#888899] text-sm">{products.length} productos</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-xl font-bold text-sm hover:bg-[#6b5be6]">
          <Plus size={14} />Nuevo producto
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3.5 text-[#555566]" />
          <input className="w-full pl-9 pr-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
            placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none">
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="draft">Borradores</option>
        </select>
      </div>

      {loading && <p className="text-[#888899] text-sm">Cargando...</p>}
      <div className="flex flex-col gap-2">
        {products.map(p => (
          <div key={p.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center overflow-hidden shrink-0">
              {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <Package size={18} className="text-[#444455]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{p.name}</p>
              <p className="text-xs font-mono text-[#555566]">${p.price?.toFixed(2)} · Stock: {p.stock} {p.sku ? `· ${p.sku}` : ''}</p>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{p.status}</span>
            <div className="flex gap-1">
              <button onClick={() => toggle(p)} className={`p-2 rounded-lg transition-all ${p.status === 'active' ? 'text-green-400' : 'text-[#555566]'}`}>
                {p.status === 'active' ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
              </button>
              <button onClick={() => openEdit(p)} className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24]"><Edit2 size={14}/></button>
              <button onClick={() => remove(p.id)} className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24]"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
