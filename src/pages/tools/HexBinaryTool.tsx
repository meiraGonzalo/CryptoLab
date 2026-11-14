import { Binary } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextArea } from '@/components/common/Field';
import { ValueBox } from '@/components/common/ValueBox';
import { useToolsStore } from '@/stores/toolsStore';
import { bytesToBinary, hexToBytes, normalizeHex, validateHex } from '@/utils/bytes';
import { ToolLayout } from './ToolLayout';

function binaryToHex(input: string): { hex: string } | { error: string } {
  const clean = input.replace(/[\s_]/g, '');
  if (clean.length === 0) return { error: 'Ingresá al menos un byte en binario.' };
  if (!/^[01]+$/.test(clean)) return { error: 'Solo se permiten los dígitos 0 y 1.' };
  if (clean.length % 8 !== 0) return { error: `Cada byte tiene 8 bits; hay ${clean.length} bits (no es múltiplo de 8).` };
  let hex = '';
  for (let i = 0; i < clean.length; i += 8) hex += parseInt(clean.slice(i, i + 8), 2).toString(16).padStart(2, '0');
  return { hex };
}

export default function HexBinaryTool() {
  const hexInput = useToolsStore((s) => s.hexBinaryHex);
  const set = useToolsStore((s) => s.set);
  const [binaryDraft, setBinaryDraft] = useState<string | null>(null);
  const [binaryError, setBinaryError] = useState<string | null>(null);

  const hexError = validateHex(hexInput);
  const bytes = hexError ? null : hexToBytes(hexInput);
  const nibbles = normalizeHex(hexInput).split('').filter((c) => /[0-9a-f]/.test(c));

  return (
    <ToolLayout title="Hexadecimal ↔ binario" description="Cada dígito hexadecimal representa exactamente 4 bits (un nibble). Dos dígitos forman un byte.">
      <Card>
        <CardHeader icon={<Binary size={17} />} title="Conversión bidireccional" />
        <CardBody className="grid gap-5 lg:grid-cols-2">
          <Field label="Hexadecimal" htmlFor="hb-hex" error={hexInput.trim() ? hexError : null}>
            <TextArea
              id="hb-hex"
              mono
              rows={4}
              value={hexInput}
              invalid={Boolean(hexInput.trim() && hexError)}
              onChange={(e) => {
                set({ hexBinaryHex: e.target.value });
                setBinaryDraft(null);
                setBinaryError(null);
              }}
            />
          </Field>
          <Field label="Binario" htmlFor="hb-bin" error={binaryError}>
            <TextArea
              id="hb-bin"
              mono
              rows={4}
              value={binaryDraft ?? (bytes ? bytesToBinary(bytes) : '')}
              invalid={Boolean(binaryError)}
              onChange={(e) => {
                setBinaryDraft(e.target.value);
                const result = binaryToHex(e.target.value);
                if ('error' in result) setBinaryError(result.error);
                else {
                  setBinaryError(null);
                  set({ hexBinaryHex: result.hex.match(/../g)!.join(' ') });
                }
              }}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Correspondencia dígito a dígito" subtitle="Cada dígito hexadecimal se expande a 4 bits." />
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {nibbles.slice(0, 128).map((digit, i) => {
              const bits = parseInt(digit, 16).toString(2).padStart(4, '0');
              return (
                <div key={i} className={`panel-inset flex flex-col items-center gap-1.5 px-3 py-2 ${i % 2 === 1 ? 'mr-2' : ''}`}>
                  <span className="mono text-xl font-semibold text-accent-data">{digit}</span>
                  <span className="text-slate-600">↓</span>
                  <div className="flex gap-0.5">
                    {bits.split('').map((b, j) => (
                      <span key={j} className={`mono flex h-6 w-5 items-center justify-center rounded-[3px] text-xs font-semibold ${b === '1' ? 'bg-accent-data/80 text-ink-950' : 'bg-ink-700 text-slate-500'}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500">= {parseInt(digit, 16)}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {bytes && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ValueBox label="Binario sin separadores" value={bytesToBinary(bytes, '')} tone="data" />
          <ValueBox label="Decimal (por byte)" value={Array.from(bytes).join(' ')} tone="neutral" />
        </div>
      )}
    </ToolLayout>
  );
}
