import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Tag, Plus, Trash2, Copy, Check } from 'lucide-react'

export default function EcommerceCoupons() {
  const [coupons, setCoupons]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied]     = useState<string|null>(null)
  const [form, setForm]         = useState({ code:'', type:'percent', value:'', min_order:'', max_uses:'', expires_at:'' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const r: any = await apiClient.get('/shop/coupons')
      setCoupons(Array.isArray(r) ? r : [])
    } finally { setLoading(false) }
  }

  const create = async () => {
    if (!form.code.trim() || !form.value) return alert('Código y valor requeridos')
    await apiClient.post('/shop/coupons', { code: form.code.toUpperCase(), type: form.type, value: parseFloat(form.value), min_order: form.min_order ? parseFloat(form.min_order) : null, max_uses: form.max_uses ? parseInt(form.max_uses) : null, expires_at: form.expires_at || null })
    setForm({ code:'', type:'percent', value:'', min_order:'', max_uses:'', expires_at:'' })
    setCreating(false); load()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar cupón?')) return
    await apiClient.delete(`/shop/coupons/${id}`); load()
  }

  const copy = (code: string) => {
    navigator.clipboard.writeText(code); setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const genCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    setForm(f => ({...f, code: Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join('')}))
  }

  const F = ({ label, value, onChange, type='text', placeholder='' }: any) => (
    <div>
      <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Cupones</h1>
          <p className="text-[#888899] text-sm">{coupons.length} cupones</p>
        </div>
        <button onClick={() => setCreating(v => !v)} className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-xl font-bold text-sm hover:bg-[#6b5be6]">
          <Plus size={14}/>Nuevo cupón
        </button>
      </div>

      {creating && (
        <div className="bg-[#111118] border border-[#7c6aff]/30 rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Código</label>
              <div className="flex gap-2">
                <input value={form.code} onChange={e => setForm(f => ({...f, code:e.target.value.toUpperCase()}))} placeholder="DESCUENTO20"
                  className="flex-1 px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] font-mono" />
                <button onClick={genCode} className="px-3 border border-[#2a2a3a] rounded-xl text-xs text-[#888899] hover:border-[#7c6aff]">Auto</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))}
                className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]">
                <option value="percent">% Porcentaje</option>
                <option value="fixed">$ Fijo</option>
              </select>
            </div>
            <F label={form.type==='percent'?'Descuento (%)':'Descuento ($)'} value={form.value} onChange={(v:string) => setForm(f => ({...f, value:v}))} type="number" placeholder="20" />
            <F label="Pedido mínimo" value={form.min_order} onChange={(v:string) => setForm(f => ({...f, min_order:v}))} type="number" placeholder="Sin mínimo" />
            <F label="Usos máximos" value={form.max_uses} onChange={(v:string) => setForm(f => ({...f, max_uses:v}))} type="number" placeholder="Ilimitado" />
            <F label="Expira" value={form.expires_at} onChange={(v:string) => setForm(f => ({...f, expires_at:v}))} type="datetime-local" />
          </div>
          <div className="flex gap-3">
            <button onClick={create} className="px-5 py-2.5 bg-[#7c6aff] rounded-xl text-sm font-bold hover:bg-[#6b5be6]">Crear cupón</button>
            <button onClick={() => setCreating(false)} className="px-5 py-2.5 border border-[#2a2a3a] rounded-xl text-sm text-[#888899]">Cancelar</button>
          </div>
        </div>
      )}

      {loading && <p className="text-[#888899] text-sm">Cargando...</p>}
      <div className="flex flex-col gap-2">
        {coupons.map(c => (
          <div key={c.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-black text-[#7c6aff]">{c.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${c.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{c.active?'activo':'inactivo'}</span>
              </div>
              <p className="text-xs text-[#555566] font-mono">
                {c.type==='percent' ? `${c.value}% desc` : `$${c.value} desc`}
                {c.min_order ? ` · Mín $${c.min_order}` : ''}
                {c.max_uses ? ` · ${c.uses}/${c.max_uses} usos` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => copy(c.code)} className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg">
                {copied===c.code ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
              </button>
              <button onClick={() => remove(c.id)} className="p-2 text-[#888899] hover:text-red-400 rounded-lg"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
