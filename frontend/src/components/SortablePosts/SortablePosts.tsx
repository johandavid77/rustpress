import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface Post { id: string; title: string; status: string; slug: string }

function SortablePost({ post, onClick }: { post: Post; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: post.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 bg-[#111118] border rounded-xl px-4 py-3 group
        ${isDragging ? 'border-[#7c6aff] shadow-lg shadow-[#7c6aff]/10' : 'border-[#2a2a3a] hover:border-[#3a3a4a]'}`}>
      <button {...attributes} {...listeners}
        className="text-[#333344] hover:text-[#7c6aff] cursor-grab active:cursor-grabbing touch-none p-1 -ml-1">
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <p className="font-bold text-sm truncate">{post.title}</p>
        <p className="text-xs font-mono text-[#555566] truncate">{post.slug}</p>
      </div>
      <span className={`text-xs font-mono px-2 py-0.5 rounded-full shrink-0
        ${post.status === 'published'
          ? 'bg-green-500/10 text-green-400'
          : 'bg-yellow-500/10 text-yellow-400'}`}>
        {post.status === 'published' ? '● pub' : '○ draft'}
      </span>
    </div>
  )
}

interface Props {
  posts: Post[]
  onReorder: (posts: Post[]) => void
  onEdit: (post: Post) => void
}

export default function SortablePosts({ posts, onReorder, onEdit }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = posts.findIndex(p => p.id === active.id)
    const newIndex  = posts.findIndex(p => p.id === over.id)
    onReorder(arrayMove(posts, oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={posts.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {posts.map(post => (
            <SortablePost key={post.id} post={post} onClick={() => onEdit(post)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
