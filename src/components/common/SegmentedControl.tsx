import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/utils/cn';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string | number>({ value, options, onChange, ariaLabel, size = 'md', className }: SegmentedControlProps<T>) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-lg border border-white/10 bg-ink-900/80 p-1', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-sm' : 'h-8 px-3.5 text-[15px]',
              active ? 'text-white' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {active && (
              <motion.span
                layoutId={`segment-${id}`}
                className="absolute inset-0 rounded-md border border-white/10 bg-ink-600"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
