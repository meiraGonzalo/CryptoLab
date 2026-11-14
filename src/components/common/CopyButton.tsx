import { Check, Copy, X } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { cn } from '@/utils/cn';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export function CopyButton({ value, label = 'Copiar', className, compact = true }: CopyButtonProps) {
  const { copied, failed, copy } = useClipboard();
  const text = copied ? 'Copiado' : failed ? 'No se pudo copiar' : label;
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      disabled={!value}
      title={text}
      aria-label={text}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium transition-colors disabled:opacity-40',
        copied ? 'text-accent-result' : failed ? 'text-rose-300' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
        className,
      )}
    >
      {copied ? <Check size={15} /> : failed ? <X size={15} /> : <Copy size={15} />}
      {!compact && <span>{text}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copiado al portapapeles' : ''}
      </span>
    </button>
  );
}
