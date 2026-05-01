import { useState, useEffect } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  rectSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface Widget {
  id: string
  label: string
  visible: boolean
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'revenue',  label: 'Ingresos',        visible: true },
  { id: 'orders',   label: 'Pedidos',          visible: true },
  { id: 'posts',    label: 'Posts',            visible: true },
  { id: 'products', label: 'Productos',        visible: true },
  { id: 'media',    label: 'Archivos media',   visible: true },
  { id: 'users',    label: 'Usuarios',         visible: true },
]

function SortableWidget({ widget, onToggle }: { widget: Widget; onToggle: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111118] border border-[#2a2a3a] hover:border-[#7c6aff]/40 transition-all">
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#444455] hover:text-[#7c6aff] transition-colors">
        <GripVertical size={16} />
      </button>
      <span className="flex-1 text-sm text-[#888899]">{widget.label}</span>
      <button onClick={() => onToggle(widget.id)}
        className={`w-9 h-5 rounded-full transition-all relative ${widget.visible ? 'bg-[#7c6aff]' : 'bg-[#2a2a3a]'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${widget.visible ? 'left-4' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

export default function DraggableDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard-widgets')
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS
    } catch { return DEFAULT_WIDGETS }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets))
  }, [widgets])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setWidgets(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleWidget = (id: string) => {
    setWidgets(ws => ws.map(w => w.id === id ? { ...w, visible: !w.visible } : w))
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111118] border border-[#2a2a3a] text-xs text-[#555566] hover:border-[#7c6aff]/50 hover:text-[#7c6aff] transition-all">
        <GripVertical size={13} />
        Personalizar
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-[#2a2a3a] bg-[#0e0e1a] shadow-2xl p-4">
          <p className="text-xs text-[#555566] mb-3 font-medium uppercase tracking-wider">Widgets del dashboard</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
              <div className="flex flex-col gap-2">
                {widgets.map(w => <SortableWidget key={w.id} widget={w} onToggle={toggleWidget} />)}
              </div>
            </SortableContext>
          </DndContext>
          <button onClick={() => { setWidgets(DEFAULT_WIDGETS); setOpen(false) }}
            className="mt-3 w-full text-xs text-[#444455] hover:text-[#7c6aff] transition-colors">
            Restablecer orden
          </button>
        </div>
      )}
    </div>
  )
}
