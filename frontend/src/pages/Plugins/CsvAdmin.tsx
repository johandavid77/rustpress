import { useTranslation } from 'react-i18next'
import { useState, useRef } from 'react'
import { apiClient } from '../../api/client'
import { Download, Upload, FileText, Users, Package, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface ImportResult { imported: number; errors: string[]; ok: boolean }

export default function CsvAdmin() {
  const { t } = useTranslation()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const download = async (type: string) => {
    const token = localStorage.getItem('access_token') ?? ''
    const res = await fetch('/api/v1/csv/export/' + type, {
      headers: { Authorization: 'Bearer ' + token }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = type + '.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').slice(0, 6).map((l: string) => l.split(','))
      setPreview(lines)
    }
    reader.readAsText(file)
  }

  const importFile = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res: any = await apiClient.post('/csv/import/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } } as any)
      setResult(res?.data ?? res)
      setPreview([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: any) {
      setResult({ imported: 0, errors: [e?.message ?? 'Error al importar'], ok: false })
    } finally { setImporting(false) }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-3">
          <FileText size={24} className="text-[#7c6aff]" />Importar / Exportar CSV
        </h1>
        <p className="text-[#888899] text-sm">Exporta datos a CSV o importa productos en bulk</p>
      </div>

      {/* Exportar */}
      <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] mb-6">
        <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest mb-4">Exportar datos</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'products', label: 'Productos', icon: Package, color: 'text-orange-400', desc: 'nombre, precio, stock, estado' },
            { key: 'posts', label: 'Posts', icon: FileText, color: 'text-green-400', desc: 'titulo, slug, estado, idioma' },
            { key: 'subscribers', label: 'Suscriptores', icon: Users, color: 'text-blue-400', desc: 'email, nombre, estado' },
          ].map(({ key, label, icon: Icon, color, desc }) => (
            <button key={key} onClick={() => download(key)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#2a2a3a] hover:border-[#7c6aff]/40 hover:bg-[#7c6aff]/5 transition-all group">
              <Icon size={20} className={color} />
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-[10px] text-[#555566] text-center">{desc}</div>
              <div className="flex items-center gap-1 text-xs text-[#7c6aff] opacity-0 group-hover:opacity-100 transition-opacity">
                <Download size={11} />Descargar
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Importar */}
      <div className="p-5 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a]">
        <h2 className="text-sm font-semibold text-[#888899] uppercase tracking-widest mb-4">Importar productos desde CSV</h2>
        <div className="mb-3 p-3 bg-[#1a1a2e] rounded-xl border border-[#2a2a3a] text-xs text-[#888899] font-mono">
          Formato esperado: name,slug,description,price,stock,status,sku
        </div>

        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2a2a3a] text-[#888899] hover:text-white hover:border-[#7c6aff]/40 text-sm transition-all mb-4">
          <Upload size={14} />Seleccionar archivo CSV
        </button>

        {preview.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-[#555566] mb-2">Preview (primeras 5 filas):</div>
            <div className="overflow-x-auto rounded-xl border border-[#2a2a3a]">
              <table className="w-full text-xs">
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i === 0 ? 'bg-[#1a1a2e] text-[#7c6aff] font-semibold' : 'text-[#888899] hover:bg-white/[0.02]'}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 border-b border-[#1e1e2e] truncate max-w-[100px]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={importFile} disabled={importing}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c6aff] hover:bg-[#6a58e8] text-white text-sm font-semibold disabled:opacity-50 transition-all">
              {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {importing ? 'Importando...' : 'Confirmar importacion'}
            </button>
          </div>
        )}

        {result && (
          <div className={"p-4 rounded-xl border " + (result.ok ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20')}>
            <div className="flex items-center gap-2 mb-2">
              {result.ok ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-yellow-400" />}
              <span className={"text-sm font-semibold " + (result.ok ? 'text-green-400' : 'text-yellow-400')}>
                {result.imported} producto(s) importados
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-yellow-400/70 font-mono">{e}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
