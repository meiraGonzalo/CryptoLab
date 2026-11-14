import { CheckCircle2, GitCompareArrows, XCircle } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextArea } from '@/components/common/Field';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ByteCell } from '@/components/visualizations/ByteCell';
import { useToolsStore } from '@/stores/toolsStore';
import { countBitDifferences, parseInput } from '@/utils/bytes';
import { ToolLayout } from './ToolLayout';

export default function CompareTool() {
  const { compareA, compareB, compareFormat, set } = useToolsStore();
  const a = parseInput(compareA, compareFormat);
  const b = parseInput(compareB, compareFormat);
  const both = a.ok && b.ok ? { a: a.bytes, b: b.bytes } : null;

  const length = both ? Math.max(both.a.length, both.b.length) : 0;
  const differentBytes = both ? Array.from({ length }, (_, i) => both.a[i] !== both.b[i]).filter(Boolean).length : 0;
  const bitDiff = both ? countBitDifferences(both.a, both.b) : 0;
  const comparableBits = both ? Math.min(both.a.length, both.b.length) * 8 : 0;
  const identical = both !== null && both.a.length === both.b.length && differentBytes === 0;

  return (
    <ToolLayout title="Comparador de resultados" description="Compará dos resultados (claves, hashes, textos cifrados) byte a byte y bit a bit.">
      <Card>
        <CardHeader
          icon={<GitCompareArrows size={17} />}
          title="Valores"
          actions={
            <SegmentedControl
              size="sm"
              ariaLabel="Formato"
              value={compareFormat}
              onChange={(f) => set({ compareFormat: f })}
              options={[
                { value: 'hex', label: 'Hexadecimal' },
                { value: 'utf8', label: 'Texto' },
              ]}
            />
          }
        />
        <CardBody className="grid gap-5 lg:grid-cols-2">
          <Field label="Valor A" htmlFor="cmp-tool-a" error={a.ok ? null : a.error}>
            <TextArea id="cmp-tool-a" mono={compareFormat === 'hex'} value={compareA} onChange={(e) => set({ compareA: e.target.value })} invalid={!a.ok} />
          </Field>
          <Field label="Valor B" htmlFor="cmp-tool-b" error={b.ok ? null : b.error}>
            <TextArea id="cmp-tool-b" mono={compareFormat === 'hex'} value={compareB} onChange={(e) => set({ compareB: e.target.value })} invalid={!b.ok} />
          </Field>
        </CardBody>
      </Card>

      {both && (
        <Card>
          <CardHeader
            title="Diferencias"
            actions={
              identical ? (
                <Badge tone="result" icon={<CheckCircle2 size={13} />}>
                  Idénticos
                </Badge>
              ) : (
                <Badge tone="xor" icon={<XCircle size={13} />}>
                  Distintos
                </Badge>
              )
            }
          />
          <CardBody className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Longitud" value={both.a.length === both.b.length ? `${both.a.length} bytes` : `${both.a.length} vs ${both.b.length} bytes`} />
              <Stat label="Bytes distintos" value={`${differentBytes} de ${length}`} />
              <Stat label="Bits distintos" value={`${bitDiff} de ${comparableBits}${comparableBits ? ` (${((bitDiff / comparableBits) * 100).toFixed(1)} %)` : ''}`} />
            </div>
            <div className="overflow-x-auto">
              <div className="w-max space-y-3">
                {Array.from({ length: Math.ceil(Math.min(length, 256) / 16) }, (_, row) => (
                  <div key={row} className="flex items-start gap-3">
                    <span className="mono w-10 pt-2 text-sm text-slate-600">{(row * 16).toString(16).padStart(3, '0')}</span>
                    <div className="space-y-1">
                      {(['a', 'b'] as const).map((side) => (
                        <div key={side} className="flex gap-1">
                          {Array.from({ length: 16 }, (_, c) => {
                            const i = row * 16 + c;
                            const value = both[side][i];
                            if (i >= length) return null;
                            if (value === undefined) return <span key={c} className="h-8 w-8 rounded-md border border-dashed border-white/10" title="Sin byte" />;
                            const differs = both.a[i] !== both.b[i];
                            return <ByteCell key={c} value={value} size="sm" tone={differs ? (side === 'a' ? 'data' : 'xor') : 'muted'} />;
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500">Fila superior: valor A. Fila inferior: valor B. Los bytes distintos aparecen resaltados.</p>
          </CardBody>
        </Card>
      )}
    </ToolLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-inset px-4 py-3">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mono mt-0.5 text-lg text-white">{value}</p>
    </div>
  );
}
