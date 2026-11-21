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

function getStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && typeof u === 'object') {
      const rawRole = (u as Record<string, unknown>).role as { name?: string } | string | undefined;
      const role =
        typeof rawRole === 'string'
          ? rawRole
          : rawRole?.name || ((u as Record<string, unknown>).roleId === 1 ? 'admin' : 'user');
      return {
        id: String(u.id),
        username: String(u.username),
        email: String(u.email),
        role: role as 'user' | 'admin',
      };
    }
  } catch {
    // Ignore JSON error
  }
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: getStoredUser(),
  isInitialized: false,
  isLoading: true,

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isInitialized: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
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
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, isInitialized: true, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ token: null, user: null, isInitialized: true, isLoading: false });
    }
  },
}));
