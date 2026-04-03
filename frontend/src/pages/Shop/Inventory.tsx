import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Archive, AlertTriangle, Search, Save } from 'lucide-react'

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [edits, setEdits]       = useState<Record<string,string>>({})
  const [saving, setSaving]     = useState<string|null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/shop/products?limit=100')
      setProducts(Array.isArray(res?.data) ? res.data : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const saveStock = async (id: string) => {
    const newStock = parseInt(edits[id])
    if (isNaN(newStock)) return
    setSaving(id)
    try {
      await apiClient.put(`/shop/products/${id}`, { stock: newStock })
      setEdits(e => { const n = {...e}; delete n[id]; return n })
      load()
    } catch(e) { console.error(e) }
    finally { setSaving(null) }
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search)
  )

  const lowStock  = filtered.filter(p => p.stock <= 5 && p.stock > 0)
  const outStock  = filtered.filter(p => p.stock === 0)
  const okStock   = filtered.filter(p => p.stock > 5)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Archive size={28} className="text-[#7c6aff]" />Inventario
        </h1>
        <div className="flex gap-4 mt-2">
          <span className="text-xs font-mono text-red-400">{outStock.length} agotados</span>
          <span className="text-xs font-mono text-yellow-400">{lowStock.length} stock bajo</span>
          <span className="text-xs font-mono text-green-400">{okStock.length} en stock</span>
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-3.5 text-[#555566]" />
        <input className="w-full pl-9 pr-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
          placeholder="Buscar por nombre o SKU..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}

      <div className="flex flex-col gap-2">
        {filtered.map(p => {
          const isLow  = p.stock <= 5 && p.stock > 0
          const isOut  = p.stock === 0
          const hasEdit = edits[p.id] !== undefined

          return (
            <div key={p.id} className={`bg-[#111118] border rounded-xl px-5 py-4 flex items-center gap-4 transition-all
              ${isOut ? 'border-red-500/30' : isLow ? 'border-yellow-500/30' : 'border-[#2a2a3a]'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {(isOut || isLow) && <AlertTriangle size={12} className={isOut ? 'text-red-400' : 'text-yellow-400'} />}
                  <p className="font-bold text-sm truncate">{p.name}</p>
                </div>
                {p.sku && <p className="text-xs font-mono text-[#555566]">SKU: {p.sku}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number" min="0"
                  value={hasEdit ? edits[p.id] : p.stock}
                  onChange={e => setEdits(ed => ({...ed, [p.id]: e.target.value}))}
                  className="w-20 px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm text-center outline-none focus:border-[#7c6aff]"
                />
                {hasEdit && (
                  <button onClick={() => saveStock(p.id)} disabled={saving === p.id}
                    className="p-2 bg-[#7c6aff] rounded-lg hover:bg-[#6b5be6] transition-all disabled:opacity-50">
                    <Save size={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
