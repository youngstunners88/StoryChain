// Custom hook for making authenticated API calls
import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';

interface ApiError {
  error: string;
  code?: string;
  requestId?: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export const useApi = () => {
  const { fetchWithAuth, token } = useAuth();

  const get = useCallback(async <T,>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithAuth(`/api${endpoint}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        return {
          data: null,
          error: {
            error: error.error || `HTTP ${response.status}`,
            code: error.code,
            requestId: error.requestId,
          },
          loading: false,
        };
      }

      const data = await response.json();
      return { data, error: null, loading: false };
    } catch (err) {
      return {
        data: null,
        error: {
          error: err instanceof Error ? err.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        loading: false,
      };
    }
  }, [fetchWithAuth]);

  const post = useCallback(async <T,>(endpoint: string, body: unknown): Promise<ApiResponse<T>> => {
    try {
      const response = await fetchWithAuth(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        return {
          data: null,
          error: {
            error: error.error || `HTTP ${response.status}`,
            code: error.code,
            requestId: error.requestId,
          },
          loading: false,
        };
      }

      const data = await response.json();
      return { data, error: null, loading: false };
    } catch (err) {
      return {
        data: null,
        error: {
          error: err instanceof Error ? err.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
        loading: false,
      };
    }
  }, [fetchWithAuth]);

  const isAuthenticated = !!token;

  return { get, post, isAuthenticated, token };
};

export default useApi;
