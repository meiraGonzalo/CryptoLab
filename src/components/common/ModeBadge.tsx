import { FlaskConical, ShieldCheck } from 'lucide-react';
import { Badge } from './Badge';

/** Distingue visualmente las implementaciones educativas de las operaciones reales. */
export function ModeBadge({ mode }: { mode: 'educational' | 'real' }) {
  return mode === 'educational' ? (
    <Badge tone="sub" icon={<FlaskConical size={13} />}>
      Implementación educativa
    </Badge>
  ) : (
    <Badge tone="result" icon={<ShieldCheck size={13} />}>
      Web Crypto API
    </Badge>
  );
}
