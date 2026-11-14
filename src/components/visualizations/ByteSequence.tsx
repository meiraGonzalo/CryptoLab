import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import type { Tone } from '../common/tones';
import { ByteCell, type CellSize } from './ByteCell';

interface ByteSequenceProps {
  bytes: ArrayLike<number>;
  tone?: Tone | ((index: number) => Tone);
  caption?: (index: number) => ReactNode;
  size?: CellSize;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
  onHover?: (index: number | null) => void;
  /** Cantidad máxima de celdas visibles; el resto se resume. */
  limit?: number;
  className?: string;
}

/** Secuencia lineal de bytes, con ajuste de línea automático. */
export function ByteSequence({ bytes, tone = 'neutral', caption, size = 'sm', selectedIndex, onSelect, onHover, limit = 512, className }: ByteSequenceProps) {
  const total = bytes.length;
  const visible = Math.min(total, limit);
  return (
    <div className={cn('flex flex-wrap gap-1.5', caption && 'pt-5', className)}>
      {Array.from({ length: visible }, (_, i) => (
        <ByteCell
          key={i}
          value={bytes[i]}
          size={size}
          tone={typeof tone === 'function' ? tone(i) : tone}
          caption={caption?.(i)}
          selected={selectedIndex === i}
          onSelect={onSelect ? () => onSelect(i) : undefined}
          onHover={onHover ? (h) => onHover(h ? i : null) : undefined}
          className={caption ? 'mb-4' : undefined}
        />
      ))}
      {total > visible && (
        <span className="flex items-center px-2 text-sm text-slate-500">… y {total - visible} bytes más</span>
      )}
      {total === 0 && <span className="text-sm text-slate-500">Sin bytes.</span>}
    </div>
  );
}
