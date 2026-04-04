import { useState } from 'react'
import { ShoppingBag, Package, Users, Tag, Archive, BarChart2, Settings, ArrowLeft } from 'lucide-react'
import EcommerceOverview from './EcommerceOverview'
import EcommerceProducts from './EcommerceProducts'
import EcommerceOrders from './EcommerceOrders'
import EcommerceCustomers from './EcommerceCustomers'
import EcommerceCoupons from './EcommerceCoupons'
import EcommerceInventory from './EcommerceInventory'
import EcommerceSettings from './EcommerceSettings'

type Tab = 'overview'|'products'|'orders'|'customers'|'coupons'|'inventory'|'settings'

interface Props { onBack: () => void }

const tabs = [
  { id: 'overview'   as Tab, icon: BarChart2,  label: 'Resumen'    },
  { id: 'products'   as Tab, icon: Package,     label: 'Productos'  },
  { id: 'orders'     as Tab, icon: ShoppingBag, label: 'Pedidos'    },
  { id: 'customers'  as Tab, icon: Users,       label: 'Clientes'   },
  { id: 'coupons'    as Tab, icon: Tag,         label: 'Cupones'    },
  { id: 'inventory'  as Tab, icon: Archive,     label: 'Inventario' },
  { id: 'settings'   as Tab, icon: Settings,    label: 'Ajustes'    },
]

export default function EcommerceHome({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="flex h-full min-h-screen bg-[#0a0a0f] text-white">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-[#1a1a24] flex flex-col">
        <div className="px-4 py-5 border-b border-[#1a1a24]">
          <button onClick={onBack} className="flex items-center gap-2 text-xs text-[#555566] hover:text-white mb-3 transition-colors">
            <ArrowLeft size={12} /> Admin principal
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7c6aff]/20 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-[#7c6aff]" />
            </div>
            <div>
              <p className="font-black text-sm">Tienda</p>
              <p className="text-[10px] text-[#555566] font-mono">RustCMS Shop</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 p-3 flex-1">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left w-full transition-all
                  ${tab === t.id ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white hover:bg-[#1a1a24]'}`}>
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-[#1a1a24]">
          <a href="/shop" target="_blank"
            className="flex items-center gap-2 px-3 py-2 border border-[#2a2a3a] rounded-xl text-xs text-[#888899] hover:border-[#7c6aff] hover:text-white transition-all">
            <ShoppingBag size={12} /> Ver tienda pública
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {tab === 'overview'   && <EcommerceOverview />}
        {tab === 'products'   && <EcommerceProducts />}
        {tab === 'orders'     && <EcommerceOrders />}
        {tab === 'customers'  && <EcommerceCustomers />}
        {tab === 'coupons'    && <EcommerceCoupons />}
        {tab === 'inventory'  && <EcommerceInventory />}
        {tab === 'settings'   && <EcommerceSettings />}
      </div>
    </div>
  )
}
