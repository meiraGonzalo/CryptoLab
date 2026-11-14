import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent-brand text-ink-950 hover:bg-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_6px_20px_-8px_rgba(56,189,248,0.6)] font-semibold',
  secondary: 'bg-ink-700 text-slate-100 border border-white/10 hover:bg-ink-600 hover:border-white/20',
  subtle: 'bg-white/[0.04] text-slate-200 border border-white/[0.07] hover:bg-white/[0.08]',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-rose-500/15 text-rose-200 border border-rose-400/30 hover:bg-rose-500/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-[15px] gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  icon: 'h-10 w-10 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
});
