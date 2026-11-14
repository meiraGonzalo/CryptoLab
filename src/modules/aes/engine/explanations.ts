import type { Explanation } from '@/types/simulation';
import { byteToHex } from '@/utils/bytes';
import type { AesOperationMode, AesState, AesVariant } from '../types';

const hex = (value: number) => `0x${byteToHex(value)}`;

export function explainMessageBytes(mode: AesOperationMode, length: number): Explanation {
  return mode === 'encrypt'
    ? {
        what: `El mensaje se convierte en una secuencia de ${length} bytes. Cada byte es un número entre 0 y 255.`,
        why: 'AES no opera sobre letras sino sobre bytes: toda la información debe expresarse primero de forma numérica.',
        technical: 'Con la codificación UTF-8 los caracteres ASCII ocupan 1 byte y otros caracteres (como ñ o á) ocupan entre 2 y 4 bytes.',
      }
    : {
        what: `Se toman los ${length} bytes del texto cifrado, expresados en hexadecimal.`,
        why: 'El descifrado opera sobre los mismos bloques de 16 bytes que produjo el cifrado.',
        technical: 'El texto cifrado debe tener una longitud múltiplo de 16 bytes, porque cada bloque cifrado ocupa exactamente 128 bits.',
      };
}

export function explainBlockSplit(mode: AesOperationMode, blocks: number, paddingLength: number): Explanation {
  const padText =
    paddingLength > 0
      ? `Se agregaron ${paddingLength} bytes de relleno con valor ${hex(paddingLength)} (PKCS#7).`
      : 'No se agregó relleno.';
  return {
    what: `Los datos se dividen en ${blocks} bloque${blocks === 1 ? '' : 's'} de 16 bytes (128 bits). ${mode === 'encrypt' ? padText : ''}`.trim(),
    why: 'AES es un cifrado por bloques: siempre procesa exactamente 128 bits a la vez, sin importar la longitud de la clave.',
    technical:
      'En PKCS#7, si faltan N bytes para completar el bloque se agregan N bytes de valor N; si el mensaje ya es múltiplo de 16 se agrega un bloque completo de 0x10. En esta simulación cada bloque se procesa de forma independiente (modo ECB), lo que facilita la visualización pero no es seguro en la práctica: los sistemas reales usan modos como GCM o CBC.',
  };
}

export function explainLoadState(blockIndex: number): Explanation {
  return {
    what: `Los 16 bytes del bloque ${blockIndex + 1} se ubican en una matriz de 4 × 4 llamada «estado», columna por columna.`,
    why: 'Todas las transformaciones de AES trabajan sobre filas y columnas de esta matriz.',
    technical: 'El byte de entrada n se ubica en la fila n mod 4 y la columna ⌊n / 4⌋. Es decir, los bytes 0–3 forman la primera columna, 4–7 la segunda, y así sucesivamente.',
  };
}

export function explainAddRoundKey(roundKeyIndex: number, isInitial: boolean, sample: { s: number; k: number }): Explanation {
  return {
    what: `Cada byte del estado se combina mediante XOR con el byte correspondiente de la clave de ronda ${roundKeyIndex}. Por ejemplo, ${hex(sample.s)} ⊕ ${hex(sample.k)} = ${hex(sample.s ^ sample.k)}.`,
    why: isInitial
      ? 'Es la primera mezcla entre los datos y la clave: sin conocer la clave, el estado ya resulta impredecible.'
      : 'Es la única operación que introduce la clave en cada ronda. Las demás transformaciones son públicas y fijas.',
    technical:
      'XOR (⊕) compara bit a bit: el resultado es 1 cuando los bits difieren y 0 cuando coinciden. Es su propia inversa, por eso el descifrado usa la misma operación con la misma clave de ronda.',
  };
}

export function explainSubBytes(inverse: boolean, sample: { from: number; to: number }): Explanation {
  return inverse
    ? {
        what: `Cada byte se reemplaza usando la S-Box inversa. Por ejemplo, ${hex(sample.from)} → ${hex(sample.to)}.`,
        why: 'Deshace la sustitución no lineal aplicada durante el cifrado.',
        technical: 'La S-Box inversa aplica primero la transformación afín inversa y luego el inverso multiplicativo en GF(2⁸).',
      }
    : {
        what: `Cada byte se reemplaza por otro según la tabla S-Box. Por ejemplo, ${hex(sample.from)} → ${hex(sample.to)}: el primer dígito indica la fila y el segundo la columna.`,
        why: 'Es la única operación no lineal de AES. Rompe cualquier relación algebraica simple entre la entrada, la clave y la salida.',
        technical: 'S(x) = A · x⁻¹ ⊕ 0x63, donde x⁻¹ es el inverso multiplicativo en GF(2⁸) (con 0 ↦ 0) y A es una matriz binaria fija (transformación afín).',
      };
}

export function explainShiftRows(inverse: boolean): Explanation {
  return inverse
    ? {
        what: 'Cada fila se desplaza circularmente hacia la derecha: la fila 0 no se mueve, la fila 1 se mueve 1 posición, la fila 2, 2 posiciones y la fila 3, 3 posiciones.',
        why: 'Revierte el desplazamiento hacia la izquierda realizado en ShiftRows.',
        technical: 'InvShiftRows: s′[r, c] = s[r, (c − r) mod 4].',
      }
    : {
        what: 'Cada fila se desplaza circularmente hacia la izquierda: la fila 0 no se mueve, la fila 1 se mueve 1 posición, la fila 2, 2 posiciones y la fila 3, 3 posiciones.',
        why: 'Distribuye los bytes de cada columna entre columnas distintas. Combinado con MixColumns, logra que cada byte de salida dependa de todos los bytes de entrada en pocas rondas (difusión).',
        technical: 'ShiftRows: s′[r, c] = s[r, (c + r) mod 4].',
      };
}

export function explainMixColumns(inverse: boolean, sampleColumn: AesState, sampleResult: AesState): Explanation {
  const col = sampleColumn.map(hex).join(', ');
  const res = sampleResult.map(hex).join(', ');
  return inverse
    ? {
        what: `Cada columna se multiplica por la matriz inversa de MixColumns. La primera columna [${col}] se transforma en [${res}].`,
        why: 'Deshace la mezcla de columnas aplicada durante el cifrado.',
        technical: 'La matriz inversa tiene coeficientes 0x0e, 0x0b, 0x0d y 0x09. Las sumas son XOR y los productos se calculan en GF(2⁸) módulo x⁸ + x⁴ + x³ + x + 1.',
      }
    : {
        what: `Cada columna se multiplica por una matriz fija. La primera columna [${col}] se transforma en [${res}].`,
        why: 'Mezcla los cuatro bytes de cada columna: si cambia un solo byte de entrada, cambian los cuatro bytes de salida.',
        technical: 'Las operaciones se realizan en GF(2⁸): la suma es XOR y multiplicar por 0x02 equivale a desplazar un bit a la izquierda y, si el bit más alto era 1, aplicar XOR con 0x1b. Multiplicar por 0x03 es (0x02 · b) ⊕ b.',
      };
}

export function explainOutput(mode: AesOperationMode, blockIndex: number, variant: AesVariant): Explanation {
  return mode === 'encrypt'
    ? {
        what: `Se lee la matriz de estado columna por columna y se obtienen los 16 bytes cifrados del bloque ${blockIndex + 1}.`,
        why: `Tras las rondas de AES-${variant}, el bloque resultante no revela información del mensaje sin la clave.`,
        technical: 'La última ronda omite MixColumns para que el cifrado y el descifrado tengan una estructura simétrica; agregarla no aumentaría la seguridad.',
      }
    : {
        what: `Se lee la matriz de estado columna por columna y se recuperan los 16 bytes originales del bloque ${blockIndex + 1}.`,
        why: 'Aplicar las transformaciones inversas en orden inverso reconstruye exactamente el bloque original.',
        technical: 'Si el último bloque contiene relleno PKCS#7, se elimina para recuperar el mensaje de longitud original.',
      };
}
