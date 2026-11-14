import { ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { MathFormula } from '@/components/common/MathFormula';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { BitStrip } from '@/components/visualizations/BitStrip';
import { cn } from '@/utils/cn';
import { formatWord, wordToBits } from '../../engine/sha2';
import { RegisterRow } from '../Registers';
import type { ShaViewProps } from './PreparationViews';
import { SigmaBreakdown } from './ScheduleView';

type FunctionTab = 'bigSigma1' | 'choose' | 'bigSigma0' | 'majority';

export function RoundView({ trace, blockIndex, round }: ShaViewProps) {
  const { params } = trace;
  const bits = params.wordBits;
  const r = trace.blocks[blockIndex].rounds[round];
  const [a, b, c, , e, f, g, h] = r.before;
  const [tab, setTab] = useState<FunctionTab>('bigSigma1');
  const compact = true;
  const fw = (v: bigint) => formatWord(v, bits);

  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 text-sm font-medium text-slate-400">Registros al comenzar la ronda {round}</p>
        <RegisterRow values={r.before} bits={bits} highlight={[0, 4]} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <InputChip label={`W${round}`} sub="Palabra del mensaje expandido" value={fw(r.w)} className="border-accent-data/40 bg-accent-data/10 text-blue-100" />
        <InputChip label={`K${round}`} sub="Constante de ronda (raíz cúbica de un primo)" value={fw(r.k)} className="border-accent-key/40 bg-accent-key/10 text-amber-100" />
      </section>

      <section className="panel-inset space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-300">Funciones lógicas</p>
          <SegmentedControl
            size="sm"
            ariaLabel="Función lógica"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'bigSigma1', label: 'Σ1(E)' },
              { value: 'choose', label: 'Ch(E,F,G)' },
              { value: 'bigSigma0', label: 'Σ0(A)' },
              { value: 'majority', label: 'Maj(A,B,C)' },
            ]}
          />
        </div>
        {tab === 'bigSigma1' && (
          <>
            <MathFormula tex={`\\Sigma_1(E) = ${params.bigSigma1.rotations.map((x) => `\\text{ROTR}^{${x}}(E)`).join(' \\oplus ')}`} />
            <SigmaBreakdown title="Rotaciones de E" input={e} set={params.bigSigma1} bits={bits} result={r.bigSigma1} />
          </>
        )}
        {tab === 'bigSigma0' && (
          <>
            <MathFormula tex={`\\Sigma_0(A) = ${params.bigSigma0.rotations.map((x) => `\\text{ROTR}^{${x}}(A)`).join(' \\oplus ')}`} />
            <SigmaBreakdown title="Rotaciones de A" input={a} set={params.bigSigma0} bits={bits} result={r.bigSigma0} />
          </>
        )}
        {tab === 'choose' && (
          <>
            <MathFormula tex={`\\text{Ch}(E,F,G) = (E \\land F) \\oplus (\\lnot E \\land G)`} />
            <p className="text-sm text-slate-400">Cada bit de E elige: si vale 1 se toma el bit de F; si vale 0, el bit de G.</p>
            <div className="space-y-1.5">
              <BitStrip compact={compact} label="E (selector)" bits={wordToBits(e, bits)} tone="key" />
              <BitStrip compact={compact} label="F" bits={wordToBits(f, bits)} tone="data" />
              <BitStrip compact={compact} label="G" bits={wordToBits(g, bits)} tone="sub" />
              <BitStrip compact={compact} label="Ch" bits={wordToBits(r.choose, bits)} tone="result" value={fw(r.choose)} />
            </div>
          </>
        )}
        {tab === 'majority' && (
          <>
            <MathFormula tex={`\\text{Maj}(A,B,C) = (A \\land B) \\oplus (A \\land C) \\oplus (B \\land C)`} />
            <p className="text-sm text-slate-400">Cada bit del resultado es el valor que aparece en mayoría entre A, B y C.</p>
            <div className="space-y-1.5">
              <BitStrip compact={compact} label="A" bits={wordToBits(a, bits)} tone="data" />
              <BitStrip compact={compact} label="B" bits={wordToBits(b, bits)} tone="data" />
              <BitStrip compact={compact} label="C" bits={wordToBits(c, bits)} tone="data" />
              <BitStrip compact={compact} label="Maj" bits={wordToBits(r.majority, bits)} tone="result" value={fw(r.majority)} />
            </div>
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SumCard
          title="T1"
          formula={`T_1 = H + \\Sigma_1(E) + \\text{Ch}(E,F,G) + K_{${round}} + W_{${round}}`}
          terms={[
            ['H', fw(h)],
            ['Σ1(E)', fw(r.bigSigma1)],
            ['Ch(E,F,G)', fw(r.choose)],
            [`K${round}`, fw(r.k)],
            [`W${round}`, fw(r.w)],
          ]}
          result={fw(r.temp1)}
          bits={bits}
        />
        <SumCard
          title="T2"
          formula={'T_2 = \\Sigma_0(A) + \\text{Maj}(A,B,C)'}
          terms={[
            ['Σ0(A)', fw(r.bigSigma0)],
            ['Maj(A,B,C)', fw(r.majority)],
          ]}
          result={fw(r.temp2)}
          bits={bits}
        />
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">
          <ArrowDown size={16} /> Actualización de los registros
        </div>
        <RegisterRow
          values={r.after}
          bits={bits}
          highlight={[0, 4]}
          pulseKey={`${blockIndex}-${round}`}
          notes={['T1 + T2', '← A', '← B', '← C', 'D + T1', '← E', '← F', '← G']}
        />
      </section>
    </div>
  );
}

function InputChip({ label, sub, value, className }: { label: string; sub: string; value: string; className: string }) {
  return (
    <div className={cn('rounded-lg border px-4 py-2.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{label}</span>
        <span className="text-xs text-slate-400">{sub}</span>
      </div>
      <p className="mono mt-1 break-all text-[15px]">{value}</p>
    </div>
  );
}

function SumCard({ title, formula, terms, result, bits }: { title: string; formula: string; terms: [string, string][]; result: string; bits: number }) {
  return (
    <div className="panel-inset space-y-3 p-4">
      <MathFormula tex={formula} />
      <table className="w-full text-sm">
        <tbody>
          {terms.map(([label, value], i) => (
            <tr key={label} className="border-b border-white/[0.04]">
              <td className="w-6 py-1.5 text-slate-500">{i === 0 ? '' : '+'}</td>
              <td className="py-1.5 text-slate-400">{label}</td>
              <td className="mono py-1.5 text-right text-slate-100">{value}</td>
            </tr>
          ))}
          <tr>
            <td className="py-2 text-slate-500">=</td>
            <td className="py-2 font-semibold text-emerald-200">
              {title} <span className="text-xs font-normal text-slate-500">(mod 2^{bits})</span>
            </td>
            <td className="mono py-2 text-right font-semibold text-emerald-100">{result}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
