import { Card } from '@/components/common/Card';
import { Select } from '@/components/common/Field';
import { cn } from '@/utils/cn';
import type { ShaStep, ShaTrace } from '../types';

interface ShaProgressProps {
  trace: ShaTrace;
  steps: ShaStep[];
  index: number;
  goTo: (index: number) => void;
}

const STAGES: { kind: ShaStep['kind']; label: string }[] = [
  { kind: 'schedule', label: 'Expansión W' },
  { kind: 'init', label: 'Registros' },
  { kind: 'round', label: 'Rondas' },
  { kind: 'final', label: 'Suma final' },
];

export function ShaProgress({ trace, steps, index, goTo }: ShaProgressProps) {
  const current = steps[index];
  const blockIndex = Math.max(0, current.blockIndex);
  const rounds = trace.params.rounds;
  const find = (predicate: (s: ShaStep) => boolean) => steps.findIndex(predicate);
  const currentRound = current.kind === 'round' ? current.round : null;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">Progreso</p>
        {trace.blocks.length > 1 && (
          <Select aria-label="Bloque" className="h-8 w-auto py-0 text-sm" value={blockIndex} onChange={(e) => goTo(find((s) => s.blockIndex === Number(e.target.value)))}>
            {trace.blocks.map((_, b) => (
              <option key={b} value={b}>
                Bloque {b + 1} de {trace.blocks.length}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['bytes', 'padding', 'length', 'blocks'] as const).map((kind, i) => (
          <StageChip key={kind} label={['Bytes', 'Relleno', 'Longitud', 'Bloques'][i]} active={current.kind === kind} onClick={() => goTo(find((s) => s.kind === kind))} />
        ))}
        {STAGES.map((stage) => (
          <StageChip
            key={stage.kind}
            label={stage.label}
            active={current.kind === stage.kind && current.blockIndex === blockIndex}
            onClick={() => goTo(find((s) => s.kind === stage.kind && s.blockIndex === blockIndex))}
          />
        ))}
        <StageChip label="Hash" active={current.kind === 'digest'} onClick={() => goTo(steps.length - 1)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Ronda</span>
          <span className="mono text-slate-200">{currentRound === null ? '—' : `${currentRound} / ${rounds - 1}`}</span>
        </div>
        <input
          type="range"
          min={0}
          max={rounds - 1}
          value={currentRound ?? 0}
          onChange={(e) => goTo(find((s) => s.kind === 'round' && s.blockIndex === blockIndex && s.round === Number(e.target.value)))}
          aria-label="Seleccionar ronda"
          className="w-full cursor-pointer"
        />
        <div className="mt-3 grid grid-cols-16 gap-[3px]" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
          {Array.from({ length: rounds }, (_, t) => (
            <button
              key={t}
              type="button"
              title={`Ronda ${t}`}
              aria-label={`Ir a la ronda ${t}`}
              onClick={() => goTo(find((s) => s.kind === 'round' && s.blockIndex === blockIndex && s.round === t))}
              className={cn(
                'h-3 rounded-[2px] transition-colors',
                t === currentRound ? 'bg-accent-brand' : currentRound !== null && t < currentRound ? 'bg-accent-brand/35' : 'bg-ink-600 hover:bg-ink-500',
              )}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function StageChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'step' : undefined}
      className={cn(
        'h-8 rounded-md border px-2.5 text-sm transition-colors',
        active ? 'border-accent-brand bg-accent-brand/20 text-white' : 'border-white/[0.07] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
      )}
    >
      {label}
    </button>
  );
}
