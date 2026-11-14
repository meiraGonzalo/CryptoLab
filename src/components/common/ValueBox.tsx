import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { CopyButton } from './CopyButton';
import { DOT_TONE_CLASSES, TEXT_TONE_CLASSES, type Tone } from './tones';

interface ValueBoxProps {
  label: ReactNode;
  value: string;
  tone?: Tone;
  /** Texto alternativo para copiar (por defecto, el valor mostrado). */
  copyValue?: string;
  hint?: ReactNode;
  className?: string;
  maxHeight?: boolean;
}

/** Muestra un valor técnico (hex, número, clave) con etiqueta y botón para copiar. */
export function ValueBox({ label, value, tone = 'neutral', copyValue, hint, className, maxHeight }: ValueBoxProps) {
  return (
    <div className={cn('panel-inset px-3.5 py-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <span className={cn('h-2 w-2 rounded-full', DOT_TONE_CLASSES[tone])} />
          {label}
        </span>
        <CopyButton value={copyValue ?? value} />
      </div>
      <p
        className={cn(
          'mono mt-1 break-all text-[15px] leading-relaxed',
          TEXT_TONE_CLASSES[tone],
          maxHeight && 'max-h-32 overflow-y-auto pr-1',
        )}
      >
        {value || <span className="text-slate-600">—</span>}
      </p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}
