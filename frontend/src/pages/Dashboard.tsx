import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { postsApi } from '../api/posts'
import NewPost from './Posts/NewPost'
import EditPost from './Posts/EditPost'
import Stats from './Stats'
import { LayoutDashboard, FileText, Image, Users, Puzzle } from 'lucide-react'
import SlidersAdmin from './Plugins/SlidersAdmin'
import MenusAdmin from './Plugins/MenusAdmin'

type View = 'home' | 'posts' | 'media' | 'users' | 'plugins'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const [view, setView] = useState<View>('home')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  useEffect(() => { if (view === 'posts') loadPosts() }, [view])
  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await postsApi.list()
      setPosts(res.data ?? res.posts ?? (Array.isArray(res) ? res : []))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const nav = [
    { id: 'home'    as View, icon: LayoutDashboard, label: 'Resumen'  },
    { id: 'posts'   as View, icon: FileText,         label: 'Posts'    },
    { id: 'media'   as View, icon: Image,            label: 'Media'    },
    { id: 'users'   as View, icon: Users,            label: 'Usuarios' },
    { id: 'plugins' as View, icon: Puzzle,           label: 'Plugins'  },
  ]

  const resetPosts = () => { setShowNewPost(false); setEditingPost(null); loadPosts() }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <aside className="w-60 min-w-60 bg-[#111118] border-r border-[#2a2a3a] flex flex-col justify-between p-5">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[#7c6aff] text-xl">⬡</span>
            <span className="text-xl font-black tracking-tight">RustCMS</span>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map(item => {
              const Icon = item.icon
              return (
                <button key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left w-full transition-all
                    ${view === item.id ? 'bg-[#1a1a24] text-white' : 'text-[#888899] hover:text-white hover:bg-[#1a1a24]'}`}
                  onClick={() => { setView(item.id); setShowNewPost(false); setEditingPost(null) }}
                >
                  <Icon size={16} className={view === item.id ? 'text-[#7c6aff]' : ''} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-[#7c6aff] flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{user?.username}</div>
              <div className="text-xs text-[#888899] font-mono truncate">{user?.email}</div>
            </div>
          </div>
          <button className="px-3 py-2 border border-[#2a2a3a] rounded-lg text-xs text-[#888899] hover:text-white hover:border-[#7c6aff] font-semibold"
            onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-10">
        {view === 'home' && (
          <div className="max-w-5xl">
            <div className="mb-8">
              <h1 className="text-4xl font-black tracking-tight mb-1">Resumen</h1>
              <p className="text-[#888899] text-sm">Bienvenido de vuelta, {user?.username}</p>
            </div>
            <Stats />
          </div>
        )}
        {view === 'posts' && !showNewPost && !editingPost && (
          <PostsView posts={posts} loading={loading} onReload={loadPosts}
            onNewPost={() => setShowNewPost(true)}
            onEditPost={(post) => setEditingPost(post)} />
        )}
        {view === 'posts' && showNewPost && (
          <NewPost onBack={() => setShowNewPost(false)} onCreated={resetPosts} />
        )}
        {view === 'posts' && editingPost && (
          <EditPost post={editingPost} onBack={() => setEditingPost(null)} onSaved={resetPosts} />
        )}
        {(view === 'media' || view === 'users') && (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-30">
            <span className="text-6xl">⬡</span>
            <p className="text-xl font-bold">{nav.find(n => n.id === view)?.label}</p>
            <p className="text-sm font-mono">Próximamente</p>
          </div>
        )}
        {view === 'plugins' && (
          <div className="flex flex-col gap-12">
            <SlidersAdmin />
            <div className="border-t border-[#2a2a3a] pt-10">
              <MenusAdmin />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PostsView({ posts, loading, onReload, onNewPost, onEditPost }: {
  posts: any[], loading: boolean, onReload: () => void,
  onNewPost: () => void, onEditPost: (post: any) => void
}) {
  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Posts</h1>
          <p className="text-[#888899] text-sm">Gestiona el contenido de tu CMS</p>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2.5 border border-[#2a2a3a] rounded-lg text-sm font-bold text-[#888899] hover:text-white hover:border-[#7c6aff]" onClick={onReload}>↺ Recargar</button>
          <button className="px-5 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6]" onClick={onNewPost}>+ Nuevo Post</button>
        </div>
      </div>
      {loading && <p className="text-[#888899] font-mono text-sm">Cargando posts...</p>}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <span className="text-6xl">+</span>
          <p className="font-bold">No hay posts todavía</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post: any) => (
          <div key={post.id} onClick={() => onEditPost(post)}
            className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 flex flex-col gap-3 hover:border-[#7c6aff] transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono px-3 py-1 rounded-full font-semibold
                ${post.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {post.status === 'published' ? '● Publicado' : '○ Borrador'}
              </span>
              <span className="text-xs text-[#888899] font-mono">
                {new Date(post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h3 className="font-bold text-base leading-tight group-hover:text-[#7c6aff] transition-colors">{post.title}</h3>
            <p className="text-xs text-[#7c6aff] font-mono">/{post.slug}</p>
            {post.excerpt && <p className="text-sm text-[#888899] leading-relaxed">{post.excerpt}</p>}
            <p className="text-xs text-[#555566] font-mono mt-auto">Click para editar →</p>
          </div>
        ))}
      </div>
    </div>
  )
}
