import { useEffect, useState } from 'react'
import { List } from 'lucide-react'

interface Heading { id: string; text: string; level: number }
interface Props { content: string; theme?: 'dark' | 'minimal' | 'bold' | 'magazine' }

function extractHeadings(html: string): Heading[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('h1,h2,h3')).map((el, i) => ({
    id: el.id || `h-${i}`, text: el.textContent ?? '', level: parseInt(el.tagName[1])
  })).filter(h => h.text.trim())
}

export default function TableOfContents({ content, theme = 'dark' }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [active, setActive]     = useState('')

  useEffect(() => { setHeadings(extractHeadings(content)) }, [content])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-20% 0% -70% 0%' }
    )
    document.querySelectorAll('h1[id],h2[id],h3[id]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  const s = {
    dark:     { w: 'bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-8',  t: 'text-xs font-mono text-[#555566] uppercase tracking-widest mb-3 flex items-center gap-2', i: 'text-sm text-[#888899] hover:text-white',        a: 'text-[#7c6aff] font-semibold' },
    minimal:  { w: 'bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8',      t: 'text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2',  i: 'text-sm text-gray-400 hover:text-gray-900',      a: 'text-gray-900 font-semibold' },
    bold:     { w: 'bg-gray-900 border-2 border-gray-800 p-5 mb-8',              t: 'text-xs font-mono text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2',  i: 'text-sm text-gray-400 hover:text-yellow-400',    a: 'text-yellow-400 font-black' },
    magazine: { w: 'border-2 border-black p-5 mb-8',                             t: 'text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2',  i: 'text-sm text-gray-500 hover:text-black',         a: 'text-black font-black' },
  }[theme]

  return (
    <nav className={s.w}>
      <p className={s.t}><List size={14} />Contenido</p>
      <ul className="flex flex-col gap-1">
        {headings.map(h => (
          <li key={h.id} style={{ paddingLeft: `${(h.level-1)*12}px` }}>
            <a href={`#${h.id}`} className={`block py-0.5 transition-colors ${s.i} ${active===h.id ? s.a : ''}`}>{h.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
