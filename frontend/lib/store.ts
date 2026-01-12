/**
 * Zustand store for J-Flash application state
 * Additional state will be added in Epic 2-4
 */

import { create } from "zustand";

interface AppState {
  // App-wide loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  // Loading state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
