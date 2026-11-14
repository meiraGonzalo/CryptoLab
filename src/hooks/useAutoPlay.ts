import { useEffect } from 'react';
import type { SimulationStep } from '@/types/simulation';
import type { SimulationStore } from '@/stores/createSimulationStore';

/** Intervalo base entre pasos durante la reproducción automática (a velocidad 1×). */
export const BASE_STEP_INTERVAL_MS = 2200;

/** Avanza la simulación automáticamente mientras está en reproducción. */
export function useAutoPlay<TStep extends SimulationStep>(useStore: SimulationStore<TStep>, baseInterval = BASE_STEP_INTERVAL_MS) {
  const isPlaying = useStore((s) => s.isPlaying);
  const speed = useStore((s) => s.speed);
  const index = useStore((s) => s.index);
  const next = useStore((s) => s.next);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(next, baseInterval / speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, speed, index, next, baseInterval]);
}
