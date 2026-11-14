/**
 * Tonos semánticos de la interfaz. Cada uno identifica un tipo de dato u
 * operación de forma consistente en toda la aplicación.
 */
export type Tone = 'neutral' | 'muted' | 'brand' | 'data' | 'key' | 'sub' | 'shift' | 'mix' | 'xor' | 'result' | 'private';

export const TONE_LABELS: Partial<Record<Tone, string>> = {
  data: 'Datos',
  key: 'Clave',
  sub: 'Sustitución',
  shift: 'Desplazamiento',
  mix: 'Mezcla',
  xor: 'XOR',
  result: 'Resultado',
};

/** Celda de byte: fondo, borde y texto. */
export const CELL_TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-ink-700/70 border-white/10 text-slate-100',
  muted: 'bg-ink-800/60 border-white/[0.06] text-slate-500',
  brand: 'bg-accent-brand/15 border-accent-brand/40 text-sky-100',
  data: 'bg-accent-data/15 border-accent-data/40 text-blue-100',
  key: 'bg-accent-key/15 border-accent-key/45 text-amber-100',
  sub: 'bg-accent-sub/15 border-accent-sub/45 text-purple-100',
  shift: 'bg-accent-shift/15 border-accent-shift/45 text-cyan-100',
  mix: 'bg-accent-mix/15 border-accent-mix/45 text-teal-100',
  xor: 'bg-accent-xor/15 border-accent-xor/45 text-rose-100',
  result: 'bg-accent-result/15 border-accent-result/45 text-emerald-100',
  private: 'bg-accent-private/15 border-accent-private/45 text-pink-100',
};

export const TEXT_TONE_CLASSES: Record<Tone, string> = {
  neutral: 'text-slate-200',
  muted: 'text-slate-400',
  brand: 'text-accent-brand',
  data: 'text-accent-data',
  key: 'text-accent-key',
  sub: 'text-accent-sub',
  shift: 'text-accent-shift',
  mix: 'text-accent-mix',
  xor: 'text-accent-xor',
  result: 'text-accent-result',
  private: 'text-accent-private',
};

export const DOT_TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-slate-300',
  muted: 'bg-slate-500',
  brand: 'bg-accent-brand',
  data: 'bg-accent-data',
  key: 'bg-accent-key',
  sub: 'bg-accent-sub',
  shift: 'bg-accent-shift',
  mix: 'bg-accent-mix',
  xor: 'bg-accent-xor',
  result: 'bg-accent-result',
  private: 'bg-accent-private',
};

export const RING_TONE_CLASSES: Record<Tone, string> = {
  neutral: 'ring-slate-300',
  muted: 'ring-slate-500',
  brand: 'ring-accent-brand',
  data: 'ring-accent-data',
  key: 'ring-accent-key',
  sub: 'ring-accent-sub',
  shift: 'ring-accent-shift',
  mix: 'ring-accent-mix',
  xor: 'ring-accent-xor',
  result: 'ring-accent-result',
  private: 'ring-accent-private',
};
