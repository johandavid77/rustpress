import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Order {
  id: string
  status: string
  subtotal: number
  discount: number
  total: number
  shipping_addr: string
  notes?: string
  created_at: string
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  pending:    { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', icon: Clock,         label: 'Pending' },
  processing: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',       icon: Package,       label: 'Processing' },
  completed:  { color: 'text-green-400 bg-green-400/10 border-green-400/20',    icon: CheckCircle,   label: 'Completed' },
  cancelled:  { color: 'text-red-400 bg-red-400/10 border-red-400/20',          icon: XCircle,       label: 'Cancelled' },
}

export default function MyOrders() {
  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get('/orders/my')
      .then((r: any) => setOrders(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
          <ShoppingBag size={22} className="text-[#7c6aff]" /> My Orders
        </h1>
        <p className="text-sm text-[#555566] mb-8">Your complete order history</p>

        {orders.length === 0 ? (
          <div className="py-20 text-center border border-[#2a2a3a] rounded-2xl">
            <ShoppingBag size={40} className="mx-auto mb-3 text-[#333344]" />
            <p className="text-[#555566]">No orders yet</p>
            <a href="/shop" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[#7c6aff] text-white text-sm font-bold">
              Browse Shop
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const sc = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
              const Icon = sc.icon
              const isOpen = expanded === order.id

              return (
                <div key={order.id} className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-[#111118] transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center shrink-0">
                        <Package size={18} className="text-[#7c6aff]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white font-mono">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-[#555566]">
                          {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${sc.color}`}>
                        <Icon size={11} /> {sc.label}
                      </span>
                      <span className="text-sm font-black text-white">${order.total?.toFixed(2)}</span>
                      {isOpen ? <ChevronUp size={16} className="text-[#555566]" /> : <ChevronDown size={16} className="text-[#555566]" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-[#1a1a2e] pt-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-[#1a1a2e]">
                          <p className="text-xs text-[#555566] mb-1">Subtotal</p>
                          <p className="text-sm font-bold text-white">${order.subtotal?.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#1a1a2e]">
                          <p className="text-xs text-[#555566] mb-1">Discount</p>
                          <p className="text-sm font-bold text-green-400">-${order.discount?.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-[#1a1a2e]">
                          <p className="text-xs text-[#555566] mb-1">Total</p>
                          <p className="text-sm font-bold text-white">${order.total?.toFixed(2)}</p>
                        </div>
                      </div>
                      {order.shipping_addr && (
                        <div className="p-3 rounded-xl bg-[#1a1a2e]">
                          <p className="text-xs text-[#555566] mb-1">Shipping Address</p>
                          <p className="text-sm text-white">{order.shipping_addr}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="p-3 rounded-xl bg-[#1a1a2e]">
                          <p className="text-xs text-[#555566] mb-1">Notes</p>
                          <p className="text-sm text-[#888899]">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
