import { create } from 'zustand';
import type { InputEncoding } from '@/utils/bytes';

/** Conserva las entradas de las herramientas al navegar entre secciones. */
interface ToolsState {
  textHexText: string;
  hexBinaryHex: string;
  byteViewerInput: string;
  byteViewerEncoding: InputEncoding;
  compareA: string;
  compareB: string;
  compareFormat: 'hex' | 'utf8';
  set: (patch: Partial<Omit<ToolsState, 'set'>>) => void;
}

export const useToolsStore = create<ToolsState>()((set) => ({
  textHexText: 'Criptografía',
  hexBinaryHex: '3a f0 7c',
  byteViewerInput: 'Hola, ñandú! 🔐',
  byteViewerEncoding: 'utf8',
  compareA: '69c4e0d86a7b0430d8cdb78070b4c55a',
  compareB: '69c4e0d86a7b0430d8cdb78070b4c55b',
  compareFormat: 'hex',
  set: (patch) => set(patch),
}));
