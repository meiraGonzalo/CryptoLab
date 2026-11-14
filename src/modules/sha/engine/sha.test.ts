import { describe, expect, it } from 'vitest';
import { bytesToHex, utf8ToBytes } from '@/utils/bytes';
import { SHA_PARAMETERS } from './constants';
import { sha, traceSha } from './sha2';
import { buildShaSteps } from './steps';

const two448 = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
const two896 =
  'abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu';

describe('Constantes derivadas de los números primos', () => {
  it('SHA-256', () => {
    expect(SHA_PARAMETERS.sha256.initialHash[0]).toBe(0x6a09e667n);
    expect(SHA_PARAMETERS.sha256.initialHash[7]).toBe(0x5be0cd19n);
    expect(SHA_PARAMETERS.sha256.constants[0]).toBe(0x428a2f98n);
    expect(SHA_PARAMETERS.sha256.constants[63]).toBe(0xc67178f2n);
  });
  it('SHA-512', () => {
    expect(SHA_PARAMETERS.sha512.initialHash[0]).toBe(0x6a09e667f3bcc908n);
    expect(SHA_PARAMETERS.sha512.constants[0]).toBe(0x428a2f98d728ae22n);
    expect(SHA_PARAMETERS.sha512.constants[79]).toBe(0x6c44198c4a475817n);
  });
});

describe('SHA-256 (vectores NIST FIPS 180-4)', () => {
  it('"abc"', () => {
    expect(bytesToHex(sha(utf8ToBytes('abc'), 'sha256'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
  it('mensaje vacío', () => {
    expect(bytesToHex(sha(new Uint8Array(), 'sha256'))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
  it('448 bits (dos bloques)', () => {
    const trace = traceSha(utf8ToBytes(two448), 'sha256');
    expect(trace.blocks.length).toBe(2);
    expect(bytesToHex(trace.digest)).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });
});

describe('SHA-512 (vectores NIST FIPS 180-4)', () => {
  it('"abc"', () => {
    expect(bytesToHex(sha(utf8ToBytes('abc'), 'sha512'))).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });
  it('896 bits (dos bloques)', () => {
    expect(bytesToHex(sha(utf8ToBytes(two896), 'sha512'))).toBe(
      '8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909',
    );
  });
});

describe('Pasos de la simulación', () => {
  it('incluye una ronda por paso y termina en el hash', () => {
    const trace = traceSha(utf8ToBytes('abc'), 'sha256');
    const steps = buildShaSteps(trace);
    expect(steps.filter((s) => s.kind === 'round').length).toBe(64);
    expect(steps[steps.length - 1].kind).toBe('digest');
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
  });
});
