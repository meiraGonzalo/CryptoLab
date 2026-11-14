import { MathFormula } from '@/components/common/MathFormula';
import { cn } from '@/utils/cn';
import type { ModPowTrace } from '../types';

interface ModPowTraceViewProps {
  trace: ModPowTrace;
  baseSymbol: string;
  exponentSymbol: string;
  resultSymbol: string;
  exponentTone: 'public' | 'private';
}

/** Tabla del algoritmo «elevar al cuadrado y multiplicar». */
export function ModPowTraceView({ trace, baseSymbol, exponentSymbol, resultSymbol, exponentTone }: ModPowTraceViewProps) {
  const toneClass = exponentTone === 'public' ? 'text-emerald-200' : 'text-pink-200';
  const maxRows = 80;
  return (
    <div className="space-y-4">
      <MathFormula
        display
        tex={`${resultSymbol} = ${baseSymbol}^{${exponentSymbol}} \\bmod n = ${trace.base}^{${trace.exponent}} \\bmod ${trace.modulus} = ${trace.result}`}
      />
      <div>
        <p className="mb-2 text-sm text-slate-400">
          Exponente {exponentSymbol} = {trace.exponent.toString()} en binario ({trace.exponentBits.length} bits):
        </p>
        <div className="flex flex-wrap gap-1">
          {trace.exponentBits.split('').map((bit, i) => (
            <span
              key={i}
              className={cn('mono flex h-7 w-6 items-center justify-center rounded text-sm font-semibold', bit === '1' ? (exponentTone === 'public' ? 'bg-accent-result/80 text-ink-950' : 'bg-accent-private/80 text-ink-950') : 'bg-ink-700 text-slate-500')}
            >
              {bit}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Bit</th>
              <th className="py-2 pr-3 font-medium">Valor previo</th>
              <th className="py-2 pr-3 font-medium">Cuadrado mod n</th>
              <th className="py-2 font-medium">× {baseSymbol} mod n (si bit = 1)</th>
            </tr>
          </thead>
          <tbody>
            {trace.steps.slice(0, maxRows).map((s) => (
              <tr key={s.bitIndex} className="border-b border-white/[0.03]">
                <td className={cn('mono py-1.5 pr-3', s.bit ? toneClass : 'text-slate-500')}>{s.bit}</td>
                <td className="mono py-1.5 pr-3 text-slate-400">{s.input.toString()}</td>
                <td className="mono py-1.5 pr-3 text-slate-200">{s.squared.toString()}</td>
                <td className="mono py-1.5 text-slate-200">{s.multiplied === null ? <span className="text-slate-600">—</span> : s.multiplied.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trace.steps.length > maxRows && <p className="mt-2 text-sm text-slate-500">Se muestran los primeros {maxRows} de {trace.steps.length} pasos.</p>}
      </div>
      <p className="text-sm text-slate-500">
        En lugar de multiplicar {baseSymbol} por sí mismo {trace.exponent.toString()} veces, se recorre el exponente bit a bit: solo se necesitan{' '}
        {trace.steps.length} elevaciones al cuadrado y {trace.steps.filter((s) => s.bit).length} multiplicaciones, reduciendo módulo n en cada paso.
      </p>
    </div>
  );
}
