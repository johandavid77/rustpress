import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Package, Plus, Trash2, Edit2, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import ProductEditor from './ProductEditor'

interface Product {
  id: string; name: string; slug: string; price: number
  compare_price: number | null; stock: number; status: string
  sku: string | null; images: string[]
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [editing, setEditing]   = useState<string|null|'new'>(null)

  useEffect(() => { load() }, [search, status])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res: any = await apiClient.get(`/shop/products?${params}`)
      setProducts(Array.isArray(res?.data) ? res.data : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar producto?')) return
    try { await apiClient.delete(`/shop/products/${id}`); load() }
    catch(e) { console.error(e) }
  }

  const toggleStatus = async (p: Product) => {
    const newStatus = p.status === 'active' ? 'draft' : 'active'
    try { await apiClient.put(`/shop/products/${p.id}`, { status: newStatus }); load() }
    catch(e) { console.error(e) }
  }

  const statusColor: Record<string, string> = {
    active:   'bg-green-500/10 text-green-400',
    draft:    'bg-yellow-500/10 text-yellow-400',
    archived: 'bg-gray-500/10 text-gray-400',
  }

  return (
    <div className="max-w-4xl">
      {editing !== null && (
        <ProductEditor
          productId={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Package size={28} className="text-[#7c6aff]" />Productos
          </h1>
          <p className="text-[#888899] text-sm">{products.length} productos</p>
        </div>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-xl font-bold text-sm hover:bg-[#6b5be6]">
          <Plus size={14} />Nuevo producto
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-3.5 text-[#555566]" />
          <input className="w-full pl-9 pr-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
            placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
          value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
        </select>
      </div>

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
      {!loading && products.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 opacity-30">
          <Package size={40} /><p className="font-bold">No hay productos</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {products.map(p => (
          <div key={p.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all">
            <div className="w-12 h-12 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center shrink-0 overflow-hidden">
              {p.images?.[0]
                ? <img src={p.images[0]} className="w-full h-full object-cover rounded-lg" />
                : <Package size={16} className="text-[#444455]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0 ${statusColor[p.status] || ''}`}>{p.status}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#555566] font-mono">
                <span className="text-[#7c6aff] font-bold">${p.price?.toFixed(2)}</span>
                {p.compare_price && <span className="line-through">${p.compare_price.toFixed(2)}</span>}
                {p.sku && <span>SKU: {p.sku}</span>}
                <span>Stock: {p.stock}</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <div className="relative group/tog">
                <button onClick={() => toggleStatus(p)}
                  className={`p-2 rounded-lg transition-all ${p.status === 'active' ? 'text-green-400 hover:bg-green-500/10' : 'text-[#555566] hover:bg-[#1a1a24]'}`}>
                  {p.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0a0a14] border border-[#2a2a3a] px-2 py-0.5 text-[10px] text-[#aaaacc] opacity-0 group-hover/tog:opacity-100 transition-opacity z-50">
                  {p.status === 'active' ? 'Desactivar' : 'Activar'}
                </span>
              </div>
              <div className="relative group/edi">
                <button onClick={() => setEditing(p.id)}
                  className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all">
                  <Edit2 size={14} />
                </button>
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0a0a14] border border-[#2a2a3a] px-2 py-0.5 text-[10px] text-[#aaaacc] opacity-0 group-hover/edi:opacity-100 transition-opacity z-50">
                  Editar
                </span>
              </div>
              <div className="relative group/del">
                <button onClick={() => remove(p.id)}
                  className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                  <Trash2 size={14} />
                </button>
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#0a0a14] border border-[#2a2a3a] px-2 py-0.5 text-[10px] text-[#aaaacc] opacity-0 group-hover/del:opacity-100 transition-opacity z-50">
                  Eliminar
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
