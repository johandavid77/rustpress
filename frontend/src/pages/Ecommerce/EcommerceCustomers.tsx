import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Users, Search, Mail, ShoppingBag } from 'lucide-react'

export default function EcommerceCustomers() {
  const [users, setUsers]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => { load() }, [search])

  const load = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      const r: any = await apiClient.get(`/users?${p}`)
      setUsers(Array.isArray(r?.data) ? r.data : [])
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-1">Clientes</h1>
          <p className="text-[#888899] text-sm">{users.length} usuarios registrados</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-3.5 text-[#555566]" />
        <input className="w-full pl-9 pr-4 py-3 bg-[#111118] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
          placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <p className="text-[#888899] text-sm">Cargando...</p>}
      <div className="flex flex-col gap-2">
        {users.map((u: any) => (
          <div key={u.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#7c6aff]/20 flex items-center justify-center shrink-0">
              <span className="text-[#7c6aff] font-black text-sm">{u.username?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{u.username}</p>
              <p className="text-xs text-[#555566] flex items-center gap-1"><Mail size={10}/>{u.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-[#555566]">Registrado</p>
              <p className="text-xs text-[#888899]">{new Date(u.created_at).toLocaleDateString('es-CO')}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${u.role === 'admin' ? 'bg-[#7c6aff]/20 text-[#7c6aff]' : 'bg-[#1a1a24] text-[#555566]'}`}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
