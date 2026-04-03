import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { CreditCard, Mail, ShoppingBag, Save, Eye, EyeOff } from 'lucide-react'

export default function EcommerceSettings() {
  const [tab, setTab] = useState<'general'|'payments'|'email'>('general')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [show, setShow]     = useState<Record<string,boolean>>({})

  const [general, setGeneral] = useState({
    shop_name: '', shop_currency: 'COP', shop_enabled: true,
    shop_email: '', shop_phone: '', shop_address: '',
  })
  const [payments, setPayments] = useState({
    stripe_enabled: false, stripe_key: '', stripe_secret: '', stripe_webhook: '',
    paypal_enabled: false, paypal_client_id: '', paypal_secret: '', paypal_sandbox: true,
  })
  const [email, setEmail] = useState({
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '',
    smtp_from: '', smtp_from_name: 'RustCMS',
    email_order_confirm: true, email_order_shipped: true, email_review_pending: false,
  })

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const res: any = await apiClient.get('/settings')
      if (res?.shop_name)       setGeneral(g => ({...g, ...res}))
      if (res?.stripe_key)      setPayments(p => ({...p, ...res}))
      if (res?.smtp_host)       setEmail(e => ({...e, ...res}))
    } catch(e) { console.error(e) }
  }

  const save = async () => {
    setSaving(true)
    try {
      const data = tab === 'general' ? general : tab === 'payments' ? payments : email
      await apiClient.put('/settings', data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  const Input = ({ label, value, onChange, type = 'text', secret = false }: any) => (
    <div>
      <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={secret && !show[label] ? 'password' : type}
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff] placeholder-[#444455]"
        />
        {secret && (
          <button onClick={() => setShow(s => ({...s, [label]: !s[label]}))}
            className="absolute right-3 top-3 text-[#555566] hover:text-white">
            {show[label] ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )

  const Toggle = ({ label, value, onChange, desc }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-[#1a1a24]">
      <div>
        <p className="text-sm font-bold">{label}</p>
        {desc && <p className="text-xs text-[#555566]">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
          <ShoppingBag size={28} className="text-[#7c6aff]" />Configuración Tienda
        </h1>
        <p className="text-[#888899] text-sm">Pasarelas de pago, email y opciones generales</p>
      </div>

      <div className="flex gap-2 mb-6">
        {([['general','🛒 General'],['payments','💳 Pasarelas'],['email','📧 Email']] as const).map(([t,l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${tab === t ? 'bg-[#7c6aff] text-white' : 'border border-[#2a2a3a] text-[#888899] hover:border-[#7c6aff]'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 flex flex-col gap-4">
        {tab === 'general' && <>
          <Input label="Nombre de la tienda" value={general.shop_name} onChange={(v:string) => setGeneral(g => ({...g, shop_name: v}))} />
          <Input label="Email de contacto" value={general.shop_email} onChange={(v:string) => setGeneral(g => ({...g, shop_email: v}))} />
          <Input label="Teléfono" value={general.shop_phone} onChange={(v:string) => setGeneral(g => ({...g, shop_phone: v}))} />
          <Input label="Dirección" value={general.shop_address} onChange={(v:string) => setGeneral(g => ({...g, shop_address: v}))} />
          <div>
            <label className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-1.5 block">Moneda</label>
            <select value={general.shop_currency} onChange={e => setGeneral(g => ({...g, shop_currency: e.target.value}))}
              className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl text-white text-sm outline-none focus:border-[#7c6aff]">
              <option value="COP">COP — Peso colombiano</option>
              <option value="USD">USD — Dólar americano</option>
              <option value="EUR">EUR — Euro</option>
              <option value="MXN">MXN — Peso mexicano</option>
            </select>
          </div>
          <Toggle label="Tienda activa" desc="Muestra la tienda pública" value={general.shop_enabled} onChange={(v:boolean) => setGeneral(g => ({...g, shop_enabled: v}))} />
        </>}

        {tab === 'payments' && <>
          <div className="border border-[#2a2a3a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-[#7c6aff]" />
              <p className="font-bold">Stripe</p>
              <Toggle label="" value={payments.stripe_enabled} onChange={(v:boolean) => setPayments(p => ({...p, stripe_enabled: v}))} desc="" />
            </div>
            <div className="flex flex-col gap-3">
              <Input label="Publishable Key" value={payments.stripe_key} onChange={(v:string) => setPayments(p => ({...p, stripe_key: v}))} secret />
              <Input label="Secret Key" value={payments.stripe_secret} onChange={(v:string) => setPayments(p => ({...p, stripe_secret: v}))} secret />
              <Input label="Webhook Secret" value={payments.stripe_webhook} onChange={(v:string) => setPayments(p => ({...p, stripe_webhook: v}))} secret />
              <p className="text-xs text-[#555566]">Webhook URL: <span className="font-mono text-[#7c6aff]">{window.location.origin}/api/v1/payments/stripe/webhook</span></p>
            </div>
          </div>

          <div className="border border-[#2a2a3a] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🅿️</span>
              <p className="font-bold">PayPal</p>
              <Toggle label="" value={payments.paypal_enabled} onChange={(v:boolean) => setPayments(p => ({...p, paypal_enabled: v}))} desc="" />
            </div>
            <div className="flex flex-col gap-3">
              <Input label="Client ID" value={payments.paypal_client_id} onChange={(v:string) => setPayments(p => ({...p, paypal_client_id: v}))} secret />
              <Input label="Client Secret" value={payments.paypal_secret} onChange={(v:string) => setPayments(p => ({...p, paypal_secret: v}))} secret />
              <Toggle label="Modo Sandbox (pruebas)" value={payments.paypal_sandbox} onChange={(v:boolean) => setPayments(p => ({...p, paypal_sandbox: v}))} desc="Desactiva para producción" />
            </div>
          </div>
        </>}

        {tab === 'email' && <>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SMTP Host" value={email.smtp_host} onChange={(v:string) => setEmail(e => ({...e, smtp_host: v}))} />
            <Input label="Puerto" value={email.smtp_port} onChange={(v:string) => setEmail(e => ({...e, smtp_port: v}))} />
            <Input label="Usuario" value={email.smtp_user} onChange={(v:string) => setEmail(e => ({...e, smtp_user: v}))} />
            <Input label="Contraseña" value={email.smtp_pass} onChange={(v:string) => setEmail(e => ({...e, smtp_pass: v}))} secret />
            <Input label="From Email" value={email.smtp_from} onChange={(v:string) => setEmail(e => ({...e, smtp_from: v}))} />
            <Input label="From Name" value={email.smtp_from_name} onChange={(v:string) => setEmail(e => ({...e, smtp_from_name: v}))} />
          </div>
          <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mt-2">Notificaciones automáticas</p>
          <Toggle label="Confirmar orden al cliente" value={email.email_order_confirm} onChange={(v:boolean) => setEmail(e => ({...e, email_order_confirm: v}))} desc="Email al comprar" />
          <Toggle label="Notificar envío" value={email.email_order_shipped} onChange={(v:boolean) => setEmail(e => ({...e, email_order_shipped: v}))} desc="Email cuando el pedido se envía" />
          <Toggle label="Alerta de reseña pendiente" value={email.email_review_pending} onChange={(v:boolean) => setEmail(e => ({...e, email_review_pending: v}))} desc="Email al admin cuando hay reseña nueva" />
        </>}

        <button onClick={save} disabled={saving}
          className="mt-2 flex items-center gap-2 px-6 py-3 bg-[#7c6aff] rounded-xl font-bold hover:bg-[#6b5be6] disabled:opacity-50 transition-all w-fit">
          <Save size={16} />{saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
