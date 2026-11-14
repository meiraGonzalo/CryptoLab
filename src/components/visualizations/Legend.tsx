import { cn } from '@/utils/cn';
import { DOT_TONE_CLASSES, type Tone } from '../common/tones';

export function Legend({ items, className }: { items: { tone: Tone; label: string }[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-sm text-slate-400">
          <span className={cn('h-2.5 w-2.5 rounded-sm', DOT_TONE_CLASSES[item.tone])} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
