import { motion } from 'framer-motion';
import { BookOpen, Cpu, HelpCircle, Lightbulb, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { useUiStore } from '@/stores/uiStore';
import type { Explanation } from '@/types/simulation';
import { Card } from './Card';
import { SegmentedControl } from './SegmentedControl';

interface ExplanationPanelProps {
  stepKey: string;
  title: string;
  explanation: Explanation;
  /** Resultado concreto de la operación (valores calculados). */
  result?: ReactNode;
  context?: ReactNode;
}

/** Panel contextual que se actualiza automáticamente al avanzar o retroceder. */
export function ExplanationPanel({ stepKey, title, explanation, result, context }: ExplanationPanelProps) {
  const level = useUiStore((s) => s.explanationLevel);
  const setLevel = useUiStore((s) => s.setExplanationLevel);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <BookOpen size={16} className="text-accent-brand" />
          Explicación
        </span>
        <SegmentedControl
          size="sm"
          ariaLabel="Nivel de detalle de la explicación"
          value={level}
          onChange={setLevel}
          options={[
            { value: 'simple', label: 'Sencilla' },
            { value: 'technical', label: 'Técnica' },
          ]}
        />
      </div>
        <motion.div
          key={stepKey + level}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4 px-4 py-4"
          aria-live="polite"
        >
          <div>
            {context && <div className="mb-1.5">{context}</div>}
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <ExplanationRow icon={<HelpCircle size={16} />} label="¿Qué ocurre?">
            {explanation.what}
          </ExplanationRow>
          <ExplanationRow icon={<Target size={16} />} label="¿Por qué?">
            {explanation.why}
          </ExplanationRow>
          {level === 'technical' && (
            <ExplanationRow icon={<Cpu size={16} />} label="Detalle técnico">
              {explanation.technical}
            </ExplanationRow>
          )}
          {result && (
            <ExplanationRow icon={<Lightbulb size={16} />} label="Resultado">
              {result}
            </ExplanationRow>
          )}
        </motion.div>
    </Card>
  );
}

function ExplanationRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-slate-500">{icon}</span>
      <div className="min-w-0">
        <p className="label-caps">{label}</p>
        <div className="mt-1 text-[15px] leading-relaxed text-slate-300">{children}</div>
      </div>
    </div>
  );
}
