import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Cloud, Save, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

type Provider = 'local' | 's3' | 'r2' | 'cloudflare'

interface CDNConfig {
  provider: Provider
  s3_bucket: string
  s3_region: string
  s3_endpoint: string
  s3_access_key: string
  s3_secret_key: string
  s3_public_url: string
}

const PROVIDERS = [
  { id: 'local',      label: 'Local Storage',     icon: '💾', desc: 'Store files on server disk' },
  { id: 's3',         label: 'AWS S3',             icon: '🟠', desc: 'Amazon Simple Storage Service' },
  { id: 'r2',         label: 'Cloudflare R2',      icon: '🟡', desc: 'S3-compatible, zero egress fees' },
  { id: 'cloudflare', label: 'Cloudflare Images',  icon: '🌐', desc: 'Automatic image optimization' },
]

export default function CDNPlugin() {
  const [cfg, setCfg]       = useState<CDNConfig>({ provider: 'local', s3_bucket: '', s3_region: 'us-east-1', s3_endpoint: '', s3_access_key: '', s3_secret_key: '', s3_public_url: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)

  useEffect(() => {
    apiClient.get('/settings/cdn_config').then((r: any) => {
      const d = r?.data ?? r
      if (d?.value) {
        try { setCfg(JSON.parse(d.value)) } catch(_) {}
      }
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await apiClient.post('/settings', { key: 'cdn_config', value: JSON.stringify(cfg) })
      setMsg('✓ Saved — restart backend to apply')
    } catch(_) { setMsg('Error saving') }
    finally { setSaving(false) }
  }

  const testConnection = async () => {
    setTesting(true); setTestResult(null)
    try {
      await apiClient.post('/media/test-cdn', cfg)
      setTestResult('ok')
    } catch(_) { setTestResult('fail') }
    finally { setTesting(false) }
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff] font-mono"

  const needsS3 = cfg.provider !== 'local'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-black text-white mb-2 flex items-center gap-3">
        <Cloud size={20} className="text-[#7c6aff]" /> CDN & Storage
      </h1>
      <p className="text-sm text-[#555566] mb-6">Configure where media files are stored and served from</p>

      {/* Provider selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PROVIDERS.map(p => (
          <button key={p.id} onClick={() => setCfg(c => ({...c, provider: p.id as Provider}))}
            className={"p-4 rounded-2xl border text-left transition-all " + (
              cfg.provider === p.id
                ? 'border-[#7c6aff] bg-[#7c6aff]/10'
                : 'border-[#2a2a3a] bg-[#0e0e1a] hover:border-[#7c6aff]/30'
            )}>
            <span className="text-2xl block mb-1">{p.icon}</span>
            <p className="text-sm font-bold text-white">{p.label}</p>
            <p className="text-xs text-[#555566] mt-0.5">{p.desc}</p>
          </button>
        ))}
      </div>

      {needsS3 && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Bucket Name</label>
              <input value={cfg.s3_bucket} onChange={e => setCfg(c => ({...c, s3_bucket: e.target.value}))}
                className={inputCls} placeholder="my-rustpress-bucket" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Region</label>
              <input value={cfg.s3_region} onChange={e => setCfg(c => ({...c, s3_region: e.target.value}))}
                className={inputCls} placeholder={cfg.provider === 'r2' ? 'auto' : 'us-east-1'} />
            </div>
          </div>

          {(cfg.provider === 'r2' || cfg.provider === 'cloudflare') && (
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">
                Endpoint URL
                <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
                  className="ml-2 text-[#7c6aff] hover:underline inline-flex items-center gap-1">
                  Cloudflare Dashboard <ExternalLink size={10} />
                </a>
              </label>
              <input value={cfg.s3_endpoint} onChange={e => setCfg(c => ({...c, s3_endpoint: e.target.value}))}
                className={inputCls} placeholder="https://<account_id>.r2.cloudflarestorage.com" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Access Key ID</label>
              <input value={cfg.s3_access_key} onChange={e => setCfg(c => ({...c, s3_access_key: e.target.value}))}
                className={inputCls} placeholder="AKIAIOSFODNN7EXAMPLE" />
            </div>
            <div>
              <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Secret Access Key</label>
              <input type="password" value={cfg.s3_secret_key} onChange={e => setCfg(c => ({...c, s3_secret_key: e.target.value}))}
                className={inputCls} placeholder="••••••••••••••••••••" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Public URL (CDN)</label>
            <input value={cfg.s3_public_url} onChange={e => setCfg(c => ({...c, s3_public_url: e.target.value}))}
              className={inputCls} placeholder="https://cdn.tudominio.com" />
            <p className="text-xs text-[#444455] mt-1">Base URL used to serve uploaded files publicly</p>
          </div>
        </div>
      )}

      {cfg.provider === 'local' && (
        <div className="p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] mb-6">
          <p className="text-sm text-[#888899]">Files stored in <code className="text-[#7c6aff] bg-[#1a1a2e] px-1.5 py-0.5 rounded text-xs">./uploads/</code> on the server. No additional config needed.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="flex-1 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Save size={15} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {needsS3 && (
          <button onClick={testConnection} disabled={testing || !cfg.s3_bucket}
            className="px-4 py-3 rounded-xl border border-[#2a2a3a] text-sm font-semibold text-[#888899] hover:text-white transition-all disabled:opacity-50 flex items-center gap-2">
            {testing ? 'Testing...' : 'Test Connection'}
            {testResult === 'ok'   && <CheckCircle size={14} className="text-green-400" />}
            {testResult === 'fail' && <XCircle size={14} className="text-red-400" />}
          </button>
        )}
      </div>

      {msg && (
        <div className={"mt-4 px-4 py-3 rounded-xl text-sm " + (msg.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
          {msg}
        </div>
      )}
    </div>
  )
}
