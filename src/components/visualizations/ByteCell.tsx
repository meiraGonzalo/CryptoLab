import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { byteToBinary, byteToHex } from '@/utils/bytes';
import { cn } from '@/utils/cn';
import { CELL_TONE_CLASSES, RING_TONE_CLASSES, type Tone } from '../common/tones';

export type CellSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<CellSize, string> = {
  sm: 'h-8 min-w-[2rem] text-[13px]',
  md: 'h-11 min-w-[2.75rem] text-[15px]',
  lg: 'h-14 min-w-[3.5rem] text-lg',
};

interface ByteCellProps {
  value: number;
  tone?: Tone;
  size?: CellSize;
  selected?: boolean;
  /** Etiqueta superior pequeña (por ejemplo, el carácter o el índice). */
  caption?: ReactNode;
  onSelect?: () => void;
  onHover?: (hovering: boolean) => void;
  /** Anima la aparición del valor (para indicar un cambio). */
  pulse?: boolean;
  layoutId?: string;
  title?: string;
  className?: string;
}

/** Celda individual que representa un byte en hexadecimal. */
export function ByteCell({ value, tone = 'neutral', size = 'md', selected, caption, onSelect, onHover, pulse, layoutId, title, className }: ByteCellProps) {
  const interactive = Boolean(onSelect);
  const Component = interactive ? motion.button : motion.div;
  return (
    <Component
      layout={layoutId ? 'position' : undefined}
      layoutId={layoutId}
      type={interactive ? 'button' : undefined}
      onClick={onSelect}
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      onFocus={onHover ? () => onHover(true) : undefined}
      onBlur={onHover ? () => onHover(false) : undefined}
      initial={pulse ? { scale: 0.82, opacity: 0.4 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      title={title ?? `0x${byteToHex(value)} · ${value} · ${byteToBinary(value)}`}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-md border px-1 font-mono font-medium tabular-nums transition-[box-shadow,background-color]',
        SIZE_CLASSES[size],
        CELL_TONE_CLASSES[tone],
        selected && cn('ring-2 ring-offset-2 ring-offset-ink-850', RING_TONE_CLASSES[tone === 'neutral' ? 'brand' : tone]),
        interactive && 'cursor-pointer hover:brightness-125',
        className,
      )}
    >
      {caption !== undefined && <span className="absolute -top-[1.15rem] text-[11px] font-sans font-medium text-slate-500">{caption}</span>}
      {byteToHex(value)}
    </Component>
  );
}
