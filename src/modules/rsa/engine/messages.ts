import { bytesToUtf8, utf8ToBytes } from '@/utils/bytes';
import type { RsaKey, RsaMessageMode } from '../types';
import { modPow } from './math';
import { parseNatural } from './keygen';

export interface RsaMessageBlock {
  /** Etiqueta del bloque (carácter o número). */
  label: string;
  value: bigint;
}

export type MessageParseResult = { ok: true; blocks: RsaMessageBlock[] } | { ok: false; error: string };

/**
 * Convierte el mensaje en valores numéricos M con 0 ≤ M < n.
 * En modo texto, cada byte UTF-8 se cifra por separado (solo con fines didácticos).
 */
export function encodeMessage(input: string, mode: RsaMessageMode, n: bigint): MessageParseResult {
  if (mode === 'number') {
    const value = parseNatural(input);
    if (value === null) return { ok: false, error: 'Ingresá un número entero no negativo.' };
    if (value >= n) return { ok: false, error: `M debe ser menor que n (${n}). Si M ≥ n, la operación mod n pierde información.` };
    return { ok: true, blocks: [{ label: 'M', value }] };
  }
  if (input.length === 0) return { ok: false, error: 'Ingresá un mensaje.' };
  if (n <= 255n) return { ok: false, error: `n = ${n} es demasiado pequeño para cifrar bytes (se necesita n > 255).` };
  const bytes = utf8ToBytes(input);
  if (bytes.length > 64) return { ok: false, error: 'Para mantener la visualización legible, el mensaje admite hasta 64 bytes.' };
  const chars = Array.from(input);
  const labels: string[] = [];
  for (const char of chars) {
    const size = utf8ToBytes(char).length;
    for (let i = 0; i < size; i++) labels.push(size === 1 ? char : `${char}·${i + 1}`);
  }
  return { ok: true, blocks: Array.from(bytes, (b, i) => ({ label: labels[i] ?? '', value: BigInt(b) })) };
}

export function parseCiphertext(input: string, n: bigint): { ok: true; values: bigint[] } | { ok: false; error: string } {
  const parts = input.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: 'Ingresá uno o más valores cifrados separados por comas o espacios.' };
  const values: bigint[] = [];
  for (const part of parts) {
    const value = parseNatural(part);
    if (value === null) return { ok: false, error: `«${part}» no es un número entero válido.` };
    if (value >= n) return { ok: false, error: `El valor ${value} no es menor que n = ${n}: no pudo haber sido producido con esta clave.` };
    values.push(value);
  }
  return { ok: true, values };
}

export function rsaEncryptValue(m: bigint, key: Pick<RsaKey, 'e' | 'n'>): bigint {
  return modPow(m, key.e, key.n);
}

export function rsaDecryptValue(c: bigint, key: Pick<RsaKey, 'd' | 'n'>): bigint {
  return modPow(c, key.d, key.n);
}

/** Intenta reconstruir texto a partir de valores que deberían ser bytes. */
export function decodeBytes(values: bigint[]): string | null {
  if (values.some((v) => v > 255n)) return null;
  return bytesToUtf8(Uint8Array.from(values.map(Number)));
}
