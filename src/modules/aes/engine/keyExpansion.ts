import { AES_PARAMETERS, type AesKeySchedule, type AesVariant, type AesWord, type KeyWordDerivation } from '../types';
import { RCON, SBOX } from './constants';

export function rotWord(word: AesWord): AesWord {
  return [word[1], word[2], word[3], word[0]];
}

export function subWord(word: AesWord): AesWord {
  return word.map((value) => SBOX[value]);
}

export function xorWords(a: AesWord, b: AesWord): AesWord {
  return a.map((value, index) => value ^ b[index]);
}

export function validateAesKey(key: Uint8Array, variant: AesVariant): string | null {
  const expected = AES_PARAMETERS[variant].keyBytes;
  if (key.length !== expected) {
    return `AES-${variant} requiere una clave de ${expected} bytes (${expected * 2} dígitos hexadecimales); se recibieron ${key.length}.`;
  }
  return null;
}

/**
 * Expansión de clave (FIPS-197, sección 5.2), registrando cada paso intermedio
 * para su visualización.
 */
export function expandKey(key: Uint8Array, variant: AesVariant): AesKeySchedule {
  const error = validateAesKey(key, variant);
  if (error) throw new Error(error);
  const { nk, nr } = AES_PARAMETERS[variant];
  const totalWords = 4 * (nr + 1);
  const words: AesWord[] = [];
  const derivations: KeyWordDerivation[] = [];

  for (let i = 0; i < nk; i++) {
    const word = Array.from(key.slice(4 * i, 4 * i + 4));
    words.push(word);
    derivations.push({
      index: i,
      kind: 'original',
      previous: null,
      afterRotWord: null,
      afterSubWord: null,
      rcon: null,
      temp: null,
      wordNkBefore: null,
      result: word,
    });
  }

  for (let i = nk; i < totalWords; i++) {
    const previous = words[i - 1];
    let temp: AesWord = previous;
    let afterRotWord: AesWord | null = null;
    let afterSubWord: AesWord | null = null;
    let rcon: AesWord | null = null;
    let kind: KeyWordDerivation['kind'] = 'xor';

    if (i % nk === 0) {
      kind = 'rotSubRcon';
      afterRotWord = rotWord(temp);
      afterSubWord = subWord(afterRotWord);
      rcon = [RCON[i / nk], 0, 0, 0];
      temp = xorWords(afterSubWord, rcon);
    } else if (nk > 6 && i % nk === 4) {
      kind = 'sub';
      afterSubWord = subWord(temp);
      temp = afterSubWord;
    }

    const wordNkBefore = words[i - nk];
    const result = xorWords(wordNkBefore, temp);
    words.push(result);
    derivations.push({ index: i, kind, previous, afterRotWord, afterSubWord, rcon, temp, wordNkBefore, result });
  }

  const roundKeys = Array.from({ length: nr + 1 }, (_, round) =>
    words.slice(4 * round, 4 * round + 4).flatMap((word) => [...word]),
  );

  return { variant, key: Uint8Array.from(key), words, derivations, roundKeys };
}
