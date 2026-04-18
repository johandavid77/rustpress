import { useState, useEffect, useRef, useCallback } from 'react'
import { apiClient } from '../../api/client'
import { Upload, Trash2, Copy, Check, Loader2, Image, X, ZoomIn, Grid, List } from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  url: string
  thumbnail_url?: string
  alt_text?: string
  created_at: string
}

export default function GalleryAdmin() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<MediaItem | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'other'>('all')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res: any = await apiClient.get('/media')
      setItems(Array.isArray(res) ? res : res?.data ?? [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        await apiClient.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } } as any)
      }
      await load()
    } catch {} finally { setUploading(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Eliminar archivo?')) return
    await apiClient.delete('/media/' + id)
    setItems(i => i.filter(x => x.id !== id))
    if (lightbox?.id === id) setLightbox(null)
  }

  const copy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    upload(e.dataTransfer.files)
  }, [])

  const fmt = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const filtered = items.filter(i => {
    if (filter === 'all') return true
    if (filter === 'image') return i.mime_type.startsWith('image/')
    if (filter === 'video') return i.mime_type.startsWith('video/')
    return !i.mime_type.startsWith('image/') && !i.mime_type.startsWith('video/')
  })

  const isImage = (mime: string) => mime.startsWith('image/')

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
            <Image size={24} className="text-[#7c6aff]" />Galeria de Medios
          </h1>
          <p className="text-[#888899] text-sm">{items.length} archivos · Arrastra o selecciona para subir</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={"p-2 rounded-lg border transition-all " + (view === 'grid' ? 'border-[#7c6aff] bg-[#7c6aff]/15 text-[#7c6aff]' : 'border-[#2a2a3a] text-[#555566] hover:text-white')}>
            <Grid size={16} />
          </button>
          <button onClick={() => setView('list')} className={"p-2 rounded-lg border transition-all " + (view === 'list' ? 'border-[#7c6aff] bg-[#7c6aff]/15 text-[#7c6aff]' : 'border-[#2a2a3a] text-[#555566] hover:text-white')}>
            <List size={16} />
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" onChange={e => upload(e.target.files)} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-semibold disabled:opacity-50 transition-all">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? 'Subiendo...' : 'Subir archivos'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {(['all', 'image', 'video', 'other'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={"px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all " +
              (filter === f ? 'bg-[#7c6aff] border-[#7c6aff] text-white' : 'border-[#2a2a3a] text-[#555566] hover:text-white')}>
            {f === 'all' ? 'Todos' : f === 'image' ? 'Imagenes' : f === 'video' ? 'Videos' : 'Otros'}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={"mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all " +
          (dragOver ? 'border-[#7c6aff] bg-[#7c6aff]/10' : 'border-[#2a2a3a] hover:border-[#3a3a4a]')}>
        <Upload size={24} className={"mx-auto mb-2 " + (dragOver ? 'text-[#7c6aff]' : 'text-[#555566]')} />
        <div className="text-sm text-[#555566]">Arrastra archivos aqui para subirlos</div>
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-[#555566]" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[#555566] text-sm border border-[#2a2a3a] rounded-2xl">Sin archivos. Sube algo arriba.</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative rounded-xl overflow-hidden border border-[#2a2a3a] bg-[#0e0e1a] aspect-square">
              {isImage(item.mime_type) ? (
                <img src={item.url} alt={item.alt_text ?? item.original_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={32} className="text-[#555566]" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {isImage(item.mime_type) && (
                  <button onClick={() => setLightbox(item)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
                    <ZoomIn size={16} />
                  </button>
                )}
                <button onClick={() => copy(item.url)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
                  {copied === item.url ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
                <button onClick={() => remove(item.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-[10px] text-white/70 truncate">{item.original_name}</div>
                <div className="text-[9px] text-white/40">{fmt(item.size_bytes)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
          <div className="divide-y divide-[#1e1e2e]">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02]">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1a1a2e] shrink-0 border border-[#2a2a3a]">
                  {isImage(item.mime_type)
                    ? <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center"><Image size={18} className="text-[#555566]" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{item.original_name}</div>
                  <div className="text-xs text-[#555566]">{item.mime_type} · {fmt(item.size_bytes)} · {new Date(item.created_at).toLocaleDateString('es-CO')}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isImage(item.mime_type) && (
                    <button onClick={() => setLightbox(item)} className="p-1.5 rounded-lg text-[#555566] hover:text-white hover:bg-white/[0.06] transition-all">
                      <ZoomIn size={15} />
                    </button>
                  )}
                  <button onClick={() => copy(item.url)} className="p-1.5 rounded-lg text-[#555566] hover:text-white hover:bg-white/[0.06] transition-all">
                    {copied === item.url ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                  </button>
                  <button onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-[#555566] hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
            <X size={20} />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.alt_text ?? lightbox.original_name}
              className="w-full h-full object-contain rounded-xl" loading="lazy" />
            <div className="mt-3 flex items-center justify-between px-1">
              <div>
                <div className="text-sm text-white font-medium">{lightbox.original_name}</div>
                <div className="text-xs text-[#888899]">{lightbox.mime_type} · {fmt(lightbox.size_bytes)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copy(lightbox.url)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-all">
                  {copied === lightbox.url ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  {copied === lightbox.url ? 'Copiado!' : 'Copiar URL'}
                </button>
                <button onClick={() => remove(lightbox.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-all">
                  <Trash2 size={13} />Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
