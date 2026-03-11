import { apiClient } from './client';
import type { Plugin } from '../types/plugin';

export const pluginsApi = {
  list:         ()                            => apiClient.get<Plugin[]>('/plugins'),
  enable:       (id: string)                  => apiClient.post<Plugin>(`/plugins/${id}/enable`),
  disable:      (id: string)                  => apiClient.post<Plugin>(`/plugins/${id}/disable`),
  getConfig:    (id: string)                  => apiClient.get(`/plugins/${id}/config`),
  updateConfig: (id: string, config: unknown) => apiClient.put(`/plugins/${id}/config`, { config }),
  delete:       (id: string)                  => apiClient.delete(`/plugins/${id}`),
};
