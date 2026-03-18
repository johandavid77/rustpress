import { apiClient } from './client'
import { Slider, CreateSliderDto, UpdateSliderDto } from '../types/slider'

export const slidersApi = {
  getAll: () =>
    apiClient.get<Slider[]>('/sliders'),

  getOne: (id: string) =>
    apiClient.get<Slider>(`/sliders/${id}`),

  create: (data: CreateSliderDto) =>
    apiClient.post<Slider>('/sliders', data),

  update: (id: string, data: UpdateSliderDto) =>
    apiClient.put<Slider>(`/sliders/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/sliders/${id}`),

  reorder: (items: { id: string; order_index: number }[]) =>
    apiClient.post('/sliders/reorder', items),
}
