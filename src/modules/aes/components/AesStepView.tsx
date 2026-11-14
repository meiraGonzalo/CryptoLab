import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import type { Tone } from '@/components/common/tones';
import type { AesStepOperation } from '../types';
import { AddRoundKeyView } from './views/AddRoundKeyView';
import { MixColumnsView } from './views/MixColumnsView';
import { BlockSplitView, LoadStateView, MessageBytesView, OutputView } from './views/PreparationViews';
import { ShiftRowsView } from './views/ShiftRowsView';
import { SubBytesView } from './views/SubBytesView';
import type { AesViewProps } from './views/viewTypes';
import { AES_PARAMETERS } from '../types';

export const OPERATION_TONES: Record<AesStepOperation, Tone> = {
  messageBytes: 'data',
  blockSplit: 'data',
  loadState: 'data',
  addRoundKey: 'key',
  subBytes: 'sub',
  invSubBytes: 'sub',
  shiftRows: 'shift',
  invShiftRows: 'shift',
  mixColumns: 'mix',
  invMixColumns: 'mix',
  output: 'result',
};

const OPERATION_CATEGORY: Record<AesStepOperation, string> = {
  messageBytes: 'Preparación',
  blockSplit: 'Preparación',
  loadState: 'Preparación',
  addRoundKey: 'XOR con la clave',
  subBytes: 'Sustitución',
  invSubBytes: 'Sustitución inversa',
  shiftRows: 'Desplazamiento',
  invShiftRows: 'Desplazamiento inverso',
  mixColumns: 'Mezcla de columnas',
  invMixColumns: 'Mezcla inversa',
  output: 'Resultado',
};

const VIEWS: Record<AesStepOperation, (props: AesViewProps) => JSX.Element> = {
  messageBytes: MessageBytesView,
  blockSplit: BlockSplitView,
  loadState: LoadStateView,
  addRoundKey: AddRoundKeyView,
  subBytes: SubBytesView,
  invSubBytes: SubBytesView,
  shiftRows: ShiftRowsView,
  invShiftRows: ShiftRowsView,
  mixColumns: MixColumnsView,
  invMixColumns: MixColumnsView,
  output: OutputView,
};

export function describeStepPosition({ step, simulation }: Pick<AesViewProps, 'step' | 'simulation'>): string {
  if (step.blockIndex < 0) return 'Preparación del mensaje';
  const nr = AES_PARAMETERS[simulation.config.variant].nr;
  const block = `Bloque ${step.blockIndex + 1} de ${simulation.blocks.length}`;
  if (step.operation === 'loadState') return `${block} · Carga del estado`;
  if (step.operation === 'output') return `${block} · Resultado`;
  if (step.round === 0) return `${block} · Ronda inicial`;
  const keyInfo = step.roundKeyIndex !== null ? ` · clave de ronda ${step.roundKeyIndex}` : '';
  return `${block} · Ronda ${step.round} de ${nr}${step.round === nr ? ' (final, sin MixColumns)' : ''}${keyInfo}`;
}

export function AesStepView(props: AesViewProps) {
  const { step } = props;
  const View = VIEWS[step.operation];
  return (
    <Card className="min-w-0">
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {step.title}
            <Badge tone={OPERATION_TONES[step.operation]}>{OPERATION_CATEGORY[step.operation]}</Badge>
          </span>
        }
        subtitle={describeStepPosition(props)}
      />
      <CardBody className="min-h-[420px]">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 / props.speed }}
          >
            <View {...props} />
          </motion.div>
      </CardBody>
    </Card>
  );
}
