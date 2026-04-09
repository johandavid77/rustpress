import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { HardDrive, Plus, Download, Trash2, Loader2, AlertCircle, CheckCircle2, RefreshCw, UploadCloud } from 'lucide-react'
import { apiClient } from '../../api/client'

interface BackupEntry {
  filename: string
  size_bytes: number
  created_at: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function BackupAdmin() {
  const { t } = useTranslation()
  const [backups, setBackups]       = useState<BackupEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [creating, setCreating]     = useState(false)
  const [restoring, setRestoring]   = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadBackups() }, [])

  async function loadBackups() {
    try {
      setLoading(true)
      const data: any = await apiClient.get('/backup/list')
      setBackups(data?.backups ?? [])
    } catch { setError('No se pudieron cargar los backups') }
    finally { setLoading(false) }
  }

  async function createBackup() {
    setCreating(true); setError(null); setSuccess(null)
    try {
      const data: any = await apiClient.post('/backup/create', {})
      setSuccess(`Backup creado: ${data.filename} (${formatSize(data.size_bytes)})`)
      await loadBackups()
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al crear backup')
    } finally { setCreating(false) }
  }

  async function deleteBackup(filename: string) {
    setDeleting(filename); setError(null)
    try {
      await apiClient.delete(`/backup/${filename}`)
      setBackups(prev => prev.filter(b => b.filename !== filename))
      setSuccess(`Backup eliminado`)
    } catch { setError('Error al eliminar backup') }
    finally { setDeleting(null) }
  }

  function downloadBackup(filename: string) {
    const a = document.createElement('a')
    a.href = `/api/v1/backup/download/${filename}`
    a.download = filename
    a.click()
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.sql')) {
      setError('Solo se aceptan archivos .sql')
      return
    }
    setConfirmRestore(file)
  }

  async function doRestore() {
    if (!confirmRestore) return
    setRestoring(true); setError(null); setSuccess(null)
    try {
      const form = new FormData()
      form.append('file', confirmRestore)
      await apiClient.post('/backup/restore', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      } as any)
      setSuccess('✅ Base de datos restaurada correctamente. Recarga la página.')
      setConfirmRestore(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Error al restaurar')
    } finally { setRestoring(false) }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
            <HardDrive size={28} className="text-yellow-400" />Backup & Restore
          </h1>
          <p className="text-[#888899] text-sm">Copias de seguridad de la base de datos · Se mantienen los últimos 30</p>
        </div>
        <button onClick={createBackup} disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 font-semibold text-sm transition-all disabled:opacity-50">
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {creating ? 'Creando...' : 'Crear backup'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} />{error}
          <button onClick={() => setError(null)} className="ml-auto">✕</button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 size={16} />{success}
          <button onClick={() => setSuccess(null)} className="ml-auto">✕</button>
        </div>
      )}

      {/* Restore zone */}
      <div className="mb-6 border border-dashed border-[#2a2a3a] hover:border-yellow-500/40 rounded-2xl p-5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <UploadCloud size={18} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-0.5">Restaurar desde archivo</div>
            <div className="text-xs text-[#555566]">Sube un archivo .sql para restaurar la base de datos</div>
          </div>
          <input ref={fileRef} type="file" accept=".sql" onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[#2a2a3a] text-[#888899] hover:text-white hover:bg-[#333344] text-sm font-medium transition-all">
            Seleccionar archivo
          </button>
        </div>

        {confirmRestore && (
          <div className="mt-4 pt-4 border-t border-[#2a2a3a]">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 text-sm text-white font-mono">{confirmRestore.name}</div>
              <div className="text-xs text-[#555566]">{formatSize(confirmRestore.size)}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 mb-3">
              ⚠️ <strong>Advertencia:</strong> Esta operación reemplazará TODOS los datos actuales. Esta acción no se puede deshacer.
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmRestore(null); if (fileRef.current) fileRef.current.value = '' }}
                className="flex-1 px-4 py-2 rounded-xl bg-[#2a2a3a] text-[#888899] hover:text-white text-sm font-medium transition-all">
                Cancelar
              </button>
              <button onClick={doRestore} disabled={restoring}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {restoring ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                {restoring ? 'Restaurando...' : 'Confirmar restauración'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backups list */}
      <div className="border border-[#2a2a3a] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a3a] bg-[#1a1a2e]">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#555566]">
            Backups disponibles ({backups.length})
          </span>
          <button onClick={loadBackups} className="text-[#555566] hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-[#888899]">
            <Loader2 size={18} className="animate-spin" /><span className="text-sm">Cargando...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="py-12 text-center text-[#555566] text-sm">
            <HardDrive size={32} className="mx-auto mb-3 opacity-30" />
            No hay backups. Crea uno ahora.
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {backups.map(b => (
              <div key={b.filename} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-white truncate">{b.filename}</div>
                  <div className="text-xs text-[#555566] mt-0.5">{b.created_at} · {formatSize(b.size_bytes)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => downloadBackup(b.filename)} title="Descargar"
                    className="p-2 rounded-lg text-[#666677] hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                    <Download size={15} />
                  </button>
                  <button onClick={() => deleteBackup(b.filename)} disabled={deleting === b.filename} title="Eliminar"
                    className="p-2 rounded-lg text-[#666677] hover:text-red-400 hover:bg-red-500/10 transition-all">
                    {deleting === b.filename ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
