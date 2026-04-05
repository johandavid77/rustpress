import { useState, useEffect } from 'react'
import { usersApi } from "../../api/users";
import type { User } from '../../types/auth'
import { Check, X, Trash2, UserCheck, UserX, Clock } from 'lucide-react'

type Tab = 'pending' | 'active'

export default function UsersAdmin() {
  const [users, setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<Tab>('pending')
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await usersApi.getAll()
      setUsers(Array.isArray(res) ? res : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleApprove = async (id: string) => {
    setActing(id)
    try { await usersApi.approve(id); await loadUsers() }
    catch (e) { console.error(e) }
    finally { setActing(null) }
  }

  const handleDeactivate = async (id: string) => {
    setActing(id)
    try { await usersApi.deactivate(id); await loadUsers() }
    catch (e) { console.error(e) }
    finally { setActing(null) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return
    setActing(id)
    try { await usersApi.delete(id); await loadUsers() }
    catch (e) { console.error(e) }
    finally { setActing(null) }
  }

  const pending = users.filter(u => !u.is_active)
  const active  = users.filter(u => u.is_active)
  const shown   = tab === 'pending' ? pending : active

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Usuarios</h1>
          <p className="text-[#888899] text-sm">Gestiona el acceso al panel de administración</p>
        </div>
        <div className="flex items-center gap-2">
          {pending.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-mono">
              <Clock size={12} /> {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#111118] border border-[#2a2a3a] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'pending'
              ? 'bg-[#7c6aff] text-white'
              : 'text-[#888899] hover:text-white'
          }`}
        >
          <Clock size={14} />
          Pendientes
          {pending.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
              tab === 'pending' ? 'bg-white/20' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('active')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            tab === 'active'
              ? 'bg-[#7c6aff] text-white'
              : 'text-[#888899] hover:text-white'
          }`}
        >
          <UserCheck size={14} />
          Activos
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
            tab === 'active' ? 'bg-white/20' : 'bg-[#2a2a3a] text-[#888899]'
          }`}>
            {active.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {loading && <p className="text-[#888899] font-mono text-sm">Cargando usuarios...</p>}

      {!loading && shown.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 opacity-30">
          <span className="text-6xl">{tab === 'pending' ? '✅' : '👥'}</span>
          <p className="font-bold">
            {tab === 'pending' ? 'No hay usuarios pendientes' : 'No hay usuarios activos'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {shown.map(user => (
          <div
            key={user.id}
            className={`bg-[#111118] border rounded-xl p-4 flex items-center gap-4 transition-all ${
              acting === user.id ? 'opacity-50' : 'hover:border-[#3a3a4a]'
            } ${!user.is_active ? 'border-yellow-500/20' : 'border-[#2a2a3a]'}`}
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#7c6aff] flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.username?.[0]?.toUpperCase() ?? 'U'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm">{user.username}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  user.is_active
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {user.is_active ? 'activo' : 'pendiente'}
                </span>
              </div>
              <p className="text-xs text-[#888899] font-mono truncate">{user.email}</p>
              {user.created_at && (
                <p className="text-xs text-[#555566] font-mono mt-0.5">
                  Registrado: {new Date(user.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!user.is_active ? (
                <button
                  onClick={() => handleApprove(user.id)}
                  disabled={acting === user.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-all"
                  title="Aprobar usuario"
                >
                  <Check size={13} /> Aprobar
                </button>
              ) : (
                <button
                  onClick={() => handleDeactivate(user.id)}
                  disabled={acting === user.id}
                  className="p-2 text-[#888899] hover:text-yellow-400 rounded-lg hover:bg-[#1a1a24] transition-all"
                  title="Desactivar usuario"
                >
                  <UserX size={15} />
                </button>
              )}
              <button
                onClick={() => handleDelete(user.id)}
                disabled={acting === user.id}
                className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all"
                title="Eliminar usuario"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
