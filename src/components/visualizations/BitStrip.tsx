import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BitStripProps {
  bits: readonly number[];
  label?: ReactNode;
  /** Valor resumido a la derecha (por ejemplo, el hexadecimal). */
  value?: ReactNode;
  tone?: 'data' | 'key' | 'sub' | 'shift' | 'mix' | 'xor' | 'result' | 'neutral';
  /** Índices de bits a resaltar (por ejemplo, los que cambiaron). */
  highlight?: (index: number) => boolean;
  compact?: boolean;
  className?: string;
}

const ONE_CLASSES = {
  data: 'bg-accent-data/80 text-ink-950',
  key: 'bg-accent-key/85 text-ink-950',
  sub: 'bg-accent-sub/80 text-ink-950',
  shift: 'bg-accent-shift/80 text-ink-950',
  mix: 'bg-accent-mix/80 text-ink-950',
  xor: 'bg-accent-xor/85 text-ink-950',
  result: 'bg-accent-result/85 text-ink-950',
  neutral: 'bg-slate-300/85 text-ink-950',
};

/** Representación bit a bit de una palabra, agrupada en nibbles. */
export function BitStrip({ bits, label, value, tone = 'neutral', highlight, compact, className }: BitStripProps) {
  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <div className="flex min-w-0 max-w-full items-center gap-3">
      {label !== undefined && <div className={cn('shrink-0 text-right text-sm text-slate-400', compact ? 'w-20' : 'w-28')}>{label}</div>}
      <div className="min-w-0 overflow-x-auto">
        <div className={cn('flex w-max', compact ? 'gap-[2px]' : 'gap-[3px]')}>
          {bits.map((bit, i) => (
            <span
              key={i}
              className={cn(
                'flex items-center justify-center rounded-[3px] font-mono font-semibold',
                compact ? 'h-5 w-[13px] text-[11px]' : 'h-6 w-[18px] text-xs',
                bit ? ONE_CLASSES[tone] : 'bg-ink-700 text-slate-500',
                i > 0 && i % 4 === 0 && (i % 8 === 0 ? (compact ? 'ml-1' : 'ml-1.5') : compact ? 'ml-px' : 'ml-0.5'),
                highlight?.(i) && 'ring-2 ring-white/80',
              )}
            >
              {bit}
            </span>
          ))}
        </div>
      </div>
      </div>
      {value !== undefined && <div className="mono shrink-0 text-sm text-slate-300">{value}</div>}
    </div>
  );
}
