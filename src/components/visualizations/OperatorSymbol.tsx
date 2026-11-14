import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** Símbolo de operación entre dos representaciones (⊕, =, →). */
export function OperatorSymbol({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-1 px-0.5 text-2xl font-light text-slate-400', className)} aria-label={label}>
      <span>{children}</span>
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
}
