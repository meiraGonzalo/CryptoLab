import { Shuffle, Undo2, Waves } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { CopyButton } from '@/components/common/CopyButton';
import { Field, TextInput } from '@/components/common/Field';
import { ModeBadge } from '@/components/common/ModeBadge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { PageHeader } from '@/components/layout/PageHeader';
import { randomIntInRange } from '@/services/crypto/random';
import { bytesToHex, countBitDifferences, utf8ToBytes } from '@/utils/bytes';
import { SHA_PARAMETERS } from '../engine/constants';
import { sha } from '../engine/sha2';
import type { ShaVariant } from '../types';
import { useHashToolsStore } from '../store/shaStore';
import { HashBitGrid, HexDiff } from './HashBitGrid';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function characterDifferences(a: string, b: string): number {
  const ca = Array.from(a);
  const cb = Array.from(b);
  let diff = Math.abs(ca.length - cb.length);
  for (let i = 0; i < Math.min(ca.length, cb.length); i++) if (ca[i] !== cb[i]) diff++;
  return diff;
}

export default function AvalanchePage() {
  const { avalancheOriginal: original, avalancheModified: modified, avalancheVariant: variant, set } = useHashToolsStore();
  const params = SHA_PARAMETERS[variant];

  const result = useMemo(() => {
    const hashA = sha(utf8ToBytes(original), variant);
    const hashB = sha(utf8ToBytes(modified), variant);
    const changed = countBitDifferences(hashA, hashB);
    return { hashA, hashB, changed, ratio: changed / (hashA.length * 8) };
  }, [original, modified, variant]);

  const totalBits = params.digestBytes * 8;
  const charDiff = characterDifferences(original, modified);

  const mutateOneCharacter = () => {
    const chars = Array.from(original);
    if (chars.length === 0) {
      set({ avalancheModified: ALPHABET[randomIntInRange(0, ALPHABET.length - 1)] });
      return;
    }
    const position = randomIntInRange(0, chars.length - 1);
    let replacement = chars[position];
    while (replacement === chars[position]) replacement = ALPHABET[randomIntInRange(0, ALPHABET.length - 1)];
    chars[position] = replacement;
    set({ avalancheModified: chars.join('') });
  };

  const hexA = bytesToHex(result.hashA);
  const hexB = bytesToHex(result.hashB);

  return (
    <div>
      <PageHeader
        eyebrow="Funciones hash"
        title="Efecto avalancha"
        description="Cambiá un solo carácter del mensaje y observá cómo cambia aproximadamente la mitad de los bits del hash, sin ningún patrón aparente."
        badges={<ModeBadge mode="educational" />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            icon={<Waves size={17} />}
            title="Mensajes"
            actions={
              <SegmentedControl
                size="sm"
                ariaLabel="Algoritmo"
                value={variant}
                onChange={(v: ShaVariant) => set({ avalancheVariant: v })}
                options={[
                  { value: 'sha256', label: 'SHA-256' },
                  { value: 'sha512', label: 'SHA-512' },
                ]}
              />
            }
          />
          <CardBody className="grid gap-5 lg:grid-cols-2">
            <Field label="Mensaje original" htmlFor="av-a">
              <TextInput id="av-a" value={original} onChange={(e) => set({ avalancheOriginal: e.target.value })} />
            </Field>
            <Field
              label="Mensaje modificado"
              htmlFor="av-b"
              hint={charDiff === 0 ? 'Los mensajes son idénticos.' : `${charDiff} carácter${charDiff === 1 ? '' : 'es'} de diferencia.`}
              actions={
                <>
                  <Button size="sm" variant="ghost" icon={<Shuffle size={14} />} onClick={mutateOneCharacter}>
                    Cambiar un carácter
                  </Button>
                  <Button size="sm" variant="ghost" icon={<Undo2 size={14} />} onClick={() => set({ avalancheModified: original })}>
                    Igualar
                  </Button>
                </>
              }
            >
              <TextInput id="av-b" value={modified} onChange={(e) => set({ avalancheModified: e.target.value })} />
            </Field>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader title={`Hashes ${params.name} en paralelo`} subtitle="Los dígitos hexadecimales que difieren aparecen resaltados." />
            <CardBody className="space-y-4">
              <div className="panel-inset p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-accent-data">Hash del mensaje original</span>
                  <CopyButton value={hexA} />
                </div>
                <HexDiff value={hexA} other={hexB} tone="a" />
              </div>
              <div className="panel-inset p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-accent-xor">Hash del mensaje modificado</span>
                  <CopyButton value={hexB} />
                </div>
                <HexDiff value={hexB} other={hexA} tone="b" />
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-400">
                  Los {totalBits} bits del resultado · <span className="text-accent-xor">■</span> bit distinto
                </p>
                <HashBitGrid a={result.hashA} b={result.hashB} />
              </div>
            </CardBody>
          </Card>

          <Card className="flex flex-col">
            <CardHeader title="Bits modificados" />
            <CardBody className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Gauge ratio={result.ratio} />
              <div>
                <p className="mono text-3xl font-semibold text-white">
                  {result.changed} <span className="text-lg text-slate-500">/ {totalBits}</span>
                </p>
                <p className="text-slate-400">{(result.ratio * 100).toFixed(1)} % de los bits cambiaron</p>
              </div>
              <p className="text-sm text-slate-500">En promedio, una función hash ideal cambia el 50 % de los bits ante cualquier modificación de la entrada.</p>
            </CardBody>
          </Card>
        </div>

        <Callout tone="info" title="¿Por qué es importante?">
          Si cambios pequeños en la entrada produjeran cambios pequeños en la salida, se podría deducir información sobre el mensaje a partir del hash. El
          efecto avalancha garantiza que mensajes casi idénticos tengan huellas completamente distintas. Recordá que SHA-2 es una función hash, no un
          cifrado: no hay clave y el mensaje no puede recuperarse a partir del resultado.
        </Callout>
      </div>
    </div>
  );
}

function Gauge({ ratio }: { ratio: number }) {
  const radius = 64;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, ratio));
  return (
    <svg viewBox="0 0 160 92" className="w-52" role="img" aria-label={`${Math.round(ratio * 100)} % de bits modificados`}>
      <path d="M 16 80 A 64 64 0 0 1 144 80" fill="none" stroke="#22304f" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M 16 80 A 64 64 0 0 1 144 80"
        fill="none"
        stroke="#fb7185"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <line x1="80" y1="16" x2="80" y2="26" stroke="#94a3b8" strokeWidth="2" />
      <text x="80" y="12" textAnchor="middle" fontSize="9" fill="#94a3b8">
        50 %
      </text>
    </svg>
  );
}
