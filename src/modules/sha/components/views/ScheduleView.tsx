import { useState } from 'react';
import { MathFormula } from '@/components/common/MathFormula';
import { BitStrip } from '@/components/visualizations/BitStrip';
import { cn } from '@/utils/cn';
import { formatWord, rotr, shr, wordToBits } from '../../engine/sha2';
import type { ShaRotationSet } from '../../types';
import type { ShaViewProps } from './PreparationViews';

export function ScheduleView({ trace, blockIndex }: ShaViewProps) {
  const { params } = trace;
  const block = trace.blocks[blockIndex];
  const [selected, setSelected] = useState(16);
  const bits = params.wordBits;
  const detail = selected >= 16 ? block.scheduleDetails[selected - 16] : null;
  const related = detail ? [selected - 2, selected - 7, selected - 15, selected - 16] : [];

  return (
    <div className="space-y-5">
      <div className={cn('grid gap-1', bits === 64 ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5' : 'grid-cols-4 sm:grid-cols-8')}>
        {block.schedule.map((w, t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelected(t)}
            className={cn(
              'rounded-md border px-1.5 py-1 text-left transition-colors',
              t === selected
                ? 'border-accent-result bg-accent-result/20'
                : related.includes(t)
                  ? 'border-accent-key/50 bg-accent-key/10'
                  : t < 16
                    ? 'border-accent-data/25 bg-accent-data/[0.07] hover:bg-accent-data/15'
                    : 'border-white/[0.06] bg-ink-900/60 hover:bg-white/[0.05]',
            )}
          >
            <span className="block text-[11px] text-slate-500">W{t}</span>
            <span className={cn('mono block truncate text-[12px]', t < 16 ? 'text-blue-100' : 'text-slate-200')}>{formatWord(w, bits)}</span>
          </button>
        ))}
      </div>

      <div className="panel-inset space-y-4 p-4">
        {!detail ? (
          <>
            <MathFormula display tex={`W_{${selected}} = M_{${selected}} = \\texttt{${formatWord(block.schedule[selected], bits)}}`} />
            <p className="text-sm text-slate-400">
              Las primeras 16 palabras se toman directamente del bloque: W{selected} corresponde a los bytes {selected * params.wordBytes}–
              {selected * params.wordBytes + params.wordBytes - 1}. Seleccioná una palabra a partir de W16 para ver cómo se calcula.
            </p>
          </>
        ) : (
          <>
            <MathFormula
              display
              tex={`W_{${selected}} = \\sigma_1(W_{${selected - 2}}) + W_{${selected - 7}} + \\sigma_0(W_{${selected - 15}}) + W_{${selected - 16}} \\pmod{2^{${bits}}}`}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Term label={`σ1(W${selected - 2})`} value={formatWord(detail.sigma1, bits)} />
              <Term label={`W${selected - 7}`} value={formatWord(detail.wMinus7, bits)} />
              <Term label={`σ0(W${selected - 15})`} value={formatWord(detail.sigma0, bits)} />
              <Term label={`W${selected - 16}`} value={formatWord(detail.wMinus16, bits)} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-accent-result/40 bg-accent-result/10 px-3 py-2">
              <span className="text-sm text-emerald-200">W{selected} = suma mod 2^{bits}</span>
              <span className="mono text-emerald-100">{formatWord(detail.value, bits)}</span>
            </div>
            <SigmaBreakdown title={`σ0(W${selected - 15})`} input={detail.wMinus15} set={params.smallSigma0} bits={bits} result={detail.sigma0} />
            <SigmaBreakdown title={`σ1(W${selected - 2})`} input={detail.wMinus2} set={params.smallSigma1} bits={bits} result={detail.sigma1} />
          </>
        )}
      </div>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-white/[0.06] bg-ink-900/60 px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="mono break-all text-sm text-slate-100">{value}</span>
    </div>
  );
}

export function SigmaBreakdown({ title, input, set, bits, result }: { title: string; input: bigint; set: ShaRotationSet; bits: number; result: bigint }) {
  const compact = true;
  return (
    <div className="space-y-1.5 border-t border-white/[0.05] pt-3">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <BitStrip compact={compact} label="x" bits={wordToBits(input, bits)} tone="data" />
      {set.rotations.map((r) => (
        <BitStrip key={r} compact={compact} label={`ROTR${r}(x)`} bits={wordToBits(rotr(input, r, bits), bits)} tone="shift" />
      ))}
      {set.shift !== null && <BitStrip compact={compact} label={`SHR${set.shift}(x)`} bits={wordToBits(shr(input, set.shift), bits)} tone="mix" />}
      <BitStrip compact={compact} label="⊕ resultado" bits={wordToBits(result, bits)} tone="result" value={formatWord(result, bits)} />
    </div>
  );
}
