import { LockOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Callout } from '@/components/common/Callout';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextArea } from '@/components/common/Field';
import { MathFormula } from '@/components/common/MathFormula';
import { ModeBadge } from '@/components/common/ModeBadge';
import { ValueBox } from '@/components/common/ValueBox';
import { PageHeader } from '@/components/layout/PageHeader';
import { traceModPow } from '../engine/math';
import { decodeBytes, parseCiphertext, rsaDecryptValue } from '../engine/messages';
import { useRsaStore } from '../store/rsaStore';
import { PrivateKeyPanel } from './KeyPanels';
import { ModPowTraceView } from './ModPowTraceView';
import { RsaBlockTable } from './RsaBlockTable';
import { RsaKeyRequired } from './RsaKeyRequired';

export default function RsaDecryptPage() {
  const { keyResult, ciphertextInput, setCiphertextInput } = useRsaStore();
  const [selected, setSelected] = useState(0);

  const parsed = useMemo(() => (keyResult.ok && ciphertextInput.trim() ? parseCiphertext(ciphertextInput, keyResult.key.n) : null), [keyResult, ciphertextInput]);
  const rows = useMemo(() => {
    if (!keyResult.ok || !parsed?.ok) return [];
    return parsed.values.map((c) => {
      const m = rsaDecryptValue(c, keyResult.key);
      const char = m < 128n ? String.fromCharCode(Number(m)) : '';
      return { label: char && m >= 32n ? char : '', input: c, output: m };
    });
  }, [keyResult, parsed]);
  const index = Math.min(selected, Math.max(0, rows.length - 1));
  const trace = keyResult.ok && rows[index] ? traceModPow(rows[index].input, keyResult.key.d, keyResult.key.n) : null;
  const recovered = rows.length ? decodeBytes(rows.map((r) => r.output)) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Criptografía asimétrica · RSA"
        title="Descifrado"
        description="Solo quien tiene la clave privada puede descifrar: se eleva C al exponente secreto d módulo n y se recupera exactamente M."
        badges={<ModeBadge mode="educational" />}
      />
      {!keyResult.ok ? (
        <RsaKeyRequired result={keyResult} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader icon={<LockOpen size={17} />} title="1. Incorporación del mensaje cifrado" subtitle="Valores numéricos separados por comas o espacios." />
              <CardBody>
                <Field label="Texto cifrado" htmlFor="rsa-cipher" error={parsed && !parsed.ok ? parsed.error : null} hint="Podés generarlo en la sección Cifrado con el botón «Descifrar este resultado».">
                  <TextArea id="rsa-cipher" mono value={ciphertextInput} onChange={(e) => setCiphertextInput(e.target.value)} invalid={Boolean(parsed && !parsed.ok)} placeholder="Por ejemplo: 2790" />
                </Field>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="2. Utilización de la clave privada" subtitle="El exponente d nunca se comparte." />
              <CardBody>
                <PrivateKeyPanel rsaKey={keyResult.key} />
              </CardBody>
            </Card>
          </div>

          {!ciphertextInput.trim() && <Callout tone="info">Ingresá uno o más valores cifrados para ver el descifrado paso a paso.</Callout>}

          {rows.length > 0 && trace && (
            <>
              <Card>
                <CardHeader title="3. Exponenciación modular con d" subtitle="Seleccioná un valor para ver su cálculo." />
                <CardBody className="space-y-5">
                  <div className="panel-inset px-4 py-3 text-lg">
                    <MathFormula display tex="M = C^{d} \bmod n" />
                  </div>
                  <RsaBlockTable rows={rows} inputSymbol="C" outputSymbol="M" selected={index} onSelect={setSelected} tone="private" />
                  <div className="border-t border-white/[0.05] pt-5">
                    <ModPowTraceView trace={trace} baseSymbol="C" exponentSymbol="d" resultSymbol="M" exponentTone="private" />
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="4. Recuperación del mensaje original" />
                <CardBody className="grid gap-3 lg:grid-cols-2">
                  <ValueBox label="Valores recuperados M" value={rows.map((r) => r.output.toString()).join(', ')} tone="private" />
                  <ValueBox
                    label="Interpretados como bytes UTF-8"
                    value={recovered ?? ''}
                    tone="result"
                    hint={recovered === null ? 'Los valores no forman texto UTF-8 válido (algún valor supera 255 o la secuencia no es UTF-8).' : undefined}
                  />
                </CardBody>
              </Card>
              <Callout tone="info" title="¿Por qué funciona?">
                Como e · d ≡ 1 (mod φ(n)), por el teorema de Euler se cumple (Mᵉ)ᵈ = M^(e·d) ≡ M (mod n). Descifrar deshace exactamente el cifrado.
              </Callout>
            </>
          )}
        </div>
      )}
    </div>
  );
}
