import { create } from 'zustand';
import type { SimulationStep } from '@/types/simulation';

export interface SimulationState<TStep extends SimulationStep> {
  steps: TStep[];
  index: number;
  isPlaying: boolean;
  /** Multiplicador de velocidad de la reproducción automática. */
  speed: number;
  /** La configuración cambió después de iniciar: los pasos ya no la reflejan. */
  isStale: boolean;
  load: (steps: TStep[]) => void;
  clear: () => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  nextGroup: () => void;
  prevGroup: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  markStale: () => void;
}

/**
 * Crea un store de reproducción de simulaciones. Los pasos se calculan una única
 * vez y se conservan: avanzar o retroceder solo cambia el índice, por lo que los
 * estados intermedios nunca se recalculan.
 */
export function createSimulationStore<TStep extends SimulationStep>() {
  return create<SimulationState<TStep>>()((set, get) => {
    const clamp = (i: number) => Math.max(0, Math.min(get().steps.length - 1, i));

    const groupStart = (index: number) => {
      const { steps } = get();
      const key = steps[index]?.groupKey;
      let start = index;
      while (start > 0 && steps[start - 1].groupKey === key) start--;
      return start;
    };

    return {
      steps: [],
      index: 0,
      isPlaying: false,
      speed: 1,
      isStale: false,
      load: (steps) => set({ steps, index: 0, isPlaying: false, isStale: false }),
      clear: () => set({ steps: [], index: 0, isPlaying: false, isStale: false }),
      goTo: (index) => set({ index: clamp(index) }),
      next: () => {
        const { index, steps } = get();
        if (index >= steps.length - 1) set({ isPlaying: false });
        else set({ index: index + 1 });
      },
      prev: () => set({ index: clamp(get().index - 1) }),
      nextGroup: () => {
        const { index, steps } = get();
        const key = steps[index]?.groupKey;
        let j = index;
        while (j < steps.length && steps[j].groupKey === key) j++;
        set({ index: clamp(j) });
      },
      prevGroup: () => {
        const { index } = get();
        const start = groupStart(index);
        if (start < index) set({ index: start });
        else if (start > 0) set({ index: groupStart(start - 1) });
      },
      play: () => {
        const { index, steps } = get();
        if (steps.length === 0) return;
        set({ isPlaying: true, index: index >= steps.length - 1 ? 0 : index });
      },
      pause: () => set({ isPlaying: false }),
      togglePlay: () => (get().isPlaying ? get().pause() : get().play()),
      reset: () => set({ index: 0, isPlaying: false }),
      setSpeed: (speed) => set({ speed }),
      markStale: () => {
        if (get().steps.length > 0) set({ isStale: true, isPlaying: false });
      },
    };
  });
}

export type SimulationStore<TStep extends SimulationStep> = ReturnType<typeof createSimulationStore<TStep>>;
