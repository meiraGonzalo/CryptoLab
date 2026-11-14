import { ArrowRight, Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, TextInput } from '@/components/common/Field';
import { MathFormula } from '@/components/common/MathFormula';
import { ModeBadge } from '@/components/common/ModeBadge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ValueBox } from '@/components/common/ValueBox';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNavigate } from '@/stores/navigationStore';
import { traceModPow } from '../engine/math';
import { encodeMessage, rsaEncryptValue } from '../engine/messages';
import type { RsaMessageMode } from '../types';
import { useRsaStore } from '../store/rsaStore';
import { PublicKeyPanel } from './KeyPanels';
import { ModPowTraceView } from './ModPowTraceView';
import { RsaBlockTable } from './RsaBlockTable';
import { RsaKeyRequired } from './RsaKeyRequired';

export default function RsaEncryptPage() {
  const navigate = useNavigate();
  const { keyResult, messageMode, messageInput, setMessageMode, setMessageInput, setCiphertextInput } = useRsaStore();
  const [selected, setSelected] = useState(0);

  const encoded = useMemo(() => (keyResult.ok ? encodeMessage(messageInput, messageMode, keyResult.key.n) : null), [keyResult, messageInput, messageMode]);
  const rows = useMemo(
    () => (keyResult.ok && encoded?.ok ? encoded.blocks.map((b) => ({ label: b.label === 'M' ? '' : b.label, input: b.value, output: rsaEncryptValue(b.value, keyResult.key) })) : []),
    [keyResult, encoded],
  );
  const index = Math.min(selected, Math.max(0, rows.length - 1));
  const trace = keyResult.ok && rows[index] ? traceModPow(rows[index].input, keyResult.key.e, keyResult.key.n) : null;
  const ciphertext = rows.map((r) => r.output.toString()).join(', ');

  return (
    <div>
      <PageHeader
        eyebrow="Criptografía asimétrica · RSA"
        title="Cifrado"
        description="Cualquiera que conozca la clave pública puede cifrar un mensaje: se eleva el número M al exponente e y se toma el resto de dividir por n."
        badges={<ModeBadge mode="educational" />}
      />
      {!keyResult.ok ? (
        <RsaKeyRequired result={keyResult} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader icon={<Lock size={17} />} title="Mensaje" subtitle="1. Conversión del mensaje en valores numéricos M < n" />
              <CardBody className="space-y-4">
                <SegmentedControl<RsaMessageMode>
                  ariaLabel="Tipo de mensaje"
                  size="sm"
                  value={messageMode}
                  onChange={(m) => {
                    setMessageMode(m);
                    setMessageInput(m === 'number' ? '65' : 'Hola');
                    setSelected(0);
                  }}
                  options={[
                    { value: 'text', label: 'Texto (byte a byte)' },
                    { value: 'number', label: 'Número' },
                  ]}
                />
                <Field
                  label={messageMode === 'text' ? 'Texto a cifrar' : `Número M (0 ≤ M < ${keyResult.key.n})`}
                  htmlFor="rsa-message"
                  error={encoded && !encoded.ok ? encoded.error : null}
                  hint={messageMode === 'text' ? 'Cada byte UTF-8 se convierte en un número entre 0 y 255 y se cifra por separado.' : undefined}
                >
                  <TextInput id="rsa-message" value={messageInput} mono={messageMode === 'number'} onChange={(e) => setMessageInput(e.target.value)} invalid={Boolean(encoded && !encoded.ok)} />
                </Field>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="2. Utilización de la clave pública" subtitle="Se usa el par (e, n) del destinatario." />
              <CardBody>
                <PublicKeyPanel rsaKey={keyResult.key} />
              </CardBody>
            </Card>
          </div>

          {rows.length > 0 && trace && (
            <>
              <Card>
                <CardHeader title="3. Exponenciación modular" subtitle="Seleccioná un bloque para ver su cálculo completo." />
                <CardBody className="space-y-5">
                  <div className="panel-inset px-4 py-3 text-lg">
                    <MathFormula display tex="C = M^{e} \bmod n" />
                  </div>
                  <RsaBlockTable rows={rows} inputSymbol="M" outputSymbol="C" selected={index} onSelect={setSelected} tone="public" />
                  <div className="border-t border-white/[0.05] pt-5">
                    <ModPowTraceView trace={trace} baseSymbol="M" exponentSymbol="e" resultSymbol="C" exponentTone="public" />
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title="4. Mensaje cifrado"
                  actions={
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<ArrowRight size={15} />}
                      onClick={() => {
                        setCiphertextInput(ciphertext);
                        navigate('rsa-decrypt');
                      }}
                    >
                      Descifrar este resultado
                    </Button>
                  }
                />
                <CardBody className="space-y-3">
                  <ValueBox label={`Texto cifrado (${rows.length} valor${rows.length === 1 ? '' : 'es'})`} value={ciphertext} tone="result" />
                  {messageMode === 'text' && (
                    <Callout tone="warning" title="¿Por qué esto no es seguro?">
                      Cifrar byte a byte con RSA sin relleno es determinista: la misma letra siempre produce el mismo valor cifrado, como en un cifrado por
                      sustitución. RSA real cifra el mensaje completo con un esquema de relleno aleatorio como OAEP (ver la sección RSA).
                    </Callout>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
