/**
 * Add-on selection store. Holds the extra markers a customer has ticked on the
 * Add-ons page so the Book-a-Test screen can show the running total and charge
 * for them at checkout. Cleared once the add-on order is paid (or the booking
 * is made without add-ons).
 */
import { create } from 'zustand';

interface AddonSelectionState {
  selected: string[]; // biomarker ids
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  clear: () => void;
}

export const useAddonStore = create<AddonSelectionState>((set, get) => ({
  selected: [],
  toggle: (id) =>
    set((s) => ({
      selected: s.selected.includes(id)
        ? s.selected.filter((x) => x !== id)
        : [...s.selected, id],
    })),
  isSelected: (id) => get().selected.includes(id),
  clear: () => set({ selected: [] }),
}));
