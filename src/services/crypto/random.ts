/**
 * Generación de valores aleatorios con una fuente criptográficamente segura
 * (crypto.getRandomValues). Nunca se usa Math.random para claves.
 */

const MAX_CHUNK = 65536;

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  for (let offset = 0; offset < length; offset += MAX_CHUNK) {
    crypto.getRandomValues(out.subarray(offset, Math.min(length, offset + MAX_CHUNK)));
  }
  return out;
}

/** Entero uniforme en [0, bound) mediante muestreo por rechazo (sin sesgo de módulo). */
export function randomBigIntBelow(bound: bigint): bigint {
  if (bound <= 0n) throw new Error('El límite debe ser positivo.');
  if (bound === 1n) return 0n;
  const bits = (bound - 1n).toString(2).length;
  const bytes = Math.ceil(bits / 8);
  const excessBits = BigInt(bytes * 8 - bits);
  for (;;) {
    const raw = randomBytes(bytes);
    let value = 0n;
    for (const b of raw) value = (value << 8n) | BigInt(b);
    value >>= excessBits;
    if (value < bound) return value;
  }
}

/** Entero uniforme en el intervalo cerrado [min, max]. */
export function randomBigIntInRange(min: bigint, max: bigint): bigint {
  if (max < min) throw new Error('El mínimo no puede superar al máximo.');
  return min + randomBigIntBelow(max - min + 1n);
}

export function randomIntInRange(min: number, max: number): number {
  return Number(randomBigIntInRange(BigInt(min), BigInt(max)));
}
