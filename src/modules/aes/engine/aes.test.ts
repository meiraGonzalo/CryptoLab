import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@/utils/bytes';
import { SBOX, INV_SBOX, RCON } from './constants';
import { gfMultiply, xtime } from './galoisField';
import { expandKey } from './keyExpansion';
import { decryptBlock, encryptBlock, pkcs7Pad, pkcs7Unpad } from './cipher';
import { buildAesSimulation } from './simulation';
import { mixColumns, invMixColumns, shiftRows, invShiftRows } from './transformations';
import { FIPS197_KEY_EXPANSION_128, FIPS197_VECTORS } from './testVectors';
import type { AesVariant } from '../types';

describe('GF(2⁸)', () => {
  it('xtime y multiplicación coinciden con FIPS-197 §4.2', () => {
    expect(xtime(0x57)).toBe(0xae);
    expect(xtime(0xae)).toBe(0x47);
    expect(gfMultiply(0x57, 0x83)).toBe(0xc1);
    expect(gfMultiply(0x57, 0x13)).toBe(0xfe);
  });
});

describe('S-Box calculada', () => {
  it('coincide con valores conocidos', () => {
    expect(SBOX[0x00]).toBe(0x63);
    expect(SBOX[0x53]).toBe(0xed);
    expect(SBOX[0xff]).toBe(0x16);
    expect(INV_SBOX[0x63]).toBe(0x00);
    expect(RCON.slice(1)).toEqual([0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]);
  });
});

describe('Transformaciones', () => {
  it('MixColumns de FIPS-197 (columna db 13 53 45 → 8e 4d a1 bc)', () => {
    const state = [0xdb, 0x13, 0x53, 0x45, ...new Array(12).fill(0)];
    expect(mixColumns(state).slice(0, 4)).toEqual([0x8e, 0x4d, 0xa1, 0xbc]);
  });
  it('las inversas deshacen las transformaciones', () => {
    const state = Array.from({ length: 16 }, (_, i) => (i * 37 + 11) & 0xff);
    expect(invMixColumns(mixColumns(state))).toEqual(state);
    expect(invShiftRows(shiftRows(state))).toEqual(state);
  });
});

describe('Expansión de clave', () => {
  it('coincide con FIPS-197 Apéndice A.1', () => {
    const schedule = expandKey(hexToBytes(FIPS197_KEY_EXPANSION_128.key), 128);
    expect(schedule.words.length).toBe(44);
    expect(bytesToHex(schedule.words[4])).toBe(FIPS197_KEY_EXPANSION_128.word4);
    expect(bytesToHex(schedule.words[43])).toBe(FIPS197_KEY_EXPANSION_128.lastWord);
  });
  it('genera la cantidad correcta de palabras por variante', () => {
    expect(expandKey(new Uint8Array(24), 192).words.length).toBe(52);
    expect(expandKey(new Uint8Array(32), 256).words.length).toBe(60);
  });
});

describe.each([128, 192, 256] as AesVariant[])('AES-%i con vectores FIPS-197', (variant) => {
  const vector = FIPS197_VECTORS[variant];
  const schedule = expandKey(hexToBytes(vector.key), variant);

  it('cifra el bloque', () => {
    expect(bytesToHex(encryptBlock(hexToBytes(vector.plaintext), schedule))).toBe(vector.ciphertext);
  });
  it('descifra el bloque', () => {
    expect(bytesToHex(decryptBlock(hexToBytes(vector.ciphertext), schedule))).toBe(vector.plaintext);
  });
  it('la simulación paso a paso produce el mismo resultado y la cantidad correcta de rondas', () => {
    const sim = buildAesSimulation({
      variant,
      mode: 'encrypt',
      input: hexToBytes(vector.plaintext),
      key: hexToBytes(vector.key),
      padding: 'none',
      inputEncoding: 'hex',
      inputText: vector.plaintext,
    });
    expect(bytesToHex(sim.output)).toBe(vector.ciphertext);
    const nr = { 128: 10, 192: 12, 256: 14 }[variant];
    expect(sim.steps.filter((s) => s.operation === 'mixColumns').length).toBe(nr - 1);
    expect(sim.steps.filter((s) => s.operation === 'addRoundKey').length).toBe(nr + 1);
    const lastRound = sim.steps.filter((s) => s.round === nr && s.operation !== 'output').map((s) => s.operation);
    expect(lastRound).toEqual(['subBytes', 'shiftRows', 'addRoundKey']);
  });
});

describe('Relleno y mensajes de varios bloques', () => {
  it('PKCS#7 ida y vuelta', () => {
    const data = utf8ToBytes('Hola mundo');
    const padded = pkcs7Pad(data);
    expect(padded.length).toBe(16);
    expect(padded[15]).toBe(6);
    const unpadded = pkcs7Unpad(padded);
    expect(unpadded.ok && bytesToHex(unpadded.data)).toBe(bytesToHex(data));
  });
  it('cifrar y descifrar recupera el mensaje', () => {
    const key = hexToBytes(FIPS197_VECTORS[256].key);
    const message = utf8ToBytes('Criptografía visual: un mensaje con más de dieciséis bytes.');
    const enc = buildAesSimulation({ variant: 256, mode: 'encrypt', input: message, key, padding: 'pkcs7', inputEncoding: 'utf8', inputText: '' });
    const dec = buildAesSimulation({ variant: 256, mode: 'decrypt', input: enc.output, key, padding: 'pkcs7', inputEncoding: 'hex', inputText: '' });
    expect(dec.paddingError).toBeNull();
    expect(bytesToHex(dec.output)).toBe(bytesToHex(message));
  });
});
