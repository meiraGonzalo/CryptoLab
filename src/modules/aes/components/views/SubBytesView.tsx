import { useState } from 'react';
import { OperatorSymbol } from '@/components/visualizations/OperatorSymbol';
import { StateMatrix } from '@/components/visualizations/StateMatrix';
import { MathFormula } from '@/components/common/MathFormula';
import { cn } from '@/utils/cn';
import { INV_SBOX, SBOX } from '../../engine/constants';
import type { AesViewProps } from './viewTypes';
import { hex2 } from './viewTypes';

export function SubBytesView({ step }: AesViewProps) {
  const inverse = step.operation === 'invSubBytes';
  const table = inverse ? INV_SBOX : SBOX;
  const [selected, setSelected] = useState(0);
  const input = step.before[selected];
  const output = step.after[selected];
  const row = input >> 4;
  const col = input & 0x0f;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <StateMatrix bytes={step.before} label="Antes" tone="data" selectedIndex={selected} onSelect={setSelected} />
        <OperatorSymbol label={inverse ? 'S-Box⁻¹' : 'S-Box'}>→</OperatorSymbol>
        <StateMatrix bytes={step.after} label="Después" tone="sub" selectedIndex={selected} onSelect={setSelected} pulseKey={step.id} />
      </div>

      <div className="grid gap-4 min-[1700px]:grid-cols-[minmax(0,1fr)_220px]">
        <div className="panel-inset overflow-x-auto p-3">
          <p className="mb-2 text-sm text-slate-400">
            {inverse ? 'S-Box inversa' : 'S-Box'}: fila = primer dígito hexadecimal, columna = segundo dígito
          </p>
          <table className="mono w-max border-separate border-spacing-[2px] text-[12px]">
            <thead>
              <tr>
                <th />
                {Array.from({ length: 16 }, (_, c) => (
                  <th key={c} className={cn('w-7 pb-1 font-semibold', c === col ? 'text-accent-sub' : 'text-slate-500')}>
                    {c.toString(16)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 16 }, (_, r) => (
                <tr key={r}>
                  <th className={cn('pr-1.5 text-right font-semibold', r === row ? 'text-accent-sub' : 'text-slate-500')}>{r.toString(16)}</th>
                  {Array.from({ length: 16 }, (_, c) => {
                    const isHit = r === row && c === col;
                    const inCross = r === row || c === col;
                    return (
                      <td
                        key={c}
                        className={cn(
                          'h-6 w-7 rounded-[3px] text-center transition-colors',
                          isHit ? 'bg-accent-sub font-bold text-ink-950' : inCross ? 'bg-accent-sub/15 text-purple-100' : 'text-slate-500',
                        )}
                      >
                        {hex2(table[r * 16 + c])}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-inset flex flex-col justify-center gap-3 p-4">
          <p className="label-caps">Sustitución</p>
          <div className="flex items-center gap-2 text-2xl">
            <span className="mono rounded-md border border-accent-data/40 bg-accent-data/15 px-2 py-1 text-blue-100">{hex2(input)}</span>
            <span className="text-slate-500">→</span>
            <span className="mono rounded-md border border-accent-sub/45 bg-accent-sub/15 px-2 py-1 text-purple-100">{hex2(output)}</span>
          </div>
          <p className="text-sm text-slate-400">
            Fila <span className="mono text-white">{row.toString(16)}</span>, columna <span className="mono text-white">{col.toString(16)}</span>
          </p>
          <MathFormula tex={inverse ? `S^{-1}(\\texttt{${hex2(input)}}) = \\texttt{${hex2(output)}}` : `S(\\texttt{${hex2(input)}}) = \\texttt{${hex2(output)}}`} />
          <p className="text-sm text-slate-500">Hacé clic en cualquier celda de las matrices para ver su sustitución.</p>
        </div>
      </div>
    </div>
  );
}
