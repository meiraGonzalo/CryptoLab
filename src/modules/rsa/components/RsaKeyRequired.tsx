import { KeyRound } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { useNavigate } from '@/stores/navigationStore';
import type { RsaKeyResult } from '../types';

export function RsaKeyRequired({ result }: { result: Extract<RsaKeyResult, { ok: false }> }) {
  const navigate = useNavigate();
  return (
    <Callout
      tone="warning"
      title="No hay un par de claves válido"
      action={
        <Button size="sm" variant="primary" icon={<KeyRound size={15} />} onClick={() => navigate('rsa-keygen')}>
          Ir a generación de claves
        </Button>
      }
    >
      {result.errors.map((e) => e.message).join(' ')}
    </Callout>
  );
}
