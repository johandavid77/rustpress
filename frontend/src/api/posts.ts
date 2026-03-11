import { apiClient } from './client';
import type { Post, CreatePostDto, UpdatePostDto, PostListResponse } from '../types/post';

export const postsApi = {
  list:      (params?: Record<string, unknown>) => apiClient.get<PostListResponse>('/posts', { params }),
  get:       (id: string)               => apiClient.get<Post>(`/posts/${id}`),
  create:    (dto: CreatePostDto)       => apiClient.post<Post>('/posts', dto),
  update:    (id: string, dto: UpdatePostDto) => apiClient.put<Post>(`/posts/${id}`, dto),
  delete:    (id: string)               => apiClient.delete(`/posts/${id}`),
  publish:   (id: string)               => apiClient.post<Post>(`/posts/${id}/publish`),
  unpublish: (id: string)               => apiClient.post<Post>(`/posts/${id}/unpublish`),
};
