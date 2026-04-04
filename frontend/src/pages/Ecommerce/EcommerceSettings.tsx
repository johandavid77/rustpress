import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { Save, Eye, EyeOff } from 'lucide-react'

export default function EcommerceSettings() {
  const [tab, setTab]     = useState<'general'|'payments'|'email'>('general')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [show, setShow]     = useState<Record<string,boolean>>({})
  const [general, setGeneral] = useState({ shop_name:'', shop_currency:'COP', shop_email:'', shop_phone:'', shop_address:'', shop_enabled:true })
  const [payments, setPayments] = useState({ stripe_enabled:false, stripe_key:'', stripe_secret:'', stripe_webhook:'', paypal_enabled:false, paypal_client_id:'', paypal_secret:'', paypal_sandbox:true })
  const [email, setEmail] = useState({ smtp_host:'', smtp_port:'587', smtp_user:'', smtp_pass:'', smtp_from:'', smtp_from_name:'RustCMS', email_order_confirm:true, email_order_shipped:true })

  useEffect(() => {
    apiClient.get('/settings').then((r: any) => {
      if (r?.shop_name) setGeneral(g => ({...g, ...r}))
      if (r?.smtp_host) setEmail(e => ({...e, ...r}))
    }).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const data = tab === 'general' ? general : tab === 'payments' ? payments : email
      await apiClient.put('/settings', data)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const F = ({ label, value, onChange, type='text', secret=false }: any) => (
    <div>
      <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">{label}</label>
      <div className="relative">
        <input type={secret && !show[label] ? 'password' : type} value={value||''} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]" />
        {secret && <button onClick={() => setShow(s => ({...s, [label]: !s[label]}))} className="absolute right-3 top-3 text-[#555566]">
          {show[label] ? <EyeOff size={14}/> : <Eye size={14}/>}
        </button>}
      </div>
    </div>
  )

  const T = ({ label, value, onChange, desc='' }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-[#1a1a24]">
      <div><p className="text-sm font-bold">{label}</p>{desc && <p className="text-xs text-[#555566]">{desc}</p>}</div>
      <button onClick={() => onChange(!value)} className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-black mb-6">Ajustes de Tienda</h1>
      <div className="flex gap-2 mb-6">
        {(['general','payments','email'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-mono transition-all ${tab===t ? 'bg-[#7c6aff] text-white' : 'border border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'}`}>
            {t === 'general' ? '🛒 General' : t === 'payments' ? '💳 Pasarelas' : '📧 Email'}
          </button>
        ))}
      </div>
      <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 flex flex-col gap-4">
        {tab === 'general' && <>
          <F label="Nombre de la tienda" value={general.shop_name} onChange={(v:string) => setGeneral(g => ({...g, shop_name:v}))} />
          <F label="Email de contacto" value={general.shop_email} onChange={(v:string) => setGeneral(g => ({...g, shop_email:v}))} />
          <F label="Teléfono" value={general.shop_phone} onChange={(v:string) => setGeneral(g => ({...g, shop_phone:v}))} />
          <F label="Dirección" value={general.shop_address} onChange={(v:string) => setGeneral(g => ({...g, shop_address:v}))} />
          <div>
            <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1 block">Moneda</label>
            <select value={general.shop_currency} onChange={e => setGeneral(g => ({...g, shop_currency:e.target.value}))}
              className="w-full px-3 py-2.5 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]">
              <option value="COP">COP — Peso colombiano</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <T label="Tienda activa" value={general.shop_enabled} onChange={(v:boolean) => setGeneral(g => ({...g, shop_enabled:v}))} desc="Muestra la tienda pública" />
        </>}
        {tab === 'payments' && <>
          <div className="border border-[#2a2a3a] rounded-xl p-4">
            <p className="font-bold mb-3 flex items-center gap-2">💳 Stripe</p>
            <div className="flex flex-col gap-3">
              <F label="Publishable Key" value={payments.stripe_key} onChange={(v:string) => setPayments(p => ({...p, stripe_key:v}))} secret />
              <F label="Secret Key" value={payments.stripe_secret} onChange={(v:string) => setPayments(p => ({...p, stripe_secret:v}))} secret />
              <F label="Webhook Secret" value={payments.stripe_webhook} onChange={(v:string) => setPayments(p => ({...p, stripe_webhook:v}))} secret />
              <p className="text-xs text-[#555566]">Webhook URL: <span className="font-mono text-[#7c6aff]">{window.location.origin}/api/v1/payments/stripe/webhook</span></p>
            </div>
          </div>
          <div className="border border-[#2a2a3a] rounded-xl p-4">
            <p className="font-bold mb-3">🅿️ PayPal</p>
            <div className="flex flex-col gap-3">
              <F label="Client ID" value={payments.paypal_client_id} onChange={(v:string) => setPayments(p => ({...p, paypal_client_id:v}))} secret />
              <F label="Client Secret" value={payments.paypal_secret} onChange={(v:string) => setPayments(p => ({...p, paypal_secret:v}))} secret />
              <T label="Modo Sandbox" value={payments.paypal_sandbox} onChange={(v:boolean) => setPayments(p => ({...p, paypal_sandbox:v}))} desc="Desactiva para producción" />
            </div>
          </div>
        </>}
        {tab === 'email' && <>
          <div className="grid grid-cols-2 gap-3">
            <F label="SMTP Host" value={email.smtp_host} onChange={(v:string) => setEmail(e => ({...e, smtp_host:v}))} />
            <F label="Puerto" value={email.smtp_port} onChange={(v:string) => setEmail(e => ({...e, smtp_port:v}))} />
            <F label="Usuario" value={email.smtp_user} onChange={(v:string) => setEmail(e => ({...e, smtp_user:v}))} />
            <F label="Contraseña" value={email.smtp_pass} onChange={(v:string) => setEmail(e => ({...e, smtp_pass:v}))} secret />
            <F label="From Email" value={email.smtp_from} onChange={(v:string) => setEmail(e => ({...e, smtp_from:v}))} />
            <F label="From Name" value={email.smtp_from_name} onChange={(v:string) => setEmail(e => ({...e, smtp_from_name:v}))} />
          </div>
          <T label="Email de confirmación" value={email.email_order_confirm} onChange={(v:boolean) => setEmail(e => ({...e, email_order_confirm:v}))} desc="Al comprar" />
          <T label="Email de envío" value={email.email_order_shipped} onChange={(v:boolean) => setEmail(e => ({...e, email_order_shipped:v}))} desc="Cuando se envía el pedido" />
        </>}
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#7c6aff] rounded-xl font-bold text-sm hover:bg-[#6b5be6] disabled:opacity-50 w-fit">
          <Save size={14}/>{saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
