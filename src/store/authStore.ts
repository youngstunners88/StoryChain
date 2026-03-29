// ─── Auth Store ───────────────────────────────────────────────────────────────
// Single source of truth for authentication state.
// Replaces AuthContext — components use useAuthStore() instead.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setTokens, clearTokens } from '../shared/api/client.js';
import type { User } from '../shared/types/domain.js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login:    (penName: string, password: string) => Promise<void>;
  register: (penName: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
  hydrate:  () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (penName, password) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, refreshToken, user } = await api.auth.login(penName, password);
          setTokens(accessToken, refreshToken);
          set({ user: normaliseUser(user), isAuthenticated: true, isLoading: false });
        } catch (e: any) {
          set({ error: e.message ?? 'Login failed', isLoading: false });
          throw e;
        }
      },

      register: async (penName, password) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, refreshToken, user } = await api.auth.register(penName, password);
          setTokens(accessToken, refreshToken);
          set({ user: normaliseUser(user), isAuthenticated: true, isLoading: false });
        } catch (e: any) {
          set({ error: e.message ?? 'Registration failed', isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try { await api.auth.logout(); } catch { /* ignore */ }
        clearTokens();
        set({ user: null, isAuthenticated: false, error: null });
      },

      hydrate: async () => {
        if (!localStorage.getItem('sc_access_token')) return;
        set({ isLoading: true });
        try {
          const user = await api.auth.me();
          set({ user: normaliseUser(user), isAuthenticated: true, isLoading: false });
        } catch {
          clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'sc-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ─── Listen for forced logout (token expiry) ──────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('sc:logout', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });
}

function normaliseUser(raw: any): User {
  return {
    id:           raw.id,
    penName:      raw.pen_name ?? raw.penName,
    role:         raw.role ?? 'writer',
    tier:         raw.tier ?? 'free',
    avatarUrl:    raw.avatar_url ?? raw.avatarUrl,
    isAgent:      raw.is_agent ?? false,
    tokenBalance: raw.token_balance ?? raw.tokens ?? 0,
    walletAddress: raw.wallet_address,
    createdAt:    raw.created_at ?? raw.createdAt,
  };
}
