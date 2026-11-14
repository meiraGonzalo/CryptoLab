import { describe, expect, it } from 'vitest';
import { buildRsaKey, choosePublicExponent, generateRandomPrimes } from './keygen';
import { modPow, traceModPow, traceModularInverse } from './math';
import { isProbablePrime } from './primes';
import { decodeBytes, encodeMessage, rsaDecryptValue, rsaEncryptValue } from './messages';

describe('Aritmética modular', () => {
  it('inverso modular con Euclides extendido', () => {
    const trace = traceModularInverse(17n, 3120n);
    expect(trace.gcd).toBe(1n);
    expect(trace.inverse).toBe(2753n);
    expect(traceModularInverse(6n, 9n).inverse).toBeNull();
  });
  it('la traza de exponenciación coincide con modPow', () => {
    const trace = traceModPow(65n, 17n, 3233n);
    expect(trace.result).toBe(2790n);
    expect(trace.result).toBe(modPow(65n, 17n, 3233n));
    expect(trace.steps.length).toBe(5);
  });
});

describe('Miller–Rabin', () => {
  it('reconoce primos y compuestos', () => {
    expect([2n, 3n, 61n, 53n, 65537n, 2147483647n].every(isProbablePrime)).toBe(true);
    expect([1n, 0n, 4n, 561n, 3233n, 4294967297n].some(isProbablePrime)).toBe(false);
  });
});

describe('RSA educativo (ejemplo clásico p = 61, q = 53)', () => {
  const result = buildRsaKey('61', '53', '17');
  it('genera la clave correcta', () => {
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.key).toMatchObject({ n: 3233n, phi: 3120n, e: 17n, d: 2753n });
  });
  it('cifra y descifra', () => {
    if (!result.ok) return;
    expect(rsaEncryptValue(65n, result.key)).toBe(2790n);
    expect(rsaDecryptValue(2790n, result.key)).toBe(65n);
  });
  it('rechaza parámetros inválidos', () => {
    expect(buildRsaKey('60', '53', '').ok).toBe(false);
    expect(buildRsaKey('61', '61', '').ok).toBe(false);
    expect(buildRsaKey('61', '53', '12').ok).toBe(false);
  });
  it('texto byte a byte ida y vuelta', () => {
    if (!result.ok) return;
    const encoded = encodeMessage('Hola, ñandú', 'text', result.key.n);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decrypted = encoded.blocks.map((b) => rsaDecryptValue(rsaEncryptValue(b.value, result.key), result.key));
    expect(decodeBytes(decrypted)).toBe('Hola, ñandú');
  });
});

describe('Generación aleatoria', () => {
  it('produce claves válidas en todos los tamaños', () => {
    for (const size of ['tiny', 'small', 'medium', 'large'] as const) {
      const { p, q } = generateRandomPrimes(size);
      const key = buildRsaKey(p.toString(), q.toString(), '');
      expect(key.ok).toBe(true);
      if (!key.ok) continue;
      expect((key.key.e * key.key.d) % key.key.phi).toBe(1n);
      expect(choosePublicExponent(key.key.phi)).toBe(key.key.e);
    }
  });
});
