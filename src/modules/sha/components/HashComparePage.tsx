import { CheckCircle2, Fingerprint, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { Field, TextArea, TextInput } from '@/components/common/Field';
import { ModeBadge } from '@/components/common/ModeBadge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ValueBox } from '@/components/common/ValueBox';
import { PageHeader } from '@/components/layout/PageHeader';
import { isWebCryptoAvailable, webCryptoDigest } from '@/services/crypto/webCrypto';
import { bytesToHex, countBitDifferences, normalizeHex, utf8ToBytes } from '@/utils/bytes';
import { SHA_PARAMETERS } from '../engine/constants';
import { sha } from '../engine/sha2';
import type { ShaVariant } from '../types';
import { useHashToolsStore } from '../store/shaStore';
import { HexDiff } from './HashBitGrid';

export default function HashComparePage() {
  const { compareA, compareB, compareVariant: variant, expectedHash, set } = useHashToolsStore();
  const params = SHA_PARAMETERS[variant];
  const [webHashes, setWebHashes] = useState<{ a: string; b: string } | null>(null);

  const hashA = useMemo(() => sha(utf8ToBytes(compareA), variant), [compareA, variant]);
  const hashB = useMemo(() => sha(utf8ToBytes(compareB), variant), [compareB, variant]);
  const hexA = bytesToHex(hashA);
  const hexB = bytesToHex(hashB);
  const equal = hexA === hexB;
  const bitDiff = countBitDifferences(hashA, hashB);

  useEffect(() => {
    if (!isWebCryptoAvailable()) return;
    let cancelled = false;
    Promise.all([webCryptoDigest(params.webCryptoName, utf8ToBytes(compareA)), webCryptoDigest(params.webCryptoName, utf8ToBytes(compareB))]).then(([a, b]) => {
      if (!cancelled) setWebHashes({ a: bytesToHex(a), b: bytesToHex(b) });
    });
    return () => {
      cancelled = true;
    };
  }, [compareA, compareB, params.webCryptoName]);

  const expected = normalizeHex(expectedHash);
  const expectedValid = /^[0-9a-f]*$/.test(expected);
  const webVerified = webHashes !== null && webHashes.a === hexA && webHashes.b === hexB;

  return (
    <div>
      <PageHeader
        eyebrow="Funciones hash"
        title="Comparación de hashes"
        description="Dos entradas producen el mismo hash solo si son exactamente iguales. Así se verifica la integridad de archivos, mensajes y descargas."
        badges={<ModeBadge mode="educational" />}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader
            icon={<Fingerprint size={17} />}
            title="Entradas"
            actions={
              <SegmentedControl
                size="sm"
                ariaLabel="Algoritmo"
                value={variant}
                onChange={(v: ShaVariant) => set({ compareVariant: v })}
                options={[
                  { value: 'sha256', label: 'SHA-256' },
                  { value: 'sha512', label: 'SHA-512' },
                ]}
              />
            }
          />
          <CardBody className="grid gap-5 lg:grid-cols-2">
            <Field label="Entrada A" htmlFor="cmp-a">
              <TextArea id="cmp-a" value={compareA} onChange={(e) => set({ compareA: e.target.value })} />
            </Field>
            <Field label="Entrada B" htmlFor="cmp-b">
              <TextArea id="cmp-b" value={compareB} onChange={(e) => set({ compareB: e.target.value })} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Resultado"
            actions={
              equal ? (
                <Badge tone="result" icon={<CheckCircle2 size={13} />}>
                  Hashes idénticos
                </Badge>
              ) : (
                <Badge tone="xor" icon={<XCircle size={13} />}>
                  Hashes distintos · {bitDiff} de {params.digestBytes * 8} bits
                </Badge>
              )
            }
          />
          <CardBody className="space-y-3">
            <div className="panel-inset p-3.5">
              <p className="mb-1 text-sm font-medium text-accent-data">{params.name}(A)</p>
              <HexDiff value={hexA} other={hexB} tone="a" />
            </div>
            <div className="panel-inset p-3.5">
              <p className="mb-1 text-sm font-medium text-accent-xor">{params.name}(B)</p>
              <HexDiff value={hexB} other={hexA} tone="b" />
            </div>
            {webVerified && <p className="text-sm text-emerald-300">✓ Ambos valores coinciden con los calculados por Web Crypto API.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Verificar contra un hash esperado" subtitle="Pegá un hash publicado (por ejemplo, el de una descarga) y comprobá si coincide con la entrada A." />
          <CardBody className="space-y-3">
            <Field label="Hash esperado (hexadecimal)" htmlFor="cmp-expected" error={!expectedValid ? 'El hash debe contener solo dígitos hexadecimales.' : null}>
              <TextInput id="cmp-expected" mono value={expectedHash} onChange={(e) => set({ expectedHash: e.target.value })} placeholder={hexA} invalid={!expectedValid} />
            </Field>
            {expected && expectedValid && (
              expected === hexA ? (
                <Callout tone="success" title="Coincide">El hash de la entrada A es exactamente el valor esperado.</Callout>
              ) : expected.length !== hexA.length ? (
                <Callout tone="warning" title="Longitud distinta">
                  Un hash {params.name} tiene {hexA.length} dígitos hexadecimales; el valor ingresado tiene {expected.length}.
                </Callout>
              ) : (
                <Callout tone="danger" title="No coincide">La entrada A no produce el hash esperado: el contenido es distinto.</Callout>
              )
            )}
            <ValueBox label={`${params.name}(A)`} value={hexA} tone="data" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
