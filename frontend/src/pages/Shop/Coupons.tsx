import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Tag, Plus, Trash2, Copy, Check } from 'lucide-react'

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied]   = useState<string|null>(null)
  const [form, setForm]       = useState({
    code: '', type: 'percent', value: '', min_order: '', max_uses: '', expires_at: ''
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/shop/coupons')
      setCoupons(Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const create = async () => {
    if (!form.code.trim() || !form.value) return alert('Código y valor requeridos')
    try {
      await apiClient.post('/shop/coupons', {
        code: form.code.toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order: form.min_order ? parseFloat(form.min_order) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      })
      setForm({ code: '', type: 'percent', value: '', min_order: '', max_uses: '', expires_at: '' })
      setCreating(false)
      load()
    } catch(e) { console.error(e) }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar cupón?')) return
    try { await apiClient.delete(`/shop/coupons/${id}`); load() }
    catch(e) { console.error(e) }
  }

  const copy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const genCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(f => ({...f, code}))
  }

  const Input = ({ label, value, onChange, type = 'text', placeholder = '' }: any) => (
    <div>
      <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Tag size={28} className="text-[#7c6aff]" />Cupones
          </h1>
          <p className="text-[#888899] text-sm">Descuentos y promociones</p>
        </div>
        <button onClick={() => setCreating(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-xl font-bold text-sm hover:bg-[#6b5be6]">
          <Plus size={14} />Nuevo cupón
        </button>
      </div>

      {creating && (
        <div className="bg-[#111118] border border-[#7c6aff]/30 rounded-xl p-5 mb-6">
          <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-4">Nuevo cupón</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Código</label>
              <div className="flex gap-2">
                <input value={form.code} onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                  placeholder="DESCUENTO20"
                  className="flex-1 px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff] font-mono" />
                <button onClick={genCode} className="px-3 py-2.5 border border-[#2a2a3a] rounded-lg text-xs text-[#888899] hover:border-[#7c6aff]">Auto</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-lg text-white text-sm outline-none focus:border-[#7c6aff]">
                <option value="percent">% Porcentaje</option>
                <option value="fixed">$ Fijo</option>
              </select>
            </div>
            <Input label={form.type === 'percent' ? 'Descuento (%)' : 'Descuento ($)'} value={form.value} onChange={(v:string) => setForm(f => ({...f, value: v}))} type="number" placeholder="20" />
            <Input label="Pedido mínimo" value={form.min_order} onChange={(v:string) => setForm(f => ({...f, min_order: v}))} type="number" placeholder="Sin mínimo" />
            <Input label="Usos máximos" value={form.max_uses} onChange={(v:string) => setForm(f => ({...f, max_uses: v}))} type="number" placeholder="Ilimitado" />
            <Input label="Expira" value={form.expires_at} onChange={(v:string) => setForm(f => ({...f, expires_at: v}))} type="datetime-local" />
          </div>
          <div className="flex gap-3">
            <button onClick={create} className="px-5 py-2.5 bg-[#7c6aff] rounded-xl text-sm font-bold hover:bg-[#6b5be6]">Crear cupón</button>
            <button onClick={() => setCreating(false)} className="px-5 py-2.5 border border-[#2a2a3a] rounded-xl text-sm text-[#888899] hover:border-[#7c6aff]">Cancelar</button>
          </div>
        </div>
      )}

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
      {!loading && coupons.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 opacity-30">
          <Tag size={40} /><p className="font-bold">No hay cupones</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {coupons.map(c => (
          <div key={c.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-black text-[#7c6aff]">{c.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${c.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                  {c.active ? 'activo' : 'inactivo'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#555566] font-mono">
                <span>{c.type === 'percent' ? `${c.value}% descuento` : `$${c.value} descuento`}</span>
                {c.min_order && <span>Mín: ${c.min_order}</span>}
                {c.max_uses && <span>{c.uses}/{c.max_uses} usos</span>}
                {c.expires_at && <span>Expira: {new Date(c.expires_at).toLocaleDateString('es-CO')}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(c.code)} className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all">
                {copied === c.code ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
              <button onClick={() => remove(c.id)} className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
