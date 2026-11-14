import type { ReactNode } from 'react';
import { Badge } from '@/components/common/Badge';
import { PageHeader } from '@/components/layout/PageHeader';

export function ToolLayout({ title, description, children, secure }: { title: string; description: string; children: ReactNode; secure?: boolean }) {
  return (
    <div>
      <PageHeader
        eyebrow="Herramientas complementarias"
        title={title}
        description={description}
        badges={secure ? <Badge tone="result">Fuente aleatoria criptográficamente segura</Badge> : undefined}
      />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
