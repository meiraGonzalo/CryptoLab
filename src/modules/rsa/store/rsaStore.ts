import { create } from 'zustand';
import { buildRsaKey, choosePublicExponent, generateRandomPrimes } from '../engine/keygen';
import type { RsaKeyResult, RsaKeySize, RsaMessageMode } from '../types';

interface RsaState {
  pInput: string;
  qInput: string;
  eInput: string;
  keySize: RsaKeySize;
  keyResult: RsaKeyResult;
  messageMode: RsaMessageMode;
  messageInput: string;
  ciphertextInput: string;
  setP: (value: string) => void;
  setQ: (value: string) => void;
  setE: (value: string) => void;
  setKeySize: (size: RsaKeySize) => void;
  generatePrimes: () => void;
  suggestExponent: () => void;
  setMessageMode: (mode: RsaMessageMode) => void;
  setMessageInput: (value: string) => void;
  setCiphertextInput: (value: string) => void;
}

const DEFAULT = { p: '61', q: '53', e: '17' };

export const useRsaStore = create<RsaState>()((set, get) => {
  const rebuild = (patch: Partial<Pick<RsaState, 'pInput' | 'qInput' | 'eInput'>>) => {
    const next = { pInput: get().pInput, qInput: get().qInput, eInput: get().eInput, ...patch };
    set({ ...next, keyResult: buildRsaKey(next.pInput, next.qInput, next.eInput) });
  };

  return {
    pInput: DEFAULT.p,
    qInput: DEFAULT.q,
    eInput: DEFAULT.e,
    keySize: 'tiny',
    keyResult: buildRsaKey(DEFAULT.p, DEFAULT.q, DEFAULT.e),
    messageMode: 'text',
    messageInput: 'Hola',
    ciphertextInput: '',
    setP: (pInput) => rebuild({ pInput }),
    setQ: (qInput) => rebuild({ qInput }),
    setE: (eInput) => rebuild({ eInput }),
    setKeySize: (keySize) => set({ keySize }),
    generatePrimes: () => {
      const { p, q } = generateRandomPrimes(get().keySize);
      const phi = (p - 1n) * (q - 1n);
      rebuild({ pInput: p.toString(), qInput: q.toString(), eInput: choosePublicExponent(phi).toString() });
    },
    suggestExponent: () => {
      const result = buildRsaKey(get().pInput, get().qInput, '');
      if (result.ok) rebuild({ eInput: result.key.e.toString() });
    },
    setMessageMode: (messageMode) => set({ messageMode }),
    setMessageInput: (messageInput) => set({ messageInput }),
    setCiphertextInput: (ciphertextInput) => set({ ciphertextInput }),
  };
});
