import { KeySquare, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextInput } from '@/components/common/Field';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ValueBox } from '@/components/common/ValueBox';
import { ByteCell } from '@/components/visualizations/ByteCell';
import { randomBytes } from '@/services/crypto/random';
import { bytesToBase64, bytesToBinary, bytesToHex } from '@/utils/bytes';
import { ToolLayout } from './ToolLayout';

type Preset = '128' | '192' | '256' | 'custom';

const LABELS: Record<Preset, string> = { '128': 'AES-128', '192': 'AES-192', '256': 'AES-256', custom: 'Personalizada' };

export default function KeyGeneratorTool() {
  const [preset, setPreset] = useState<Preset>('256');
  const [customBytes, setCustomBytes] = useState('16');
  const [key, setKey] = useState<Uint8Array>(() => randomBytes(32));

  const customValue = Number(customBytes);
  const customError = preset === 'custom' && (!Number.isInteger(customValue) || customValue < 1 || customValue > 512) ? 'Ingresá una longitud entre 1 y 512 bytes.' : null;
  const length = preset === 'custom' ? customValue : Number(preset) / 8;

  const generate = (len = length) => {
    if (!Number.isInteger(len) || len < 1 || len > 512) return;
    setKey(randomBytes(len));
  };

  return (
    <ToolLayout title="Generador de claves" description="Genera claves simétricas y valores aleatorios con crypto.getRandomValues, la fuente de entropía del sistema operativo." secure>
      <Card>
        <CardHeader icon={<KeySquare size={17} />} title="Configuración" />
        <CardBody className="flex flex-wrap items-end gap-5">
          <Field label="Tipo de clave">
            <SegmentedControl<Preset>
              ariaLabel="Tipo de clave"
              value={preset}
              onChange={(p) => {
                setPreset(p);
                if (p !== 'custom') generate(Number(p) / 8);
              }}
              options={(Object.keys(LABELS) as Preset[]).map((p) => ({ value: p, label: LABELS[p] }))}
            />
          </Field>
          {preset === 'custom' && (
            <Field label="Longitud (bytes)" htmlFor="kg-len" error={customError} className="w-44">
              <TextInput id="kg-len" inputMode="numeric" value={customBytes} onChange={(e) => setCustomBytes(e.target.value)} invalid={Boolean(customError)} />
            </Field>
          )}
          <Button variant="primary" icon={<RefreshCw size={16} />} onClick={() => generate()} disabled={Boolean(customError)}>
            Generar
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={`Clave generada · ${key.length} bytes (${key.length * 8} bits)`} />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {Array.from(key.slice(0, 128)).map((b, i) => (
              <ByteCell key={`${bytesToHex(key.slice(0, 4))}-${i}`} value={b} size="sm" tone="key" pulse />
            ))}
            {key.length > 128 && <span className="self-center text-sm text-slate-500">… y {key.length - 128} bytes más</span>}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <ValueBox label="Hexadecimal" value={bytesToHex(key)} tone="key" />
            <ValueBox label="Base64" value={bytesToBase64(key)} tone="key" />
          </div>
          <ValueBox label="Binario" value={bytesToBinary(key)} tone="neutral" maxHeight />
          <p className="text-sm text-slate-500">
            La clave existe solo en esta página: no se guarda ni se envía a ningún lado. Para usarla en el simulador de AES, copiala en el campo de clave.
          </p>
        </CardBody>
      </Card>
    </ToolLayout>
  );
}
