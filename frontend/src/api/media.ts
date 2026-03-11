import { apiClient } from './client';
import type { MediaFile } from '../types/media';

export const mediaApi = {
  list:   (params?: Record<string, unknown>) => apiClient.get<{ data: MediaFile[] }>('/media', { params }),
  get:    (id: string) => apiClient.get<MediaFile>(`/media/${id}`),
  upload: (files: File[]) => {
    const form = new FormData();
    files.forEach(f => form.append('file', f));
    return apiClient.post<MediaFile[]>('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id: string) => apiClient.delete(`/media/${id}`),
};
