import { chunkBytes } from '@/utils/bytes';
import { AES_PARAMETERS, type AesSimulation, type AesSimulationConfig, type AesState, type AesStep } from '../types';
import { decryptBlock, encryptBlock, pkcs7Pad, pkcs7Unpad } from './cipher';
import {
  explainAddRoundKey,
  explainBlockSplit,
  explainLoadState,
  explainMessageBytes,
  explainMixColumns,
  explainOutput,
  explainShiftRows,
  explainSubBytes,
} from './explanations';
import { expandKey } from './keyExpansion';
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

export type AesInputValidation = { ok: true } | { ok: false; error: string };

export function validateAesInput(config: Pick<AesSimulationConfig, 'mode' | 'input' | 'padding'>): AesInputValidation {
  if (config.mode === 'decrypt') {
    if (config.input.length === 0) return { ok: false, error: 'Ingresá el texto cifrado.' };
    if (config.input.length % 16 !== 0) {
      return { ok: false, error: `El texto cifrado debe tener una longitud múltiplo de 16 bytes (tiene ${config.input.length}).` };
    }
    return { ok: true };
  }
  if (config.padding === 'none' && (config.input.length === 0 || config.input.length % 16 !== 0)) {
    return {
      ok: false,
      error: `Sin relleno, el mensaje debe ocupar un múltiplo exacto de 16 bytes (tiene ${config.input.length}). Elegí PKCS#7 para completar el bloque automáticamente.`,
    };
  }
  return { ok: true };
}

const firstColumn = (state: AesState): AesState => state.slice(0, 4);

/**
 * Ejecuta AES de forma completa y registra cada estado intermedio.
 * Los pasos son el producto directo de las transformaciones reales: la interfaz
 * solo los recorre y representa.
 */
export function buildAesSimulation(config: AesSimulationConfig): AesSimulation {
  const validation = validateAesInput(config);
  if (!validation.ok) throw new Error(validation.error);

  const schedule = expandKey(config.key, config.variant);
  const { nr } = AES_PARAMETERS[config.variant];
  const isEncrypt = config.mode === 'encrypt';

  const processedInput = isEncrypt && config.padding === 'pkcs7' ? pkcs7Pad(config.input) : Uint8Array.from(config.input);
  const paddingLength = processedInput.length - config.input.length;
  const blocks = chunkBytes(processedInput, 16);
  const steps: AesStep[] = [];

  steps.push({
    id: 'prep-bytes',
    groupKey: 'prep-bytes',
    title: isEncrypt ? 'Conversión del mensaje en bytes' : 'Lectura del texto cifrado',
    operation: 'messageBytes',
    blockIndex: -1,
    round: -1,
    roundKeyIndex: null,
    before: [],
    after: [],
    roundKey: null,
    explanation: explainMessageBytes(config.mode, config.input.length),
  });
  steps.push({
    id: 'prep-blocks',
    groupKey: 'prep-blocks',
    title: 'División en bloques de 128 bits',
    operation: 'blockSplit',
    blockIndex: -1,
    round: -1,
    roundKeyIndex: null,
    before: [],
    after: [],
    roundKey: null,
    explanation: explainBlockSplit(config.mode, blocks.length, paddingLength),
  });

  const outputBlocks: Uint8Array[] = [];

  blocks.forEach((block, blockIndex) => {
    const push = (step: Omit<AesStep, 'id' | 'groupKey' | 'blockIndex'>) => {
      steps.push({
        ...step,
        id: `b${blockIndex}-r${step.round}-${step.operation}`,
        groupKey: `b${blockIndex}-r${step.round}`,
        blockIndex,
      });
    };

    let state = bytesToState(block);
    push({
      title: 'Construcción de la matriz de estado',
      operation: 'loadState',
      round: 0,
      roundKeyIndex: null,
      before: state,
      after: state,
      roundKey: null,
      explanation: explainLoadState(blockIndex),
    });

    const pushAddRoundKey = (round: number, roundKeyIndex: number) => {
      const key = schedule.roundKeys[roundKeyIndex];
      const next = addRoundKey(state, key);
      push({
        title: round === 0 ? 'AddRoundKey inicial' : 'AddRoundKey',
        operation: 'addRoundKey',
        round,
        roundKeyIndex,
        before: state,
        after: next,
        roundKey: key,
        explanation: explainAddRoundKey(roundKeyIndex, round === 0, { s: state[0], k: key[0] }),
      });
      state = next;
    };

    const pushTransform = (
      round: number,
      operation: AesStep['operation'],
      title: string,
      transform: (s: AesState) => AesState,
    ) => {
      const next = transform(state);
      let explanation;
      switch (operation) {
        case 'subBytes':
        case 'invSubBytes':
          explanation = explainSubBytes(operation === 'invSubBytes', { from: state[0], to: next[0] });
          break;
        case 'shiftRows':
        case 'invShiftRows':
          explanation = explainShiftRows(operation === 'invShiftRows');
          break;
        default:
          explanation = explainMixColumns(operation === 'invMixColumns', firstColumn(state), firstColumn(next));
      }
      push({ title, operation, round, roundKeyIndex: null, before: state, after: next, roundKey: null, explanation });
      state = next;
    };

    if (isEncrypt) {
      pushAddRoundKey(0, 0);
      for (let round = 1; round <= nr; round++) {
        pushTransform(round, 'subBytes', 'SubBytes', subBytes);
        pushTransform(round, 'shiftRows', 'ShiftRows', shiftRows);
        if (round < nr) pushTransform(round, 'mixColumns', 'MixColumns', mixColumns);
        pushAddRoundKey(round, round);
      }
    } else {
      pushAddRoundKey(0, nr);
      for (let round = 1; round <= nr; round++) {
        pushTransform(round, 'invShiftRows', 'InvShiftRows', invShiftRows);
        pushTransform(round, 'invSubBytes', 'InvSubBytes', invSubBytes);
        pushAddRoundKey(round, nr - round);
        if (round < nr) pushTransform(round, 'invMixColumns', 'InvMixColumns', invMixColumns);
      }
    }

    const outputBlock = stateToBytes(state);
    outputBlocks.push(outputBlock);
    push({
      title: isEncrypt ? 'Bloque cifrado' : 'Bloque descifrado',
      operation: 'output',
      round: nr,
      roundKeyIndex: null,
      before: state,
      after: state,
      roundKey: null,
      explanation: explainOutput(config.mode, blockIndex, config.variant),
    });
    // Las etiquetas de ronda del paso de salida no deben generar una ronda extra.
    steps[steps.length - 1].groupKey = `b${blockIndex}-output`;

    // Comprobación interna: la traza coincide con la implementación directa.
    const reference = isEncrypt ? encryptBlock(block, schedule) : decryptBlock(block, schedule);
    if (reference.some((value, index) => value !== outputBlock[index])) {
      throw new Error('Inconsistencia interna entre la traza y el cifrado de referencia.');
    }
  });

  const joined = new Uint8Array(outputBlocks.length * 16);
  outputBlocks.forEach((block, index) => joined.set(block, index * 16));

  let output = joined;
  let paddingError: string | null = null;
  if (!isEncrypt && config.padding === 'pkcs7') {
    const unpadded = pkcs7Unpad(joined);
    if (unpadded.ok) output = unpadded.data;
    else paddingError = unpadded.error;
  }

  return { config, schedule, processedInput, paddingLength, blocks, outputBlocks, output, paddingError, steps };
}

/** Ejecuta AES sin registrar la traza (para herramientas auxiliares). */
export function aesEcbProcess(config: Omit<AesSimulationConfig, 'inputEncoding' | 'inputText'>): Uint8Array {
  const schedule = expandKey(config.key, config.variant);
  const input = config.mode === 'encrypt' && config.padding === 'pkcs7' ? pkcs7Pad(config.input) : config.input;
  const out = new Uint8Array(input.length);
  chunkBytes(input, 16).forEach((block, i) => {
    out.set(config.mode === 'encrypt' ? encryptBlock(block, schedule) : decryptBlock(block, schedule), i * 16);
  });
  return out;
}
