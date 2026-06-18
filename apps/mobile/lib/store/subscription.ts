/**
 * Subscription store — caches the user's active subscription so screens can
 * gate biomarker data without refetching on every navigation.
 */
import type { SubscriptionWithPlan } from '@vital/shared';
import { create } from 'zustand';

import { subscriptionApi } from '../api';

interface SubscriptionState {
  subscription: SubscriptionWithPlan | null;
  loaded: boolean;
  loading: boolean;
  fetch: () => Promise<void>;
  hasActive: () => boolean;
  clear: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  loaded: false,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const { subscription } = await subscriptionApi.mine();
      set({ subscription, loaded: true });
    } catch {
      set({ subscription: null, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  hasActive: () => {
    const sub = get().subscription;
    return !!sub && sub.status === 'active' && new Date(sub.expires_at) > new Date();
  },

  clear: () => set({ subscription: null, loaded: false }),
}));
