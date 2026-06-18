/**
 * Auth/session store. Holds the current user + auth status and bridges the
 * secure-store token helpers with the API.
 */
import type { User } from '@vital/shared';
import { create } from 'zustand';

import { authApi, userApi } from '../api';
import { clearSession, getAccessToken, setSession } from '../auth';
import { registerForPushNotifications, resetPushRegistration } from '../push';
import { useScoreStore } from './score';

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  applySession: (accessToken: string, refreshToken?: string, user?: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  setUser: (user) => set({ user }),

  hydrate: async () => {
    set({ status: 'loading' });
    const token = await getAccessToken();
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const { user } = await userApi.me();
      set({ user, status: 'authenticated' });
      void registerForPushNotifications();
    } catch {
      await clearSession();
      set({ status: 'unauthenticated', user: null });
    }
  },

  refreshUser: async () => {
    try {
      const { user } = await userApi.me();
      set({ user });
    } catch {
      /* keep stale user on transient errors */
    }
  },

  applySession: async (accessToken, refreshToken, user) => {
    await setSession(accessToken, refreshToken);
    if (user) {
      set({ user, status: 'authenticated' });
    } else {
      const me = await userApi.me();
      set({ user: me.user, status: 'authenticated' });
    }
    void registerForPushNotifications();
  },

  signOut: async () => {
    await authApi.logout().catch(() => undefined);
    await clearSession();
    resetPushRegistration();
    useScoreStore.getState().clear();
    set({ user: null, status: 'unauthenticated' });
  },
}));
