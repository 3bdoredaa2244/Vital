/**
 * Library data store — fetches the full biomarker list (with the user's latest
 * results + computed status) and categories once, then serves client-side
 * filtering/search/sort. Refetched after a manual result is added.
 */
import type { BiomarkerCategory, BiomarkerWithResult } from '@vital/shared';
import { create } from 'zustand';

import { biomarkerApi } from '../api';

interface LibraryState {
  biomarkers: BiomarkerWithResult[];
  categories: BiomarkerCategory[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: (force?: boolean) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  biomarkers: [],
  categories: [],
  loaded: false,
  loading: false,
  error: null,

  fetch: async (force = false) => {
    if (get().loading) return;
    if (get().loaded && !force) return;
    set({ loading: true, error: null });
    try {
      const data = await biomarkerApi.list({ limit: 200, offset: 0 });
      // The list endpoint returns categories separately; attach each
      // biomarker's category so screens can filter/sort by slug + color.
      const byId = new Map(data.categories.map((c) => [c.id, c]));
      const enriched = data.biomarkers.map((b) => ({
        ...b,
        category: b.category ?? byId.get(b.category_id),
      }));
      set({
        biomarkers: enriched,
        categories: data.categories,
        loaded: true,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load biomarkers' });
    } finally {
      set({ loading: false });
    }
  },
}));
