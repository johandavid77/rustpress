interface Props {
  title: string
  url?: string
  theme?: 'dark' | 'minimal' | 'bold' | 'magazine'
}

export default function ShareButtons({ title, url, theme = 'dark' }: Props) {
  const shareUrl     = url || window.location.href
  const encoded      = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)

  const links = [
    { label: 'X',        href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}` },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: 'WhatsApp', href: `https://wa.me/?text=${encodedTitle}%20${encoded}` },
  ]

  const s = {
    dark:     { wrapper: 'flex items-center gap-3 mt-8 pt-6 border-t border-[#2a2a3a]',  label: 'text-xs font-mono text-[#555566] uppercase tracking-widest mr-2', btn: 'text-xs font-mono text-[#888899] px-3 py-1.5 border border-[#2a2a3a] rounded-lg hover:border-[#7c6aff] hover:text-white transition-all' },
    minimal:  { wrapper: 'flex items-center gap-3 mt-8 pt-6 border-t border-gray-100',   label: 'text-xs font-mono text-gray-300 uppercase tracking-widest mr-2',   btn: 'text-xs font-mono text-gray-400 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-all' },
    bold:     { wrapper: 'flex items-center gap-3 mt-8 pt-6 border-t-2 border-gray-800', label: 'text-xs font-mono text-gray-600 uppercase tracking-widest mr-2',   btn: 'text-xs font-black uppercase px-3 py-1.5 border-2 border-gray-800 hover:border-yellow-400 hover:text-yellow-400 transition-all' },
    magazine: { wrapper: 'flex items-center gap-3 mt-8 pt-6 border-t-2 border-black',    label: 'text-xs font-mono text-gray-400 uppercase tracking-widest mr-2',   btn: 'text-xs font-black px-3 py-1.5 border-2 border-black hover:bg-black hover:text-white transition-all' },
  }[theme]

  return (
    <div className={s.wrapper}>
      <span className={s.label}>Compartir</span>
      {links.map(l => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={s.btn}>
          {l.label}
        </a>
      ))}
    </div>
  )
}
