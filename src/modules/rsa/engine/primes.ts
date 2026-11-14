import { randomBigIntInRange } from '@/services/crypto/random';
import type { RsaKeySize } from '../types';
import { modPow } from './math';

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/**
 * Test de primalidad de Miller–Rabin con las 12 primeras bases primas. Es
 * determinista para n < 3,18 · 10²³ (Sorenson y Webster, 2017), rango que cubre
 * todos los primos que genera el modo educativo (hasta 32 bits). Para valores
 * mayores ingresados manualmente, el resultado es probabilístico.
 */
export function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  witness: for (const a of SMALL_PRIMES) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) continue witness;
    }
    return false;
  }
  return true;
}

export interface PrimeRange {
  label: string;
  description: string;
  min: bigint;
  max: bigint;
}

export const PRIME_RANGES: Record<RsaKeySize, PrimeRange> = {
  tiny: { label: 'Muy pequeños', description: 'Primos de 2 dígitos: ideales para seguir los cálculos a mano.', min: 17n, max: 97n },
  small: { label: 'Pequeños', description: 'Primos de 3 dígitos.', min: 101n, max: 997n },
  medium: { label: 'Medianos', description: 'Primos de 16 bits (n de ~32 bits).', min: 32771n, max: 65521n },
  large: { label: 'Grandes', description: 'Primos de 32 bits (n de ~64 bits). Todavía inseguros.', min: 2147483659n, max: 4294967291n },
};

/** Primo aleatorio en el rango, usando una fuente criptográficamente segura. */
export function randomPrime(range: PrimeRange, exclude?: bigint): bigint {
  for (let attempt = 0; attempt < 100000; attempt++) {
    const candidate = randomBigIntInRange(range.min, range.max) | 1n;
    if (candidate <= range.max && candidate !== exclude && isProbablePrime(candidate)) return candidate;
  }
  throw new Error('No se encontró un número primo en el rango indicado.');
}
