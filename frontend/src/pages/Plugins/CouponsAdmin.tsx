import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Percent, DollarSign } from 'lucide-react'

interface Coupon {
  id: string; code: string; type: string; value: number
  min_order?: number; max_uses?: number; uses: number
  expires_at?: string; active: boolean; created_at: string
}

export default function CouponsAdmin() {
  const { t } = useTranslation()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/coupons')
      setCoupons(Array.isArray(res) ? res : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!code || !value) return
    setSaving(true)
    try {
      await apiClient.post('/coupons', {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        min_order: minOrder ? parseFloat(minOrder) : null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      setCode(''); setValue(''); setMinOrder(''); setMaxUses(''); setExpiresAt('')
      setShowForm(false)
      await load()
    } catch {} finally { setSaving(false) }
  }

  const toggle = async (id: string) => {
    const res: any = await apiClient.post('/coupons/' + id + '/toggle', {})
    setCoupons(c => c.map(x => x.id === id ? (res?.data ?? res) : x))
  }

  const remove = async (id: string) => {
    if (!confirm('Eliminar cupon?')) return
    await apiClient.delete('/coupons/' + id)
    setCoupons(c => c.filter(x => x.id !== id))
  }

  const usagePercent = (c: Coupon) => c.max_uses ? Math.round((c.uses / c.max_uses) * 100) : null

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Tag size={24} className="text-[#7c6aff]" />Cupones de Descuento
          </h1>
          <p className="text-[#888899] text-sm">Crea codigos de descuento para tu tienda</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-semibold transition-all">
          <Plus size={15} />Nuevo cupon
        </button>
      </div>

      {showForm && (
        <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] mb-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest">Nuevo cupon</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="CODIGO" maxLength={20}
              className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] font-mono tracking-widest" />
            <div className="flex gap-2">
              {(['percent', 'fixed'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={"flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all " +
                    (type === t ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]/50')}>
                  {t === 'percent' ? <Percent size={14} /> : <DollarSign size={14} />}
                  {t === 'percent' ? 'Porcentaje' : 'Monto fijo'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="relative">
              <input value={value} onChange={e => setValue(e.target.value)} type="number" min="0"
                placeholder={type === 'percent' ? 'Descuento %' : 'Monto $'}
                className="w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
              <span className="absolute right-3 top-2.5 text-[#555566] text-xs">{type === 'percent' ? '%' : '$'}</span>
            </div>
            <input value={minOrder} onChange={e => setMinOrder(e.target.value)} type="number" min="0"
              placeholder="Pedido minimo $"
              className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
            <input value={maxUses} onChange={e => setMaxUses(e.target.value)} type="number" min="1"
              placeholder="Usos maximos"
              className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]" />
          </div>
          <input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="datetime-local"
            className="bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#7c6aff]" />
          <div className="flex gap-3">
            <button onClick={create} disabled={saving || !code || !value}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-semibold disabled:opacity-50 transition-all">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}Crear
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white text-sm transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">{coupons.length} cupones</span>
          <span className="text-xs text-[#555566]">{coupons.filter(c => c.active).length} activos</span>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>
        ) : coupons.length === 0 ? (
          <div className="py-10 text-center text-[#555566] text-sm">Sin cupones. Crea uno arriba.</div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {coupons.map(c => {
              const pct = usagePercent(c)
              const expired = c.expires_at && new Date(c.expires_at) < new Date()
              return (
                <div key={c.id} className={"flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] " + (!c.active ? 'opacity-50' : '')}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-bold text-white tracking-wider">{c.code}</code>
                      <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (c.type === 'percent' ? 'bg-violet-500/15 text-violet-400' : 'bg-green-500/15 text-green-400')}>
                        {c.type === 'percent' ? c.value + '%' : '$' + c.value}
                      </span>
                      {expired && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Expirado</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#555566]">
                      {c.min_order && <span>Min: ${c.min_order}</span>}
                      <span>{c.uses}{c.max_uses ? '/' + c.max_uses : ''} usos</span>
                      {c.expires_at && <span>Expira: {new Date(c.expires_at).toLocaleDateString('es-CO')}</span>}
                    </div>
                    {pct !== null && (
                      <div className="mt-1.5 h-1 bg-[#1a1a2e] rounded-full overflow-hidden w-32">
                        <div className={"h-full rounded-full transition-all " + (pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-[#7c6aff]')}
                          style={{ width: pct + '%' }} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggle(c.id)} className="text-[#555566] hover:text-white transition-colors">
                    {c.active ? <ToggleRight size={20} className="text-[#7c6aff]" /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => remove(c.id)} className="text-[#555566] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
