import { create } from 'zustand';
import { randomBytes } from '@/services/crypto/random';
import { isWebCryptoAvailable, webCryptoAesEncryptBlocks } from '@/services/crypto/webCrypto';
import { createSimulationStore } from '@/stores/createSimulationStore';
import { bytesEqual, bytesToHex, hexToBytes, parseInput, validateHex, type InputEncoding } from '@/utils/bytes';
import { encryptBlock } from '../engine/cipher';
import { expandKey, validateAesKey } from '../engine/keyExpansion';
import { buildAesSimulation, validateAesInput } from '../engine/simulation';
import { FIPS197_VECTORS } from '../engine/testVectors';
import { AES_PARAMETERS, type AesOperationMode, type AesPadding, type AesSimulation, type AesStep, type AesVariant } from '../types';

export const useAesPlayback = createSimulationStore<AesStep>();

export type VerificationStatus = 'idle' | 'running' | 'verified' | 'mismatch' | 'fallback' | 'error';

export interface AesVerification {
  status: VerificationStatus;
  message: string;
}

interface AesConfigState {
  mode: AesOperationMode;
  plaintext: string;
  plaintextEncoding: InputEncoding;
  ciphertextHex: string;
  keys: Record<AesVariant, string>;
  padding: AesPadding;
  /** Se incrementa con cada cambio de configuración. */
  configVersion: number;
  simulation: AesSimulation | null;
  simulationVersion: number;
  verification: AesVerification;
  setMode: (mode: AesOperationMode) => void;
  setPlaintext: (text: string) => void;
  setPlaintextEncoding: (encoding: InputEncoding) => void;
  setCiphertextHex: (hex: string) => void;
  setKey: (variant: AesVariant, hex: string) => void;
  randomizeKey: (variant: AesVariant) => void;
  setPadding: (padding: AesPadding) => void;
  loadFipsVector: (variant: AesVariant) => void;
  loadOutputForDecryption: () => void;
  start: (variant: AesVariant) => string | null;
}

const randomKeyHex = (variant: AesVariant) => bytesToHex(randomBytes(AES_PARAMETERS[variant].keyBytes));

export interface AesFormValidation {
  input: string | null;
  key: string | null;
}

export function validateAesForm(state: Pick<AesConfigState, 'mode' | 'plaintext' | 'plaintextEncoding' | 'ciphertextHex' | 'keys' | 'padding'>, variant: AesVariant): AesFormValidation {
  const keyHexError = validateHex(state.keys[variant]);
  const keyError = keyHexError ?? validateAesKey(hexToBytes(state.keys[variant]), variant);
  let inputError: string | null;
  if (state.mode === 'encrypt') {
    if (state.plaintextEncoding === 'utf8' && state.plaintext.length === 0) inputError = 'Ingresá un mensaje para cifrar.';
    else {
      const parsed = parseInput(state.plaintext, state.plaintextEncoding);
      inputError = parsed.ok ? null : parsed.error;
      if (parsed.ok) {
        if (parsed.bytes.length > 256) inputError = 'Para mantener la simulación legible, el mensaje admite hasta 256 bytes.';
        else {
          const v = validateAesInput({ mode: 'encrypt', input: parsed.bytes, padding: state.padding });
          inputError = v.ok ? null : v.error;
        }
      }
    }
  } else {
    const hexError = validateHex(state.ciphertextHex);
    if (hexError) inputError = hexError;
    else {
      const bytes = hexToBytes(state.ciphertextHex);
      const v = validateAesInput({ mode: 'decrypt', input: bytes, padding: state.padding });
      inputError = v.ok ? (bytes.length > 272 ? 'El texto cifrado admite hasta 17 bloques en la simulación.' : null) : v.error;
    }
  }
  return { input: inputError, key: keyError };
}

async function verifyWithWebCrypto(simulation: AesSimulation): Promise<AesVerification> {
  const { variant, mode } = simulation.config;
  // Bloques a cifrar con la implementación de referencia y resultado esperado.
  const plainBlocks = mode === 'encrypt' ? simulation.blocks : simulation.outputBlocks;
  const cipherBlocks = mode === 'encrypt' ? simulation.outputBlocks : simulation.blocks;

  const fipsFallback = (): AesVerification => {
    const vector = FIPS197_VECTORS[variant];
    const ok = bytesToHex(encryptBlock(hexToBytes(vector.plaintext), expandKey(hexToBytes(vector.key), variant))) === vector.ciphertext;
    return ok
      ? {
          status: 'fallback',
          message: `Este navegador no ofrece AES-${variant} en Web Crypto API. La implementación se validó con el vector oficial ${vector.source}.`,
        }
      : { status: 'error', message: 'La validación con el vector oficial FIPS-197 falló.' };
  };

  if (!isWebCryptoAvailable()) return fipsFallback();
  try {
    const reference = await webCryptoAesEncryptBlocks(simulation.config.key, plainBlocks);
    const matches = reference.every((block, i) => bytesEqual(block, cipherBlocks[i]));
    return matches
      ? {
          status: 'verified',
          message:
            mode === 'encrypt'
              ? `Los ${cipherBlocks.length} bloques cifrados coinciden con los calculados por Web Crypto API.`
              : `Al volver a cifrar los bloques descifrados con Web Crypto API se obtiene exactamente el texto cifrado de entrada.`,
        }
      : { status: 'mismatch', message: 'El resultado no coincide con Web Crypto API.' };
  } catch {
    return fipsFallback();
  }
}

export const useAesStore = create<AesConfigState>()((set, get) => {
  const touch = <T extends Partial<AesConfigState>>(patch: T) => set({ ...patch, configVersion: get().configVersion + 1 });

  return {
    mode: 'encrypt',
    plaintext: 'Hola, criptografía!',
    plaintextEncoding: 'utf8',
    ciphertextHex: '',
    keys: { 128: randomKeyHex(128), 192: randomKeyHex(192), 256: randomKeyHex(256) },
    padding: 'pkcs7',
    configVersion: 0,
    simulation: null,
    simulationVersion: -1,
    verification: { status: 'idle', message: '' },
    setMode: (mode) => touch({ mode }),
    setPlaintext: (plaintext) => touch({ plaintext }),
    setPlaintextEncoding: (plaintextEncoding) => touch({ plaintextEncoding }),
    setCiphertextHex: (ciphertextHex) => touch({ ciphertextHex }),
    setKey: (variant, hex) => touch({ keys: { ...get().keys, [variant]: hex } }),
    randomizeKey: (variant) => touch({ keys: { ...get().keys, [variant]: randomKeyHex(variant) } }),
    setPadding: (padding) => touch({ padding }),
    loadFipsVector: (variant) => {
      const vector = FIPS197_VECTORS[variant];
      const { mode } = get();
      touch({
        keys: { ...get().keys, [variant]: vector.key },
        padding: 'none',
        ...(mode === 'encrypt'
          ? { plaintext: vector.plaintext, plaintextEncoding: 'hex' as const }
          : { ciphertextHex: vector.ciphertext }),
      });
    },
    loadOutputForDecryption: () => {
      const sim = get().simulation;
      if (!sim || sim.config.mode !== 'encrypt') return;
      touch({ mode: 'decrypt', ciphertextHex: bytesToHex(sim.output), padding: sim.config.padding });
    },
    start: (variant) => {
      const state = get();
      const validation = validateAesForm(state, variant);
      if (validation.input || validation.key) return validation.input ?? validation.key;
      const input =
        state.mode === 'encrypt'
          ? (parseInput(state.plaintext, state.plaintextEncoding) as { ok: true; bytes: Uint8Array }).bytes
          : hexToBytes(state.ciphertextHex);
      try {
        const simulation = buildAesSimulation({
          variant,
          mode: state.mode,
          input,
          key: hexToBytes(state.keys[variant]),
          padding: state.padding,
          inputEncoding: state.mode === 'encrypt' ? state.plaintextEncoding : 'hex',
          inputText: state.mode === 'encrypt' ? state.plaintext : state.ciphertextHex,
        });
        set({ simulation, simulationVersion: state.configVersion, verification: { status: 'running', message: 'Verificando con Web Crypto API…' } });
        useAesPlayback.getState().load(simulation.steps);
        void verifyWithWebCrypto(simulation).then((verification) => {
          if (get().simulation === simulation) set({ verification });
        });
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : 'No se pudo ejecutar la simulación.';
      }
    },
  };
});
