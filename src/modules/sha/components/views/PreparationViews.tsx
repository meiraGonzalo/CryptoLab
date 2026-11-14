import { ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ByteCell } from '@/components/visualizations/ByteCell';
import { BitStrip } from '@/components/visualizations/BitStrip';
import { Legend } from '@/components/visualizations/Legend';
import type { Tone } from '@/components/common/tones';
import { byteToBinary, bytesToBinary, utf8CharacterMap } from '@/utils/bytes';
import { cn } from '@/utils/cn';
import { formatWord } from '../../engine/sha2';
import type { ShaTrace } from '../../types';

export interface ShaViewProps {
  trace: ShaTrace;
  blockIndex: number;
  round: number;
  inputText: string;
  isUtf8: boolean;
}

export function BytesView({ trace, inputText, isUtf8 }: ShaViewProps) {
  const [format, setFormat] = useState<'hex' | 'bin'>('hex');
  const message = trace.message;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-slate-400">
          {message.length} bytes · {message.length * 8} bits
        </p>
        <SegmentedControl size="sm" ariaLabel="Formato" value={format} onChange={setFormat} options={[{ value: 'hex', label: 'Hexadecimal' }, { value: 'bin', label: 'Binario' }]} />
      </div>
      {message.length === 0 ? (
        <p className="text-slate-400">El mensaje está vacío: el hash se calcula igualmente sobre un bloque formado solo por el relleno.</p>
      ) : format === 'hex' && isUtf8 ? (
        <div className="flex flex-wrap gap-3">
          {utf8CharacterMap(inputText).slice(0, 200).map((entry, i) => (
            <div key={i} className="panel-inset flex flex-col items-center gap-1.5 px-2 py-1.5">
              <span className="text-base font-semibold text-white">{entry.char === ' ' ? '␣' : entry.char === '\n' ? '↵' : entry.char}</span>
              <div className="flex gap-1">
                {entry.bytes.map((b, j) => (
                  <ByteCell key={j} value={b} size="sm" tone="data" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : format === 'hex' ? (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(message.slice(0, 512)).map((b, i) => (
            <ByteCell key={i} value={b} size="sm" tone="data" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {Array.from(message.slice(0, 256)).map((b, i) => (
            <span key={i} className="mono rounded border border-accent-data/30 bg-accent-data/10 px-1.5 py-0.5 text-sm text-blue-100">
              {byteToBinary(b)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function paddedTone(trace: ShaTrace, i: number): Tone {
  const p = trace.padding;
  if (i < p.messageBytes) return 'data';
  if (i === p.oneByteIndex) return 'key';
  if (i >= p.lengthStart) return 'sub';
  return 'muted';
}

export function PaddingView({ trace, highlightLength = false }: ShaViewProps & { highlightLength?: boolean }) {
  const { params, padded, padding } = trace;
  const rowBytes = 16;
  return (
    <div className="space-y-4">
      <Legend
        items={[
          { tone: 'data', label: `Mensaje (${padding.messageBytes} bytes)` },
          { tone: 'key', label: 'Bit «1» → 0x80' },
          { tone: 'muted', label: `Ceros (${padding.zeroBytes} bytes)` },
          { tone: 'sub', label: `Longitud (${params.lengthBytes} bytes)` },
        ]}
      />
      <div className="space-y-4 overflow-x-auto">
        {Array.from({ length: padded.length / params.blockBytes }, (_, b) => (
          <div key={b} className="w-max">
            <p className="mb-1.5 text-sm font-medium text-slate-400">
              Bloque {b + 1} · {params.blockBytes * 8} bits
            </p>
            <div className="flex flex-col gap-1">
              {Array.from({ length: params.blockBytes / rowBytes }, (_, r) => (
                <div key={r} className="flex gap-1">
                  {Array.from({ length: rowBytes }, (_, c) => {
                    const i = b * params.blockBytes + r * rowBytes + c;
                    const tone = paddedTone(trace, i);
                    return (
                      <ByteCell
                        key={c}
                        value={padded[i]}
                        size="sm"
                        tone={tone}
                        className={cn(highlightLength && tone !== 'sub' && 'opacity-40')}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LengthView(props: ShaViewProps) {
  const { trace } = props;
  const { params, padding, padded } = trace;
  const lengthBytes = padded.slice(padding.lengthStart);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="panel-inset px-4 py-3">
          <p className="label-caps">Longitud original</p>
          <p className="mono mt-1 text-2xl text-white">
            {padding.messageBytes} bytes × 8 = <span className="text-accent-sub">{padding.bitLength.toString()}</span> bits
          </p>
        </div>
        <ArrowDown className="text-slate-600 sm:-rotate-90" />
        <div className="panel-inset px-4 py-3">
          <p className="label-caps">Entero big-endian de {params.lengthBytes * 8} bits</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from(lengthBytes).map((b, i) => (
              <ByteCell key={i} value={b} size="sm" tone="sub" />
            ))}
          </div>
        </div>
      </div>
      <div className="panel-inset overflow-x-auto p-3">
        <p className="mb-2 text-sm text-slate-400">Últimos 64 bits del campo de longitud</p>
        <BitStrip bits={bytesToBinary(lengthBytes.slice(-8), '').split('').map(Number)} tone="sub" compact />
      </div>
      <PaddingView {...props} highlightLength />
    </div>
  );
}

export function BlocksView({ trace }: ShaViewProps) {
  const { params } = trace;
  return (
    <div className="space-y-5">
      {trace.blocks.map((block) => (
        <div key={block.index}>
          <p className="mb-2 text-sm font-medium text-slate-400">
            Bloque {block.index + 1}: 16 palabras de {params.wordBits} bits (M0 … M15)
          </p>
          <div className={cn('grid gap-1.5', params.wordBits === 64 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8')}>
            {block.schedule.slice(0, 16).map((w, t) => (
              <div key={t} className="panel-inset px-2.5 py-1.5">
                <span className="text-xs text-slate-500">M{t}</span>
                <p className="mono break-all text-[14px] text-blue-100">{formatWord(w, params.wordBits)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
