import { Dices } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextInput } from '@/components/common/Field';
import { ValueBox } from '@/components/common/ValueBox';
import { randomBigIntInRange } from '@/services/crypto/random';
import { ToolLayout } from './ToolLayout';

const BINS = 10;

function parseBig(value: string): bigint | null {
  const clean = value.trim();
  return /^-?\d+$/.test(clean) ? BigInt(clean) : null;
}

export default function RandomNumberTool() {
  const [minInput, setMinInput] = useState('1');
  const [maxInput, setMaxInput] = useState('100');
  const [countInput, setCountInput] = useState('20');
  const [values, setValues] = useState<bigint[]>([]);
  const [range, setRange] = useState<[bigint, bigint] | null>(null);

  const min = parseBig(minInput);
  const max = parseBig(maxInput);
  const count = Number(countInput);
  let error: string | null = null;
  if (min === null || max === null) error = 'El mínimo y el máximo deben ser números enteros.';
  else if (max < min) error = 'El máximo debe ser mayor o igual que el mínimo.';
  const countError = !Number.isInteger(count) || count < 1 || count > 1000 ? 'Elegí entre 1 y 1000 valores.' : null;

  const generate = () => {
    if (error || countError || min === null || max === null) return;
    setValues(Array.from({ length: count }, () => randomBigIntInRange(min, max)));
    setRange([min, max]);
  };

  const histogram = (() => {
    if (!range || values.length === 0) return null;
    const [lo, hi] = range;
    const span = hi - lo + 1n;
    const bins = span < BigInt(BINS) ? Number(span) : BINS;
    const counts = new Array<number>(bins).fill(0);
    for (const v of values) counts[Number(((v - lo) * BigInt(bins)) / span)]++;
    return { counts, bins, lo, hi, span };
  })();
  const maxCount = histogram ? Math.max(...histogram.counts, 1) : 1;

  return (
    <ToolLayout title="Generador de números aleatorios" description="Enteros uniformes en cualquier rango, sin sesgo de módulo: los valores fuera de rango se descartan y se vuelven a generar." secure>
      <Card>
        <CardHeader icon={<Dices size={17} />} title="Parámetros" />
        <CardBody className="flex flex-wrap items-end gap-4">
          <Field label="Mínimo" htmlFor="rn-min" className="w-48">
            <TextInput id="rn-min" mono value={minInput} onChange={(e) => setMinInput(e.target.value)} invalid={min === null} />
          </Field>
          <Field label="Máximo" htmlFor="rn-max" className="w-48">
            <TextInput id="rn-max" mono value={maxInput} onChange={(e) => setMaxInput(e.target.value)} invalid={max === null} />
          </Field>
          <Field label="Cantidad" htmlFor="rn-count" className="w-32">
            <TextInput id="rn-count" inputMode="numeric" value={countInput} onChange={(e) => setCountInput(e.target.value)} invalid={Boolean(countError)} />
          </Field>
          <Button variant="primary" icon={<Dices size={16} />} onClick={generate} disabled={Boolean(error || countError)}>
            Generar
          </Button>
          {(error || countError) && <p className="w-full text-sm text-rose-300">{error ?? countError}</p>}
        </CardBody>
      </Card>

      {values.length > 0 && histogram && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader title={`${values.length} valores entre ${histogram.lo} y ${histogram.hi}`} />
            <CardBody className="space-y-4">
              <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
                {values.map((v, i) => (
                  <span key={i} className="mono rounded-md border border-accent-data/30 bg-accent-data/10 px-2 py-1 text-sm text-blue-100">
                    {v.toString()}
                  </span>
                ))}
              </div>
              <ValueBox label="Lista separada por comas" value={values.join(', ')} tone="data" maxHeight />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Distribución" subtitle="Con más valores, las barras tienden a igualarse (distribución uniforme)." />
            <CardBody>
              <svg viewBox="0 0 340 200" className="w-full" role="img" aria-label="Histograma de los valores generados">
                {histogram.counts.map((c, i) => {
                  const w = 320 / histogram.bins;
                  const h = (c / maxCount) * 150;
                  return (
                    <g key={i}>
                      <rect x={10 + i * w + 2} y={170 - h} width={w - 4} height={h} rx={3} fill="#60a5fa" fillOpacity={0.75} />
                      <text x={10 + i * w + w / 2} y={165 - h} textAnchor="middle" fontSize="11" fill="#cbd5e1">
                        {c}
                      </text>
                    </g>
                  );
                })}
                <line x1="10" y1="171" x2="330" y2="171" stroke="#334155" />
                <text x="10" y="190" fontSize="11" fill="#94a3b8">
                  {histogram.lo.toString()}
                </text>
                <text x="330" y="190" fontSize="11" fill="#94a3b8" textAnchor="end">
                  {histogram.hi.toString()}
                </text>
              </svg>
            </CardBody>
          </Card>
        </div>
      )}
    </ToolLayout>
  );
}
