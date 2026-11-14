import { create } from 'zustand';
import type { ExplanationLevel } from '@/types/simulation';

interface UiState {
  explanationLevel: ExplanationLevel;
  mobileNavOpen: boolean;
  setExplanationLevel: (level: ExplanationLevel) => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  explanationLevel: 'simple',
  mobileNavOpen: false,
  setExplanationLevel: (explanationLevel) => set({ explanationLevel }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
}));
