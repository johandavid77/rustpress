import { useEffect, useState } from 'react'
import { List } from 'lucide-react'

interface Heading {
  id:    string
  text:  string
  level: number
}

interface Props {
  content: string
  theme?: 'dark' | 'minimal' | 'bold' | 'magazine'
}

function extractHeadings(html: string): Heading[] {
  const parser   = new DOMParser()
  const doc      = parser.parseFromString(html, 'text/html')
  const elements = doc.querySelectorAll('h1, h2, h3')
  return Array.from(elements).map((el, i) => ({
    id:    el.id || `heading-${i}`,
    text:  el.textContent ?? '',
    level: parseInt(el.tagName[1]),
  })).filter(h => h.text.trim())
}

export default function TableOfContents({ content, theme = 'dark' }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [active, setActive]     = useState('')

  useEffect(() => { setHeadings(extractHeadings(content)) }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-20% 0% -70% 0%' }
    )
    document.querySelectorAll('h1[id], h2[id], h3[id]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  const s = {
    dark:     { wrapper: 'bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-8',  title: 'text-xs font-mono text-[#555566] uppercase tracking-widest mb-3 flex items-center gap-2', item: 'text-sm text-[#888899] hover:text-white transition-colors',        active: 'text-[#7c6aff] font-semibold' },
    minimal:  { wrapper: 'bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8',      title: 'text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2',  item: 'text-sm text-gray-400 hover:text-gray-900 transition-colors',      active: 'text-gray-900 font-semibold' },
    bold:     { wrapper: 'bg-gray-900 border-2 border-gray-800 p-5 mb-8',              title: 'text-xs font-mono text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2',  item: 'text-sm text-gray-400 hover:text-yellow-400 transition-colors',    active: 'text-yellow-400 font-black' },
    magazine: { wrapper: 'border-2 border-black p-5 mb-8',                             title: 'text-xs font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2',  item: 'text-sm text-gray-500 hover:text-black transition-colors',          active: 'text-black font-black' },
  }[theme]

  return (
    <nav className={s.wrapper}>
      <p className={s.title}><List size={14} /> Contenido</p>
      <ul className="flex flex-col gap-1">
        {headings.map(h => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
            <a href={`#${h.id}`} className={`block py-0.5 ${s.item} ${active === h.id ? s.active : ''}`}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
