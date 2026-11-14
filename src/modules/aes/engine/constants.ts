import { gfInverse, xtime } from './galoisField';

function rotateLeft8(value: number, shift: number): number {
  return ((value << shift) | (value >> (8 - shift))) & 0xff;
}

/**
 * Transformación afín de AES: b ⊕ rotl(b,1) ⊕ rotl(b,2) ⊕ rotl(b,3) ⊕ rotl(b,4) ⊕ 0x63.
 */
export function affineTransform(value: number): number {
  return (
    value ^
    rotateLeft8(value, 1) ^
    rotateLeft8(value, 2) ^
    rotateLeft8(value, 3) ^
    rotateLeft8(value, 4) ^
    0x63
  );
}

/**
 * La S-Box se construye a partir de su definición matemática:
 * S(x) = Afín(x⁻¹) en GF(2⁸). Los vectores de prueba de FIPS-197 verifican el resultado.
 */
function buildSBox(): number[] {
  return Array.from({ length: 256 }, (_, x) => affineTransform(gfInverse(x)));
}

export const SBOX: readonly number[] = buildSBox();

export const INV_SBOX: readonly number[] = (() => {
  const inverse = new Array<number>(256);
  SBOX.forEach((value, index) => {
    inverse[value] = index;
  });
  return inverse;
})();

/** Constantes de ronda Rcon[i] = x^(i−1) en GF(2⁸), para i = 1..10. */
export const RCON: readonly number[] = (() => {
  const values: number[] = [0x00];
  let current = 0x01;
  for (let i = 1; i <= 10; i++) {
    values.push(current);
    current = xtime(current);
  }
  return values;
})();

/** Matriz fija de MixColumns. */
export const MIX_COLUMNS_MATRIX: readonly (readonly number[])[] = [
  [0x02, 0x03, 0x01, 0x01],
  [0x01, 0x02, 0x03, 0x01],
  [0x01, 0x01, 0x02, 0x03],
  [0x03, 0x01, 0x01, 0x02],
];

/** Matriz inversa usada en InvMixColumns. */
export const INV_MIX_COLUMNS_MATRIX: readonly (readonly number[])[] = [
  [0x0e, 0x0b, 0x0d, 0x09],
  [0x09, 0x0e, 0x0b, 0x0d],
  [0x0d, 0x09, 0x0e, 0x0b],
  [0x0b, 0x0d, 0x09, 0x0e],
];
