import { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import { BarChart2 } from 'lucide-react'

interface DayData { day: string; views: number }

export default function ViewsChart() {
  const [data, setData] = useState<DayData[]>([])

  useEffect(() => {
    apiClient.get('/posts/stats/views')
      .then((res: any) => setData(Array.isArray(res) ? res : []))
      .catch(console.error)
  }, [])

  if (data.length === 0) return null

  const max   = Math.max(...data.map(d => d.views), 1)
  const total = data.reduce((sum, d) => sum + d.views, 0)

  return (
    <div className="bg-[#111118] border border-[#2a2a3a] rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-[#7c6aff]" />
          <p className="font-bold text-sm">Visitas últimos 30 días</p>
        </div>
        <span className="text-xs font-mono text-[#555566]">{total.toLocaleString()} total</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group relative">
            <div className="absolute bottom-full mb-1 hidden group-hover:flex z-10">
              <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded px-2 py-1 text-xs font-mono whitespace-nowrap">
                {d.day.slice(5)}: {d.views}
              </div>
            </div>
            <div className="w-full bg-[#7c6aff]/30 hover:bg-[#7c6aff] transition-all rounded-sm"
              style={{ height: `${Math.max(4, (d.views / max) * 96)}px` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-[#555566] font-mono">{data[0]?.day.slice(5)}</span>
        <span className="text-xs text-[#555566] font-mono">{data[data.length-1]?.day.slice(5)}</span>
      </div>
    </div>
  )
}
