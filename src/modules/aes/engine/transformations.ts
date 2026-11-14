import type { AesState } from '../types';
import { INV_MIX_COLUMNS_MATRIX, INV_SBOX, MIX_COLUMNS_MATRIX, SBOX } from './constants';
import { gfMultiply } from './galoisField';

/** Índice lineal de la celda (fila, columna) en la matriz de estado por columnas. */
export function stateIndex(row: number, column: number): number {
  return row + 4 * column;
}

export function bytesToState(block: ArrayLike<number>): AesState {
  if (block.length !== 16) throw new Error('Un bloque AES tiene exactamente 16 bytes.');
  return Array.from(block);
}

export function stateToBytes(state: AesState): Uint8Array {
  return Uint8Array.from(state);
}

export function subBytes(state: AesState): AesState {
  return state.map((value) => SBOX[value]);
}

export function invSubBytes(state: AesState): AesState {
  return state.map((value) => INV_SBOX[value]);
}

/** Columna de origen de la celda (fila, columna) luego de ShiftRows. */
export function shiftRowsSourceColumn(row: number, column: number): number {
  return (column + row) % 4;
}

/** Columna de origen de la celda (fila, columna) luego de InvShiftRows. */
export function invShiftRowsSourceColumn(row: number, column: number): number {
  return (column - row + 4) % 4;
}

export function shiftRows(state: AesState): AesState {
  const out = new Array<number>(16);
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      out[stateIndex(row, column)] = state[stateIndex(row, shiftRowsSourceColumn(row, column))];
    }
  }
  return out;
}

export function invShiftRows(state: AesState): AesState {
  const out = new Array<number>(16);
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      out[stateIndex(row, column)] = state[stateIndex(row, invShiftRowsSourceColumn(row, column))];
    }
  }
  return out;
}

/** Multiplica cada columna del estado por una matriz fija en GF(2⁸). */
export function multiplyColumns(state: AesState, matrix: readonly (readonly number[])[]): AesState {
  const out = new Array<number>(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      let value = 0;
      for (let k = 0; k < 4; k++) {
        value ^= gfMultiply(matrix[row][k], state[stateIndex(k, column)]);
      }
      out[stateIndex(row, column)] = value;
    }
  }
  return out;
}

export function mixColumns(state: AesState): AesState {
  return multiplyColumns(state, MIX_COLUMNS_MATRIX);
}

export function invMixColumns(state: AesState): AesState {
  return multiplyColumns(state, INV_MIX_COLUMNS_MATRIX);
}

export function addRoundKey(state: AesState, roundKey: AesState): AesState {
  return state.map((value, index) => value ^ roundKey[index]);
}
