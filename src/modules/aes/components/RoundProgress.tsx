import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Field';
import { DOT_TONE_CLASSES } from '@/components/common/tones';
import { cn } from '@/utils/cn';
import { AES_PARAMETERS, type AesSimulation, type AesStep } from '../types';
import { OPERATION_TONES } from './AesStepView';

interface RoundProgressProps {
  simulation: AesSimulation;
  steps: AesStep[];
  index: number;
  goTo: (index: number) => void;
}

/** Indicador de progreso: bloque, rondas y operaciones de la ronda actual. */
export function RoundProgress({ simulation, steps, index, goTo }: RoundProgressProps) {
  const current = steps[index];
  const nr = AES_PARAMETERS[simulation.config.variant].nr;
  const blockIndex = Math.max(0, current.blockIndex);
  const inPreparation = current.blockIndex < 0;

  const firstIndexOf = (predicate: (s: AesStep) => boolean) => steps.findIndex(predicate);
  const roundSteps = inPreparation
    ? steps.filter((s) => s.blockIndex < 0)
    : steps.filter((s) => s.blockIndex === current.blockIndex && s.groupKey === current.groupKey);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">Progreso</p>
        {simulation.blocks.length > 1 && (
          <Select
            aria-label="Bloque"
            className="h-8 w-auto py-0 text-sm"
            value={blockIndex}
            onChange={(e) => goTo(firstIndexOf((s) => s.blockIndex === Number(e.target.value)))}
          >
            {simulation.blocks.map((_, b) => (
              <option key={b} value={b}>
                Bloque {b + 1} de {simulation.blocks.length}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs text-slate-500">Rondas del bloque {blockIndex + 1}</p>
        <div className="flex flex-wrap gap-1.5">
          <RoundChip label="Prep." active={inPreparation} done={!inPreparation} onClick={() => goTo(0)} />
          {Array.from({ length: nr + 1 }, (_, r) => {
            const target = firstIndexOf((s) => s.blockIndex === blockIndex && s.round === r && s.operation !== 'loadState' && s.operation !== 'output');
            const active = !inPreparation && current.round === r && current.operation !== 'loadState' && current.operation !== 'output';
            const done = !inPreparation && (current.operation === 'output' || current.round > r);
            return <RoundChip key={r} label={r === 0 ? 'R0' : `R${r}`} active={active} done={done} onClick={() => goTo(target)} title={r === 0 ? 'Ronda inicial (AddRoundKey)' : `Ronda ${r}`} />;
          })}
          <RoundChip
            label="Salida"
            active={current.operation === 'output'}
            done={false}
            onClick={() => goTo(firstIndexOf((s) => s.blockIndex === blockIndex && s.operation === 'output'))}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-slate-500">Operaciones {inPreparation ? 'de preparación' : 'de esta etapa'}</p>
        <ol className="flex flex-col gap-1">
          {roundSteps.map((s) => {
            const stepIndex = steps.indexOf(s);
            const active = stepIndex === index;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(stepIndex)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                    active ? 'bg-white/[0.07] text-white' : stepIndex < index ? 'text-slate-400 hover:bg-white/[0.04]' : 'text-slate-500 hover:bg-white/[0.04]',
                  )}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT_TONE_CLASSES[OPERATION_TONES[s.operation]], !active && 'opacity-50')} />
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

function RoundChip({ label, active, done, onClick, title }: { label: string; active: boolean; done: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-current={active ? 'step' : undefined}
      className={cn(
        'mono h-8 min-w-[2.5rem] rounded-md border px-2 text-sm transition-colors',
        active
          ? 'border-accent-brand bg-accent-brand/20 text-white'
          : done
            ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'
            : 'border-white/[0.06] text-slate-500 hover:bg-white/[0.05]',
      )}
    >
      {label}
    </button>
  );
}
