import { useState } from 'react'
import { apiClient } from '../api/client'
import { Download, FileText, ShoppingBag, Mail, Package } from 'lucide-react'

const EXPORTS = [
  { key: 'orders',      label: 'Orders',      icon: ShoppingBag, desc: 'All orders with status and totals',    color: '#06b6d4' },
  { key: 'posts',       label: 'Posts',       icon: FileText,    desc: 'All posts with views and status',      color: '#7c6aff' },
  { key: 'subscribers', label: 'Subscribers', icon: Mail,        desc: 'Newsletter subscribers list',          color: '#4ade80' },
  { key: 'products',    label: 'Products',    icon: Package,     desc: 'Product catalog with prices and stock', color: '#fb923c' },
]

export default function ExportData() {
  const [loading, setLoading] = useState<string | null>(null)
  const [done,    setDone]    = useState<string[]>([])

  const download = async (key: string) => {
    setLoading(key)
    try {
      const res = await fetch(`/api/v1/export/${key}.csv`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` }
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${key}_${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setDone(d => [...d, key])
      setTimeout(() => setDone(d => d.filter(x => x !== key)), 3000)
    } catch(e: any) {
      alert('Export error: ' + (e?.message ?? 'unknown'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
        <Download size={22} className="text-[#7c6aff]" /> Export Data
      </h1>
      <p className="text-sm text-[#555566] mb-6">Download your data as CSV files</p>

      <div className="grid grid-cols-2 gap-4">
        {EXPORTS.map(({ key, label, icon: Icon, desc, color }) => (
          <div key={key} className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + '20' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs text-[#555566]">{desc}</p>
              </div>
            </div>
            <button
              onClick={() => download(key)}
              disabled={loading === key}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: done.includes(key) ? '#16a34a20' : color + '15',
                color: done.includes(key) ? '#4ade80' : color,
                border: `1px solid ${done.includes(key) ? '#16a34a40' : color + '30'}`
              }}>
              {loading === key ? (
                <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Exporting...</>
              ) : done.includes(key) ? (
                <>✓ Downloaded</>
              ) : (
                <><Download size={14} /> Download CSV</>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
        <p className="text-xs text-[#555566]">
          CSV files are UTF-8 encoded and compatible with Excel, Google Sheets, and most data tools.
          Large exports may take a few seconds.
        </p>
      </div>
    </div>
  )
}
