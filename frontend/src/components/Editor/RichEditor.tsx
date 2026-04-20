import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useState, useCallback, useRef } from 'react'
import { apiClient } from '../../api/client'

interface Props {
  content: string
  onChange: (html: string) => void
}

export default function RichEditor({ content, onChange }: Props) {
  const [slashMenu, setSlashMenu] = useState(false)
  const [slashPos,  setSlashPos]  = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#7c6aff] underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Escribe aquí o presiona "/" para insertar bloques...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          const { top, left } = view.coordsAtPos(view.state.selection.from)
          setSlashPos({ x: left, y: top + 24 })
          setSlashMenu(true)
        } else if (event.key === 'Escape') {
          setSlashMenu(false)
        } else if (event.key !== '/') {
          setSlashMenu(false)
        }
        return false
      },
    },
  })

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res: any = await apiClient.post('/media/upload', fd)
      const url = res?.data?.url ?? res?.url ?? ''
      if (url && editor) {
        editor.chain().focus().setImage({ src: url, alt: file.name }).run()
      }
    } catch {
      // fallback base64
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        editor?.chain().focus().setImage({ src }).run()
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }, [editor])

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    setSlashMenu(false)
  }

  const SLASH_COMMANDS = [
    { label: 'Título 1',       icon: 'H1', action: () => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setSlashMenu(false) } },
    { label: 'Título 2',       icon: 'H2', action: () => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setSlashMenu(false) } },
    { label: 'Título 3',       icon: 'H3', action: () => { editor?.chain().focus().toggleHeading({ level: 3 }).run(); setSlashMenu(false) } },
    { label: 'Lista',          icon: '•',  action: () => { editor?.chain().focus().toggleBulletList().run();   setSlashMenu(false) } },
    { label: 'Lista numerada', icon: '1.', action: () => { editor?.chain().focus().toggleOrderedList().run(); setSlashMenu(false) } },
    { label: 'Cita',           icon: '"',  action: () => { editor?.chain().focus().toggleBlockquote().run();  setSlashMenu(false) } },
    { label: 'Código',         icon: '<>', action: () => { editor?.chain().focus().toggleCodeBlock().run();   setSlashMenu(false) } },
    { label: 'Separador',      icon: '—',  action: () => { editor?.chain().focus().setHorizontalRule().run(); setSlashMenu(false) } },
    { label: 'Tabla',          icon: '⊞',  action: insertTable },
    { label: 'Imagen',         icon: '🖼', action: () => { fileRef.current?.click(); setSlashMenu(false) } },
  ]

  const btn = (action: () => void, label: string, active = false, title?: string) => (
    <button key={label} onClick={action} title={title ?? label}
      className={"px-2 py-1 rounded text-xs font-bold transition-colors " + (
        active ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white hover:bg-[#2a2a3a]'
      )}>
      {label}
    </button>
  )

  if (!editor) return null

  return (
    <div className="rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[#2a2a3a] bg-[#0a0a0f]">
        {btn(() => editor.chain().focus().toggleBold().run(),          'B',   editor.isActive('bold'),      'Negrita')}
        {btn(() => editor.chain().focus().toggleItalic().run(),        'I',   editor.isActive('italic'),    'Cursiva')}
        {btn(() => editor.chain().focus().toggleUnderline().run(),     'U',   editor.isActive('underline'), 'Subrayado')}
        {btn(() => editor.chain().focus().toggleStrike().run(),        'S̶',   editor.isActive('strike'),    'Tachado')}
        {btn(() => editor.chain().focus().toggleCode().run(),          '`',   editor.isActive('code'),      'Código inline')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
        {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', editor.isActive('heading', { level: 1 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
        {btn(() => editor.chain().focus().setTextAlign('left').run(),   '⬤', editor.isActive({ textAlign: 'left' }),   'Izquierda')}
        {btn(() => editor.chain().focus().setTextAlign('center').run(), '≡', editor.isActive({ textAlign: 'center' }), 'Centro')}
        {btn(() => editor.chain().focus().setTextAlign('right').run(),  '⬤', editor.isActive({ textAlign: 'right' }),  'Derecha')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
        {btn(() => editor.chain().focus().toggleBulletList().run(),  '• Lista',   editor.isActive('bulletList'))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista',  editor.isActive('orderedList'))}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
        {btn(() => editor.chain().focus().toggleBlockquote().run(),  '"',   editor.isActive('blockquote'), 'Cita')}
        {btn(() => editor.chain().focus().toggleCodeBlock().run(),   '</>', editor.isActive('codeBlock'),  'Bloque código')}
        {btn(() => editor.chain().focus().setHorizontalRule().run(), '—',   false,                         'Separador')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
        {btn(insertTable, '⊞ Tabla', editor.isActive('table'), 'Insertar tabla')}
        {editor.isActive('table') && (
          <>
            {btn(() => editor.chain().focus().addColumnAfter().run(),  '+ Col', false, 'Agregar columna')}
            {btn(() => editor.chain().focus().addRowAfter().run(),     '+ Fila', false, 'Agregar fila')}
            {btn(() => editor.chain().focus().deleteTable().run(),     '✕ Tabla', false, 'Eliminar tabla')}
          </>
        )}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />
        {btn(() => fileRef.current?.click(), uploading ? '⏳' : '🖼 Imagen', false, 'Subir imagen')}
        {btn(addLink, '🔗 Link', editor.isActive('link'), 'Insertar enlace')}
        {editor.isActive('link') && btn(() => editor.chain().focus().unsetLink().run(), '✕ Link', false, 'Quitar enlace')}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="
          p-5 min-h-[400px] text-sm text-white
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-black [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:mt-4
          [&_.ProseMirror_h2]:text-xl  [&_.ProseMirror_h2]:font-bold  [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-3
          [&_.ProseMirror_h3]:text-lg  [&_.ProseMirror_h3]:font-bold  [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-3
          [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_ul]:list-disc   [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-3
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-3
          [&_.ProseMirror_li]:mb-1
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[#7c6aff] [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-[#888899] [&_.ProseMirror_blockquote]:mb-3
          [&_.ProseMirror_pre]:bg-[#1a1a2e] [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:mb-3 [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_code]:bg-[#1a1a2e] [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-[#7c6aff] [&_.ProseMirror_code]:text-xs
          [&_.ProseMirror_hr]:border-[#2a2a3a] [&_.ProseMirror_hr]:my-4
          [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:my-3
          [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:mb-4
          [&_.ProseMirror_th]:bg-[#1a1a2e] [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-[#2a2a3a] [&_.ProseMirror_th]:px-3 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:font-bold [&_.ProseMirror_th]:text-xs
          [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-[#2a2a3a] [&_.ProseMirror_td]:px-3 [&_.ProseMirror_td]:py-2 [&_.ProseMirror_td]:text-sm
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-[#444455] [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
        "
      />

      {/* Slash command menu */}
      {slashMenu && (
        <div
          className="fixed z-50 bg-[#0e0e1a] border border-[#2a2a3a] rounded-2xl shadow-2xl p-2 min-w-[200px]"
          style={{ left: slashPos.x, top: slashPos.y }}>
          <p className="text-[10px] text-[#444455] uppercase tracking-wider px-2 mb-1">Insertar bloque</p>
          {SLASH_COMMANDS.map(cmd => (
            <button key={cmd.label} onClick={cmd.action}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-[#2a2a3a] transition-colors text-left">
              <span className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center text-xs font-bold text-[#7c6aff] shrink-0">{cmd.icon}</span>
              <span className="text-sm text-white">{cmd.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]) }} />

      {/* Word count */}
      <div className="px-4 py-2 border-t border-[#2a2a3a] flex items-center justify-between text-xs text-[#444455]">
        <span>Presiona <kbd className="px-1.5 py-0.5 rounded bg-[#1a1a2e] text-[#7c6aff] font-mono">/</kbd> para insertar bloques</span>
        <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} caracteres</span>
      </div>
    </div>
  )
}
