import { useState, type ReactNode } from 'react';
import { BitStrip } from '@/components/visualizations/BitStrip';
import { OperatorSymbol } from '@/components/visualizations/OperatorSymbol';
import { StateMatrix } from '@/components/visualizations/StateMatrix';
import { MathFormula } from '@/components/common/MathFormula';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { cn } from '@/utils/cn';
import { INV_MIX_COLUMNS_MATRIX, MIX_COLUMNS_MATRIX } from '../../engine/constants';
import { traceGfMultiply } from '../../engine/galoisField';
import type { AesViewProps } from './viewTypes';
import { hex2 } from './viewTypes';

const SUPERSCRIPTS = ['', '', '²', '³', '⁴', '⁵', '⁶', '⁷'];

const bits8 = (v: number) => Array.from({ length: 8 }, (_, i) => (v >> (7 - i)) & 1);

export function MixColumnsView({ step }: AesViewProps) {
  const inverse = step.operation === 'invMixColumns';
  const matrix = inverse ? INV_MIX_COLUMNS_MATRIX : MIX_COLUMNS_MATRIX;
  const [column, setColumn] = useState(0);
  const [row, setRow] = useState(0);

  const input = [0, 1, 2, 3].map((r) => step.before[r + 4 * column]);
  const output = [0, 1, 2, 3].map((r) => step.after[r + 4 * column]);
  const products = matrix[row].map((coefficient, k) => traceGfMultiply(input[k], coefficient));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Columna</span>
          <SegmentedControl size="sm" ariaLabel="Columna" value={column} onChange={setColumn} options={[0, 1, 2, 3].map((c) => ({ value: c, label: `c${c}` }))} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Byte de salida</span>
          <SegmentedControl size="sm" ariaLabel="Fila de salida" value={row} onChange={setRow} options={[0, 1, 2, 3].map((r) => ({ value: r, label: `f${r}` }))} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <StateMatrix
          bytes={step.before}
          label="Antes"
          size="sm"
          tone={(i) => (Math.floor(i / 4) === column ? 'data' : 'muted')}
          onSelect={(i) => setColumn(Math.floor(i / 4))}
          highlightColumn={column}
        />
        <OperatorSymbol label={inverse ? 'InvMixColumns' : 'MixColumns'}>→</OperatorSymbol>
        <StateMatrix
          bytes={step.after}
          label="Después"
          size="sm"
          tone={(i) => (Math.floor(i / 4) === column ? 'mix' : 'muted')}
          onSelect={(i) => {
            setColumn(Math.floor(i / 4));
            setRow(i % 4);
          }}
          selectedIndex={row + 4 * column}
          highlightColumn={column}
          pulseKey={step.id}
        />
      </div>

      {/* Multiplicación matricial de la columna seleccionada */}
      <div className="panel-inset overflow-x-auto p-4">
        <p className="mb-3 text-sm text-slate-400">Multiplicación de la columna c{column} por la matriz fija en GF(2⁸)</p>
        <div className="flex w-max items-center gap-4">
          <Bracket>
            <div className="grid grid-cols-4 gap-1">
              {matrix.flatMap((r, ri) =>
                r.map((v, ci) => (
                  <span
                    key={`${ri}-${ci}`}
                    className={cn(
                      'mono flex h-9 w-10 items-center justify-center rounded text-[15px]',
                      ri === row ? 'bg-accent-mix/20 text-teal-100' : 'text-slate-400',
                    )}
                  >
                    {hex2(v)}
                  </span>
                )),
              )}
            </div>
          </Bracket>
          <span className="text-xl text-slate-500">·</span>
          <Bracket>
            <div className="flex flex-col gap-1">
              {input.map((v, i) => (
                <span key={i} className="mono flex h-9 w-10 items-center justify-center rounded bg-accent-data/15 text-[15px] text-blue-100">
                  {hex2(v)}
                </span>
              ))}
            </div>
          </Bracket>
          <span className="text-xl text-slate-500">=</span>
          <Bracket>
            <div className="flex flex-col gap-1">
              {output.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRow(i)}
                  className={cn(
                    'mono flex h-9 w-10 items-center justify-center rounded text-[15px] transition-colors',
                    i === row ? 'bg-accent-mix text-ink-950 font-semibold' : 'bg-accent-mix/15 text-teal-100 hover:bg-accent-mix/30',
                  )}
                >
                  {hex2(v)}
                </button>
              ))}
            </div>
          </Bracket>
        </div>
      </div>

      {/* Desarrollo del byte de salida seleccionado */}
      <div className="panel-inset space-y-4 p-4">
        <MathFormula
          display
          tex={`s'_{${row},${column}} = ${products.map((p, k) => `(\\texttt{${hex2(p.b)}} \\bullet \\texttt{${hex2(input[k])}})`).join(' \\oplus ')} = \\texttt{${hex2(output[row])}}`}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {products.map((p, k) => (
            <div key={k} className="rounded-lg border border-white/[0.06] bg-ink-900/60 p-3">
              <p className="mb-2 text-sm text-slate-300">
                <span className="mono text-teal-200">{hex2(p.b)}</span> • <span className="mono text-blue-200">{hex2(p.a)}</span> ={' '}
                <span className="mono font-semibold text-white">{hex2(p.result)}</span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-sm">
                {p.terms.map((term) => (
                  <span
                    key={term.power}
                    className={cn(
                      'mono rounded border px-1.5 py-0.5',
                      term.included ? 'border-accent-mix/40 bg-accent-mix/10 text-teal-100' : 'border-white/[0.06] text-slate-600 line-through',
                    )}
                    title={term.power === 0 ? 'a · 1' : `xtime aplicado ${term.power} vez/veces`}
                  >
                    {term.power === 0 ? 'a' : `a·x${SUPERSCRIPTS[term.power]}`} = {hex2(term.value)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-white/[0.05] pt-3">
          {products.map((p, k) => (
            <BitStrip key={k} compact label={`${hex2(p.b)}•${hex2(p.a)}`} bits={bits8(p.result)} tone="data" value={hex2(p.result)} />
          ))}
          <BitStrip compact label="⊕ resultado" bits={bits8(output[row])} tone="mix" value={hex2(output[row])} />
        </div>
        <p className="text-sm text-slate-500">
          a·x equivale a xtime(a): desplazar un bit a la izquierda y, si se desborda el bit más alto, aplicar XOR con 0x1b. Solo se suman (XOR) los
          términos cuyos bits están activos en el coeficiente.
        </p>
      </div>
    </div>
  );
}

function Bracket({ children }: { children: ReactNode }) {
  return <div className="rounded-md border-x-2 border-slate-500/70 px-2 py-1">{children}</div>;
}
