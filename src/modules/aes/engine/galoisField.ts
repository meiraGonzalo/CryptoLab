/**
 * Aritmética en el campo finito GF(2⁸) con el polinomio irreducible de AES:
 * m(x) = x⁸ + x⁴ + x³ + x + 1 (0x11b).
 */

export const AES_POLYNOMIAL = 0x11b;

/** Multiplicación por x (desplazamiento a la izquierda con reducción módulo m(x)). */
export function xtime(value: number): number {
  const shifted = (value << 1) & 0xff;
  return value & 0x80 ? shifted ^ 0x1b : shifted;
}

/** Producto de dos elementos de GF(2⁸). */
export function gfMultiply(a: number, b: number): number {
  let result = 0;
  let factor = a & 0xff;
  let multiplier = b & 0xff;
  while (multiplier) {
    if (multiplier & 1) result ^= factor;
    factor = xtime(factor);
    multiplier >>= 1;
  }
  return result;
}

export interface GfMultiplicationTerm {
  /** Potencia k: el término es a · xᵏ. */
  power: number;
  /** Valor de a · xᵏ obtenido aplicando xtime k veces. */
  value: number;
  /** Indica si el bit k del multiplicador está activo (el término participa del XOR). */
  included: boolean;
}

export interface GfMultiplicationTrace {
  a: number;
  b: number;
  terms: GfMultiplicationTerm[];
  result: number;
}

/** Descompone a · b como XOR de a · xᵏ para cada bit activo de b. */
export function traceGfMultiply(a: number, b: number): GfMultiplicationTrace {
  const terms: GfMultiplicationTerm[] = [];
  let value = a & 0xff;
  const highestBit = b === 0 ? 0 : Math.floor(Math.log2(b));
  for (let power = 0; power <= highestBit; power++) {
    terms.push({ power, value, included: ((b >> power) & 1) === 1 });
    value = xtime(value);
  }
  return { a, b, terms, result: gfMultiply(a, b) };
}

/** Inverso multiplicativo en GF(2⁸) (por convención, el inverso de 0 es 0). */
export function gfInverse(value: number): number {
  if (value === 0) return 0;
  for (let candidate = 1; candidate < 256; candidate++) {
    if (gfMultiply(value, candidate) === 1) return candidate;
  }
  throw new Error('Elemento sin inverso: el polinomio no es irreducible.');
}
