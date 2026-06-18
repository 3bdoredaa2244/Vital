/**
 * Biomarker library UI state — persists the selected category filter, status
 * filter, sort, search term, and view mode across navigation.
 */
import type { BiomarkerStatus } from '@vital/shared';
import { create } from 'zustand';

export type StatusFilter = 'all' | BiomarkerStatus;
export type SortKey = 'name' | 'category' | 'last_tested' | 'status';
export type ViewMode = 'grid' | 'list';

interface BiomarkerUiState {
  category: string; // 'all' or a category slug
  status: StatusFilter;
  sort: SortKey;
  search: string;
  view: ViewMode;
  setCategory: (category: string) => void;
  setStatus: (status: StatusFilter) => void;
  setSort: (sort: SortKey) => void;
  setSearch: (search: string) => void;
  toggleView: () => void;
  reset: () => void;
}

export const useBiomarkerStore = create<BiomarkerUiState>((set) => ({
  category: 'all',
  status: 'all',
  sort: 'category',
  search: '',
  view: 'list',
  setCategory: (category) => set({ category }),
  setStatus: (status) => set({ status }),
  setSort: (sort) => set({ sort }),
  setSearch: (search) => set({ search }),
  toggleView: () => set((s) => ({ view: s.view === 'grid' ? 'list' : 'grid' })),
  reset: () => set({ category: 'all', status: 'all', sort: 'category', search: '' }),
}));
