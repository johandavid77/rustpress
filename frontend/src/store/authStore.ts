import { create } from 'zustand';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  setAuth: (user, token) => { localStorage.setItem('access_token', token); set({ user, token }); },
  clearAuth: () => { localStorage.removeItem('access_token'); set({ user: null, token: null }); },
  logout: () => { localStorage.removeItem('access_token'); set({ user: null, token: null }); },
}));
