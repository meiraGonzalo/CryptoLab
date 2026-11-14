import { LayoutGroup, motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { StateMatrix } from '@/components/visualizations/StateMatrix';
import { OperatorSymbol } from '@/components/visualizations/OperatorSymbol';
import { cn } from '@/utils/cn';
import { CELL_TONE_CLASSES } from '@/components/common/tones';
import { invShiftRowsSourceColumn, shiftRowsSourceColumn } from '../../engine/transformations';
import type { AesViewProps } from './viewTypes';
import { hex2 } from './viewTypes';

export function ShiftRowsView({ step, speed }: AesViewProps) {
  const inverse = step.operation === 'invShiftRows';
  const [phase, setPhase] = useState<'before' | 'after'>('before');
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    setPhase('before');
    const timer = window.setTimeout(() => setPhase('after'), 650 / speed);
    return () => window.clearTimeout(timer);
  }, [step.id, replay, speed]);

  const sourceColumn = inverse ? invShiftRowsSourceColumn : shiftRowsSourceColumn;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          size="sm"
          ariaLabel="Estado mostrado"
          value={phase}
          onChange={setPhase}
          options={[
            { value: 'before', label: 'Antes' },
            { value: 'after', label: 'Después' },
          ]}
        />
        <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setReplay((r) => r + 1)}>
          Repetir animación
        </Button>
      </div>

      <LayoutGroup id={`shift-${step.id}-${replay}`}>
        <div className="mx-auto flex w-max flex-col gap-2">
          {[0, 1, 2, 3].map((row) => {
            const order = [0, 1, 2, 3].map((column) => (phase === 'before' ? column : sourceColumn(row, column)));
            return (
              <div key={row} className="flex items-center gap-4">
                <span className="w-14 text-right text-sm text-slate-500">Fila {row}</span>
                <div className="flex gap-2">
                  {order.map((src) => {
                    const value = step.before[row + 4 * src];
                    const moved = phase === 'after' && row > 0;
                    return (
                      <motion.div
                        key={`${row}-${src}`}
                        layout
                        transition={{ type: 'spring', stiffness: 170 * speed, damping: 22 }}
                        className={cn(
                          'mono flex h-14 w-14 items-center justify-center rounded-md border text-lg font-medium',
                          CELL_TONE_CLASSES[moved ? 'shift' : 'data'],
                        )}
                      >
                        {hex2(value)}
                      </motion.div>
                    );
                  })}
                </div>
                <span className={cn('w-32 whitespace-nowrap text-sm', row === 0 ? 'text-slate-600' : 'text-accent-shift')}>
                  {row === 0 ? 'sin cambio' : `${inverse ? '→' : '←'} ${row} ${row > 1 ? 'posiciones' : 'posición'}`}
                </span>
              </div>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/[0.05] pt-5">
        <StateMatrix bytes={step.before} label="Estado anterior" tone="data" size="sm" />
        <OperatorSymbol label={inverse ? 'InvShiftRows' : 'ShiftRows'}>→</OperatorSymbol>
        <StateMatrix bytes={step.after} label="Estado posterior" tone={(i) => (i % 4 === 0 ? 'data' : 'shift')} size="sm" />
      </div>
    </div>
  );
}
