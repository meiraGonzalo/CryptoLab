import type { SimulationStep } from '@/types/simulation';

export type ShaVariant = 'sha256' | 'sha512';

export interface ShaRotationSet {
  /** Desplazamientos de rotación (ROTR) combinados con XOR. */
  rotations: readonly number[];
  /** Desplazamiento lógico (SHR), solo en σ0 y σ1. */
  shift: number | null;
}

export interface ShaParameters {
  variant: ShaVariant;
  name: string;
  wordBits: 32 | 64;
  wordBytes: 4 | 8;
  blockBytes: 64 | 128;
  lengthBytes: 8 | 16;
  rounds: 64 | 80;
  digestBytes: 32 | 64;
  initialHash: readonly bigint[];
  constants: readonly bigint[];
  bigSigma0: ShaRotationSet;
  bigSigma1: ShaRotationSet;
  smallSigma0: ShaRotationSet;
  smallSigma1: ShaRotationSet;
  webCryptoName: 'SHA-256' | 'SHA-512';
}

export interface ShaPaddingInfo {
  messageBytes: number;
  bitLength: bigint;
  /** Posición del byte 0x80 (bit «1» agregado). */
  oneByteIndex: number;
  zeroBytes: number;
  lengthStart: number;
  totalBytes: number;
}

export interface ShaScheduleDetail {
  t: number;
  /** Para t ≥ 16: términos de W[t] = σ1(W[t−2]) + W[t−7] + σ0(W[t−15]) + W[t−16]. */
  wMinus2: bigint;
  wMinus7: bigint;
  wMinus15: bigint;
  wMinus16: bigint;
  sigma0: bigint;
  sigma1: bigint;
  value: bigint;
}

export interface ShaRoundTrace {
  t: number;
  before: readonly bigint[];
  w: bigint;
  k: bigint;
  bigSigma1: bigint;
  choose: bigint;
  temp1: bigint;
  bigSigma0: bigint;
  majority: bigint;
  temp2: bigint;
  after: readonly bigint[];
}

export interface ShaBlockTrace {
  index: number;
  bytes: Uint8Array;
  schedule: bigint[];
  scheduleDetails: ShaScheduleDetail[];
  hashBefore: readonly bigint[];
  rounds: ShaRoundTrace[];
  hashAfter: readonly bigint[];
}

export interface ShaTrace {
  params: ShaParameters;
  message: Uint8Array;
  padded: Uint8Array;
  padding: ShaPaddingInfo;
  blocks: ShaBlockTrace[];
  digest: Uint8Array;
}

export type ShaStepKind = 'bytes' | 'padding' | 'length' | 'blocks' | 'schedule' | 'init' | 'round' | 'final' | 'digest';

export interface ShaStep extends SimulationStep {
  kind: ShaStepKind;
  blockIndex: number;
  /** Número de ronda para los pasos de tipo «round». */
  round: number;
}
