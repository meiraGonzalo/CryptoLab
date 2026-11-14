import type { ShaParameters, ShaVariant } from '../types';

/** Raíz entera k-ésima (piso) mediante el método de Newton sobre BigInt. */
export function integerRoot(n: bigint, k: bigint): bigint {
  if (n < 2n) return n;
  let x = 1n << (BigInt(n.toString(2).length) / k + 1n);
  for (;;) {
    const y = ((k - 1n) * x + n / x ** (k - 1n)) / k;
    if (y >= x) return x;
    x = y;
  }
}

export function firstPrimes(count: number): number[] {
  const primes: number[] = [];
  for (let candidate = 2; primes.length < count; candidate++) {
    if (primes.every((p) => candidate % p !== 0)) primes.push(candidate);
  }
  return primes;
}

/**
 * Parte fraccionaria de la raíz k-ésima de p, tomando los primeros `bits` bits:
 * ⌊p^(1/k) · 2^bits⌋ mod 2^bits, calculado de forma exacta con enteros.
 */
function fractionalRootBits(prime: number, k: bigint, bits: number): bigint {
  const scaled = BigInt(prime) << (k * BigInt(bits));
  return integerRoot(scaled, k) & ((1n << BigInt(bits)) - 1n);
}

function deriveConstants(wordBits: number, rounds: number) {
  const primes = firstPrimes(rounds);
  return {
    initialHash: primes.slice(0, 8).map((p) => fractionalRootBits(p, 2n, wordBits)),
    constants: primes.map((p) => fractionalRootBits(p, 3n, wordBits)),
  };
}

const sha256Constants = deriveConstants(32, 64);
const sha512Constants = deriveConstants(64, 80);

export const SHA_PARAMETERS: Record<ShaVariant, ShaParameters> = {
  sha256: {
    variant: 'sha256',
    name: 'SHA-256',
    wordBits: 32,
    wordBytes: 4,
    blockBytes: 64,
    lengthBytes: 8,
    rounds: 64,
    digestBytes: 32,
    initialHash: sha256Constants.initialHash,
    constants: sha256Constants.constants,
    bigSigma0: { rotations: [2, 13, 22], shift: null },
    bigSigma1: { rotations: [6, 11, 25], shift: null },
    smallSigma0: { rotations: [7, 18], shift: 3 },
    smallSigma1: { rotations: [17, 19], shift: 10 },
    webCryptoName: 'SHA-256',
  },
  sha512: {
    variant: 'sha512',
    name: 'SHA-512',
    wordBits: 64,
    wordBytes: 8,
    blockBytes: 128,
    lengthBytes: 16,
    rounds: 80,
    digestBytes: 64,
    initialHash: sha512Constants.initialHash,
    constants: sha512Constants.constants,
    bigSigma0: { rotations: [28, 34, 39], shift: null },
    bigSigma1: { rotations: [14, 18, 41], shift: null },
    smallSigma0: { rotations: [1, 8], shift: 7 },
    smallSigma1: { rotations: [19, 61], shift: 6 },
    webCryptoName: 'SHA-512',
  },
};

export const REGISTER_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
