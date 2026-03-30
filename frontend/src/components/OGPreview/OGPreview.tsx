import { Eye } from 'lucide-react'

interface Props {
  title:       string
  description: string
  image?:      string
  url?:        string
}

export default function OGPreview({ title, description, image, url }: Props) {
  const displayUrl = url || window.location.host

  return (
    <div className="mt-2">
      <p className="text-xs font-mono text-[#555566] uppercase tracking-widest mb-2 flex items-center gap-1">
        <Eye size={12} /> Preview en redes sociales
      </p>
      <div className="border border-[#2a2a3a] rounded-xl overflow-hidden max-w-sm">
        {image ? (
          <img src={image} alt="" className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 bg-[#1a1a24] flex items-center justify-center text-[#333344]">
            <Eye size={32} />
          </div>
        )}
        <div className="p-3 bg-[#111118]">
          <p className="text-xs text-[#555566] font-mono truncate mb-1">{displayUrl}</p>
          <p className="text-sm font-bold text-white line-clamp-2 mb-1">{title || 'Título del post'}</p>
          <p className="text-xs text-[#888899] line-clamp-2">{description || 'Descripción...'}</p>
        </div>
      </div>
    </div>
  )
}
