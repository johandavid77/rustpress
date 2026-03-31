import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Shield, Check } from 'lucide-react'

interface Role { id: string; name: string; description: string | null }
interface Permission { id: string; resource: string; action: string }

export default function RolesAdmin() {
  const [roles, setRoles]             = useState<Role[]>([])
  const [perms, setPerms]             = useState<Permission[]>([])
  const [selected, setSelected]       = useState<string | null>(null)
  const [rolePerms, setRolePerms]     = useState<Set<string>>(new Set())
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  useEffect(() => {
    Promise.all([
      apiClient.get('/roles'),
      apiClient.get('/permissions'),
    ]).then(([r, p]: any) => {
      setRoles(Array.isArray(r) ? r : [])
      setPerms(Array.isArray(p) ? p : [])
    })
  }, [])

  const selectRole = async (id: string) => {
    setSelected(id)
    const res: any = await apiClient.get(`/roles/${id}/permissions`)
    setRolePerms(new Set((Array.isArray(res) ? res : []).map((p: Permission) => p.id)))
  }

  const togglePerm = (id: string) => {
    setRolePerms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await apiClient.put(`/roles/${selected}/permissions`, {
        permission_ids: Array.from(rolePerms)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  // Agrupar permisos por recurso
  const grouped = perms.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = []
    acc[p.resource].push(p)
    return acc
  }, {} as Record<string, Permission[]>)

  const roleColors: Record<string, string> = {
    admin:  'border-red-500/30 text-red-400 bg-red-500/5',
    editor: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    author: 'border-green-500/30 text-green-400 bg-green-500/5',
    viewer: 'border-gray-500/30 text-gray-400 bg-gray-500/5',
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <Shield size={28} className="text-[#7c6aff]" />Roles & Permisos
        </h1>
        <p className="text-[#888899] text-sm">Gestiona los permisos de cada rol del sistema</p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-6">
        {roles.map(r => (
          <button key={r.id} onClick={() => selectRole(r.id)}
            className={`p-3 rounded-xl border text-sm font-bold transition-all ${
              selected === r.id
                ? 'border-[#7c6aff] bg-[#7c6aff]/10 text-white'
                : roleColors[r.name] || 'border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'
            }`}>
            {r.name}
            <p className="text-xs font-normal opacity-60 mt-0.5 truncate">{r.description}</p>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="flex flex-col gap-4 mb-6">
            {Object.entries(grouped).map(([resource, ps]) => (
              <div key={resource} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4">
                <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-3">{resource}</p>
                <div className="flex flex-wrap gap-2">
                  {ps.map(p => (
                    <button key={p.id} onClick={() => togglePerm(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        rolePerms.has(p.id)
                          ? 'bg-[#7c6aff]/10 border-[#7c6aff] text-[#7c6aff]'
                          : 'border-[#2a2a3a] text-[#555566] hover:border-[#3a3a4a]'
                      }`}>
                      {rolePerms.has(p.id) && <Check size={10} />}
                      {p.action}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] disabled:opacity-50 transition-all">
            <Shield size={15} />{saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar permisos'}
          </button>
        </>
      )}

      {!selected && (
        <div className="flex flex-col items-center gap-3 py-16 opacity-30">
          <Shield size={36} /><p className="font-bold text-sm">Selecciona un rol para editar sus permisos</p>
        </div>
      )}
    </div>
  )
}
