import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Star, Check, X, Trash2 } from 'lucide-react'

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('pending')

  useEffect(() => { load() }, [status])

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get(`/reviews?status=${status}`)
      setReviews(Array.isArray(res?.data) ? res.data : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const setReviewStatus = async (id: string, s: string) => {
    await apiClient.put(`/reviews/${id}/status`, { status: s })
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar reseña?')) return
    await apiClient.delete(`/reviews/${id}`)
    load()
  }

  const stars = (n: number) => Array.from({length: 5}, (_, i) => (
    <Star key={i} size={12} className={i < n ? 'text-yellow-400 fill-yellow-400' : 'text-[#333344]'} />
  ))

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Star size={28} className="text-[#7c6aff]" />Reseñas
          </h1>
          <p className="text-[#888899] text-sm">Moderación de reseñas de productos</p>
        </div>
        <select className="px-4 py-2.5 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]"
          value={status} onChange={e => setStatus(e.target.value)}>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando...</p>}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-20 opacity-30">
          <Star size={40} className="mx-auto mb-3" />
          <p className="font-bold">No hay reseñas {status === 'pending' ? 'pendientes' : ''}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">{stars(r.rating)}</div>
                  {r.verified && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-mono">✓ Compra verificada</span>}
                </div>
                <p className="text-xs text-[#555566] font-mono">{r.author} · {r.product_name} · {new Date(r.created_at).toLocaleDateString('es-CO')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status === 'pending' && <>
                  <button onClick={() => setReviewStatus(r.id, 'approved')}
                    className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-all">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setReviewStatus(r.id, 'rejected')}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                    <X size={14} />
                  </button>
                </>}
                <button onClick={() => remove(r.id)}
                  className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {r.title && <p className="font-bold text-sm mb-1">{r.title}</p>}
            {r.body && <p className="text-sm text-[#888899] leading-relaxed">{r.body}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
