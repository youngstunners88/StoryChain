import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  penName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (penName: string) => void;
  logout: () => void;
  updatePenName: (newName: string) => void;
  getAuthHeaders: () => Record<string, string>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'storychain_auth_token';
const PENNAME_KEY = 'storychain_pen_name';

function generateToken(penName: string): string {
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `${penName.toLowerCase().replace(/\s+/g, '_')}_${rand}`.slice(0, 48).padEnd(24, 'x');
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [penName, setPenName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedName = localStorage.getItem(PENNAME_KEY);
    if (storedToken) setToken(storedToken);
    if (storedName) setPenName(storedName);
    setIsLoading(false);
  }, []);

  const login = (name: string) => {
    const newToken = generateToken(name);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(PENNAME_KEY, name);
    setToken(newToken);
    setPenName(name);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PENNAME_KEY);
    setToken(null);
    setPenName(null);
  };

  const updatePenName = (newName: string) => {
    localStorage.setItem(PENNAME_KEY, newName);
    setPenName(newName);
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = { ...getAuthHeaders() };
    if (options.headers) {
      const extra = options.headers as Record<string, string>;
      for (const [k, v] of Object.entries(extra)) headers[k] = v;
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{
      token, penName,
      isAuthenticated: !!token,
      isLoading,
      login, logout, updatePenName,
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
