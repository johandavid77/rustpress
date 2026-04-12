import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Shield, Users, Check, Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react'

interface Role { id: string; name: string; description?: string }
interface Permission { id: string; resource: string; action: string }
interface User { id: string; username: string; email: string; role_id?: string }

const ROLE_COLORS: Record<string, string> = {
  admin:  'text-red-400 bg-red-500/10 border-red-500/20',
  editor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  author: 'text-green-400 bg-green-500/10 border-green-500/20',
  viewer: 'text-[#888899] bg-[#2a2a3a] border-[#3a3a4a]',
}

const RESOURCE_ICONS: Record<string, string> = {
  posts: '📝', media: '🖼️', users: '👥', plugins: '🧩', orders: '📦', products: '🛍️', settings: '⚙️',
}

export default function RolesAdmin() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      try {
        const [r, p, u]: any[] = await Promise.all([
          apiClient.get('/roles'),
          apiClient.get('/permissions'),
          apiClient.get('/users'),
        ])
        const rolesData = Array.isArray(r) ? r : r?.data ?? []
        const permsData = Array.isArray(p) ? p : p?.data ?? []
        const usersData = Array.isArray(u) ? u : u?.data ?? []
        setRoles(rolesData)
        setPermissions(permsData)
        setUsers(usersData)

        // Cargar permisos de cada rol
        const rp: Record<string, string[]> = {}
        for (const role of rolesData) {
          const res: any = await apiClient.get('/roles/' + role.id + '/permissions')
          const arr = Array.isArray(res) ? res : res?.data ?? []
          rp[role.id] = arr.map((p: Permission) => p.id)
        }
        setRolePerms(rp)
      } catch {} finally { setLoading(false) }
    }
    loadAll()
  }, [])

  const togglePerm = (roleId: string, permId: string) => {
    setRolePerms(prev => {
      const current = prev[roleId] ?? []
      return {
        ...prev,
        [roleId]: current.includes(permId) ? current.filter(p => p !== permId) : [...current, permId]
      }
    })
  }

  const savePerms = async (roleId: string) => {
    setSaving(roleId)
    try {
      await apiClient.put('/roles/' + roleId + '/permissions', { permission_ids: rolePerms[roleId] ?? [] })
    } catch {} finally { setSaving(null) }
  }

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      await apiClient.put('/users/' + userId, { role_id: roleId })
      setUsers(u => u.map(x => x.id === userId ? { ...x, role_id: roleId } : x))
    } catch {}
  }

  // Agrupar permisos por recurso
  const byResource = permissions.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = []
    acc[p.resource].push(p)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={20} className="animate-spin text-[#555566]" /></div>

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Shield size={24} className="text-[#7c6aff]" />Roles y Permisos
        </h1>
        <p className="text-[#888899] text-sm">Gestiona los roles del sistema y asignalos a usuarios</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[#0e0e1a] rounded-xl border border-[#2a2a3a] w-fit">
        {(['roles', 'users'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (activeTab === t ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white')}>
            {t === 'roles' ? 'Roles y permisos' : 'Usuarios y roles'}
          </button>
        ))}
      </div>

      {/* Tab Roles */}
      {activeTab === 'roles' && (
        <div className="flex flex-col gap-4">
          {roles.map(role => {
            const isOpen = expanded === role.id
            const permsForRole = rolePerms[role.id] ?? []
            const colorClass = ROLE_COLORS[role.name] ?? ROLE_COLORS.viewer

            return (
              <div key={role.id} className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0e0e1a] cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => setExpanded(isOpen ? null : role.id)}>
                  <Shield size={16} className={colorClass.split(' ')[0]} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white capitalize">{role.name}</span>
                      <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full border " + colorClass}>
                        {permsForRole.length} permisos
                      </span>
                    </div>
                    {role.description && <div className="text-xs text-[#555566]">{role.description}</div>}
                  </div>
                  <button disabled={saving === role.id} onClick={e => { e.stopPropagation(); savePerms(role.id) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c6aff]/15 border border-[#7c6aff]/30 text-[#7c6aff] text-xs font-semibold hover:bg-[#7c6aff]/25 disabled:opacity-50 transition-all">
                    {saving === role.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Guardar
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-[#555566]" /> : <ChevronDown size={16} className="text-[#555566]" />}
                </div>

                {isOpen && (
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {Object.entries(byResource).map(([resource, perms]) => (
                      <div key={resource} className="p-3 rounded-xl bg-[#0e0e1a] border border-[#1e1e2e]">
                        <div className="text-xs font-semibold text-[#888899] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>{RESOURCE_ICONS[resource] ?? '🔧'}</span>{resource}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {perms.map(perm => (
                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                              <div className={"w-4 h-4 rounded border flex items-center justify-center transition-all " +
                                (permsForRole.includes(perm.id) ? 'bg-[#7c6aff] border-[#7c6aff]' : 'border-[#3a3a4a] group-hover:border-[#7c6aff]/50')}
                                onClick={() => togglePerm(role.id, perm.id)}>
                                {permsForRole.includes(perm.id) && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-xs text-[#888899] group-hover:text-white transition-colors">{perm.action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tab Usuarios */}
      {activeTab === 'users' && (
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2a3a] bg-[#0e0e1a]">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">{users.length} usuarios</span>
          </div>
          <div className="divide-y divide-[#1e1e2e]">
            {users.map(user => {
              const userRole = roles.find(r => r.id === user.role_id)
              const colorClass = ROLE_COLORS[userRole?.name ?? ''] ?? ROLE_COLORS.viewer
              return (
                <div key={user.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-full bg-[#7c6aff]/20 border border-[#7c6aff]/30 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-[#7c6aff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{user.username}</div>
                    <div className="text-xs text-[#555566]">{user.email}</div>
                  </div>
                  <select value={user.role_id ?? ''} onChange={e => updateUserRole(user.id, e.target.value)}
                    className={"text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none transition-all bg-[#0e0e1a] " + colorClass}>
                    <option value="">Sin rol</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
