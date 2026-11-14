import type { RsaFieldError, RsaKeyResult, RsaKeySize } from '../types';
import { gcd, traceModularInverse } from './math';
import { PRIME_RANGES, isProbablePrime, randomPrime } from './primes';

const COMMON_EXPONENTS = [65537n, 257n, 17n, 5n, 3n];

export function parseNatural(value: string): bigint | null {
  const clean = value.trim();
  if (!/^\d+$/.test(clean)) return null;
  return BigInt(clean);
}

/**
 * Elige un exponente público e: se prefiere 65537 (el valor estándar) y, si no
 * es menor que φ(n) o no es coprimo con φ(n), se prueban valores menores.
 */
export function choosePublicExponent(phi: bigint): bigint {
  for (const e of COMMON_EXPONENTS) if (e < phi && gcd(e, phi) === 1n) return e;
  for (let e = 3n; e < phi; e += 2n) if (gcd(e, phi) === 1n) return e;
  throw new Error('No existe un exponente válido para este φ(n).');
}

/** Valida los parámetros y construye el par de claves con su traza de cálculo. */
export function buildRsaKey(pInput: string, qInput: string, eInput: string): RsaKeyResult {
  const errors: RsaFieldError[] = [];
  const p = parseNatural(pInput);
  const q = parseNatural(qInput);
  if (p === null) errors.push({ field: 'p', message: 'p debe ser un número entero positivo.' });
  else if (!isProbablePrime(p)) errors.push({ field: 'p', message: `${p} no es primo.` });
  if (q === null) errors.push({ field: 'q', message: 'q debe ser un número entero positivo.' });
  else if (!isProbablePrime(q)) errors.push({ field: 'q', message: `${q} no es primo.` });
  if (p !== null && q !== null && p === q) {
    errors.push({ field: 'q', message: 'p y q deben ser distintos: si son iguales, n = p² y φ(n) se obtiene trivialmente.' });
  }
  if (p !== null && q !== null && p * q > 10n ** 40n) {
    errors.push({ field: 'general', message: 'El modo educativo admite valores de n de hasta 40 dígitos.' });
  }
  if (errors.length) return { ok: false, errors };

  const n = p! * q!;
  const phi = (p! - 1n) * (q! - 1n);
  let e: bigint;
  if (eInput.trim() === '') {
    e = choosePublicExponent(phi);
  } else {
    const parsed = parseNatural(eInput);
    if (parsed === null) return { ok: false, errors: [{ field: 'e', message: 'e debe ser un número entero positivo.' }] };
    if (parsed <= 1n || parsed >= phi) {
      return { ok: false, errors: [{ field: 'e', message: `e debe cumplir 1 < e < φ(n) = ${phi}.` }] };
    }
    const g = gcd(parsed, phi);
    if (g !== 1n) {
      return {
        ok: false,
        errors: [{ field: 'e', message: `e debe ser coprimo con φ(n): mcd(${parsed}, ${phi}) = ${g}, por lo que no existe inverso modular.` }],
      };
    }
    e = parsed;
  }

  const inverseTrace = traceModularInverse(e, phi);
  const d = inverseTrace.inverse!;
  const warnings: string[] = [];
  if (n <= 255n) warnings.push(`n = ${n} es menor que 256: no permite cifrar texto byte a byte (cada byte debe ser menor que n).`);
  if (e === d) warnings.push('En este caso e = d: la clave privada coincide con la pública. Elegí otros valores para una demostración más clara.');
  return { ok: true, key: { p: p!, q: q!, n, phi, e, d }, inverseTrace, warnings };
}

export function generateRandomPrimes(size: RsaKeySize): { p: bigint; q: bigint } {
  const range = PRIME_RANGES[size];
  const p = randomPrime(range);
  const q = randomPrime(range, p);
  return { p, q };
}
