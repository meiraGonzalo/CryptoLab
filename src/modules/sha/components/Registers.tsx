import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { REGISTER_NAMES } from '../engine/constants';
import { formatWord } from '../engine/sha2';

/** Cada registro tiene un color propio y estable. */
export const REGISTER_CLASSES = [
  'border-sky-400/45 bg-sky-400/10 text-sky-100',
  'border-blue-400/45 bg-blue-400/10 text-blue-100',
  'border-indigo-400/45 bg-indigo-400/10 text-indigo-100',
  'border-violet-400/45 bg-violet-400/10 text-violet-100',
  'border-amber-400/45 bg-amber-400/10 text-amber-100',
  'border-orange-400/45 bg-orange-400/10 text-orange-100',
  'border-rose-400/45 bg-rose-400/10 text-rose-100',
  'border-emerald-400/45 bg-emerald-400/10 text-emerald-100',
];

export const REGISTER_LABEL_CLASSES = [
  'text-sky-300',
  'text-blue-300',
  'text-indigo-300',
  'text-violet-300',
  'text-amber-300',
  'text-orange-300',
  'text-rose-300',
  'text-emerald-300',
];

interface RegisterBlockProps {
  index: number;
  value: bigint;
  bits: number;
  note?: string;
  highlight?: boolean;
  pulse?: boolean;
  label?: string;
}

export function RegisterBlock({ index, value, bits, note, highlight, pulse, label }: RegisterBlockProps) {
  return (
    <motion.div
      initial={pulse ? { opacity: 0.3, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex min-w-0 flex-col rounded-lg border px-3 py-2', REGISTER_CLASSES[index % 8], highlight && 'ring-2 ring-white/70 ring-offset-2 ring-offset-ink-850')}
    >
      <span className={cn('text-sm font-bold', REGISTER_LABEL_CLASSES[index % 8])}>{label ?? REGISTER_NAMES[index]}</span>
      <span className={cn('mono break-all font-medium', bits === 64 ? 'text-[13px]' : 'text-[15px]')}>{formatWord(value, bits)}</span>
      {note && <span className="mt-0.5 text-xs text-slate-400">{note}</span>}
    </motion.div>
  );
}

export function RegisterRow({ values, bits, notes, highlight, pulseKey, labels }: { values: readonly bigint[]; bits: number; notes?: (string | undefined)[]; highlight?: number[]; pulseKey?: string; labels?: string[] }) {
  return (
    <div className={cn('grid gap-2', bits === 64 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4 2xl:grid-cols-8')}>
      {values.map((v, i) => (
        <RegisterBlock key={`${pulseKey ?? ''}-${i}`} index={i} value={v} bits={bits} note={notes?.[i]} highlight={highlight?.includes(i)} pulse={Boolean(pulseKey)} label={labels?.[i]} />
      ))}
    </div>
  );
}
