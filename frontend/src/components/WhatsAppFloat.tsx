import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { apiClient } from '../api/client'

interface WACfg { phone: string; message: string; enabled: boolean; position: string }

export default function WhatsAppFloat() {
  const [cfg, setCfg] = useState<WACfg | null>(null)

  useEffect(() => {
    apiClient.get('/settings/whatsapp').then((r: any) => {
      const d = r?.data ?? r
      if (d?.value) {
        const parsed: WACfg = JSON.parse(d.value)
        if (parsed.enabled && parsed.phone) setCfg(parsed)
      }
    }).catch(() => {})
  }, [])

  if (!cfg) return null

  const phone = cfg.phone.replace(/\D/g, '')
  const url   = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(cfg.message)
  const side  = cfg.position === 'left' ? 'left-6' : 'right-6'

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={'fixed bottom-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-400 text-white text-sm font-bold shadow-xl transition-all hover:scale-105 ' + side}>
      <MessageCircle size={20} />
      <span className="hidden sm:block">WhatsApp</span>
    </a>
  )
}
