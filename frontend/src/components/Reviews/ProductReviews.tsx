import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Star } from 'lucide-react'

interface Props { productId: string }

export default function ProductReviews({ productId }: Props) {
  const [data, setData]           = useState<any>(null)
  const [form, setForm]           = useState({ rating: 5, title: '', body: '', guest_name: '' })
  const [submitting, setSub]      = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { load() }, [productId])

  const load = async () => {
    try {
      const res = await apiClient.get(`/reviews/product/${productId}`)
      setData(res)
    } catch(e) { console.error(e) }
  }

  const submit = async () => {
    if (!form.guest_name.trim()) return alert('Ingresa tu nombre')
    setSub(true)
    try {
      await apiClient.post(`/reviews/product/${productId}`, form)
      setSubmitted(true)
      setForm({ rating: 5, title: '', body: '', guest_name: '' })
    } catch(e) { console.error(e) }
    finally { setSub(false) }
  }

  const Stars = ({ n, interactive = false, onChange }: { n: number, interactive?: boolean, onChange?: (n: number) => void }) => (
    <div className="flex gap-0.5">
      {Array.from({length: 5}, (_, i) => (
        <Star key={i} size={16}
          className={`${i < n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onChange?.(i + 1)} />
      ))}
    </div>
  )

  const summary = data?.summary

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-black mb-8">Reseñas</h2>

      {summary && summary.total_reviews > 0 && (
        <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50 rounded-2xl">
          <div className="text-center shrink-0">
            <p className="text-5xl font-black">{summary.avg_rating.toFixed(1)}</p>
            <Stars n={Math.round(summary.avg_rating)} />
            <p className="text-sm text-gray-500 mt-1">{summary.total_reviews} reseñas</p>
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            {[5,4,3,2,1].map(n => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right text-gray-500">{n}</span>
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{width: `${summary.total_reviews > 0 ? (summary.distribution[n] / summary.total_reviews) * 100 : 0}%`}} />
                </div>
                <span className="w-6 text-gray-400 text-xs">{summary.distribution[n]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-10">
        {data?.data?.map((r: any) => (
          <div key={r.id} className="border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <Stars n={r.rating} />
              {r.verified && <span className="text-xs text-green-600 font-mono bg-green-50 px-2 py-0.5 rounded-full">✓ Compra verificada</span>}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {r.title && <p className="font-bold text-sm">{r.title}</p>}
              <span className="text-xs text-gray-400">{r.author} · {new Date(r.created_at).toLocaleDateString('es-CO')}</span>
            </div>
            {r.body && <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>}
          </div>
        ))}
        {data?.data?.length === 0 && <p className="text-gray-400 text-sm">Sé el primero en dejar una reseña.</p>}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-black mb-4">Escribir reseña</h3>
        {submitted ? (
          <p className="text-green-600 font-bold">✓ Reseña enviada — aparecerá después de revisión.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-bold mb-2">Calificación</p>
              <Stars n={form.rating} interactive onChange={n => setForm(f => ({...f, rating: n}))} />
            </div>
            <input className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 bg-white"
              placeholder="Tu nombre *" value={form.guest_name} onChange={e => setForm(f => ({...f, guest_name: e.target.value}))} />
            <input className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 bg-white"
              placeholder="Título (opcional)" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
            <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 bg-white resize-none"
              rows={3} placeholder="Tu reseña..." value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} />
            <button onClick={submit} disabled={submitting}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-700 disabled:opacity-50 transition-all w-fit">
              {submitting ? 'Enviando...' : 'Enviar reseña'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
