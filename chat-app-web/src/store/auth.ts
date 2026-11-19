import { create } from 'zustand';
import type { UserInfo } from '../types';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isInitialized: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isInitialized: false,
  isLoading: true,

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user, isInitialized: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, isInitialized: true, isLoading: false });
  },

  initialize: async () => {
    if (get().isInitialized) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ isInitialized: true, isLoading: false });
      return;
    }
    // Set token first so the interceptor can attach it
    set({ token });
    try {
      // Dynamic import to avoid circular dependency at module level
      const { usersApi } = await import('../api/users');
      const user = await usersApi.getMe();
      set({ user, isInitialized: true, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      set({ token: null, user: null, isInitialized: true, isLoading: false });
    }
  },
}));
