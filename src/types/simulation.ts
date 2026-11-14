/** Explicación contextual de una operación, en dos niveles de detalle. */
export interface Explanation {
  /** Qué operación se realiza y con qué datos. */
  what: string;
  /** Por qué se realiza (su propósito dentro del algoritmo). */
  why: string;
  /** Detalle técnico y matemático, visible en el modo técnico. */
  technical: string;
}

/** Contrato mínimo de un paso de simulación. */
export interface SimulationStep {
  id: string;
  /** Pasos con el mismo grupo forman una "ronda" para la navegación por rondas. */
  groupKey: string;
  title: string;
  explanation: Explanation;
}

export type ExplanationLevel = 'simple' | 'technical';
