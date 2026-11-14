export interface RsaKey {
  p: bigint;
  q: bigint;
  n: bigint;
  phi: bigint;
  e: bigint;
  d: bigint;
}

export interface EuclidRow {
  /** Cociente q = ⌊r₀ / r₁⌋. */
  quotient: bigint;
  dividend: bigint;
  divisor: bigint;
  remainder: bigint;
  /** Coeficiente t asociado al divisor, antes de actualizar. */
  coefficient: bigint;
  /** Nuevo coeficiente t₀ − q · t₁. */
  nextCoefficient: bigint;
}

export interface ModularInverseTrace {
  a: bigint;
  modulus: bigint;
  rows: EuclidRow[];
  gcd: bigint;
  /** Inverso modular, si existe (gcd = 1). */
  inverse: bigint | null;
}

export interface ModPowStep {
  bitIndex: number;
  bit: 0 | 1;
  /** Valor acumulado antes del paso. */
  input: bigint;
  /** Resultado tras elevar al cuadrado. */
  squared: bigint;
  /** Resultado tras multiplicar por la base (solo si el bit es 1). */
  multiplied: bigint | null;
}

export interface ModPowTrace {
  base: bigint;
  exponent: bigint;
  modulus: bigint;
  exponentBits: string;
  steps: ModPowStep[];
  result: bigint;
}

export type RsaField = 'p' | 'q' | 'e';

export interface RsaFieldError {
  field: RsaField | 'general';
  message: string;
}

export type RsaKeyResult =
  | { ok: true; key: RsaKey; inverseTrace: ModularInverseTrace; warnings: string[] }
  | { ok: false; errors: RsaFieldError[] };

export type RsaKeySize = 'tiny' | 'small' | 'medium' | 'large';

export type RsaMessageMode = 'text' | 'number';
