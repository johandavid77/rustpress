import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'

interface Props {
  content: string
  onChange: (html: string) => void
}

export default function RichEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#7c6aff] underline' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escribe el contenido del post...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const addImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result as string
        editor?.chain().focus().setImage({ src }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (!url) return
    editor?.chain().focus().setLink({ href: url }).run()
  }

  if (!editor) return null

  const btn = (action: () => void, label: string, active?: boolean, title?: string) => (
    <button type="button" onClick={action} title={title ?? label}
      className={`px-2 py-1 rounded text-xs font-bold font-mono transition-all
        ${active ? 'bg-[#7c6aff] text-white' : 'text-[#888899] hover:text-white hover:bg-[#2a2a3a]'}`}>
      {label}
    </button>
  )

  return (
    <div className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl overflow-hidden focus-within:border-[#7c6aff] transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#2a2a3a] flex-wrap bg-[#111118]">
        {/* Historia */}
        {btn(() => editor.chain().focus().undo().run(), '↩', false, 'Deshacer')}
        {btn(() => editor.chain().focus().redo().run(), '↪', false, 'Rehacer')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />

        {/* Formato texto */}
        {btn(() => editor.chain().focus().toggleBold().run(), 'B', editor.isActive('bold'), 'Negrita')}
        {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'), 'Cursiva')}
        {btn(() => editor.chain().focus().toggleUnderline().run(), 'U', editor.isActive('underline'), 'Subrayado')}
        {btn(() => editor.chain().focus().toggleStrike().run(), 'S̶', editor.isActive('strike'), 'Tachado')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />

        {/* Headings */}
        {btn(() => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1', editor.isActive('heading', { level: 1 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />

        {/* Alineación */}
        {btn(() => editor.chain().focus().setTextAlign('left').run(), '⬤⬤⬤', editor.isActive({ textAlign: 'left' }), 'Izquierda')}
        {btn(() => editor.chain().focus().setTextAlign('center').run(), '≡', editor.isActive({ textAlign: 'center' }), 'Centro')}
        {btn(() => editor.chain().focus().setTextAlign('right').run(), '⬤⬤', editor.isActive({ textAlign: 'right' }), 'Derecha')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />

        {/* Listas */}
        {btn(() => editor.chain().focus().toggleBulletList().run(), '• Lista', editor.isActive('bulletList'))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista', editor.isActive('orderedList'))}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />

        {/* Bloques */}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), '❝', editor.isActive('blockquote'), 'Cita')}
        {btn(() => editor.chain().focus().toggleCodeBlock().run(), '</>', editor.isActive('codeBlock'), 'Bloque de código')}
        {btn(() => editor.chain().focus().setHorizontalRule().run(), '—', false, 'Separador')}
        <div className="w-px h-4 bg-[#2a2a3a] mx-1" />

        {/* Media */}
        {btn(addImage, '🖼 Imagen', false, 'Insertar imagen')}
        {btn(addLink, '🔗 Link', editor.isActive('link'), 'Insertar enlace')}
        {editor.isActive('link') && btn(() => editor.chain().focus().unsetLink().run(), '✕ Link', false, 'Quitar enlace')}
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="
          p-5 min-h-[320px] text-sm text-white
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-black [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:mt-4
          [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:mt-3
          [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-3
          [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:mb-3
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:mb-3
          [&_.ProseMirror_li]:mb-1
          [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[#7c6aff] [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-[#888899] [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:mb-3
          [&_.ProseMirror_pre]:bg-[#0a0a0f] [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-xs [&_.ProseMirror_pre]:mb-3 [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_code]:bg-[#0a0a0f] [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-xs [&_.ProseMirror_code]:text-[#ff6a9b]
          [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-3
          [&_.ProseMirror_hr]:border-[#2a2a3a] [&_.ProseMirror_hr]:my-4
          [&_.ProseMirror_a]:text-[#7c6aff] [&_.ProseMirror_a]:underline
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-[#444455]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
        "
      />
    </div>
  )
}
