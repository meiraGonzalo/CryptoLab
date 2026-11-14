import type { AesKeySchedule } from '../types';
import {
  addRoundKey,
  bytesToState,
  invMixColumns,
  invShiftRows,
  invSubBytes,
  mixColumns,
  shiftRows,
  stateToBytes,
  subBytes,
} from './transformations';

/** Cifrado de un bloque de 128 bits (FIPS-197, sección 5.1). */
export function encryptBlock(block: Uint8Array, schedule: AesKeySchedule): Uint8Array {
  const nr = schedule.roundKeys.length - 1;
  let state = addRoundKey(bytesToState(block), schedule.roundKeys[0]);
  for (let round = 1; round < nr; round++) {
    state = addRoundKey(mixColumns(shiftRows(subBytes(state))), schedule.roundKeys[round]);
  }
  state = addRoundKey(shiftRows(subBytes(state)), schedule.roundKeys[nr]);
  return stateToBytes(state);
}

/** Descifrado de un bloque con el cifrado inverso (FIPS-197, sección 5.3). */
export function decryptBlock(block: Uint8Array, schedule: AesKeySchedule): Uint8Array {
  const nr = schedule.roundKeys.length - 1;
  let state = addRoundKey(bytesToState(block), schedule.roundKeys[nr]);
  for (let round = nr - 1; round >= 1; round--) {
    state = invMixColumns(addRoundKey(invSubBytes(invShiftRows(state)), schedule.roundKeys[round]));
  }
  state = addRoundKey(invSubBytes(invShiftRows(state)), schedule.roundKeys[0]);
  return stateToBytes(state);
}

/** Relleno PKCS#7: agrega N bytes con valor N (1 ≤ N ≤ 16). */
export function pkcs7Pad(data: Uint8Array): Uint8Array {
  const padLength = 16 - (data.length % 16);
  const out = new Uint8Array(data.length + padLength);
  out.set(data);
  out.fill(padLength, data.length);
  return out;
}

export type UnpadResult = { ok: true; data: Uint8Array; paddingLength: number } | { ok: false; error: string };

export function pkcs7Unpad(data: Uint8Array): UnpadResult {
  if (data.length === 0 || data.length % 16 !== 0) {
    return { ok: false, error: 'La longitud no es múltiplo de 16 bytes.' };
  }
  const padLength = data[data.length - 1];
  if (padLength < 1 || padLength > 16) {
    return { ok: false, error: `El último byte (0x${padLength.toString(16).padStart(2, '0')}) no es un relleno PKCS#7 válido. ¿La clave es correcta?` };
  }
  for (let i = data.length - padLength; i < data.length; i++) {
    if (data[i] !== padLength) {
      return { ok: false, error: 'Los bytes de relleno no son consistentes con PKCS#7. ¿La clave es correcta?' };
    }
  }
  return { ok: true, data: data.slice(0, data.length - padLength), paddingLength: padLength };
}
