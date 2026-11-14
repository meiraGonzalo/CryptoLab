import type { EuclidRow, ModPowStep, ModPowTrace, ModularInverseTrace } from '../types';

export function mod(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r < 0n ? r + m : r;
}

export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

/**
 * Algoritmo de Euclides extendido para obtener a⁻¹ mod m,
 * registrando cada división de la tabla.
 */
export function traceModularInverse(a: bigint, modulus: bigint): ModularInverseTrace {
  const rows: EuclidRow[] = [];
  let r0 = modulus;
  let r1 = mod(a, modulus);
  let t0 = 0n;
  let t1 = 1n;
  while (r1 !== 0n) {
    const quotient = r0 / r1;
    const remainder = r0 - quotient * r1;
    const nextCoefficient = t0 - quotient * t1;
    rows.push({ quotient, dividend: r0, divisor: r1, remainder, coefficient: t1, nextCoefficient });
    [r0, r1] = [r1, remainder];
    [t0, t1] = [t1, nextCoefficient];
  }
  return { a, modulus, rows, gcd: r0, inverse: r0 === 1n ? mod(t0, modulus) : null };
}

export function modularInverse(a: bigint, modulus: bigint): bigint | null {
  return traceModularInverse(a, modulus).inverse;
}

/** Exponenciación modular rápida (sin traza). */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  let b = mod(base, modulus);
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= 1n;
  }
  return result;
}

/**
 * Exponenciación modular «elevar al cuadrado y multiplicar», de izquierda a derecha.
 * Para cada bit del exponente: resultado ← resultado² mod n y, si el bit es 1,
 * resultado ← resultado · base mod n.
 */
export function traceModPow(base: bigint, exponent: bigint, modulus: bigint): ModPowTrace {
  const exponentBits = exponent.toString(2);
  const steps: ModPowStep[] = [];
  const b = mod(base, modulus);
  let result = 1n;
  for (let i = 0; i < exponentBits.length; i++) {
    const bit = exponentBits[i] === '1' ? 1 : 0;
    const input = result;
    const squared = (result * result) % modulus;
    const multiplied = bit ? (squared * b) % modulus : null;
    result = multiplied ?? squared;
    steps.push({ bitIndex: i, bit, input, squared, multiplied });
  }
  return { base, exponent, modulus, exponentBits, steps, result };
}
