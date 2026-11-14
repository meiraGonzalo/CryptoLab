import { create } from 'zustand';
import { isWebCryptoAvailable, webCryptoDigest } from '@/services/crypto/webCrypto';
import { createSimulationStore } from '@/stores/createSimulationStore';
import { bytesToHex, parseInput, type InputEncoding } from '@/utils/bytes';
import { SHA_PARAMETERS } from '../engine/constants';
import { traceSha } from '../engine/sha2';
import { buildShaSteps } from '../engine/steps';
import type { ShaStep, ShaTrace, ShaVariant } from '../types';

export const useShaPlayback = createSimulationStore<ShaStep>();

export const SHA_MAX_INPUT_BYTES = 1024;

export interface ShaVerification {
  status: 'idle' | 'running' | 'verified' | 'mismatch' | 'unavailable';
  referenceHex: string;
}

interface ShaState {
  text: string;
  encoding: InputEncoding;
  configVersion: number;
  trace: ShaTrace | null;
  traceVersion: number;
  verification: ShaVerification;
  setText: (text: string) => void;
  setEncoding: (encoding: InputEncoding) => void;
  start: (variant: ShaVariant) => string | null;
}

export function validateShaInput(text: string, encoding: InputEncoding): { bytes: Uint8Array | null; error: string | null } {
  const parsed = parseInput(text, encoding);
  if (!parsed.ok) return { bytes: null, error: encoding === 'utf8' ? null : parsed.error };
  if (parsed.bytes.length > SHA_MAX_INPUT_BYTES) {
    return { bytes: null, error: `Para mantener la simulación fluida, la entrada admite hasta ${SHA_MAX_INPUT_BYTES} bytes.` };
  }
  return { bytes: parsed.bytes, error: null };
}

export const useShaStore = create<ShaState>()((set, get) => ({
  text: 'abc',
  encoding: 'utf8',
  configVersion: 0,
  trace: null,
  traceVersion: -1,
  verification: { status: 'idle', referenceHex: '' },
  setText: (text) => set({ text, configVersion: get().configVersion + 1 }),
  setEncoding: (encoding) => set({ encoding, configVersion: get().configVersion + 1 }),
  start: (variant) => {
    const { text, encoding, configVersion } = get();
    const { bytes, error } = validateShaInput(text, encoding);
    if (!bytes) return error ?? 'Entrada inválida.';
    const trace = traceSha(bytes, variant);
    set({ trace, traceVersion: configVersion, verification: { status: 'running', referenceHex: '' } });
    useShaPlayback.getState().load(buildShaSteps(trace));
    if (!isWebCryptoAvailable()) {
      set({ verification: { status: 'unavailable', referenceHex: '' } });
    } else {
      void webCryptoDigest(SHA_PARAMETERS[variant].webCryptoName, bytes).then((reference) => {
        if (get().trace !== trace) return;
        const referenceHex = bytesToHex(reference);
        set({ verification: { status: referenceHex === bytesToHex(trace.digest) ? 'verified' : 'mismatch', referenceHex } });
      });
    }
    return null;
  },
}));

/** Estado compartido de las páginas de comparación y efecto avalancha. */
interface HashToolsState {
  avalancheOriginal: string;
  avalancheModified: string;
  avalancheVariant: ShaVariant;
  compareA: string;
  compareB: string;
  compareVariant: ShaVariant;
  expectedHash: string;
  set: (patch: Partial<Omit<HashToolsState, 'set'>>) => void;
}

export const useHashToolsStore = create<HashToolsState>()((set) => ({
  avalancheOriginal: 'Transferir 100 pesos a Ana',
  avalancheModified: 'Transferir 900 pesos a Ana',
  avalancheVariant: 'sha256',
  compareA: 'contraseña123',
  compareB: 'Contraseña123',
  compareVariant: 'sha256',
  expectedHash: '',
  set: (patch) => set(patch),
}));
