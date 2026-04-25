import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LayoutDashboard, FileText, Package, ShoppingBag,
  Users, BarChart2, MessageSquare, Settings, LogOut, X
} from 'lucide-react'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  action: () => void
  keywords?: string
}

export default function CommandPalette() {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [idx, setIdx]     = useState(0)
  const inputRef          = useRef<HTMLInputElement>(null)
  const navigate          = useNavigate()

  const go = useCallback((path: string) => {
    navigate(path); setOpen(false); setQuery('')
  }, [navigate])

  const commands: Command[] = [
    { id: 'dashboard',  label: 'Dashboard',        icon: LayoutDashboard, action: () => go('/admin') },
    { id: 'posts',      label: 'Posts',             icon: FileText,        action: () => go('/admin/posts') },
    { id: 'new-post',   label: 'Nuevo Post',        icon: FileText,        action: () => go('/admin/posts/new'), keywords: 'crear escribir' },
    { id: 'products',   label: 'Productos',         icon: Package,         action: () => go('/admin/products') },
    { id: 'orders',     label: 'Órdenes',           icon: ShoppingBag,     action: () => go('/admin/orders') },
    { id: 'users',      label: 'Usuarios',          icon: Users,           action: () => go('/admin/users') },
    { id: 'analytics',  label: 'Analytics',         icon: BarChart2,       action: () => go('/admin/analytics') },
    { id: 'chat',       label: 'Chat Admins',       icon: MessageSquare,   action: () => go('/admin/chat') },
    { id: 'settings',   label: 'Configuración',     icon: Settings,        action: () => go('/admin/settings'), keywords: 'config ajustes' },
    { id: 'logout',     label: 'Cerrar sesión',     icon: LogOut,          action: () => { localStorage.clear(); go('/login') }, keywords: 'salir exit' },
  ]

  const filtered = query.trim()
    ? commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.keywords?.toLowerCase().includes(query.toLowerCase())
      )
    : commands

  useEffect(() => { setIdx(0) }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setOpen(o => !o); setQuery('')
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[idx]) { filtered[idx].action() }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111118] border border-[#2a2a3a] text-xs text-[#555566] hover:border-[#7c6aff]/50 transition-all">
      <Search size={12} />
      <span>Buscar...</span>
      <kbd className="ml-1 px-1 py-0.5 rounded bg-[#1a1a2e] text-[10px] font-mono">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3a]">
          <Search size={16} className="text-[#555566] shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey} placeholder="Buscar comandos..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#444455] outline-none" />
          <button onClick={() => setOpen(false)}><X size={14} className="text-[#555566]" /></button>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-[#444455] py-6">Sin resultados</p>
          ) : filtered.map((cmd, i) => {
            const Icon = cmd.icon
            return (
              <button key={cmd.id} onClick={cmd.action}
                onMouseEnter={() => setIdx(i)}
                className={"w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left " +
                  (i === idx ? 'bg-[#7c6aff]/10' : 'hover:bg-[#111118]')}>
                <div className={"w-8 h-8 rounded-xl flex items-center justify-center shrink-0 " +
                  (i === idx ? 'bg-[#7c6aff]/20' : 'bg-[#1a1a2e]')}>
                  <Icon size={14} className={i === idx ? 'text-[#7c6aff]' : 'text-[#555566]'} />
                </div>
                <div>
                  <p className={"text-sm font-medium " + (i === idx ? 'text-white' : 'text-[#888899]')}>{cmd.label}</p>
                  {cmd.description && <p className="text-xs text-[#555566]">{cmd.description}</p>}
                </div>
                {i === idx && <kbd className="ml-auto text-[10px] text-[#555566] font-mono">↵</kbd>}
              </button>
            )
          })}
        </div>
        <div className="px-4 py-2 border-t border-[#1a1a2e] flex items-center gap-3 text-[10px] text-[#444455]">
          <span>↑↓ navegar</span><span>↵ abrir</span><span>Esc cerrar</span>
        </div>
      </div>
    </div>
  )
}
