import { MathFormula } from '@/components/common/MathFormula';
import { cn } from '@/utils/cn';
import { firstPrimes } from '../../engine/constants';
import { formatWord } from '../../engine/sha2';
import { REGISTER_CLASSES, RegisterRow } from '../Registers';
import type { ShaViewProps } from './PreparationViews';

export function InitView({ trace, blockIndex }: ShaViewProps) {
  const { params } = trace;
  const block = trace.blocks[blockIndex];
  const primes = firstPrimes(8);
  return (
    <div className="space-y-5">
      <RegisterRow values={block.hashBefore} bits={params.wordBits} notes={block.hashBefore.map((_, i) => (blockIndex === 0 ? `√${primes[i]}` : `H${i} del bloque ${blockIndex}`))} />
      {blockIndex === 0 ? (
        <div className="panel-inset space-y-2 p-4">
          <MathFormula display tex={`H_i^{(0)} = \\big\\lfloor \\operatorname{frac}(\\sqrt{p_i}) \\cdot 2^{${params.wordBits}} \\big\\rfloor`} />
          <p className="text-sm text-slate-400">
            Por ejemplo, √2 = 1.41421356… → su parte fraccionaria multiplicada por 2^{params.wordBits} es {formatWord(params.initialHash[0], params.wordBits)}. Usar
            constantes derivadas de números conocidos muestra que no se eligieron para ocultar debilidades («nada bajo la manga»).
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Los registros continúan desde el valor hash intermedio que produjo el bloque anterior.</p>
      )}
    </div>
  );
}

export function FinalView({ trace, blockIndex }: ShaViewProps) {
  const { params } = trace;
  const block = trace.blocks[blockIndex];
  const last = block.rounds[block.rounds.length - 1].after;
  const bits = params.wordBits;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[15px]">
          <thead>
            <tr className="text-left text-sm text-slate-500">
              <th className="pb-2 font-medium">j</th>
              <th className="pb-2 font-medium">H(anterior)</th>
              <th className="pb-2 font-medium" />
              <th className="pb-2 font-medium">Registro final</th>
              <th className="pb-2 font-medium" />
              <th className="pb-2 font-medium">H(nuevo)</th>
            </tr>
          </thead>
          <tbody>
            {block.hashAfter.map((value, j) => (
              <tr key={j} className="border-t border-white/[0.04]">
                <td className="py-1.5 text-slate-400">H{j}</td>
                <td className="mono py-1.5 text-slate-300">{formatWord(block.hashBefore[j], bits)}</td>
                <td className="px-2 text-slate-500">+</td>
                <td className="py-1.5">
                  <span className={cn('mono rounded border px-1.5 py-0.5 text-sm', REGISTER_CLASSES[j])}>{formatWord(last[j], bits)}</span>
                </td>
                <td className="px-2 text-slate-500">=</td>
                <td className="mono py-1.5 text-emerald-200">{formatWord(value, bits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">Todas las sumas se realizan módulo 2^{bits}: los acarreos que exceden {bits} bits se descartan.</p>
    </div>
  );
}

export function DigestView({ trace }: ShaViewProps) {
  const { params } = trace;
  const final = trace.blocks[trace.blocks.length - 1].hashAfter;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {final.map((word, j) => (
          <span key={j} className={cn('mono rounded-md border px-2 py-1.5 text-[15px]', REGISTER_CLASSES[j])} title={`H${j}`}>
            {formatWord(word, params.wordBits)}
          </span>
        ))}
      </div>
      <p className="text-sm text-slate-400">
        {params.digestBytes * 8} bits = 8 palabras × {params.wordBits} bits = {params.digestBytes * 2} dígitos hexadecimales.
      </p>
    </div>
  );
}
