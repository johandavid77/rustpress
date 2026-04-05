import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { mediaApi, MediaFile, formatBytes, isImage } from '../../api/media'
import { Upload, Trash2, Copy, Check, FileText, Image, Film, Music, File } from 'lucide-react'

type Filter = 'all' | 'image' | 'video' | 'audio' | 'document'

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <Image size={20} className="text-blue-400" />
  if (mime.startsWith('video/')) return <Film size={20} className="text-purple-400" />
  if (mime.startsWith('audio/')) return <Music size={20} className="text-green-400" />
  if (mime.includes('pdf') || mime.includes('doc') || mime.includes('text'))
    return <FileText size={20} className="text-yellow-400" />
  return <File size={20} className="text-[#888899]" />
}

export default function MediaAdmin() {
  const { t } = useTranslation()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [selected, setSelected] = useState<MediaFile | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadFiles() }, [filter, page])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const mime = filter === 'all' ? undefined : filter
      const res = await mediaApi.list(page, mime)
      setFiles((res.data ?? []) as any)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      await mediaApi.upload(Array.from(fileList))
      await loadFiles()
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error uploading files')
    } finally { setUploading(false) }
  }

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete "${file.original_name}"?`)) return
    try {
      await mediaApi.delete(file.id)
      if (selected?.id === file.id) setSelected(null)
      await loadFiles()
    } catch (e) { console.error(e) }
  }

  const copyUrl = (url: string) => {
    const full = `${window.location.origin}${url}`
    navigator.clipboard.writeText(full)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleUpload(e.dataTransfer.files)
  }, [])

  const filters: { id: Filter; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'image',    label: 'Images' },
    { id: 'video',    label: 'Video' },
    { id: 'audio',    label: 'Audio' },
    { id: 'document', label: 'Docs' },
  ]

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Media</h1>
          <p className="text-[#888899] text-sm">Manage your uploaded files</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] transition-colors disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload files'}
        </button>
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={e => handleUpload(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-[#7c6aff] bg-[#7c6aff]/10'
            : 'border-[#2a2a3a] hover:border-[#7c6aff]/50 hover:bg-[#111118]'
        }`}
      >
        <Upload size={24} className="mx-auto mb-2 text-[#555566]" />
        <p className="text-sm text-[#888899] font-mono">
          {dragging ? 'Drop files here' : 'Drag & drop files here or click to browse'}
        </p>
        <p className="text-xs text-[#555566] mt-1">Images, videos, audio, PDFs and documents</p>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-6 bg-[#111118] border border-[#2a2a3a] rounded-xl p-1 w-fit">
        {filters.map(f => (
          <button key={f.id} onClick={() => { setFilter(f.id); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === f.id ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1">
          {loading && <p className="text-[#888899] font-mono text-sm">Loading...</p>}
          {!loading && files.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 opacity-30">
              <span className="text-6xl">📁</span>
              <p className="font-bold">No files yet</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {files.map(file => (
              <div
                key={file.id}
                onClick={() => setSelected(file)}
                className={`group relative bg-[#111118] border rounded-xl overflow-hidden cursor-pointer transition-all ${
                  selected?.id === file.id
                    ? 'border-[#7c6aff]'
                    : 'border-[#2a2a3a] hover:border-[#3a3a4a]'
                }`}
              >
                {/* Preview */}
                <div className="aspect-square flex items-center justify-center bg-[#0a0a0f]">
                  {isImage(file.mime_type) ? (
                    <img src={file.url} alt={file.original_name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <FileIcon mime={file.mime_type} />
                  )}
                </div>
                {/* Name */}
                <div className="p-2">
                  <p className="text-xs font-mono truncate text-[#888899]">{file.original_name}</p>
                  <p className="text-xs text-[#555566]">{formatBytes(file.size_bytes)}</p>
                </div>
                {/* Delete overlay */}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(file) }}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {files.length === 30 && (
            <div className="flex gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm text-[#888899] hover:text-white disabled:opacity-30">
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-[#888899] font-mono">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm text-[#888899] hover:text-white">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 sticky top-0">
              {/* Preview */}
              <div className="aspect-square bg-[#0a0a0f] rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                {isImage(selected.mime_type) ? (
                  <img src={selected.url} alt={selected.original_name} className="w-full h-full object-contain" />
                ) : (
                  <FileIcon mime={selected.mime_type} />
                )}
              </div>
              {/* Info */}
              <p className="font-bold text-sm mb-1 break-all">{selected.original_name}</p>
              <p className="text-xs text-[#888899] font-mono mb-1">{selected.mime_type}</p>
              <p className="text-xs text-[#555566] mb-3">{formatBytes(selected.size_bytes)}</p>
              <p className="text-xs text-[#555566] mb-4">
                {new Date(selected.created_at).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })}
              </p>
              {/* Copy URL */}
              <button
                onClick={() => copyUrl(selected.url)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#7c6aff]/10 border border-[#7c6aff]/30 text-[#7c6aff] rounded-lg text-xs font-bold hover:bg-[#7c6aff]/20 transition-all mb-2"
              >
                {copied === selected.url ? <Check size={13} /> : <Copy size={13} />}
                {copied === selected.url ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
