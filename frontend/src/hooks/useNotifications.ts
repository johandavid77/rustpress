import { useEffect, useRef, useCallback, useState } from 'react'

export interface Notification {
  id: string
  type: 'order' | 'user' | 'product' | 'system'
  message: string
  timestamp: number
}

export function useNotifications() {
  const ws = useRef<WebSocket | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${proto}://${window.location.host}/ws/notifications`
    ws.current = new WebSocket(url)
    ws.current.onopen = () => setConnected(true)
    ws.current.onclose = () => { setConnected(false); setTimeout(connect, 3000) }
    ws.current.onmessage = (e) => {
      try {
        const notif: Notification = JSON.parse(e.data)
        setNotifications(prev => [notif, ...prev].slice(0, 50))
      } catch(_) {}
    }
  }, [])

  useEffect(() => { connect(); return () => { ws.current?.close() } }, [connect])
  const clear = useCallback(() => setNotifications([]), [])
  return { notifications, connected, clear }
}
