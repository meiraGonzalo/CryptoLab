import type { Explanation } from '@/types/simulation';
import type { ShaStep, ShaTrace } from '../types';
import { formatWord } from './sha2';

function explainRound(trace: ShaTrace, blockIndex: number, t: number): Explanation {
  const { params } = trace;
  const round = trace.blocks[blockIndex].rounds[t];
  const w = params.wordBits;
  return {
    what: `Ronda ${t}: se combinan los registros con la palabra W${t} = ${formatWord(round.w, w)} y la constante K${t} = ${formatWord(round.k, w)} para calcular T1 y T2.`,
    why: 'Cada ronda mezcla de forma no lineal un fragmento del mensaje con el estado interno. Tras todas las rondas, cada bit del resultado depende de todos los bits del bloque.',
    technical: `T1 = H + Σ1(E) + Ch(E,F,G) + K${t} + W${t} y T2 = Σ0(A) + Maj(A,B,C), sumas módulo 2^${w}. Luego los registros se desplazan: H←G, G←F, F←E, E←D+T1, D←C, C←B, B←A, A←T1+T2.`,
  };
}

/** Lista lineal de pasos que recorre la traza de SHA-2. */
export function buildShaSteps(trace: ShaTrace): ShaStep[] {
  const { params, padding } = trace;
  const steps: ShaStep[] = [];
  const add = (step: Omit<ShaStep, 'groupKey'> & { groupKey?: string }) =>
    steps.push({ ...step, groupKey: step.groupKey ?? step.id });

  add({
    id: 'bytes',
    kind: 'bytes',
    blockIndex: -1,
    round: -1,
    title: 'Conversión del mensaje en bytes',
    explanation: {
      what: `El mensaje se representa como ${padding.messageBytes} bytes (${padding.bitLength} bits).`,
      why: 'La función hash opera sobre bits; cualquier dato (texto, imagen, archivo) se procesa como una secuencia de bytes.',
      technical: 'Los caracteres se codifican con UTF-8. El hash depende de los bytes exactos: una misma palabra con otra codificación produce otro hash.',
    },
  });
  add({
    id: 'padding',
    kind: 'padding',
    blockIndex: -1,
    round: -1,
    title: 'Aplicación del relleno (padding)',
    explanation: {
      what: `Se agrega un bit «1» (byte 0x80) y luego ${padding.zeroBytes} bytes en cero hasta dejar espacio exacto para la longitud.`,
      why: `El mensaje debe ocupar un múltiplo exacto de ${params.blockBytes * 8} bits para dividirse en bloques completos.`,
      technical: `Se agregan k bits en cero, donde k es el menor valor que cumple (L + 1 + k) ≡ ${params.blockBytes * 8 - params.lengthBytes * 8} (mod ${params.blockBytes * 8}).`,
    },
  });
  add({
    id: 'length',
    kind: 'length',
    blockIndex: -1,
    round: -1,
    title: 'Incorporación de la longitud del mensaje',
    explanation: {
      what: `Los últimos ${params.lengthBytes * 8} bits guardan la longitud original del mensaje: ${padding.bitLength} bits.`,
      why: 'Incluir la longitud evita que dos mensajes distintos produzcan el mismo bloque final tras el relleno.',
      technical: `La longitud se escribe como un entero big-endian de ${params.lengthBytes * 8} bits (refuerzo de Merkle–Damgård).`,
    },
  });
  add({
    id: 'blocks',
    kind: 'blocks',
    blockIndex: -1,
    round: -1,
    title: `División en bloques de ${params.blockBytes * 8} bits`,
    explanation: {
      what: `El mensaje con relleno ocupa ${trace.blocks.length} bloque${trace.blocks.length === 1 ? '' : 's'}. Cada bloque se divide en 16 palabras de ${params.wordBits} bits.`,
      why: 'Los bloques se procesan en orden: el resultado de cada uno es el punto de partida del siguiente.',
      technical: 'Esta construcción iterativa se conoce como Merkle–Damgård; la función que procesa cada bloque se llama función de compresión.',
    },
  });

  trace.blocks.forEach((_block, b) => {
    add({
      id: `b${b}-schedule`,
      kind: 'schedule',
      blockIndex: b,
      round: -1,
      title: `Expansión del mensaje (W0–W${params.rounds - 1})`,
      explanation: {
        what: `Las 16 palabras del bloque ${b + 1} se extienden a ${params.rounds} palabras, una por ronda.`,
        why: 'La expansión distribuye cada bit del bloque en muchas rondas distintas.',
        technical: 'Para t ≥ 16: W[t] = σ1(W[t−2]) + W[t−7] + σ0(W[t−15]) + W[t−16], con sumas módulo 2^w.',
      },
    });
    add({
      id: `b${b}-init`,
      kind: 'init',
      blockIndex: b,
      round: -1,
      title: 'Inicialización de los registros A–H',
      explanation:
        b === 0
          ? {
              what: 'Los ocho registros toman los valores iniciales H0–H7 definidos por el estándar.',
              why: 'Son constantes públicas y conocidas: cualquier persona obtiene el mismo hash para el mismo mensaje.',
              technical: `Son los primeros ${params.wordBits} bits de la parte fraccionaria de las raíces cuadradas de los primeros 8 números primos (2, 3, 5, …, 19).`,
            }
          : {
              what: `Los registros toman el valor hash obtenido al terminar el bloque ${b}.`,
              why: 'Así, el resultado final depende de todos los bloques del mensaje.',
              technical: 'Encadenamiento de Merkle–Damgård: el valor intermedio H(i−1) es la entrada de la compresión del bloque i.',
            },
    });
    for (let t = 0; t < params.rounds; t++) {
      add({
        id: `b${b}-round-${t}`,
        groupKey: `b${b}-round-${t}`,
        kind: 'round',
        blockIndex: b,
        round: t,
        title: `Ronda ${t}`,
        explanation: explainRound(trace, b, t),
      });
    }
    add({
      id: `b${b}-final`,
      kind: 'final',
      blockIndex: b,
      round: -1,
      title: 'Actualización del valor hash',
      explanation: {
        what: 'Cada registro final se suma al valor hash con el que comenzó el bloque.',
        why: 'Esta suma impide invertir la compresión ejecutando las rondas hacia atrás.',
        technical: `H(i)j = H(i−1)j + registroj mod 2^${params.wordBits}, para j = 0..7.`,
      },
    });
  });

  add({
    id: 'digest',
    kind: 'digest',
    blockIndex: -1,
    round: -1,
    title: `Hash final de ${params.digestBytes * 8} bits`,
    explanation: {
      what: `Se concatenan los ocho valores H0–H7 para formar el hash de ${params.digestBytes * 8} bits.`,
      why: 'El resultado es una huella digital de longitud fija: identifica al mensaje pero no permite reconstruirlo.',
      technical: `${params.name} es una función hash, no un cifrado: no existe una clave de descifrado. Obtener el mensaje a partir del hash requeriría probar entradas por fuerza bruta.`,
    },
  });

  return steps;
}
