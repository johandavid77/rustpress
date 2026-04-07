import { apiClient } from './client'

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  is_enabled: boolean
  config: {
    title: string
    icon: string
    color: string
    category: 'content' | 'ecommerce' | 'integrations' | 'system'
    badge?: string
  }
  installed_at: string
}

export const pluginsApi = {
  list:         ()                            => apiClient.get<Plugin[]>('/plugins'),
  enable:       (id: string)                  => apiClient.post<Plugin>(`/plugins/${id}/enable`),
  disable:      (id: string)                  => apiClient.post<Plugin>(`/plugins/${id}/disable`),
  getConfig:    (id: string)                  => apiClient.get(`/plugins/${id}/config`),
  updateConfig: (id: string, config: unknown) => apiClient.put(`/plugins/${id}/config`, { config }),
  delete:       (id: string)                  => apiClient.delete(`/plugins/${id}`),
}
