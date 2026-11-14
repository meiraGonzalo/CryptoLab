import { useMemo } from 'react';
import katex from 'katex';
import { cn } from '@/utils/cn';

interface MathFormulaProps {
  tex: string;
  display?: boolean;
  className?: string;
}

/** Representa una expresión matemática con KaTeX. */
export function MathFormula({ tex, display = false, className }: MathFormulaProps) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' }),
    [tex, display],
  );
  return <span className={cn(display ? 'block text-slate-100' : 'text-slate-100', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
