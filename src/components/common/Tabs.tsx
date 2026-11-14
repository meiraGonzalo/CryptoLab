import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  const id = useId();
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-white/[0.07]', className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-4 py-3 text-[15px] font-medium transition-colors',
              selected ? 'text-white' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {tab.icon}
            {tab.label}
            {selected && (
              <motion.span layoutId={`tab-${id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-brand" />
            )}
          </button>
        );
      })}
    </div>
  );
}
