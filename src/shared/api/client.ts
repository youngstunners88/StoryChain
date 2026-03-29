// ─── Typed API Client — Abstraction Layer ─────────────────────────────────────
// All HTTP calls go through here. Never call fetch() directly in components.
// Handles: auth headers, token refresh, error normalisation, type safety.

import type { ApiError } from '../types/domain.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = '';  // Same origin — Hono serves API + frontend

// ─── Token management (kept in memory + localStorage) ─────────────────────────

let _accessToken: string | null = localStorage.getItem('sc_access_token');
let _refreshToken: string | null = localStorage.getItem('sc_refresh_token');
let _refreshPromise: Promise<boolean> | null = null;

export function setTokens(access: string, refresh: string): void {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem('sc_access_token', access);
  localStorage.setItem('sc_refresh_token', refresh);
}

export function clearTokens(): void {
  _accessToken = null;
  _refreshToken = null;
  localStorage.removeItem('sc_access_token');
  localStorage.removeItem('sc_refresh_token');
}

export function getAccessToken(): string | null { return _accessToken; }

async function refreshAccessToken(): Promise<boolean> {
  if (!_refreshToken) return false;
  if (_refreshPromise) return _refreshPromise;  // deduplicate concurrent refresh attempts

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: _refreshToken }),
      });
      if (!res.ok) { clearTokens(); return false; }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken ?? _refreshToken!);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ─── Core request function ────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, skipRefresh, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> ?? {}),
  };

  if (!skipAuth && _accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !skipRefresh && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...options, skipRefresh: true });
    }
    // Force logout via storage event
    clearTokens();
    window.dispatchEvent(new Event('sc:logout'));
    throw normaliseError({ code: 'AUTH_EXPIRED', message: 'Session expired', status: 401 });
  }

  if (!res.ok) {
    let errBody: any = {};
    try { errBody = await res.json(); } catch { /* empty body */ }
    throw normaliseError({
      code: errBody?.code ?? 'REQUEST_FAILED',
      message: errBody?.error ?? errBody?.message ?? `HTTP ${res.status}`,
      status: res.status,
    });
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

function normaliseError(e: ApiError): ApiError { return e; }

// ─── Typed endpoint namespaces ────────────────────────────────────────────────

export const authApi = {
  login: (penName: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ penName, password }),
      skipAuth: true,
    }),

  register: (penName: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ penName, password }),
      skipAuth: true,
    }),

  logout: () =>
    request<void>('/api/auth/logout', { method: 'POST' }),

  me: () =>
    request<any>('/api/auth/me'),
};

export const storiesApi = {
  list: (page = 1, genre?: string) =>
    request<any>(`/api/stories?page=${page}${genre ? `&genre=${genre}` : ''}`),

  get: (id: string) =>
    request<any>(`/api/stories/${id}`),

  create: (payload: { title?: string; genre: string; seed?: string }) =>
    request<any>('/api/stories', { method: 'POST', body: JSON.stringify(payload) }),

  contribute: (storyId: string, content: string) =>
    request<any>(`/api/stories/${storyId}/contributions`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  completed: () =>
    request<any>('/api/stories/completed'),

  book: (id: string) =>
    request<any>(`/api/stories/${id}/book`),

  updateBook: (id: string, meta: any) =>
    request<any>(`/api/stories/${id}/book`, { method: 'PUT', body: JSON.stringify(meta) }),
};

export const writersApi = {
  list: () => request<any>('/api/writers'),

  me: () => request<any>('/api/writers/me'),

  ensureMe: () => request<any>('/api/writers/me/ensure', { method: 'POST' }),

  update: (payload: any) =>
    request<any>('/api/writers/me', { method: 'PUT', body: JSON.stringify(payload) }),

  get: (id: string) => request<any>(`/api/writers/${id}`),
};

export const messagingApi = {
  threads: () => request<any>('/api/messages/threads'),

  messages: (partnerId: string) =>
    request<any>(`/api/messages/${partnerId}`),

  send: (partnerId: string, content: string) =>
    request<any>(`/api/messages/${partnerId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

export const notificationsApi = {
  list: () => request<any>('/api/notifications'),
  markRead: (id: string) =>
    request<any>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    request<any>('/api/notifications/read-all', { method: 'PUT' }),
};

export const blockchainApi = {
  balance: () => request<any>('/api/blockchain/balance'),
  earnings: () => request<any>('/api/blockchain/earnings'),
  claimPayout: () => request<any>('/api/blockchain/claim', { method: 'POST' }),
  mintStory: (storyId: string) =>
    request<any>(`/api/blockchain/mint/${storyId}`, { method: 'POST' }),
};

export const providerApi = {
  status: () => request<any>('/api/providers/status', { skipAuth: true }),
};

// ─── Convenience re-export ────────────────────────────────────────────────────

export const api = {
  auth:          authApi,
  stories:       storiesApi,
  writers:       writersApi,
  messaging:     messagingApi,
  notifications: notificationsApi,
  blockchain:    blockchainApi,
  providers:     providerApi,
} as const;

export default api;
