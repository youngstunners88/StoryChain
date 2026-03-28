import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  id: string;
  penName: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  penName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (penName: string, password: string) => Promise<{ error?: string }>;
  register: (penName: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updatePenName: (newName: string) => void;
  getAuthHeaders: () => Record<string, string>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'storychain_auth_token';
const REFRESH_KEY = 'storychain_refresh_token';
const USER_KEY = 'storychain_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const storeSession = (accessToken: string, refreshToken: string, userData: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const register = async (penName: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penName, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Registration failed' };
      storeSession(data.accessToken, data.refreshToken, data.user);
      return {};
    } catch {
      return { error: 'Network error — please try again' };
    }
  };

  const login = async (penName: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penName, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Login failed' };
      storeSession(data.accessToken, data.refreshToken, data.user);
      return {};
    } catch {
      return { error: 'Network error — please try again' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } finally {
      clearSession();
    }
  };

  const refreshSession = async (): Promise<string | null> => {
    const rt = localStorage.getItem(REFRESH_KEY);
    if (!rt) return null;
    try {
      const res = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { clearSession(); return null; }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      setToken(data.accessToken);
      return data.accessToken;
    } catch {
      return null;
    }
  };

  const updatePenName = (newName: string) => {
    if (user) {
      const updated = { ...user, penName: newName };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const makeRequest = (t: string | null) => {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (t) headers['Authorization'] = `Bearer ${t}`;
      if (options.headers) {
        const extra = options.headers as Record<string, string>;
        for (const [k, v] of Object.entries(extra)) headers[k] = v;
      }
      return fetch(url, { ...options, headers });
    };

    const res = await makeRequest(token);
    // Auto-refresh on 401
    if (res.status === 401 && token) {
      const newToken = await refreshSession();
      if (newToken) return makeRequest(newToken);
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{
      token, user,
      penName: user?.penName ?? null,
      isAuthenticated: !!token,
      isLoading,
      login, register, logout, updatePenName,
      getAuthHeaders, fetchWithAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
