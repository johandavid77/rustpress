import { apiClient } from './client';
import type { AuthResponse, LoginDto, RegisterDto } from '../types/auth';

export const authApi = {
  login:    (dto: LoginDto)    => apiClient.post<AuthResponse>('/auth/login', dto),
  register: (dto: RegisterDto) => apiClient.post<AuthResponse>('/auth/register', dto),
  me:       ()                 => apiClient.get<AuthResponse['user']>('/auth/me'),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
};
