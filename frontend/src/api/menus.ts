import { apiClient } from './client'

export interface MenuItem {
  id: string
  menu_id: string
  parent_id: string | null
  label: string
  url: string
  order_index: number
  is_active: boolean
  children?: MenuItem[]
}

export interface Menu {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  items?: MenuItem[]
}

export interface CreateMenuDto {
  name: string
  slug: string
  description?: string
  is_active: boolean
}

export interface CreateMenuItemDto {
  menu_id: string
  parent_id?: string | null
  label: string
  url: string
  order_index: number
  is_active: boolean
}

export const menusApi = {
  getAll: () =>
    apiClient.get<Menu[]>('/menus'),

  getOne: (id: string) =>
    apiClient.get<Menu>(`/menus/${id}`),

  getBySlug: (slug: string) =>
    apiClient.get<Menu>(`/menus/slug/${slug}`),

  create: (data: CreateMenuDto) =>
    apiClient.post<Menu>('/menus', data),

  update: (id: string, data: Partial<CreateMenuDto>) =>
    apiClient.put<Menu>(`/menus/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/menus/${id}`),

  // Menu Items
  getItems: (menuId: string) =>
    apiClient.get<MenuItem[]>(`/menu-items?menu_id=${menuId}`),

  createItem: (data: CreateMenuItemDto) =>
    apiClient.post<MenuItem>('/menu-items', data),

  updateItem: (id: string, data: Partial<CreateMenuItemDto>) =>
    apiClient.put<MenuItem>(`/menu-items/${id}`, data),

  deleteItem: (id: string) =>
    apiClient.delete(`/menu-items/${id}`),
}
