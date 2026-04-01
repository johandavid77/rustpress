import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users, CheckCircle } from 'lucide-react'
import { apiClient } from '../../api/client'

interface Service {
  id: string; type: string; name: string; slug: string
  description: string; price: number; currency: string
  capacity: number; duration_min: number; images: string[]
  location: string
}

interface Slot {
  id: string; starts_at: string; ends_at: string
  capacity: number; booked: number; available: number; price: number | null
}

const typeLabels: Record<string, string> = {
  tour: '🗺️ Tours', lodging: '🏨 Hospedaje',
  restaurant: '🍽️ Restaurante', event: '🎉 Eventos', custom: '⭐ Servicios'
}

export default function Bookings() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('')
  const [selected, setSelected] = useState<Service | null>(null)
  const [slots, setSlots]       = useState<Slot[]>([])
  const [slot, setSlot]         = useState<string>('')
  const [qty, setQty]           = useState(1)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [notes, setNotes]       = useState('')
  const [booking, setBooking]   = useState(false)
  const [done, setDone]         = useState<any>(null)

  useEffect(() => { load() }, [filter])

  const load = async () => {
    setLoading(true)
    try {
      const params = filter ? `?service_type=${filter}` : ''
      const res: any = await apiClient.get(`/bookings/services${params}`)
      setServices(Array.isArray(res) ? res : [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const selectService = async (s: Service) => {
    setSelected(s)
    setSlot('')
    try {
      const res: any = await apiClient.get(`/bookings/services/${s.id}/slots`)
      setSlots(Array.isArray(res) ? res : [])
    } catch(e) { setSlots([]) }
  }

  const book = async () => {
    if (!selected) return
    if (!name.trim() || !email.trim()) return alert('Nombre y email requeridos')
    setBooking(true)
    try {
      const res: any = await apiClient.post('/bookings', {
        service_id: selected.id,
        slot_id: slot || undefined,
        quantity: qty,
        guest_name: name,
        guest_email: email,
        guest_phone: phone || undefined,
        notes: notes || undefined,
      })
      setDone(res)
    } catch(e: any) {
      alert(e?.response?.data?.error || 'Error al crear la reserva')
    } finally { setBooking(false) }
  }

  const total = selected
    ? (slot ? (slots.find(s => s.id === slot)?.price ?? selected.price) : selected.price) * qty
    : 0

  if (done) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <CheckCircle size={64} className="text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-black mb-2">¡Reserva creada!</h1>
        <p className="text-[#888899] mb-2">#{done.booking_id?.slice(0,8).toUpperCase()}</p>
        <p className="text-2xl font-black text-[#7c6aff] mb-8">${done.total?.toFixed(2)} {selected?.currency}</p>
        <p className="text-[#888899] text-sm mb-8">Recibirás confirmación en tu email.</p>
        <button onClick={() => { setDone(null); setSelected(null) }}
          className="px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6]">
          Ver más servicios
        </button>
      </div>
    </div>
  )

  if (selected) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="text-[#7c6aff] font-bold">← Volver</button>
          <h1 className="font-black">{selected.name}</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {selected.images?.[0] && (
              <img src={selected.images[0]} className="w-full h-56 object-cover rounded-2xl mb-6" />
            )}
            <p className="text-[#888899] mb-4">{selected.description}</p>
            <div className="flex flex-col gap-2 text-sm">
              {selected.location && <div className="flex items-center gap-2 text-[#888899]"><MapPin size={14} />{selected.location}</div>}
              {selected.duration_min && <div className="flex items-center gap-2 text-[#888899]"><Clock size={14} />{selected.duration_min} min</div>}
              {selected.capacity && <div className="flex items-center gap-2 text-[#888899]"><Users size={14} />Capacidad: {selected.capacity} personas</div>}
            </div>
            {slots.length > 0 && (
              <div className="mt-6">
                <p className="font-bold mb-3 flex items-center gap-2"><Calendar size={14} />Disponibilidad</p>
                <div className="flex flex-col gap-2">
                  {slots.map(s => (
                    <button key={s.id} onClick={() => setSlot(s.id === slot ? '' : s.id)}
                      disabled={s.available <= 0}
                      className={`p-3 rounded-xl border text-sm text-left transition-all ${slot === s.id ? 'border-[#7c6aff] bg-[#7c6aff]/10' : 'border-[#2a2a3a] hover:border-[#7c6aff]/50'} ${s.available <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <div className="flex justify-between">
                        <span>{new Date(s.starts_at).toLocaleString('es-CO', {dateStyle:'medium', timeStyle:'short'})}</span>
                        <span className="text-[#7c6aff] font-mono">${(s.price ?? selected.price).toFixed(2)}</span>
                      </div>
                      <span className="text-xs text-[#555566]">{s.available} lugares disponibles</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 h-fit">
            <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-4">Datos de reserva</p>
            <div className="flex flex-col gap-3 mb-5">
              <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                placeholder="Nombre completo *" value={name} onChange={e => setName(e.target.value)} />
              <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
                placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} />
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#888899]">Personas:</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-8 h-8 border border-[#2a2a3a] rounded-lg hover:border-[#7c6aff]">-</button>
                  <span className="w-8 text-center font-bold">{qty}</span>
                  <button onClick={() => setQty(q => q+1)} className="w-8 h-8 border border-[#2a2a3a] rounded-lg hover:border-[#7c6aff]">+</button>
                </div>
              </div>
              <textarea className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455] resize-none"
                rows={2} placeholder="Notas especiales" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-between font-black text-lg pt-3 border-t border-[#2a2a3a] mb-4">
              <span>Total</span><span className="text-[#7c6aff]">${total.toFixed(2)} {selected.currency}</span>
            </div>
            <button onClick={book} disabled={booking}
              className="w-full py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] disabled:opacity-50 transition-all">
              {booking ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#1a1a24] sticky top-0 bg-[#0a0a0f]/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black">Reservas <span className="text-[#7c6aff]">&</span> Tours</h1>
          <div className="flex gap-2">
            {['', 'tour', 'lodging', 'restaurant', 'event'].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${filter === t ? 'border-[#7c6aff] text-[#7c6aff] bg-[#7c6aff]/10' : 'border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'}`}>
                {t === '' ? 'Todo' : typeLabels[t]?.split(' ')[1] || t}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading && <p className="text-[#888899]">Cargando servicios...</p>}
        {!loading && services.length === 0 && (
          <div className="text-center py-20 opacity-40">
            <Calendar size={48} className="mx-auto mb-4" />
            <p className="font-bold">No hay servicios disponibles</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <button key={s.id} onClick={() => selectService(s)} className="bg-[#111118] border border-[#2a2a3a] rounded-2xl overflow-hidden hover:border-[#7c6aff]/50 transition-all text-left group">
              <div className="aspect-video bg-[#1a1a24] overflow-hidden">
                {s.images?.[0]
                  ? <img src={s.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl">{typeLabels[s.type]?.split(' ')[0]}</div>
                }
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#7c6aff] bg-[#7c6aff]/10 px-2 py-0.5 rounded-full">{typeLabels[s.type] || s.type}</span>
                </div>
                <h3 className="font-black mb-1">{s.name}</h3>
                {s.location && <p className="text-xs text-[#555566] flex items-center gap-1 mb-2"><MapPin size={10} />{s.location}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-[#7c6aff]">${s.price.toFixed(2)} <span className="text-xs font-normal text-[#555566]">{s.currency}</span></span>
                  {s.duration_min && <span className="text-xs text-[#555566] flex items-center gap-1"><Clock size={10} />{s.duration_min}min</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
