import { KeyRound, LockKeyhole } from 'lucide-react';
import { CopyButton } from '@/components/common/CopyButton';
import { cn } from '@/utils/cn';
import type { RsaKey } from '../types';

function KeyValue({ name, value, className }: { name: string; value: bigint; className: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="text-sm text-slate-400">{name}</span>
        <p className={cn('mono break-all text-lg', className)}>{value.toString()}</p>
      </div>
      <CopyButton value={value.toString()} />
    </div>
  );
}

export function PublicKeyPanel({ rsaKey, compact }: { rsaKey: RsaKey; compact?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-accent-result/35 bg-accent-result/[0.06] p-4', compact && 'p-3')}>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-200">
        <KeyRound size={16} /> Clave pública (e, n) · se comparte
      </p>
      <div className="space-y-2">
        <KeyValue name="Exponente público e" value={rsaKey.e} className="text-emerald-100" />
        <KeyValue name="Módulo n" value={rsaKey.n} className="text-slate-100" />
      </div>
    </div>
  );
}

export function PrivateKeyPanel({ rsaKey, compact }: { rsaKey: RsaKey; compact?: boolean }) {
  return (
    <div className={cn('rounded-xl border border-accent-private/35 bg-accent-private/[0.06] p-4', compact && 'p-3')}>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-pink-200">
        <LockKeyhole size={16} /> Clave privada (d, n) · secreta
      </p>
      <div className="space-y-2">
        <KeyValue name="Exponente privado d" value={rsaKey.d} className="text-pink-100" />
        <KeyValue name="Módulo n" value={rsaKey.n} className="text-slate-100" />
      </div>
    </div>
  );
}
