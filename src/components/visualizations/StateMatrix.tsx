import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import type { Tone } from '../common/tones';
import { ByteCell, type CellSize } from './ByteCell';

interface StateMatrixProps {
  /** 16 bytes en orden por columnas (índice = fila + 4 × columna). */
  bytes: readonly number[];
  label?: ReactNode;
  tone?: Tone | ((index: number) => Tone);
  size?: CellSize;
  selectedIndex?: number | null;
  highlightColumn?: number | null;
  onSelect?: (index: number) => void;
  showAxes?: boolean;
  pulseKey?: string;
  className?: string;
}

/** Matriz de estado de 4 × 4 bytes. */
export function StateMatrix({ bytes, label, tone = 'neutral', size = 'md', selectedIndex, highlightColumn, onSelect, showAxes = false, pulseKey, className }: StateMatrixProps) {
  const toneFor = (index: number) => (typeof tone === 'function' ? tone(index) : tone);
  return (
    <figure className={cn('flex flex-col items-center gap-2', className)}>
      {label && <figcaption className="text-sm font-medium text-slate-400">{label}</figcaption>}
      <div className="flex gap-1.5">
        {showAxes && (
          <div className="flex flex-col justify-around gap-1.5 pr-1 pt-0">
            {[0, 1, 2, 3].map((r) => (
              <span key={r} className="flex h-full items-center text-xs text-slate-600">
                f{r}
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 gap-1.5" role="grid" aria-label={typeof label === 'string' ? label : 'Matriz de estado'}>
          {[0, 1, 2, 3].map((row) =>
            [0, 1, 2, 3].map((column) => {
              const index = row + 4 * column;
              return (
                <ByteCell
                  key={`${pulseKey ?? ''}-${index}`}
                  value={bytes[index]}
                  size={size}
                  tone={toneFor(index)}
                  selected={selectedIndex === index}
                  pulse={Boolean(pulseKey)}
                  onSelect={onSelect ? () => onSelect(index) : undefined}
                  className={cn(highlightColumn === column && 'outline outline-1 outline-offset-2 outline-white/25')}
                />
              );
            }),
          )}
        </div>
      </div>
      {showAxes && (
        <div className={cn('grid grid-cols-4 gap-1.5 text-center text-xs text-slate-600', showAxes && 'pl-6')}>
          {[0, 1, 2, 3].map((c) => (
            <span key={c} className={size === 'lg' ? 'w-14' : size === 'md' ? 'w-11' : 'w-8'}>
              c{c}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
