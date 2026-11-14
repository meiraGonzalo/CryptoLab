import { cn } from '@/utils/cn';

interface HashBitGridProps {
  a: Uint8Array;
  b: Uint8Array;
}

/** Cuadrícula de todos los bits del hash: los bits distintos se resaltan. */
export function HashBitGrid({ a, b }: HashBitGridProps) {
  const totalBits = a.length * 8;
  const columns = 32;
  return (
    <div className="overflow-x-auto">
      <div className="grid w-max gap-[3px]" style={{ gridTemplateColumns: `repeat(${columns}, 14px)` }} role="img" aria-label={`Comparación de ${totalBits} bits`}>
        {Array.from({ length: totalBits }, (_, i) => {
          const byte = i >> 3;
          const shift = 7 - (i & 7);
          const bitA = (a[byte] >> shift) & 1;
          const bitB = (b[byte] >> shift) & 1;
          const differs = bitA !== bitB;
          return (
            <span
              key={i}
              title={`Bit ${i}: ${bitA} → ${bitB}`}
              className={cn('h-[14px] w-[14px] rounded-[3px]', differs ? 'bg-accent-xor' : bitB ? 'bg-slate-500/50' : 'bg-ink-600/70')}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Hash en hexadecimal con los dígitos distintos resaltados. */
export function HexDiff({ value, other, tone }: { value: string; other: string; tone: 'a' | 'b' }) {
  return (
    <p className="mono break-all text-[15px] leading-relaxed">
      {value.split('').map((ch, i) => (
        <span key={i} className={ch !== other[i] ? (tone === 'a' ? 'rounded-sm bg-accent-data/20 text-blue-100' : 'rounded-sm bg-accent-xor/25 text-rose-100') : 'text-slate-500'}>
          {ch}
        </span>
      ))}
    </p>
  );
}
