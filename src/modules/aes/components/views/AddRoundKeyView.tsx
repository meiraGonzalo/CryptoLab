import { useState } from 'react';
import { BitStrip } from '@/components/visualizations/BitStrip';
import { OperatorSymbol } from '@/components/visualizations/OperatorSymbol';
import { StateMatrix } from '@/components/visualizations/StateMatrix';
import { MathFormula } from '@/components/common/MathFormula';
import type { AesViewProps } from './viewTypes';
import { hex2 } from './viewTypes';

const bits8 = (v: number) => Array.from({ length: 8 }, (_, i) => (v >> (7 - i)) & 1);

export function AddRoundKeyView({ step }: AesViewProps) {
  const [selected, setSelected] = useState(0);
  const key = step.roundKey!;
  const s = step.before[selected];
  const k = key[selected];
  const r = step.after[selected];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StateMatrix bytes={step.before} label="Estado" tone="data" selectedIndex={selected} onSelect={setSelected} />
        <OperatorSymbol label="XOR">⊕</OperatorSymbol>
        <StateMatrix bytes={key} label={`Clave de ronda ${step.roundKeyIndex}`} tone="key" selectedIndex={selected} onSelect={setSelected} />
        <OperatorSymbol>=</OperatorSymbol>
        <StateMatrix bytes={step.after} label="Resultado" tone="xor" selectedIndex={selected} onSelect={setSelected} pulseKey={step.id} />
      </div>

      <div className="panel-inset space-y-2.5 p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-300">
            Celda seleccionada: fila {selected % 4}, columna {Math.floor(selected / 4)}
          </p>
          <MathFormula tex={`\\texttt{${hex2(s)}} \\oplus \\texttt{${hex2(k)}} = \\texttt{${hex2(r)}}`} />
        </div>
        <BitStrip label="Estado" bits={bits8(s)} tone="data" value={`0x${hex2(s)}`} />
        <BitStrip label="Clave" bits={bits8(k)} tone="key" value={`0x${hex2(k)}`} />
        <div className="ml-[7.75rem] h-px max-w-[200px] bg-white/10" />
        <BitStrip label="⊕ Resultado" bits={bits8(r)} tone="xor" value={`0x${hex2(r)}`} highlight={(i) => ((s ^ k) >> (7 - i)) & 1 ? true : false} />
        <p className="pt-1 text-sm text-slate-500">Los bits resaltados son aquellos en los que el estado y la clave difieren.</p>
      </div>
    </div>
  );
}
