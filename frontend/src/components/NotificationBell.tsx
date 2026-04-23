import React, { useState } from 'react'
import { Bell, X, ShoppingBag, User, Package, Info } from 'lucide-react'
import { useNotifications, Notification } from '../hooks/useNotifications'

const ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  order:   { icon: ShoppingBag, color: '#06b6d4' },
  user:    { icon: User,        color: '#7c6aff' },
  product: { icon: Package,     color: '#fb923c' },
  system:  { icon: Info,        color: '#4ade80' },
}

export default function NotificationBell() {
  const { notifications, connected, clear } = useNotifications()
  const [open, setOpen] = useState(false)
  const unread = notifications.length

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-xl bg-[#111118] border border-[#2a2a3a] flex items-center justify-center hover:border-[#7c6aff]/50 transition-all">
        <Bell size={16} className={connected ? 'text-white' : 'text-[#555566]'} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#7c6aff] text-white text-[10px] font-black flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a]">
            <p className="text-sm font-bold text-white">Notifications</p>
            <div className="flex items-center gap-2">
              <span className={"w-2 h-2 rounded-full " + (connected ? 'bg-green-400' : 'bg-red-400')} />
              {unread > 0 && (
                <button onClick={clear} className="text-xs text-[#555566] hover:text-white transition-colors">
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)}><X size={14} className="text-[#555566]" /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-[#333344]" />
                <p className="text-xs text-[#555566]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n: Notification) => {
                const cfg = ICONS[n.type] ?? ICONS.system
                const Icon = cfg.icon
                return (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#111118] transition-colors border-b border-[#1a1a2e] last:border-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.color + '20' }}>
                      <Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white leading-snug">{n.message}</p>
                      <p className="text-[10px] text-[#555566] mt-0.5">
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
