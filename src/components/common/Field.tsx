import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

const controlBase =
  'w-full rounded-lg border bg-ink-900/80 px-3 text-[15px] text-slate-100 placeholder:text-slate-500 transition-colors focus:border-accent-brand/60 focus:outline-none focus:ring-2 focus:ring-accent-brand/25 disabled:opacity-50';

const borderFor = (invalid?: boolean) => (invalid ? 'border-rose-400/60' : 'border-white/10 hover:border-white/20');

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, actions, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex min-h-[28px] flex-wrap items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300">
          {label}
        </label>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-rose-300">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  mono?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ invalid, mono, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'h-10', borderFor(invalid), mono && 'font-mono', className)}
      {...props}
    />
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  mono?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea({ invalid, mono, className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, 'resize-y py-2 leading-relaxed', borderFor(invalid), mono && 'font-mono', className)}
      {...props}
    />
  );
});

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlBase, 'h-10 cursor-pointer border-white/10 pr-8 hover:border-white/20', className)} {...props}>
      {children}
    </select>
  );
}
