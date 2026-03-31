import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { User, Save, Globe, Twitter, Github } from 'lucide-react'

export default function Profile() {
  const [bio, setBio]         = useState('')
  const [avatar, setAvatar]   = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [github, setGithub]   = useState('')
  const [isPublic, setPublic] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  useEffect(() => {
    apiClient.get('/users/me').then((res: any) => {
      setBio(res.bio ?? '')
      setAvatar(res.avatar ?? '')
      setWebsite(res.website ?? '')
      setTwitter(res.twitter ?? '')
      setGithub(res.github ?? '')
      setPublic(res.public ?? true)
    }).catch(console.error)
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await apiClient.put('/users/me/profile', { bio, avatar, website, twitter, github, public: isPublic })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <User size={28} className="text-[#7c6aff]" />Perfil de autor
        </h1>
        <p className="text-[#888899] text-sm">Tu perfil público como autor del blog</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Avatar */}
        <div>
          <label className="block text-xs font-mono text-[#555566] uppercase tracking-widest mb-2">Avatar URL</label>
          <div className="flex items-center gap-4">
            {avatar && <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-[#2a2a3a]" />}
            <input className="flex-1 px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="https://..." value={avatar} onChange={e => setAvatar(e.target.value)} />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-mono text-[#555566] uppercase tracking-widest mb-2">Bio</label>
          <textarea className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455] resize-none"
            rows={3} placeholder="Cuéntale algo a tus lectores..."
            value={bio} onChange={e => setBio(e.target.value)} />
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-[#555566] uppercase tracking-widest mb-2 flex items-center gap-1"><Globe size={11} />Web</label>
            <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#555566] uppercase tracking-widest mb-2 flex items-center gap-1"><Twitter size={11} />Twitter</label>
            <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="@usuario" value={twitter} onChange={e => setTwitter(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-mono text-[#555566] uppercase tracking-widest mb-2 flex items-center gap-1"><Github size={11} />GitHub</label>
            <input className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
              placeholder="usuario" value={github} onChange={e => setGithub(e.target.value)} />
          </div>
        </div>

        {/* Visibilidad */}
        <div className="flex items-center gap-3 p-4 bg-[#111118] border border-[#2a2a3a] rounded-xl">
          <input type="checkbox" checked={isPublic} onChange={e => setPublic(e.target.checked)}
            className="w-4 h-4 accent-[#7c6aff]" />
          <div>
            <p className="text-sm font-bold">Perfil público</p>
            <p className="text-xs text-[#888899]">Tu perfil y posts serán visibles en /autor/username</p>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="self-start flex items-center gap-2 px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] disabled:opacity-50 transition-all">
          <Save size={15} />{saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  )
}
