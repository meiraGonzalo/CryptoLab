import { FileCheck2, Lock, LockOpen, Play, RefreshCw, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { CopyButton } from '@/components/common/CopyButton';
import { Field, FieldError, Select, TextArea, TextInput } from '@/components/common/Field';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useNavigate } from '@/stores/navigationStore';
import { INPUT_ENCODING_LABELS, bytesToBinary, hexToBytes, parseInput, validateHex, type InputEncoding } from '@/utils/bytes';
import { AES_PARAMETERS, type AesVariant } from '../types';
import { useAesStore, validateAesForm } from '../store/aesStore';

export function AesConfigPanel({ variant, isStale, hasSimulation }: { variant: AesVariant; isStale: boolean; hasSimulation: boolean }) {
  const navigate = useNavigate();
  const state = useAesStore();
  const [startError, setStartError] = useState<string | null>(null);
  const [showBinary, setShowBinary] = useState(false);
  const validation = validateAesForm(state, variant);
  const { keyBytes, nr } = AES_PARAMETERS[variant];
  const keyHex = state.keys[variant];
  const keyClean = keyHex.replace(/\s/g, '');

  const parsedInput = state.mode === 'encrypt' ? parseInput(state.plaintext, state.plaintextEncoding) : null;
  const inputByteCount = state.mode === 'encrypt' ? (parsedInput?.ok ? parsedInput.bytes.length : null) : validateHex(state.ciphertextHex) ? null : hexToBytes(state.ciphertextHex).length;

  const handleStart = () => setStartError(state.start(variant));

  return (
    <Card>
      <CardHeader
        icon={<Settings2 size={17} />}
        title="Configuración"
        subtitle={`Bloques de 128 bits · clave de ${keyBytes * 8} bits · ${nr} rondas`}
        actions={
          <Button size="sm" variant="subtle" icon={<FileCheck2 size={15} />} onClick={() => state.loadFipsVector(variant)}>
            Cargar vector FIPS-197
          </Button>
        }
      />
      <CardBody className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <Field label="Operación">
              <SegmentedControl
                ariaLabel="Operación"
                value={state.mode}
                onChange={state.setMode}
                options={[
                  { value: 'encrypt', label: 'Cifrar', icon: <Lock size={15} /> },
                  { value: 'decrypt', label: 'Descifrar', icon: <LockOpen size={15} /> },
                ]}
              />
            </Field>
            <Field label="Variante">
              <SegmentedControl
                ariaLabel="Variante de AES"
                value={variant}
                onChange={(v) => navigate(`aes-${v}`)}
                options={[128, 192, 256].map((v) => ({ value: v as AesVariant, label: `AES-${v}` }))}
              />
            </Field>
          </div>

          {state.mode === 'encrypt' ? (
            <Field
              label="Mensaje original"
              htmlFor="aes-plaintext"
              error={validation.input}
              hint={inputByteCount !== null ? `${inputByteCount} bytes → ${Math.ceil((inputByteCount + (state.padding === 'pkcs7' ? 1 : 0)) / 16)} bloque(s)` : undefined}
              actions={
                <Select
                  aria-label="Codificación de entrada"
                  value={state.plaintextEncoding}
                  onChange={(e) => state.setPlaintextEncoding(e.target.value as InputEncoding)}
                  className="h-8 w-auto py-0 text-sm"
                >
                  {(Object.keys(INPUT_ENCODING_LABELS) as InputEncoding[]).map((enc) => (
                    <option key={enc} value={enc}>
                      {INPUT_ENCODING_LABELS[enc]}
                    </option>
                  ))}
                </Select>
              }
            >
              <TextArea
                id="aes-plaintext"
                value={state.plaintext}
                onChange={(e) => state.setPlaintext(e.target.value)}
                invalid={Boolean(validation.input)}
                mono={state.plaintextEncoding !== 'utf8'}
                placeholder="Escribí el mensaje a cifrar"
              />
            </Field>
          ) : (
            <Field
              label="Texto cifrado (hexadecimal)"
              htmlFor="aes-ciphertext"
              error={validation.input}
              hint={inputByteCount !== null ? `${inputByteCount} bytes → ${inputByteCount / 16} bloque(s)` : undefined}
            >
              <TextArea
                id="aes-ciphertext"
                value={state.ciphertextHex}
                onChange={(e) => state.setCiphertextHex(e.target.value)}
                invalid={Boolean(validation.input)}
                mono
                placeholder="Pegá el texto cifrado en hexadecimal (múltiplo de 16 bytes)"
              />
            </Field>
          )}

          <Field label="Relleno (padding)" hint={state.padding === 'pkcs7' ? 'PKCS#7 completa el último bloque automáticamente.' : 'Sin relleno: la entrada debe ser múltiplo de 16 bytes.'}>
            <SegmentedControl
              ariaLabel="Relleno"
              size="sm"
              value={state.padding}
              onChange={state.setPadding}
              options={[
                { value: 'pkcs7', label: 'PKCS#7' },
                { value: 'none', label: 'Sin relleno' },
              ]}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-5">
          <Field
            label={`Clave de ${keyBytes * 8} bits (${keyBytes * 2} dígitos hexadecimales)`}
            htmlFor="aes-key"
            error={validation.key}
            actions={
              <>
                <CopyButton value={keyClean} />
                <Button size="sm" variant="ghost" icon={<RefreshCw size={14} />} onClick={() => state.randomizeKey(variant)}>
                  Generar
                </Button>
              </>
            }
          >
            <TextInput
              id="aes-key"
              mono
              value={keyHex}
              onChange={(e) => state.setKey(variant, e.target.value)}
              invalid={Boolean(validation.key)}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>

          <div className="panel-inset p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Representación de la clave</span>
              <SegmentedControl
                size="sm"
                ariaLabel="Formato de la clave"
                value={showBinary ? 'bin' : 'hex'}
                onChange={(v) => setShowBinary(v === 'bin')}
                options={[
                  { value: 'hex', label: 'Hex' },
                  { value: 'bin', label: 'Binario' },
                ]}
              />
            </div>
            {validation.key ? (
              <p className="text-sm text-slate-500">Ingresá una clave válida para ver su representación.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(hexToBytes(keyHex)).map((b, i) => (
                  <span
                    key={i}
                    className="mono rounded border border-accent-key/30 bg-accent-key/10 px-1.5 py-0.5 text-sm text-amber-100"
                    title={`Byte ${i}`}
                  >
                    {showBinary ? bytesToBinary([b]) : b.toString(16).padStart(2, '0')}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3">
            {startError && <FieldError message={startError} />}
            <Button
              variant="primary"
              size="lg"
              icon={<Play size={18} />}
              onClick={handleStart}
              disabled={Boolean(validation.input || validation.key)}
              className="w-full justify-center"
            >
              {hasSimulation && !isStale ? 'Reiniciar simulación' : isStale ? 'Aplicar cambios e iniciar' : 'Iniciar simulación'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
