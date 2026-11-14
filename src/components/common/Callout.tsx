import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

type CalloutTone = 'info' | 'warning' | 'success' | 'danger';

const STYLES: Record<CalloutTone, { box: string; icon: ReactNode }> = {
  info: { box: 'border-sky-400/25 bg-sky-400/[0.07] text-sky-100', icon: <Info size={18} className="text-sky-300" /> },
  warning: { box: 'border-amber-400/30 bg-amber-400/[0.07] text-amber-100', icon: <AlertTriangle size={18} className="text-amber-300" /> },
  success: { box: 'border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-100', icon: <CheckCircle2 size={18} className="text-emerald-300" /> },
  danger: { box: 'border-rose-400/30 bg-rose-400/[0.08] text-rose-100', icon: <XCircle size={18} className="text-rose-300" /> },
};

interface CalloutProps {
  tone?: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Callout({ tone = 'info', title, children, action, className }: CalloutProps) {
  const style = STYLES[tone];
  return (
    <div className={cn('flex gap-3 rounded-lg border px-4 py-3 text-[15px]', style.box, className)} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('text-slate-300', Boolean(title) && 'mt-0.5')}>{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
