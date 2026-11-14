import { cn } from '@/utils/cn';

export interface RsaBlockRow {
  label: string;
  input: bigint;
  output: bigint;
}

interface RsaBlockTableProps {
  rows: RsaBlockRow[];
  inputSymbol: string;
  outputSymbol: string;
  selected: number;
  onSelect: (index: number) => void;
  tone: 'public' | 'private';
}

/** Lista de bloques procesados (M → C o C → M), seleccionables para ver su cálculo. */
export function RsaBlockTable({ rows, inputSymbol, outputSymbol, selected, onSelect, tone }: RsaBlockTableProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-pressed={i === selected}
          className={cn(
            'flex min-w-[88px] flex-col items-center gap-0.5 rounded-lg border px-3 py-2 transition-colors',
            i === selected
              ? tone === 'public'
                ? 'border-accent-result/60 bg-accent-result/10'
                : 'border-accent-private/60 bg-accent-private/10'
              : 'border-white/[0.07] bg-ink-900/50 hover:bg-white/[0.05]',
          )}
        >
          {row.label && <span className="text-base font-semibold text-white">{row.label === ' ' ? '␣' : row.label}</span>}
          <span className="mono text-sm text-slate-400">
            {inputSymbol} = {row.input.toString()}
          </span>
          <span className="text-xs text-slate-600">↓</span>
          <span className={cn('mono text-sm', tone === 'public' ? 'text-emerald-200' : 'text-pink-200')}>
            {outputSymbol} = {row.output.toString()}
          </span>
        </button>
      ))}
    </div>
  );
}
