import { KeyRound, Loader2, Lock, LockOpen, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Field, Select, TextInput } from '@/components/common/Field';
import { ModeBadge } from '@/components/common/ModeBadge';
import { ValueBox } from '@/components/common/ValueBox';
import {
  generateRsaOaepKeyPair,
  isWebCryptoAvailable,
  rsaOaepDecrypt,
  rsaOaepEncrypt,
  rsaOaepMaxMessageBytes,
  type RsaOaepKeyPair,
} from '@/services/crypto/webCrypto';
import { bytesToBase64, bytesToHex, bytesToUtf8, utf8ToBytes } from '@/utils/bytes';

type ModulusBits = 2048 | 3072 | 4096;

/**
 * Laboratorio de RSA-OAEP real con Web Crypto API. La clave privada se genera
 * como no extraíble y solo vive en memoria mientras esta sección está abierta.
 */
export function RealRsaLab() {
  const [bits, setBits] = useState<ModulusBits>(2048);
  const [pair, setPair] = useState<RsaOaepKeyPair | null>(null);
  const [busy, setBusy] = useState<'keys' | 'encrypt' | 'decrypt' | null>(null);
  const [message, setMessage] = useState('Mensaje confidencial');
  const [ciphertexts, setCiphertexts] = useState<Uint8Array[]>([]);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = isWebCryptoAvailable();
  const messageBytes = utf8ToBytes(message).length;
  const maxBytes = pair ? rsaOaepMaxMessageBytes(pair.modulusBits) : rsaOaepMaxMessageBytes(bits);
  const tooLong = messageBytes > maxBytes;

  const run = async (kind: 'keys' | 'encrypt' | 'decrypt', task: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error && e.message ? `La operación falló: ${e.message}` : 'La operación falló.');
    } finally {
      setBusy(null);
    }
  };

  const generate = () =>
    run('keys', async () => {
      setPair(await generateRsaOaepKeyPair(bits));
      setCiphertexts([]);
      setDecrypted(null);
    });

  const encrypt = () =>
    run('encrypt', async () => {
      if (!pair) return;
      const c = await rsaOaepEncrypt(pair.keyPair.publicKey, utf8ToBytes(message));
      setCiphertexts((prev) => [c, ...prev].slice(0, 2));
      setDecrypted(null);
    });

  const decrypt = () =>
    run('decrypt', async () => {
      if (!pair || !ciphertexts[0]) return;
      const plain = await rsaOaepDecrypt(pair.keyPair.privateKey, ciphertexts[0]);
      setDecrypted(bytesToUtf8(plain) ?? '(bytes no válidos como UTF-8)');
    });

  if (!available) {
    return <Callout tone="warning">Web Crypto API no está disponible. Abrí la aplicación desde localhost o mediante HTTPS.</Callout>;
  }

  return (
    <Card>
      <CardHeader
        icon={<ShieldCheck size={17} />}
        title="Modo criptográfico real: RSA-OAEP"
        subtitle="Claves de 2048 bits o más, relleno OAEP con SHA-256 y aleatoriedad en cada cifrado."
        actions={<ModeBadge mode="real" />}
      />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Tamaño del módulo">
            <Select value={bits} onChange={(e) => setBits(Number(e.target.value) as ModulusBits)} className="w-auto" aria-label="Tamaño del módulo">
              <option value={2048}>2048 bits</option>
              <option value={3072}>3072 bits</option>
              <option value={4096}>4096 bits</option>
            </Select>
          </Field>
          <Button variant="primary" icon={busy === 'keys' ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} onClick={generate} disabled={busy !== null}>
            {pair ? 'Generar un nuevo par' : 'Generar par de claves'}
          </Button>
        </div>

        {pair && (
          <>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <ValueBox label={`Módulo n (${pair.modulusBits} bits, hexadecimal)`} value={pair.modulusHex} tone="result" maxHeight />
              <div className="flex flex-col gap-3">
                <ValueBox label="Exponente público e" value={pair.publicExponent.toString()} tone="result" />
                <div className="panel-inset px-3.5 py-2.5 text-sm text-slate-400">
                  <span className="font-medium text-pink-200">Clave privada:</span> no extraíble. Permanece dentro del motor criptográfico del navegador y se descarta al salir.
                </div>
              </div>
            </div>

            <Field
              label="Mensaje"
              htmlFor="oaep-msg"
              error={tooLong ? `RSA-OAEP con SHA-256 y ${pair.modulusBits} bits admite hasta ${maxBytes} bytes; el mensaje tiene ${messageBytes}.` : null}
              hint={`${messageBytes} de ${maxBytes} bytes. Para datos más largos se cifra con AES y se protege la clave AES con RSA (cifrado híbrido).`}
            >
              <TextInput id="oaep-msg" value={message} onChange={(e) => setMessage(e.target.value)} invalid={tooLong} />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button icon={busy === 'encrypt' ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} onClick={encrypt} disabled={busy !== null || tooLong}>
                Cifrar con la clave pública
              </Button>
              <Button icon={busy === 'decrypt' ? <Loader2 size={16} className="animate-spin" /> : <LockOpen size={16} />} onClick={decrypt} disabled={busy !== null || ciphertexts.length === 0}>
                Descifrar el último cifrado
              </Button>
            </div>

            {ciphertexts.map((c, i) => (
              <ValueBox key={bytesToHex(c)} label={i === 0 ? `Texto cifrado más reciente (${c.length} bytes, Base64)` : 'Cifrado anterior'} value={bytesToBase64(c)} tone={i === 0 ? 'brand' : 'muted'} maxHeight />
            ))}
            {ciphertexts.length === 2 && (
              <Callout tone="info" title="Cifrar dos veces produce resultados distintos">
                OAEP incorpora bytes aleatorios en cada cifrado. Por eso el mismo mensaje genera textos cifrados diferentes y un atacante no puede comparar
                cifrados para deducir el contenido, a diferencia del RSA matemático sin relleno.
              </Callout>
            )}
            {decrypted !== null && <ValueBox label="Mensaje descifrado con la clave privada" value={decrypted} tone="result" />}
          </>
        )}
        {error && <Callout tone="danger">{error}</Callout>}
      </CardBody>
    </Card>
  );
}
