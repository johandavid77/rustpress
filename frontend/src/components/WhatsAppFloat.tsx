import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { apiClient } from '../api/client'

export default function WhatsAppFloat() {
  const [cfg, setCfg] = useState<{phone:string,message:string,enabled:boolean,position:string}|null>(null)

  useEffect(() => {
    apiClient.get('/settings/whatsapp').then((r:any) => {
      const d = r?.data ?? r
      if (d?.value) {
        const parsed = JSON.parse(d.value)
        if (parsed.enabled && parsed.phone) setCfg(parsed)
      }
    }).catch(() => {})
  }, [])

  if (!cfg) return null

  const url = \`https://wa.me/\${cfg.phone.replace(/\D/g,'')}?text=\${encodeURIComponent(cfg.message)}\`

  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className={\`fixed bottom-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 hover:bg-green-400 text-white text-sm font-bold shadow-xl transition-all hover:scale-105 \${cfg.position === 'left' ? 'left-6' : 'right-6'}\`}>
      <MessageCircle size={20} />
      <span className="hidden sm:block">WhatsApp</span>
    </a>
  )
}
