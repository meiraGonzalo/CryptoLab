import { ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { ByteCell } from '@/components/visualizations/ByteCell';
import { ByteSequence } from '@/components/visualizations/ByteSequence';
import { Legend } from '@/components/visualizations/Legend';
import { StateMatrix } from '@/components/visualizations/StateMatrix';
import { byteToBinary, utf8CharacterMap } from '@/utils/bytes';
import { cn } from '@/utils/cn';
import type { AesViewProps } from './viewTypes';
import { hex2 } from './viewTypes';

export function MessageBytesView({ simulation }: AesViewProps) {
  const { config } = simulation;
  const [selected, setSelected] = useState<number | null>(null);

  if (config.mode === 'encrypt' && config.inputEncoding === 'utf8') {
    const map = utf8CharacterMap(config.inputText);
    let offset = 0;
    return (
      <div className="space-y-5">
        <p className="text-[15px] text-slate-400">Cada carácter se codifica en UTF-8 como uno o más bytes:</p>
        <div className="flex flex-wrap gap-3">
          {map.map((entry, i) => {
            const start = offset;
            offset += entry.bytes.length;
            return (
              <div key={i} className={cn('panel-inset flex flex-col items-center gap-2 px-2.5 py-2', entry.bytes.length > 1 && 'border-accent-sub/30')}>
                <span className="text-lg font-semibold text-white">{entry.char === ' ' ? '␣' : entry.char}</span>
                <ArrowDown size={14} className="text-slate-600" />
                <div className="flex gap-1">
                  {entry.bytes.map((b, j) => (
                    <ByteCell key={j} value={b} size="sm" tone="data" selected={selected === start + j} onSelect={() => setSelected(start + j)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {selected !== null && <ByteDetail value={simulation.config.input[selected]} index={selected} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[15px] text-slate-400">
        {config.mode === 'encrypt' ? 'Bytes del mensaje' : 'Bytes del texto cifrado'} ({config.input.length}):
      </p>
      <ByteSequence bytes={config.input} tone="data" size="md" selectedIndex={selected} onSelect={setSelected} />
      {selected !== null && <ByteDetail value={config.input[selected]} index={selected} />}
    </div>
  );
}

function ByteDetail({ value, index }: { value: number; index: number }) {
  return (
    <div className="panel-inset flex flex-wrap gap-x-8 gap-y-2 px-4 py-3 text-[15px]">
      <span className="text-slate-400">
        Byte <span className="mono text-white">{index}</span>
      </span>
      <span className="text-slate-400">
        Hex <span className="mono text-accent-data">0x{hex2(value)}</span>
      </span>
      <span className="text-slate-400">
        Decimal <span className="mono text-white">{value}</span>
      </span>
      <span className="text-slate-400">
        Binario <span className="mono text-white">{byteToBinary(value)}</span>
      </span>
    </div>
  );
}

export function BlockSplitView({ simulation }: AesViewProps) {
  const messageLength = simulation.config.input.length;
  const isEncrypt = simulation.config.mode === 'encrypt';
  return (
    <div className="space-y-4">
      <Legend
        items={[
          { tone: 'data', label: isEncrypt ? 'Bytes del mensaje' : 'Bytes cifrados' },
          ...(simulation.paddingLength > 0 ? [{ tone: 'mix' as const, label: `Relleno PKCS#7 (0x${hex2(simulation.paddingLength)})` }] : []),
        ]}
      />
      <div className="space-y-3">
        {simulation.blocks.map((block, b) => (
          <div key={b} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="w-24 shrink-0 text-sm font-medium text-slate-400">Bloque {b + 1}</span>
            <div className="overflow-x-auto">
              <div className="flex w-max gap-1">
                {Array.from(block).map((value, i) => (
                  <ByteCell key={i} value={value} size="sm" tone={b * 16 + i >= messageLength ? 'mix' : 'data'} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        {simulation.processedInput.length} bytes = {simulation.blocks.length} × 16 bytes = {simulation.blocks.length * 128} bits
      </p>
    </div>
  );
}

export function LoadStateView({ step, simulation }: AesViewProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const block = simulation.blocks[step.blockIndex];
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full">
        <p className="mb-1 text-sm text-slate-400">Bytes del bloque (en orden de lectura)</p>
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max gap-1 pt-5">
            {Array.from(block).map((value, i) => (
              <ByteCell
                key={i}
                value={value}
                size="sm"
                caption={i}
                tone={Math.floor(i / 4) % 2 === 0 ? 'data' : 'brand'}
                selected={hovered === i}
                onHover={(h) => setHovered(h ? i : null)}
              />
            ))}
          </div>
        </div>
      </div>
      <ArrowDown className="text-slate-600" />
      <div className="flex flex-col items-center gap-2">
        <StateMatrix
          bytes={step.after}
          size="lg"
          label="Matriz de estado (se completa por columnas)"
          tone={(i) => (Math.floor(i / 4) % 2 === 0 ? 'data' : 'brand')}
          selectedIndex={hovered}
          onSelect={(i) => setHovered(i)}
          showAxes
          pulseKey={step.id}
        />
        {hovered !== null && (
          <p className="text-sm text-slate-400">
            Byte {hovered} → fila {hovered % 4}, columna {Math.floor(hovered / 4)}
          </p>
        )}
      </div>
    </div>
  );
}

export function OutputView({ step, simulation }: AesViewProps) {
  const block = simulation.outputBlocks[step.blockIndex];
  return (
    <div className="flex flex-col items-center gap-6">
      <StateMatrix bytes={step.after} size="lg" tone="result" label="Estado final" showAxes />
      <ArrowDown className="text-slate-600" />
      <div className="w-full">
        <p className="mb-1 text-sm text-slate-400">
          {simulation.config.mode === 'encrypt' ? 'Bloque cifrado' : 'Bloque descifrado'} {step.blockIndex + 1} (lectura por columnas)
        </p>
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max gap-1 pt-5">
            {Array.from(block).map((value, i) => (
              <ByteCell key={i} value={value} size="sm" caption={i} tone="result" pulse />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
