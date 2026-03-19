import { apiClient } from './client'

export interface MediaFile {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  url: string
  uploaded_by: string
  created_at: string
}

export interface MediaListResponse {
  data: MediaFile[]
  page: number
}

export const mediaApi = {
  list: (page = 1, mime_type?: string) =>
    apiClient.get<MediaListResponse>('/media', {
      params: { page, per_page: 30, ...(mime_type ? { mime_type } : {}) }
    }),

  upload: (files: File[]) => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    return apiClient.post<MediaFile[]>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  delete: (id: string) => apiClient.delete(`/media/${id}`),
}

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const isImage = (mime: string) => mime.startsWith('image/')
