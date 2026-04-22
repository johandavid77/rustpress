import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { MessageCircle, Save, ExternalLink, Check } from 'lucide-react'

type Provider = 'tawk' | 'crisp' | 'none'

interface LivechatConfig {
  provider: Provider
  tawk_property_id: string
  tawk_widget_id: string
  crisp_website_id: string
  enabled: boolean
}

const PROVIDERS = [
  {
    id: 'none',
    label: 'Disabled',
    icon: '🚫',
    desc: 'No live chat',
    color: '#555566',
  },
  {
    id: 'tawk',
    label: 'Tawk.to',
    icon: '🦅',
    desc: 'Free live chat — tawk.to',
    color: '#03a84e',
    url: 'https://tawk.to',
    docs: 'Dashboard → Administration → Channels → Chat Widget → copy Property ID & Widget ID',
  },
  {
    id: 'crisp',
    label: 'Crisp',
    icon: '💬',
    desc: 'Modern customer chat',
    color: '#4f46e5',
    url: 'https://crisp.chat',
    docs: 'Settings → Website Settings → copy Website ID',
  },
]

export default function LivechatPlugin() {
  const [cfg, setCfg]       = useState<LivechatConfig>({
    provider: 'none', tawk_property_id: '', tawk_widget_id: '',
    crisp_website_id: '', enabled: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    apiClient.get('/settings/livechat_config').then((r: any) => {
      const d = r?.data ?? r
      if (d?.value) {
        try { setCfg(JSON.parse(d.value)) } catch(_) {}
      }
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      await apiClient.post('/settings', { key: 'livechat_config', value: JSON.stringify(cfg) })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Inject/remove script dynamically for preview
      const existing = document.getElementById('rustpress-livechat')
      if (existing) existing.remove()

      if (cfg.enabled && cfg.provider !== 'none') {
        const script = document.createElement('script')
        script.id = 'rustpress-livechat'
        if (cfg.provider === 'tawk' && cfg.tawk_property_id && cfg.tawk_widget_id) {
          script.innerHTML = `
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;s1.src='https://embed.tawk.to/${cfg.tawk_property_id}/${cfg.tawk_widget_id}';
            s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();`
        } else if (cfg.provider === 'crisp' && cfg.crisp_website_id) {
          script.innerHTML = `
            window.$crisp=[];window.CRISP_WEBSITE_ID="${cfg.crisp_website_id}";
            (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";
            s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`
        }
        document.head.appendChild(script)
      }
    } catch(_) { } finally { setSaving(false) }
  }

  const selected = PROVIDERS.find(p => p.id === cfg.provider)
  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] font-mono"

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-black text-white mb-2 flex items-center gap-3">
        <MessageCircle size={20} className="text-[#7c6aff]" /> Live Chat
      </h1>
      <p className="text-sm text-[#555566] mb-6">Add a live chat widget to your public site</p>

      {/* Provider selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PROVIDERS.map(p => (
          <button key={p.id} onClick={() => setCfg(c => ({...c, provider: p.id as Provider}))}
            className={"p-4 rounded-2xl border text-left transition-all " + (
              cfg.provider === p.id
                ? 'border-[#7c6aff] bg-[#7c6aff]/10'
                : 'border-[#2a2a3a] bg-[#0e0e1a] hover:border-[#7c6aff]/30'
            )}>
            <span className="text-2xl block mb-1">{p.icon}</span>
            <p className="text-xs font-bold text-white">{p.label}</p>
            <p className="text-[10px] text-[#555566] mt-0.5">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Config fields */}
      {cfg.provider === 'tawk' && (
        <div className="space-y-4 mb-6">
          <div className="p-3 rounded-xl bg-[#0e0e1a] border border-[#2a2a3a] text-xs text-[#888899]">
            {selected?.docs}
            <a href={selected?.url} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-[#7c6aff] inline-flex items-center gap-1 hover:underline">
              Open Tawk.to <ExternalLink size={10} />
            </a>
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Property ID</label>
            <input value={cfg.tawk_property_id}
              onChange={e => setCfg(c => ({...c, tawk_property_id: e.target.value}))}
              className={inputCls} placeholder="5f1234abc56789..." />
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Widget ID</label>
            <input value={cfg.tawk_widget_id}
              onChange={e => setCfg(c => ({...c, tawk_widget_id: e.target.value}))}
              className={inputCls} placeholder="default" />
          </div>
        </div>
      )}

      {cfg.provider === 'crisp' && (
        <div className="space-y-4 mb-6">
          <div className="p-3 rounded-xl bg-[#0e0e1a] border border-[#2a2a3a] text-xs text-[#888899]">
            {selected?.docs}
            <a href={selected?.url} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-[#7c6aff] inline-flex items-center gap-1 hover:underline">
              Open Crisp <ExternalLink size={10} />
            </a>
          </div>
          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Website ID</label>
            <input value={cfg.crisp_website_id}
              onChange={e => setCfg(c => ({...c, crisp_website_id: e.target.value}))}
              className={inputCls} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>
        </div>
      )}

      {/* Enable toggle */}
      {cfg.provider !== 'none' && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a] mb-6">
          <div>
            <p className="text-sm font-semibold text-white">Enable on public site</p>
            <p className="text-xs text-[#555566]">Show chat widget to visitors</p>
          </div>
          <button onClick={() => setCfg(c => ({...c, enabled: !c.enabled}))}
            className={"w-11 h-6 rounded-full transition-colors relative " + (cfg.enabled ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]')}>
            <div className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-all " + (cfg.enabled ? 'left-6' : 'left-1')} />
          </button>
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        style={{ backgroundColor: saved ? '#16a34a' : '#7c6aff', color: 'white' }}>
        {saved ? <><Check size={15} /> Saved!</> : saving ? 'Saving...' : <><Save size={15} /> Save Configuration</>}
      </button>
    </div>
  )
}
