import type { SimulationStep } from '@/types/simulation';
import type { InputEncoding } from '@/utils/bytes';

export type AesVariant = 128 | 192 | 256;
export type AesOperationMode = 'encrypt' | 'decrypt';
export type AesPadding = 'pkcs7' | 'none';

export interface AesParameters {
  /** Longitud de la clave en palabras de 32 bits. */
  nk: number;
  /** Cantidad de rondas. */
  nr: number;
  keyBytes: number;
}

export const AES_PARAMETERS: Record<AesVariant, AesParameters> = {
  128: { nk: 4, nr: 10, keyBytes: 16 },
  192: { nk: 6, nr: 12, keyBytes: 24 },
  256: { nk: 8, nr: 14, keyBytes: 32 },
};

/** Matriz de estado de 16 bytes en orden por columnas: índice = fila + 4 × columna. */
export type AesState = readonly number[];
/** Palabra de 32 bits representada como 4 bytes. */
export type AesWord = readonly number[];

export type KeyWordKind = 'original' | 'rotSubRcon' | 'sub' | 'xor';

export interface KeyWordDerivation {
  index: number;
  kind: KeyWordKind;
  /** w[i−1], punto de partida de temp. */
  previous: AesWord | null;
  afterRotWord: AesWord | null;
  afterSubWord: AesWord | null;
  rcon: AesWord | null;
  /** Valor final de temp antes del XOR con w[i−Nk]. */
  temp: AesWord | null;
  /** w[i−Nk]. */
  wordNkBefore: AesWord | null;
  result: AesWord;
}

export interface AesKeySchedule {
  variant: AesVariant;
  key: Uint8Array;
  words: AesWord[];
  derivations: KeyWordDerivation[];
  /** Claves de ronda como estados 4×4 (16 bytes por columnas). */
  roundKeys: AesState[];
}

export type AesStepOperation =
  | 'messageBytes'
  | 'blockSplit'
  | 'loadState'
  | 'addRoundKey'
  | 'subBytes'
  | 'shiftRows'
  | 'mixColumns'
  | 'invSubBytes'
  | 'invShiftRows'
  | 'invMixColumns'
  | 'output';

export interface AesStep extends SimulationStep {
  operation: AesStepOperation;
  /** −1 para los pasos de preparación del mensaje. */
  blockIndex: number;
  /** −1 en preparación; 0..Nr para las rondas en orden de procesamiento. */
  round: number;
  /** Índice de la clave de ronda utilizada, si corresponde. */
  roundKeyIndex: number | null;
  before: AesState;
  after: AesState;
  roundKey: AesState | null;
}

export interface AesSimulationConfig {
  variant: AesVariant;
  mode: AesOperationMode;
  input: Uint8Array;
  key: Uint8Array;
  padding: AesPadding;
  inputEncoding: InputEncoding;
  inputText: string;
}

export interface AesSimulation {
  config: AesSimulationConfig;
  schedule: AesKeySchedule;
  /** Bytes de entrada luego del padding (cifrado) o el texto cifrado (descifrado). */
  processedInput: Uint8Array;
  paddingLength: number;
  blocks: Uint8Array[];
  outputBlocks: Uint8Array[];
  /** Resultado final (sin padding en el descifrado, si corresponde). */
  output: Uint8Array;
  /** Error de padding detectado al descifrar, si existe. */
  paddingError: string | null;
  steps: AesStep[];
}
