import type {
  ShaBlockTrace,
  ShaPaddingInfo,
  ShaParameters,
  ShaRotationSet,
  ShaRoundTrace,
  ShaScheduleDetail,
  ShaTrace,
  ShaVariant,
} from '../types';
import { SHA_PARAMETERS } from './constants';

export function wordMask(bits: number): bigint {
  return (1n << BigInt(bits)) - 1n;
}

/** Rotación circular a la derecha de una palabra de `bits` bits. */
export function rotr(value: bigint, shift: number, bits: number): bigint {
  const s = BigInt(shift);
  return ((value >> s) | (value << (BigInt(bits) - s))) & wordMask(bits);
}

export function shr(value: bigint, shift: number): bigint {
  return value >> BigInt(shift);
}

/** Aplica una función Σ/σ: XOR de las rotaciones (y del desplazamiento, si existe). */
export function applySigma(value: bigint, set: ShaRotationSet, bits: number): bigint {
  let result = 0n;
  for (const r of set.rotations) result ^= rotr(value, r, bits);
  if (set.shift !== null) result ^= shr(value, set.shift);
  return result;
}

/** Ch(e, f, g) = (e ∧ f) ⊕ (¬e ∧ g): cada bit de e elige entre f y g. */
export function choose(e: bigint, f: bigint, g: bigint, bits: number): bigint {
  return (e & f) ^ (~e & wordMask(bits) & g);
}

/** Maj(a, b, c): cada bit toma el valor mayoritario entre a, b y c. */
export function majority(a: bigint, b: bigint, c: bigint): bigint {
  return (a & b) ^ (a & c) ^ (b & c);
}

export function addWords(bits: number, ...values: bigint[]): bigint {
  return values.reduce((acc, v) => acc + v, 0n) & wordMask(bits);
}

function readWord(bytes: Uint8Array, offset: number, length: number): bigint {
  let value = 0n;
  for (let i = 0; i < length; i++) value = (value << 8n) | BigInt(bytes[offset + i]);
  return value;
}

function writeWord(value: bigint, length: number): number[] {
  const out: number[] = [];
  for (let i = length - 1; i >= 0; i--) out.push(Number((value >> BigInt(8 * i)) & 0xffn));
  return out;
}

export function padMessage(message: Uint8Array, params: ShaParameters): { padded: Uint8Array; info: ShaPaddingInfo } {
  const { blockBytes, lengthBytes } = params;
  const minimum = message.length + 1 + lengthBytes;
  const totalBytes = Math.ceil(minimum / blockBytes) * blockBytes;
  const padded = new Uint8Array(totalBytes);
  padded.set(message);
  padded[message.length] = 0x80;
  const bitLength = BigInt(message.length) * 8n;
  const lengthStart = totalBytes - lengthBytes;
  padded.set(writeWord(bitLength, lengthBytes), lengthStart);
  return {
    padded,
    info: {
      messageBytes: message.length,
      bitLength,
      oneByteIndex: message.length,
      zeroBytes: lengthStart - message.length - 1,
      lengthStart,
      totalBytes,
    },
  };
}

/**
 * Calcula un hash SHA-2 registrando el relleno, la expansión del mensaje,
 * cada una de las rondas y la actualización del valor hash.
 */
export function traceSha(message: Uint8Array, variant: ShaVariant): ShaTrace {
  const params = SHA_PARAMETERS[variant];
  const { wordBits: bits, wordBytes, blockBytes, rounds } = params;
  const { padded, info } = padMessage(message, params);
  const blocks: ShaBlockTrace[] = [];
  let hash: readonly bigint[] = [...params.initialHash];

  for (let blockIndex = 0; blockIndex < padded.length / blockBytes; blockIndex++) {
    const offset = blockIndex * blockBytes;
    const bytes = padded.slice(offset, offset + blockBytes);
    const schedule: bigint[] = [];
    const scheduleDetails: ShaScheduleDetail[] = [];
    for (let t = 0; t < 16; t++) schedule.push(readWord(bytes, t * wordBytes, wordBytes));
    for (let t = 16; t < rounds; t++) {
      const sigma0 = applySigma(schedule[t - 15], params.smallSigma0, bits);
      const sigma1 = applySigma(schedule[t - 2], params.smallSigma1, bits);
      const value = addWords(bits, sigma1, schedule[t - 7], sigma0, schedule[t - 16]);
      schedule.push(value);
      scheduleDetails.push({
        t,
        wMinus2: schedule[t - 2],
        wMinus7: schedule[t - 7],
        wMinus15: schedule[t - 15],
        wMinus16: schedule[t - 16],
        sigma0,
        sigma1,
        value,
      });
    }

    const roundTraces: ShaRoundTrace[] = [];
    let registers: readonly bigint[] = [...hash];
    for (let t = 0; t < rounds; t++) {
      const [a, b, c, d, e, f, g, h] = registers;
      const bigSigma1 = applySigma(e, params.bigSigma1, bits);
      const ch = choose(e, f, g, bits);
      const temp1 = addWords(bits, h, bigSigma1, ch, params.constants[t], schedule[t]);
      const bigSigma0 = applySigma(a, params.bigSigma0, bits);
      const maj = majority(a, b, c);
      const temp2 = addWords(bits, bigSigma0, maj);
      const after = [addWords(bits, temp1, temp2), a, b, c, addWords(bits, d, temp1), e, f, g];
      roundTraces.push({
        t,
        before: registers,
        w: schedule[t],
        k: params.constants[t],
        bigSigma1,
        choose: ch,
        temp1,
        bigSigma0,
        majority: maj,
        temp2,
        after,
      });
      registers = after;
    }

    const hashAfter = hash.map((value, i) => addWords(bits, value, registers[i]));
    blocks.push({ index: blockIndex, bytes, schedule, scheduleDetails, hashBefore: hash, rounds: roundTraces, hashAfter });
    hash = hashAfter;
  }

  const digest = Uint8Array.from(hash.flatMap((word) => writeWord(word, wordBytes)));
  return { params, message: Uint8Array.from(message), padded, padding: info, blocks, digest };
}

export function sha(message: Uint8Array, variant: ShaVariant): Uint8Array {
  return traceSha(message, variant).digest;
}

export function formatWord(value: bigint, bits: number): string {
  return value.toString(16).padStart(bits / 4, '0');
}

export function wordToBits(value: bigint, bits: number): number[] {
  return Array.from({ length: bits }, (_, i) => Number((value >> BigInt(bits - 1 - i)) & 1n));
}
