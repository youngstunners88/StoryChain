import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyPhone: (phone: string, code: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  userType: 'PASSENGER' | 'DRIVER';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet(['token', 'user']);
      
      if (storedToken[1] && storedUser[1]) {
        setToken(storedToken[1]);
        setUser(JSON.parse(storedUser[1]));
        api.setToken(storedToken[1]);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.login(email, password);
    await handleAuthSuccess(response);
  }

  async function loginWithPhone(phone: string) {
    await api.loginWithPhone(phone);
  }

  async function verifyPhone(phone: string, code: string) {
    const response = await api.verifyPhone(phone, code);
    await handleAuthSuccess(response);
  }

  async function register(data: RegisterData) {
    const response = await api.register(data);
    await handleAuthSuccess(response);
  }

  async function handleAuthSuccess(response: { token: string; user: User }) {
    await AsyncStorage.multiSet([
      ['token', response.token],
      ['user', JSON.stringify(response.user)],
    ]);
    setToken(response.token);
    setUser(response.user);
    api.setToken(response.token);
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
    api.setToken(null);
  }

  async function updateProfile(data: Partial<User>) {
    const updatedUser = await api.updateProfile(data);
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginWithPhone,
        verifyPhone,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
