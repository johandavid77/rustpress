import { useState, useEffect } from 'react'
import { menusApi, Menu, MenuItem, CreateMenuDto, CreateMenuItemDto } from '../../api/menus'
import { Plus, Trash2, Edit2, X, Check, ChevronDown, ChevronRight, Menu as MenuIcon, Link } from 'lucide-react'

type AdminView = 'list' | 'menu-form' | 'menu-items'

export default function MenusAdmin() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<AdminView>('list')
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const [menuForm, setMenuForm] = useState<CreateMenuDto>({
    name: '', slug: '', description: '', is_active: true
  })

  // Items state
  const [items, setItems] = useState<MenuItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)
  const [itemForm, setItemForm] = useState<CreateMenuItemDto>({
    menu_id: '', parent_id: null, label: '', url: '', order_index: 0, is_active: true
  })

  useEffect(() => { loadMenus() }, [])

  const loadMenus = async () => {
    setLoading(true)
    try {
      const res = await menusApi.getAll()
      setMenus(Array.isArray(res) ? res : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadItems = async (menuId: string) => {
    setLoadingItems(true)
    try {
      const res = await menusApi.getItems(menuId)
      setItems(Array.isArray(res) ? res : [])
    } catch (e) { console.error(e) }
    finally { setLoadingItems(false) }
  }

  const resetMenuForm = () => {
    setMenuForm({ name: '', slug: '', description: '', is_active: true })
    setEditingMenuId(null)
    setView('list')
  }

  const handleMenuSubmit = async () => {
    if (!menuForm.name || !menuForm.slug) return
    try {
      if (editingMenuId) {
        await menusApi.update(editingMenuId, menuForm)
      } else {
        await menusApi.create(menuForm)
      }
      resetMenuForm()
      loadMenus()
    } catch (e) { console.error(e) }
  }

  const handleEditMenu = (menu: Menu) => {
    setMenuForm({
      name: menu.name,
      slug: menu.slug,
      description: menu.description ?? '',
      is_active: menu.is_active,
    })
    setEditingMenuId(menu.id)
    setView('menu-form')
  }

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('¿Eliminar este menú y todos sus ítems?')) return
    try { await menusApi.delete(id); loadMenus() } catch (e) { console.error(e) }
  }

  const handleManageItems = (menu: Menu) => {
    setSelectedMenu(menu)
    setItemForm({ menu_id: menu.id, parent_id: null, label: '', url: '', order_index: 0, is_active: true })
    setView('menu-items')
    loadItems(menu.id)
  }

  const resetItemForm = () => {
    if (!selectedMenu) return
    setItemForm({ menu_id: selectedMenu.id, parent_id: null, label: '', url: '', order_index: items.length, is_active: true })
    setEditingItemId(null)
    setShowItemForm(false)
  }

  const handleItemSubmit = async () => {
    if (!itemForm.label || !itemForm.url) return
    try {
      if (editingItemId) {
        await menusApi.updateItem(editingItemId, itemForm)
      } else {
        await menusApi.createItem({ ...itemForm, order_index: items.length })
      }
      resetItemForm()
      loadItems(selectedMenu!.id)
    } catch (e) { console.error(e) }
  }

  const handleEditItem = (item: MenuItem) => {
    setItemForm({
      menu_id: item.menu_id,
      parent_id: item.parent_id,
      label: item.label,
      url: item.url,
      order_index: item.order_index,
      is_active: item.is_active,
    })
    setEditingItemId(item.id)
    setShowItemForm(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este ítem?')) return
    try { await menusApi.deleteItem(id); loadItems(selectedMenu!.id) } catch (e) { console.error(e) }
  }

  const slugify = (val: string) =>
    val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  // ── VISTA: Lista de menús ──
  if (view === 'list') return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">Menús de Navegación</h1>
          <p className="text-[#888899] text-sm">Gestiona los menús del sitio público</p>
        </div>
        <button
          onClick={() => setView('menu-form')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] transition-colors"
        >
          <Plus size={16} /> Nuevo Menú
        </button>
      </div>

      {loading && <p className="text-[#888899] font-mono text-sm">Cargando menús...</p>}

      {!loading && menus.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <span className="text-6xl">☰</span>
          <p className="font-bold">No hay menús aún</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {menus.map(menu => (
          <div key={menu.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all">
            <MenuIcon size={16} className="text-[#444455] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm truncate">{menu.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${menu.is_active ? 'bg-green-500/10 text-green-400' : 'bg-[#2a2a3a] text-[#888899]'}`}>
                  {menu.is_active ? 'activo' : 'inactivo'}
                </span>
              </div>
              <p className="text-xs text-[#7c6aff] font-mono">/{menu.slug}</p>
              {menu.description && <p className="text-xs text-[#888899] truncate mt-0.5">{menu.description}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleManageItems(menu)}
                className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all"
                title="Gestionar ítems"
              >
                <Link size={15} />
              </button>
              <button
                onClick={() => handleEditMenu(menu)}
                className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all"
                title="Editar menú"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={() => handleDeleteMenu(menu.id)}
                className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all"
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // ── VISTA: Formulario de menú ──
  if (view === 'menu-form') return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black tracking-tight">{editingMenuId ? 'Editar Menú' : 'Nuevo Menú'}</h1>
        <button onClick={resetMenuForm} className="text-[#888899] hover:text-white"><X size={20} /></button>
      </div>

      <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className="text-xs text-[#888899] font-mono mb-1 block">Nombre *</label>
          <input
            value={menuForm.name}
            onChange={e => setMenuForm({ ...menuForm, name: e.target.value, slug: slugify(e.target.value) })}
            placeholder="Menú principal"
            className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#888899] font-mono mb-1 block">Slug *</label>
          <input
            value={menuForm.slug}
            onChange={e => setMenuForm({ ...menuForm, slug: slugify(e.target.value) })}
            placeholder="menu-principal"
            className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-[#888899] font-mono mb-1 block">Descripción</label>
          <input
            value={menuForm.description}
            onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
            placeholder="Descripción opcional"
            className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={menuForm.is_active}
            onChange={e => setMenuForm({ ...menuForm, is_active: e.target.checked })}
            className="w-4 h-4 accent-[#7c6aff]"
          />
          <span className="text-sm">Activo</span>
        </label>

        <div className="flex gap-2 mt-2">
          <button onClick={handleMenuSubmit} className="flex items-center gap-2 px-4 py-2 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6]">
            <Check size={14} /> {editingMenuId ? 'Guardar' : 'Crear'}
          </button>
          <button onClick={resetMenuForm} className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm text-[#888899] hover:text-white">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )

  // ── VISTA: Ítems del menú ──
  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <button onClick={() => { setView('list'); setSelectedMenu(null) }} className="text-xs text-[#7c6aff] font-mono mb-2 hover:underline">
            ← Volver a menús
          </button>
          <h1 className="text-4xl font-black tracking-tight mb-1">{selectedMenu?.name}</h1>
          <p className="text-[#888899] text-sm font-mono">/{selectedMenu?.slug}</p>
        </div>
        <button
          onClick={() => { resetItemForm(); setShowItemForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6] transition-colors"
        >
          <Plus size={16} /> Nuevo Ítem
        </button>
      </div>

      {showItemForm && (
        <div className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">{editingItemId ? 'Editar Ítem' : 'Nuevo Ítem'}</h2>
            <button onClick={resetItemForm} className="text-[#888899] hover:text-white"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">Etiqueta *</label>
              <input
                value={itemForm.label}
                onChange={e => setItemForm({ ...itemForm, label: e.target.value })}
                placeholder="Inicio"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">URL *</label>
              <input
                value={itemForm.url}
                onChange={e => setItemForm({ ...itemForm, url: e.target.value })}
                placeholder="/"
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-[#888899] font-mono mb-1 block">Orden</label>
              <input
                type="number"
                value={itemForm.order_index}
                onChange={e => setItemForm({ ...itemForm, order_index: parseInt(e.target.value) })}
                className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm focus:border-[#7c6aff] outline-none"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.is_active}
                  onChange={e => setItemForm({ ...itemForm, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#7c6aff]"
                />
                <span className="text-sm">Activo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleItemSubmit} className="flex items-center gap-2 px-4 py-2 bg-[#7c6aff] rounded-lg text-sm font-bold hover:bg-[#6b5be6]">
              <Check size={14} /> {editingItemId ? 'Guardar' : 'Agregar'}
            </button>
            <button onClick={resetItemForm} className="px-4 py-2 border border-[#2a2a3a] rounded-lg text-sm text-[#888899] hover:text-white">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loadingItems && <p className="text-[#888899] font-mono text-sm">Cargando ítems...</p>}

      {!loadingItems && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 opacity-30">
          <span className="text-5xl">🔗</span>
          <p className="font-bold">No hay ítems en este menú</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map(item => (
          <div key={item.id} className="bg-[#111118] border border-[#2a2a3a] rounded-xl p-4 flex items-center gap-4 hover:border-[#3a3a4a] transition-all">
            <ChevronRight size={14} className="text-[#444455] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-bold text-sm">{item.label}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${item.is_active ? 'bg-green-500/10 text-green-400' : 'bg-[#2a2a3a] text-[#888899]'}`}>
                  {item.is_active ? 'activo' : 'inactivo'}
                </span>
              </div>
              <p className="text-xs text-[#7c6aff] font-mono">{item.url}</p>
            </div>
            <p className="text-xs text-[#555566] font-mono flex-shrink-0">orden: {item.order_index}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => handleEditItem(item)} className="p-2 text-[#888899] hover:text-[#7c6aff] rounded-lg hover:bg-[#1a1a24] transition-all">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-[#888899] hover:text-red-400 rounded-lg hover:bg-[#1a1a24] transition-all">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
