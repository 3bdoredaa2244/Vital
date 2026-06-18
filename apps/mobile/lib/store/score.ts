/**
 * VITAL Score store — caches the user's current score and history so the
 * dashboard and score screen can render instantly and refresh on demand.
 */
import type { ScoreHistoryPoint, VitalScore } from '@vital/shared';
import { create } from 'zustand';

import { scoreApi } from '../api';

interface ScoreState {
  score: VitalScore | null;
  history: ScoreHistoryPoint[];
  loaded: boolean;
  loading: boolean;
  fetch: (force?: boolean) => Promise<void>;
  clear: () => void;
}

export const useScoreStore = create<ScoreState>((set, get) => ({
  score: null,
  history: [],
  loaded: false,
  loading: false,

  fetch: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;
    set({ loading: true });
    try {
      const [{ score }, { history }] = await Promise.all([scoreApi.get(), scoreApi.history()]);
      set({ score, history, loaded: true });
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  clear: () => set({ score: null, history: [], loaded: false }),
}));
