import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Archive, AlertTriangle, Search, Save } from 'lucide-react'

export default function EcommerceInventory() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [edits, setEdits]       = useState<Record<string,string>>({})
  const [saving, setSaving]     = useState<string|null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r: any = await apiClient.get('/shop/products?limit=100')
      setProducts(Array.isArray(r?.data) ? r.data : [])
    } finally { setLoading(false) }
  }

  const saveStock = async (id: string) => {
    const s = parseInt(edits[id])
    if (isNaN(s)) return
    setSaving(id)
    try {
      await apiClient.put(`/shop/products/${id}`, { stock: s })
      setEdits(e => { const n={...e}; delete n[id]; return n })
      load()
    } finally { setSaving(null) }
  }

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search))
  const out = filtered.filter(p => p.stock === 0)
  const low = filtered.filter(p => p.stock > 0 && p.stock <= 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Inventario</h1>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-red-400">{out.length} agotados</span>
            <span className="text-yellow-400">{low.length} stock bajo</span>
          </div>
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-3.5 text-[#555566]" />
        <input className="w-full pl-9 pr-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
          placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <p className="text-[#888899] text-sm">Cargando...</p>}
      <div className="flex flex-col gap-2">
        {filtered.map(p => {
          const isOut = p.stock === 0
          const isLow = p.stock > 0 && p.stock <= 5
          const hasEdit = edits[p.id] !== undefined
          return (
            <div key={p.id} className={`bg-[#111118] border rounded-xl px-5 py-4 flex items-center gap-4 ${isOut ? 'border-red-500/30' : isLow ? 'border-yellow-500/30' : 'border-[#2a2a3a]'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {(isOut||isLow) && <AlertTriangle size={12} className={isOut?'text-red-400':'text-yellow-400'} />}
                  <p className="font-bold text-sm truncate">{p.name}</p>
                </div>
                {p.sku && <p className="text-xs font-mono text-[#555566]">SKU: {p.sku}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0"
                  value={hasEdit ? edits[p.id] : p.stock}
                  onChange={e => setEdits(ed => ({...ed, [p.id]: e.target.value}))}
                  className="w-20 px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm text-center outline-none focus:border-[#7c6aff]" />
                {hasEdit && (
                  <button onClick={() => saveStock(p.id)} disabled={saving===p.id}
                    className="p-2 bg-[#7c6aff] rounded-xl hover:bg-[#6b5be6] disabled:opacity-50">
                    <Save size={14}/>
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
