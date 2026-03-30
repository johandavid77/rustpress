import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { postsApi } from '../api/posts'
import NewPost from './Posts/NewPost'
import EditPost from './Posts/EditPost'
import Stats from './Stats'
import { LayoutDashboard, FileText, Image, Users, Puzzle, ExternalLink, Palette, MessageSquare, Tag, Webhook, Activity } from 'lucide-react'
import SlidersAdmin from './Plugins/SlidersAdmin'
import MenusAdmin from './Plugins/MenusAdmin'
import UsersAdmin from './Users/UsersAdmin'
import MediaAdmin from './Media/MediaAdmin'
import LanguageSelector from '../components/LanguageSelector'
import { apiClient } from '../api/client'
import CommentsAdmin from './Plugins/CommentsAdmin'
import CategoriesAdmin from './Plugins/CategoriesAdmin'
import WebhooksAdmin from './Plugins/WebhooksAdmin'
import PluginsHome from './Plugins/PluginsHome'
import HealthDashboard from './Dashboard/HealthDashboard'
import HealthDashboard from './Dashboard/HealthDashboard'
import HealthDashboard from './Dashboard/HealthDashboard'

type View = 'home' | 'posts' | 'media' | 'users' | 'plugins' | 'themes' | 'comments' | 'categories' | 'webhooks' | 'health' | 'health' | 'health'

const THEMES = [
  { id: 'dark',     name: '🌑 Dark',     description: 'Oscuro, moderno, minimalista',              preview: 'bg-[#0a0a0f] border-[#2a2a3a]', accent: 'bg-[#7c6aff]' },
  { id: 'minimal',  name: '⬜ Minimal',  description: 'Blanco, tipografía grande, mucho espacio',  preview: 'bg-white border-gray-200',       accent: 'bg-gray-900'   },
  { id: 'bold',     name: '🎨 Bold',     description: 'Colores vibrantes, cards grandes, energético', preview: 'bg-black border-yellow-400',  accent: 'bg-yellow-400' },
  { id: 'magazine', name: '📰 Magazine', description: 'Clásico blog/periódico, columnas, denso',   preview: 'bg-[#f5f0e8] border-black',     accent: 'bg-black'      },
]

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const [view, setView] = useState<View>('home')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewPost, setShowNewPost] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [activeTheme, setActiveTheme] = useState<string>('dark')
  const [savingTheme, setSavingTheme] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)

  useEffect(() => { if (view === 'posts') loadPosts() }, [view])

  useEffect(() => {
    apiClient.get('/settings/active-theme')
      .then((res: any) => setActiveTheme(res?.value ?? 'dark'))
      .catch(() => setActiveTheme('dark'))
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await postsApi.list()
      setPosts(res.data ?? res.posts ?? (Array.isArray(res) ? res : []))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const saveTheme = async (themeId: string) => {
    setSavingTheme(true)
    try {
      await apiClient.put('/settings/active-theme', { value: themeId })
      setActiveTheme(themeId)
      setThemeSaved(true)
      setTimeout(() => setThemeSaved(false), 2000)
    } catch (e) { console.error(e) }
    finally { setSavingTheme(false) }
  }

  const nav = [
    { id: 'home'     as View, icon: LayoutDashboard, label: t('nav.home')    },
    { id: 'posts'    as View, icon: FileText,         label: t('nav.posts')   },
    { id: 'media'    as View, icon: Image,            label: t('nav.media')   },
    { id: 'users'    as View, icon: Users,            label: t('nav.users')   },
    { id: 'plugins'  as View, icon: Puzzle,           label: t('nav.plugins') },
    { id: 'themes'   as View, icon: Palette,          label: 'Themes'         },
    { id: 'comments'   as View, icon: MessageSquare, label: 'Comentarios' },
    { id: 'categories' as View, icon: Tag,     label: 'Categorías' },
    { id: 'webhooks' | 'health'   as View, icon: Webhook, label: 'Webhooks'   },
  ]

  const resetPosts = () => { setShowNewPost(false); setEditingPost(null); loadPosts() }
  const viewTitle = nav.find(n => n.id === view)?.label ?? ''

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <aside className="w-60 min-w-60 bg-[#111118] border-r border-[#2a2a3a] flex flex-col justify-between p-5">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[#7c6aff] text-xl">○</span>
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
          <div className="px-2 pb-1"><LanguageSelector /></div>
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
            onClick={logout}>{t('common.logout')}</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-[#111118] border-b border-[#2a2a3a] flex items-center justify-between px-6 flex-shrink-0">
          <p className="text-sm text-[#888899] font-mono">{viewTitle}</p>
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-1.5 border border-[#2a2a3a] rounded-lg text-xs text-[#888899] hover:text-white hover:border-[#7c6aff] font-semibold transition-all">
            <ExternalLink size={13} /> Preview site
          </a>
        </header>

        <main className="flex-1 overflow-auto p-10">
          {view === 'home' && (
            <div className="max-w-5xl">
              <div className="mb-8">
                <h1 className="text-4xl font-black tracking-tight mb-1">{t('dashboard.summary')}</h1>
                <p className="text-[#888899] text-sm">{t('dashboard.welcome')}, {user?.username}</p>
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
          {view === 'media'    && <MediaAdmin />}
          {view === 'users'    && <UsersAdmin />}
          {view === 'comments'    && <CommentsAdmin />}
          {view === 'categories'  && <CategoriesAdmin />}
          {view === 'webhooks' | 'health'    && <WebhooksAdmin />}
          {view === 'plugins'  && <PluginsHome onNavigate={(v) => setView(v as any)} />}
          {view === 'themes' && (
            <div className="max-w-3xl">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-black tracking-tight mb-1">Themes</h1>
                  <p className="text-[#888899] text-sm">Selecciona el tema visual del blog público</p>
                </div>
                {themeSaved && (
                  <span className="text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
                    ✓ Theme guardado
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {THEMES.map(theme => (
                  <button key={theme.id} onClick={() => saveTheme(theme.id)} disabled={savingTheme}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all
                      ${activeTheme === theme.id ? 'border-[#7c6aff] bg-[#1a1a24]' : 'border-[#2a2a3a] bg-[#111118] hover:border-[#7c6aff]/50'}`}>
                    {activeTheme === theme.id && (
                      <span className="absolute top-3 right-3 text-xs font-mono text-[#7c6aff] bg-[#7c6aff]/10 px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                    <div className={`w-full h-16 rounded-lg border-2 mb-4 flex items-end p-2 gap-1 ${theme.preview}`}>
                      <div className={`h-2 w-16 rounded ${theme.accent} opacity-80`} />
                      <div className={`h-1.5 w-10 rounded ${theme.accent} opacity-40`} />
                    </div>
                    <p className="font-bold text-sm mb-1">{theme.name}</p>
                    <p className="text-xs text-[#888899]">{theme.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function PostsView({ posts, loading, onReload, onNewPost, onEditPost }: {
  posts: any[], loading: boolean, onReload: () => void,
  onNewPost: () => void, onEditPost: (post: any) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">{t('posts.title')}</h1>
          <p className="text-[#888899] text-sm">{t('posts.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-5 py-2.5 border border-[#2a2a3a] rounded-lg text-sm font-bold text-[#888899] hover:text-white hover:border-[#7c6aff]"
            onClick={onReload}>{t('posts.reload')}</button>
          <button className="px-5 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6]"
            onClick={onNewPost}>{t('posts.new')}</button>
        </div>
      </div>
      {loading && <p className="text-[#888899] font-mono text-sm">{t('posts.loading')}</p>}
      {!loading && posts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <span className="text-6xl">+</span>
          <p className="font-bold">{t('posts.empty')}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post: any) => (
          <div key={post.id} onClick={() => onEditPost(post)}
            className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 flex flex-col gap-3 hover:border-[#7c6aff] transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono px-3 py-1 rounded-full font-semibold
                ${post.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {post.status === 'published' ? t('posts.published') : t('posts.draft')}
              </span>
              <span className="text-xs text-[#888899] font-mono">
                {new Date(post.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h3 className="font-bold text-base leading-tight group-hover:text-[#7c6aff] transition-colors">{post.title}</h3>
            <p className="text-xs text-[#7c6aff] font-mono">{post.slug}</p>
            {post.excerpt && <p className="text-sm text-[#888899] leading-relaxed">{post.excerpt}</p>}
            <p className="text-xs text-[#555566] font-mono mt-auto">{t('posts.clickToEdit')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
