import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Circle } from 'lucide-react'

interface ChatMessage {
  type: string
  from: string
  message: string
  timestamp: number
}

export default function AdminChat() {
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input,    setInput]      = useState('')
  const [connected, setConnected] = useState(false)
  const [username] = useState(() => localStorage.getItem('username') ?? 'Admin')
  const ws  = useRef<WebSocket | null>(null)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${proto}://${window.location.host}/ws/chat?user=${encodeURIComponent(username)}`
    ws.current = new WebSocket(url)
    ws.current.onopen  = () => setConnected(true)
    ws.current.onclose = () => setConnected(false)
    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'chat') setMessages(prev => [...prev, msg])
      } catch(_) {}
    }
    return () => ws.current?.close()
  }, [username])

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = () => {
    if (!input.trim() || !ws.current || ws.current.readyState !== 1) return
    ws.current.send(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare size={20} className="text-[#7c6aff]" />
        <h1 className="text-xl font-black text-white">Admin Chat</h1>
        <div className="flex items-center gap-1.5 ml-auto">
          <Circle size={8} className={connected ? 'text-green-400 fill-green-400' : 'text-red-400 fill-red-400'} />
          <span className="text-xs text-[#555566]">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-[#555566]">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.from === username
            return (
              <div key={i} className={"flex " + (isMe ? 'justify-end' : 'justify-start')}>
                <div className={"max-w-[75%] " + (isMe ? 'items-end' : 'items-start') + " flex flex-col gap-1"}>
                  {!isMe && <span className="text-[10px] text-[#7c6aff] font-bold px-1">{m.from}</span>}
                  <div className={"px-4 py-2.5 rounded-2xl text-sm " + (
                    isMe ? 'bg-[#7c6aff] text-white rounded-br-sm' : 'bg-[#1a1a2e] text-white rounded-bl-sm'
                  )}>
                    {m.message}
                  </div>
                  <span className="text-[10px] text-[#444455] px-1">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={end} />
      </div>

      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 bg-[#111118] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444455] outline-none focus:border-[#7c6aff] transition-colors"
        />
        <button onClick={send} disabled={!input.trim() || !connected}
          className="w-12 h-12 rounded-xl bg-[#7c6aff] hover:bg-[#6b5be6] flex items-center justify-center disabled:opacity-40 transition-all">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}
