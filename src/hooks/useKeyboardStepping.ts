import { useEffect } from 'react';
import type { SimulationStep } from '@/types/simulation';
import type { SimulationStore } from '@/stores/createSimulationStore';

/**
 * Atajos de teclado para la simulación: ← / → paso, Shift + ← / → ronda,
 * barra espaciadora para reproducir o pausar. Se ignoran mientras se escribe.
 */
export function useKeyboardStepping<TStep extends SimulationStep>(useStore: SimulationStore<TStep>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return;
      const state = useStore.getState();
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (event.shiftKey) state.nextGroup();
        else state.next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (event.shiftKey) state.prevGroup();
        else state.prev();
      } else if (event.key === ' ' && target?.tagName !== 'BUTTON') {
        event.preventDefault();
        state.togglePlay();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [useStore, enabled]);
}
