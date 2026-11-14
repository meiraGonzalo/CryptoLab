import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SimulationStore } from '@/stores/createSimulationStore';
import type { SimulationStep } from '@/types/simulation';
import { cn } from '@/utils/cn';
import { Select } from '../common/Field';

const SPEEDS = [0.5, 1, 1.5, 2, 3];

interface SimulationControlsProps<TStep extends SimulationStep> {
  useStore: SimulationStore<TStep>;
  /** Etiqueta del grupo de pasos (por ejemplo, «ronda»). */
  groupLabel?: string;
  /** Texto de posición actual (por ejemplo, «Bloque 1 · Ronda 3»). */
  position?: ReactNode;
  className?: string;
}

function ControlButton({ label, onClick, disabled, children, primary }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-10 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-30',
        primary ? 'w-12 bg-accent-brand text-ink-950 hover:bg-sky-300' : 'w-10 text-slate-300 hover:bg-white/[0.07] hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

/** Barra de controles para recorrer una simulación paso a paso. */
export function SimulationControls<TStep extends SimulationStep>({ useStore, groupLabel = 'ronda', position, className }: SimulationControlsProps<TStep>) {
  const steps = useStore((s) => s.steps);
  const index = useStore((s) => s.index);
  const isPlaying = useStore((s) => s.isPlaying);
  const speed = useStore((s) => s.speed);
  const { next, prev, nextGroup, prevGroup, togglePlay, reset, setSpeed, goTo } = useStore.getState();

  const total = steps.length;
  const atStart = index === 0;
  const atEnd = index >= total - 1;
  const progress = total > 1 ? (index / (total - 1)) * 100 : 0;
  const isResumable = !isPlaying && index > 0 && !atEnd;

  return (
    <div className={cn('panel sticky top-[72px] z-20 px-3 py-2.5 sm:px-4 lg:top-2', className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-0.5">
          <ControlButton label={`Retroceder una ${groupLabel} (Shift + ←)`} onClick={prevGroup} disabled={atStart}>
            <ChevronsLeft size={20} />
          </ControlButton>
          <ControlButton label="Retroceder una operación (←)" onClick={prev} disabled={atStart}>
            <ChevronLeft size={20} />
          </ControlButton>
          <ControlButton
            primary
            label={isPlaying ? 'Pausar (barra espaciadora)' : isResumable ? 'Reanudar (barra espaciadora)' : 'Ejecutar automáticamente (barra espaciadora)'}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
          </ControlButton>
          <ControlButton label="Avanzar una operación (→)" onClick={next} disabled={atEnd}>
            <ChevronRight size={20} />
          </ControlButton>
          <ControlButton label={`Avanzar una ${groupLabel} (Shift + →)`} onClick={nextGroup} disabled={atEnd}>
            <ChevronsRight size={20} />
          </ControlButton>
          <ControlButton label="Reiniciar simulación" onClick={reset} disabled={atStart && !isPlaying}>
            <RotateCcw size={18} />
          </ControlButton>
        </div>

        <div className="flex min-w-[200px] flex-1 items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, total - 1)}
            value={index}
            onChange={(e) => goTo(Number(e.target.value))}
            aria-label="Posición en la simulación"
            className="h-1.5 flex-1 cursor-pointer"
            style={{ background: `linear-gradient(to right, #38bdf8 ${progress}%, #22304f ${progress}%)`, borderRadius: 999, appearance: 'none' }}
          />
          <span className="mono whitespace-nowrap text-sm text-slate-400">
            {index + 1} / {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{isPlaying ? 'Reproduciendo' : isResumable ? 'En pausa' : 'Velocidad'}</span>
          <Select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Velocidad de animación" className="h-9 w-[84px]">
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </Select>
        </div>
      </div>
      {position && <div className="mt-2 border-t border-white/[0.05] pt-2 text-sm text-slate-300">{position}</div>}
    </div>
  );
}
