import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiClient } from '../../api/client'
import { User, Lock, Camera, Save, Eye, EyeOff } from 'lucide-react'

export default function Profile() {
  const { user, setAuth } = useAuthStore()
  const [tab, setTab] = useState<'info' | 'password'>('info')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState('')
  const fileRef           = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    username: '', bio: '', website: '', twitter: '', github: '', avatar: ''
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    if (user) setForm({
      username: (user as any).username ?? '',
      bio:      (user as any).bio      ?? '',
      website:  (user as any).website  ?? '',
      twitter:  (user as any).twitter  ?? '',
      github:   (user as any).github   ?? '',
      avatar:   (user as any).avatar   ?? '',
    })
  }, [user])

  const saveInfo = async () => {
    setSaving(true); setMsg('')
    try {
      const res: any = await apiClient.put('/users/' + (user as any).id, form)
      const updated = res?.data ?? res
      setAuth(updated, localStorage.getItem('access_token') ?? '')
      setMsg('✓ Perfil actualizado')
    } catch(e: any) {
      setMsg('Error: ' + (e?.message ?? 'algo falló'))
    } finally { setSaving(false) }
  }

  const savePassword = async () => {
    if (pwd.next !== pwd.confirm) { setMsg('Las contraseñas no coinciden'); return }
    if (pwd.next.length < 8) { setMsg('Mínimo 8 caracteres'); return }
    setSaving(true); setMsg('')
    try {
      await apiClient.put('/users/' + (user as any).id + '/password', {
        current_password: pwd.current,
        new_password: pwd.next,
      })
      setMsg('✓ Contraseña actualizada')
      setPwd({ current: '', next: '', confirm: '' })
    } catch(e: any) {
      setMsg('Error: ' + (e?.message ?? 'contraseña incorrecta'))
    } finally { setSaving(false) }
  }

  const uploadAvatar = async (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    try {
      const res: any = await apiClient.post('/media/upload', fd)
      const url = res?.data?.url ?? res?.url ?? ''
      if (url) setForm(f => ({ ...f, avatar: url }))
    } catch(_) {}
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] transition-colors"

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
        <User size={22} className="text-[#7c6aff]" /> Mi perfil
      </h1>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-[#1a1a2e] border-2 border-[#2a2a3a] overflow-hidden flex items-center justify-center">
            {form.avatar
              ? <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <User size={28} className="text-[#555566]" />
            }
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#7c6aff] rounded-lg flex items-center justify-center hover:bg-[#6a58e8] transition-colors">
            <Camera size={13} className="text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
        </div>
        <div>
          <p className="text-white font-bold">{(user as any)?.username}</p>
          <p className="text-[#888899] text-sm">{(user as any)?.email}</p>
          <p className="text-[#555566] text-xs mt-0.5 capitalize">{(user as any)?.role_name ?? 'admin'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#0e0e1a] rounded-xl p-1 border border-[#2a2a3a]">
        {(['info', 'password'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setMsg('') }}
            className={"flex-1 py-2 rounded-lg text-sm font-semibold transition-all " + (
              tab === t ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white'
            )}>
            {t === 'info' ? 'Información' : 'Contraseña'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Nombre de usuario</label>
            <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))}
              className={inputCls} placeholder="tu_usuario" />
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))}
              className={inputCls + " resize-none h-24"} placeholder="Cuéntanos algo sobre ti..." />
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Sitio web</label>
            <input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))}
              className={inputCls} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Twitter / X</label>
              <input value={form.twitter} onChange={e => setForm(f => ({...f, twitter: e.target.value}))}
                className={inputCls} placeholder="@usuario" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">GitHub</label>
              <input value={form.github} onChange={e => setForm(f => ({...f, github: e.target.value}))}
                className={inputCls} placeholder="usuario" />
            </div>
          </div>
          <button onClick={saveInfo} disabled={saving}
            className="w-full py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={15} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {tab === 'password' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Contraseña actual</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={pwd.current}
                onChange={e => setPwd(p => ({...p, current: e.target.value}))}
                className={inputCls + " pr-10"} placeholder="••••••••" />
              <button onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555566] hover:text-white">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Nueva contraseña</label>
            <input type={showPwd ? 'text' : 'password'} value={pwd.next}
              onChange={e => setPwd(p => ({...p, next: e.target.value}))}
              className={inputCls} placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Confirmar nueva contraseña</label>
            <input type={showPwd ? 'text' : 'password'} value={pwd.confirm}
              onChange={e => setPwd(p => ({...p, confirm: e.target.value}))}
              className={inputCls} placeholder="Repetir contraseña" />
          </div>
          <button onClick={savePassword} disabled={saving}
            className="w-full py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <Lock size={15} /> {saving ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </div>
      )}

      {msg && (
        <div className={"mt-4 px-4 py-3 rounded-xl text-sm font-medium " + (
          msg.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
        )}>
          {msg}
        </div>
      )}
    </div>
  )
}
