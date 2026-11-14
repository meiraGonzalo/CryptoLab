/**
 * Utilidades de conversión entre texto, bytes, hexadecimal, binario y Base64.
 * Todas las funciones son puras y no dependen del DOM.
 */

export type InputEncoding = 'utf8' | 'hex' | 'base64';

export const INPUT_ENCODING_LABELS: Record<InputEncoding, string> = {
  utf8: 'Texto (UTF-8)',
  hex: 'Hexadecimal',
  base64: 'Base64',
};

const textEncoder = new TextEncoder();

export function utf8ToBytes(text: string): Uint8Array {
  return textEncoder.encode(text);
}

/** Decodifica UTF-8. Devuelve `null` si los bytes no forman UTF-8 válido. */
export function bytesToUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function byteToHex(value: number): string {
  return (value & 0xff).toString(16).padStart(2, '0');
}

export function byteToBinary(value: number): string {
  return (value & 0xff).toString(2).padStart(8, '0');
}

export function bytesToHex(bytes: ArrayLike<number>, separator = ''): string {
  return Array.from(bytes, byteToHex).join(separator);
}

export function bytesToBinary(bytes: ArrayLike<number>, separator = ' '): string {
  return Array.from(bytes, byteToBinary).join(separator);
}

/** Normaliza una cadena hexadecimal: quita espacios, separadores y prefijos 0x. */
export function normalizeHex(input: string): string {
  return input
    .replace(/0x/gi, '')
    .replace(/[\s:,\-_]/g, '')
    .toLowerCase();
}

export function validateHex(input: string): string | null {
  const clean = normalizeHex(input);
  if (clean.length === 0) return 'Ingresá al menos un byte en hexadecimal.';
  if (!/^[0-9a-f]*$/.test(clean)) return 'Solo se permiten los caracteres 0-9 y a-f.';
  if (clean.length % 2 !== 0) return 'Cada byte necesita dos dígitos hexadecimales (cantidad de dígitos impar).';
  return null;
}

export function hexToBytes(input: string): Uint8Array {
  const error = validateHex(input);
  if (error) throw new Error(error);
  const clean = normalizeHex(input);
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64ToBytes(input: string): Uint8Array {
  const clean = input.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export type ParseResult = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

/** Interpreta la entrada del usuario según la codificación elegida. */
export function parseInput(text: string, encoding: InputEncoding): ParseResult {
  if (encoding === 'utf8') return { ok: true, bytes: utf8ToBytes(text) };
  if (encoding === 'hex') {
    const error = validateHex(text);
    return error ? { ok: false, error } : { ok: true, bytes: hexToBytes(text) };
  }
  const clean = text.replace(/\s/g, '');
  if (clean.length === 0) return { ok: false, error: 'Ingresá un valor en Base64.' };
  if (!/^[A-Za-z0-9+/\-_]*={0,2}$/.test(clean)) return { ok: false, error: 'El texto no es Base64 válido.' };
  try {
    return { ok: true, bytes: base64ToBytes(clean) };
  } catch {
    return { ok: false, error: 'El texto no es Base64 válido.' };
  }
}

export function bytesEqual(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function popcount8(value: number): number {
  let v = value & 0xff;
  let count = 0;
  while (v) {
    count += v & 1;
    v >>= 1;
  }
  return count;
}

/** Cantidad de bits distintos entre dos secuencias de igual longitud. */
export function countBitDifferences(a: ArrayLike<number>, b: ArrayLike<number>): number {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < length; i++) total += popcount8(a[i] ^ b[i]);
  return total;
}

/** Representación imprimible de un byte como carácter ASCII (o un punto). */
export function byteToPrintable(value: number): string {
  return value >= 0x20 && value < 0x7f ? String.fromCharCode(value) : '·';
}

/** Divide un arreglo de bytes en fragmentos de tamaño fijo. */
export function chunkBytes(bytes: Uint8Array, size: number): Uint8Array[] {
  const out: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) out.push(bytes.slice(i, i + size));
  return out;
}

/** Agrupa los caracteres de un texto UTF-8 con los bytes que los codifican. */
export function utf8CharacterMap(text: string): { char: string; bytes: number[] }[] {
  return Array.from(text).map((char) => ({ char, bytes: Array.from(utf8ToBytes(char)) }));
}
