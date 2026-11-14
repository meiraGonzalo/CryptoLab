import type { AesVariant } from '../types';

export interface AesTestVector {
  variant: AesVariant;
  source: string;
  key: string;
  plaintext: string;
  ciphertext: string;
}

/** Vectores de prueba oficiales de FIPS-197, Apéndice C. */
export const FIPS197_VECTORS: Record<AesVariant, AesTestVector> = {
  128: {
    variant: 128,
    source: 'FIPS-197, Apéndice C.1',
    key: '000102030405060708090a0b0c0d0e0f',
    plaintext: '00112233445566778899aabbccddeeff',
    ciphertext: '69c4e0d86a7b0430d8cdb78070b4c55a',
  },
  192: {
    variant: 192,
    source: 'FIPS-197, Apéndice C.2',
    key: '000102030405060708090a0b0c0d0e0f1011121314151617',
    plaintext: '00112233445566778899aabbccddeeff',
    ciphertext: 'dda97ca4864cdfe06eaf70a0ec0d7191',
  },
  256: {
    variant: 256,
    source: 'FIPS-197, Apéndice C.3',
    key: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    plaintext: '00112233445566778899aabbccddeeff',
    ciphertext: '8ea2b7ca516745bfeafc49904b496089',
  },
};

/** Vector del Apéndice A.1 de FIPS-197 para la expansión de clave de AES-128. */
export const FIPS197_KEY_EXPANSION_128 = {
  key: '2b7e151628aed2a6abf7158809cf4f3c',
  lastWord: 'b6630ca6',
  word4: 'a0fafe17',
};
