import { ScanLine } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, Select, TextArea } from '@/components/common/Field';
import { ByteCell } from '@/components/visualizations/ByteCell';
import { useToolsStore } from '@/stores/toolsStore';
import { INPUT_ENCODING_LABELS, byteToBinary, byteToHex, byteToPrintable, parseInput, type InputEncoding } from '@/utils/bytes';
import { cn } from '@/utils/cn';
import { ToolLayout } from './ToolLayout';

export default function ByteViewerTool() {
  const input = useToolsStore((s) => s.byteViewerInput);
  const encoding = useToolsStore((s) => s.byteViewerEncoding);
  const set = useToolsStore((s) => s.set);
  const [selected, setSelected] = useState<number | null>(null);

  const parsed = parseInput(input, encoding);
  const bytes = parsed.ok ? parsed.bytes.slice(0, 1024) : new Uint8Array();
  const sel = selected !== null && selected < bytes.length ? selected : null;

  return (
    <ToolLayout title="Visualizador de bytes" description="Inspeccioná cualquier dato byte por byte: hexadecimal, decimal, binario y su carácter ASCII.">
      <Card>
        <CardHeader icon={<ScanLine size={17} />} title="Entrada" />
        <CardBody>
          <Field
            label="Datos"
            htmlFor="bv-input"
            error={parsed.ok ? null : parsed.error}
            hint={parsed.ok ? `${parsed.bytes.length} bytes${parsed.bytes.length > 1024 ? ' (se muestran los primeros 1024)' : ''}` : undefined}
            actions={
              <Select aria-label="Codificación" value={encoding} onChange={(e) => set({ byteViewerEncoding: e.target.value as InputEncoding })} className="h-8 w-auto py-0 text-sm">
                {(Object.keys(INPUT_ENCODING_LABELS) as InputEncoding[]).map((enc) => (
                  <option key={enc} value={enc}>
                    {INPUT_ENCODING_LABELS[enc]}
                  </option>
                ))}
              </Select>
            }
          >
            <TextArea id="bv-input" rows={3} mono={encoding !== 'utf8'} value={input} onChange={(e) => set({ byteViewerInput: e.target.value })} invalid={!parsed.ok} />
          </Field>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader title="Vista hexadecimal" subtitle="16 bytes por fila: desplazamiento, bytes y caracteres ASCII." />
          <CardBody className="overflow-x-auto">
            <div className="w-max space-y-1">
              {Array.from({ length: Math.ceil(bytes.length / 16) }, (_, row) => (
                <div key={row} className="flex items-center gap-4">
                  <span className="mono w-12 text-sm text-slate-600">{(row * 16).toString(16).padStart(4, '0')}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 16 }, (_, c) => {
                      const i = row * 16 + c;
                      return i < bytes.length ? (
                        <ByteCell key={c} value={bytes[i]} size="sm" tone={bytes[i] >= 0x80 ? 'sub' : bytes[i] >= 0x20 && bytes[i] < 0x7f ? 'data' : 'muted'} selected={sel === i} onSelect={() => setSelected(i)} />
                      ) : (
                        <span key={c} className="h-8 w-8" />
                      );
                    })}
                  </div>
                  <span className="mono whitespace-pre text-sm text-slate-400">
                    {Array.from(bytes.slice(row * 16, row * 16 + 16), (b, c) => (
                      <span key={c} className={cn(sel === row * 16 + c && 'rounded-sm bg-accent-brand/30 text-white')}>
                        {byteToPrintable(b)}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
              {bytes.length === 0 && <p className="text-slate-500">Sin datos.</p>}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Byte seleccionado" />
          <CardBody>
            {sel === null ? (
              <p className="text-slate-400">Hacé clic en un byte para ver todas sus representaciones.</p>
            ) : (
              <dl className="space-y-3 text-[15px]">
                <Row label="Posición" value={`${sel} (0x${sel.toString(16)})`} />
                <Row label="Hexadecimal" value={`0x${byteToHex(bytes[sel])}`} />
                <Row label="Decimal" value={String(bytes[sel])} />
                <Row label="Binario" value={byteToBinary(bytes[sel])} />
                <Row label="ASCII" value={bytes[sel] >= 0x20 && bytes[sel] < 0x7f ? `«${String.fromCharCode(bytes[sel])}»` : 'no imprimible'} />
                <Row label="Tipo" value={bytes[sel] >= 0x80 ? (bytes[sel] >= 0xc0 ? 'Inicio de carácter UTF-8 multibyte' : 'Continuación UTF-8') : 'ASCII (1 byte)'} />
              </dl>
            )}
          </CardBody>
        </Card>
      </div>
    </ToolLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.04] pb-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="mono text-right text-slate-100">{value}</dd>
    </div>
  );
}
