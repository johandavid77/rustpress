import { apiClient } from "./client"
import type { User } from "../types/auth"

export interface UpdateUserDto {
  username?: string
  email?: string
  role_id?: string | null
  is_active?: boolean
}

export const usersApi = {
  getAll: () => apiClient.get("/users"),
  getOne: (id: string) => apiClient.get(`/users/${id}`),
  update: (id: string, data: UpdateUserDto) => apiClient.put(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  approve: (id: string) => apiClient.put(`/users/${id}`, { is_active: true }),
  deactivate: (id: string) => apiClient.put(`/users/${id}`, { is_active: false }),
}
