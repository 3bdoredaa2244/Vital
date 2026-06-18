'use client';

/**
 * Client-side admin auth. Logs in via the API, verifies the user's role is
 * 'admin', and exposes the session to the dashboard. Tokens live in
 * localStorage (admin is an internal tool on trusted devices).
 */
import type { User } from '@vital/shared';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { ApiError, api, clearToken, getToken, setToken } from './api';

interface AuthState {
  user: User | null;
  status: 'loading' | 'authed' | 'anon';
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('anon');
      return;
    }
    api
      .me()
      .then(({ user }) => {
        if (user.role === 'admin') {
          setUser(user);
          setStatus('authed');
        } else {
          clearToken();
          setStatus('anon');
        }
      })
      .catch(() => {
        clearToken();
        setStatus('anon');
      });
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await api.login(email, password);
    setToken(access_token);
    const { user } = await api.me();
    if (user.role !== 'admin') {
      clearToken();
      throw new ApiError('forbidden', 'This account is not an administrator', 403);
    }
    setUser(user);
    setStatus('authed');
    router.replace('/');
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setStatus('anon');
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
