import type { AesSimulation, AesStep } from '../../types';

export interface AesViewProps {
  step: AesStep;
  simulation: AesSimulation;
  /** Multiplicador de velocidad de las animaciones. */
  speed: number;
}

export const hex2 = (value: number) => value.toString(16).padStart(2, '0');
