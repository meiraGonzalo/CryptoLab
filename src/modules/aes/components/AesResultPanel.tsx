import { ArrowRightLeft, CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { ValueBox } from '@/components/common/ValueBox';
import { bytesToBase64, bytesToHex, bytesToUtf8 } from '@/utils/bytes';
import type { AesSimulation } from '../types';
import type { AesVerification } from '../store/aesStore';

interface AesResultPanelProps {
  simulation: AesSimulation;
  verification: AesVerification;
  onDecryptOutput: () => void;
}

export function AesResultPanel({ simulation, verification, onDecryptOutput }: AesResultPanelProps) {
  const isEncrypt = simulation.config.mode === 'encrypt';
  const text = !isEncrypt && !simulation.paddingError ? bytesToUtf8(simulation.output) : null;

  return (
    <Card>
      <CardHeader
        icon={<CheckCircle2 size={17} />}
        title={isEncrypt ? 'Resultado del cifrado' : 'Resultado del descifrado'}
        subtitle={`${simulation.output.length} bytes · ${simulation.blocks.length} bloque(s) procesados en modo ECB`}
        actions={
          isEncrypt && (
            <Button size="sm" variant="subtle" icon={<ArrowRightLeft size={15} />} onClick={onDecryptOutput}>
              Descifrar este resultado
            </Button>
          )
        }
      />
      <CardBody className="space-y-3">
        <VerificationBanner verification={verification} />
        {simulation.paddingError && (
          <Callout tone="danger" title="Relleno inválido">
            {simulation.paddingError}
          </Callout>
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          <ValueBox label="Hexadecimal" value={bytesToHex(simulation.output)} tone="result" maxHeight />
          <ValueBox label="Base64" value={bytesToBase64(simulation.output)} tone="result" maxHeight />
        </div>
        {!isEncrypt && !simulation.paddingError && (
          <ValueBox
            label="Texto recuperado (UTF-8)"
            value={text ?? ''}
            tone="result"
            hint={text === null ? 'Los bytes descifrados no forman texto UTF-8 válido. Revisá la clave o la codificación original.' : undefined}
          />
        )}
      </CardBody>
    </Card>
  );
}

function VerificationBanner({ verification }: { verification: AesVerification }) {
  switch (verification.status) {
    case 'running':
      return (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> {verification.message}
        </div>
      );
    case 'verified':
      return (
        <Callout tone="success" title={<span className="flex items-center gap-2"><ShieldCheck size={16} /> Verificado con Web Crypto API</span>}>
          {verification.message}
        </Callout>
      );
    case 'fallback':
      return <Callout tone="info" title="Verificado con vectores oficiales">{verification.message}</Callout>;
    case 'mismatch':
    case 'error':
      return (
        <Callout tone="danger" title={<span className="flex items-center gap-2"><ShieldAlert size={16} /> Verificación fallida</span>}>
          {verification.message}
        </Callout>
      );
    default:
      return null;
  }
}
