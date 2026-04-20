import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Bell, Save, Send, CheckCircle } from 'lucide-react'

interface AlertConfig {
  low_stock_threshold: number
  low_stock_email: boolean
  new_order_email: boolean
  new_comment_email: boolean
  alert_email: string
}

export default function AlertsPlugin() {
  const [cfg, setCfg]       = useState<AlertConfig>({ low_stock_threshold: 5, low_stock_email: true, new_order_email: true, new_comment_email: false, alert_email: '' })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [msg, setMsg]       = useState('')
  const [checkResult, setCheckResult] = useState<any>(null)

  useEffect(() => {
    apiClient.get('/alerts/config').then((r: any) => {
      const d = r?.data ?? r
      if (d && typeof d === 'object' && 'alert_email' in d) setCfg(d)
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await apiClient.post('/alerts/config', cfg)
      setMsg('✓ Saved')
    } catch(_) { setMsg('Error saving') }
    finally { setSaving(false) }
  }

  const testAlert = async () => {
    if (!cfg.alert_email) { setMsg('Set an email first'); return }
    setTesting(true); setMsg('')
    try {
      const r: any = await apiClient.post('/alerts/test', {})
      setMsg('✓ Test alert sent to ' + (r?.sent_to ?? cfg.alert_email))
    } catch(_) { setMsg('Error sending test') }
    finally { setTesting(false) }
  }

  const checkStock = async () => {
    setChecking(true); setCheckResult(null)
    try {
      const r: any = await apiClient.post('/alerts/check-stock', {})
      setCheckResult(r?.data ?? r)
    } catch(_) { setCheckResult({ error: 'Error checking stock' }) }
    finally { setChecking(false) }
  }

  const inputCls = "w-full bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555566] outline-none focus:border-[#7c6aff]"

  const Toggle = ({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-[#2a2a3a] bg-[#0e0e1a]">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-[#555566]">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={"w-11 h-6 rounded-full transition-colors relative shrink-0 " + (value ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]')}>
        <div className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-all " + (value ? 'left-6' : 'left-1')} />
      </button>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-black text-white mb-2 flex items-center gap-3">
        <Bell size={20} className="text-[#7c6aff]" /> Email Alerts
      </h1>
      <p className="text-sm text-[#555566] mb-6">Get notified about important events in your store</p>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">Alert Email</label>
          <input value={cfg.alert_email} onChange={e => setCfg(c => ({...c, alert_email: e.target.value}))}
            className={inputCls} placeholder="admin@tutienda.com" type="email" />
          <p className="text-xs text-[#444455] mt-1">All alerts will be sent to this address</p>
        </div>

        <Toggle value={cfg.new_order_email} onChange={v => setCfg(c => ({...c, new_order_email: v}))}
          label="New Order" desc="Email when a new order is placed" />

        <Toggle value={cfg.low_stock_email} onChange={v => setCfg(c => ({...c, low_stock_email: v}))}
          label="Low Stock" desc="Email when products run low" />

        {cfg.low_stock_email && (
          <div className="pl-4 border-l-2 border-[#7c6aff]/30">
            <label className="text-xs text-[#555566] uppercase tracking-wider block mb-1.5">
              Low Stock Threshold
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="50" value={cfg.low_stock_threshold}
                onChange={e => setCfg(c => ({...c, low_stock_threshold: parseInt(e.target.value)}))}
                className="flex-1 accent-[#7c6aff]" />
              <span className="text-sm font-bold text-white w-12 text-right">{cfg.low_stock_threshold} units</span>
            </div>
          </div>
        )}

        <Toggle value={cfg.new_comment_email} onChange={v => setCfg(c => ({...c, new_comment_email: v}))}
          label="New Comment" desc="Email when a comment needs moderation" />

        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={15} /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={testAlert} disabled={testing || !cfg.alert_email}
            className="px-4 py-3 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
            <Send size={13} /> {testing ? 'Sending...' : 'Test'}
          </button>
        </div>

        <button onClick={checkStock} disabled={checking}
          className="w-full py-2.5 rounded-xl border border-[#2a2a3a] text-sm text-[#888899] hover:text-white hover:border-[#7c6aff]/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          <CheckCircle size={14} /> {checking ? 'Checking...' : 'Check Low Stock Now'}
        </button>

        {checkResult && (
          <div className={"p-4 rounded-2xl border text-sm " + (checkResult.error ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400')}>
            {checkResult.error ? checkResult.error : checkResult.skipped ? 'Alerts disabled or no email set' : (
              <div>
                <p className="font-bold mb-2">Found {checkResult.alerts} low-stock products</p>
                {checkResult.products?.map((p: any, i: number) => (
                  <p key={i} className="text-xs">{p.name}: <span className={p.stock === 0 ? 'text-red-400' : 'text-yellow-400'}>{p.stock} units</span></p>
                ))}
              </div>
            )}
          </div>
        )}

        {msg && (
          <div className={"px-4 py-3 rounded-xl text-sm " + (msg.startsWith('✓') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}
