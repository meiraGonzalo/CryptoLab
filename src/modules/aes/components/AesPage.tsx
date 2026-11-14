import { Grid3x3, KeyRound, Play } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { Card } from '@/components/common/Card';
import { ExplanationPanel } from '@/components/common/ExplanationPanel';
import { ModeBadge } from '@/components/common/ModeBadge';
import { Tabs } from '@/components/common/Tabs';
import { SimulationControls } from '@/components/controls/SimulationControls';
import { PageHeader } from '@/components/layout/PageHeader';
import type { RouteId } from '@/components/navigation/routes';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { useKeyboardStepping } from '@/hooks/useKeyboardStepping';
import { AES_PARAMETERS, type AesVariant } from '../types';
import { useAesPlayback, useAesStore } from '../store/aesStore';
import { AesConfigPanel } from './AesConfigPanel';
import { AesResultPanel } from './AesResultPanel';
import { AesStepView, describeStepPosition } from './AesStepView';
import { KeyExpansionView } from './KeyExpansionView';
import { RoundProgress } from './RoundProgress';

type AesTab = 'simulation' | 'keyExpansion';

export default function AesPage({ route }: { route: RouteId }) {
  const variant = Number(route.split('-')[1]) as AesVariant;
  const [tab, setTab] = useState<AesTab>('simulation');
  const { nr, keyBytes } = AES_PARAMETERS[variant];

  const simulation = useAesStore((s) => s.simulation);
  const simulationVersion = useAesStore((s) => s.simulationVersion);
  const configVersion = useAesStore((s) => s.configVersion);
  const verification = useAesStore((s) => s.verification);
  const keyHex = useAesStore((s) => s.keys[variant]);
  const start = useAesStore((s) => s.start);
  const loadOutputForDecryption = useAesStore((s) => s.loadOutputForDecryption);

  const steps = useAesPlayback((s) => s.steps);
  const index = useAesPlayback((s) => s.index);
  const speed = useAesPlayback((s) => s.speed);
  const goTo = useAesPlayback((s) => s.goTo);

  const activeSimulation = simulation && simulation.config.variant === variant ? simulation : null;
  const isStale = Boolean(activeSimulation) && simulationVersion !== configVersion;
  const step = activeSimulation ? steps[index] : undefined;

  useAutoPlay(useAesPlayback);
  useKeyboardStepping(useAesPlayback, Boolean(step) && tab === 'simulation');

  return (
    <div>
      <PageHeader
        eyebrow="Criptografía simétrica"
        title={`AES-${variant}`}
        description="Advanced Encryption Standard: un cifrado por bloques en el que la misma clave cifra y descifra. Seguí cada transformación sobre la matriz de estado."
        badges={
          <>
            <ModeBadge mode="educational" />
            <Badge tone="data">Bloque de 128 bits</Badge>
            <Badge tone="key">Clave de {keyBytes * 8} bits</Badge>
            <Badge tone="neutral">{nr} rondas</Badge>
          </>
        }
      />

      <Tabs<AesTab>
        className="mb-6"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'simulation', label: 'Simulación', icon: <Grid3x3 size={16} /> },
          { id: 'keyExpansion', label: 'Expansión de clave', icon: <KeyRound size={16} /> },
        ]}
      />

      {tab === 'keyExpansion' ? (
        <KeyExpansionView variant={variant} keyHex={keyHex} />
      ) : (
        <div className="space-y-6">
          <AesConfigPanel variant={variant} isStale={isStale} hasSimulation={Boolean(activeSimulation)} />

          {isStale && (
            <Callout
              tone="warning"
              title="La configuración cambió"
              action={
                <Button size="sm" variant="primary" onClick={() => start(variant)}>
                  Aplicar
                </Button>
              }
            >
              La simulación que se muestra corresponde a la configuración anterior. Aplicá los cambios para recalcularla.
            </Callout>
          )}

          {activeSimulation && step ? (
            <>
              <SimulationControls useStore={useAesPlayback} groupLabel="ronda" position={describeStepPosition({ step, simulation: activeSimulation })} />
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <AesStepView step={step} simulation={activeSimulation} speed={speed} />
                <div className="flex flex-col gap-6">
                  <ExplanationPanel stepKey={step.id} title={step.title} explanation={step.explanation} />
                  <RoundProgress simulation={activeSimulation} steps={steps} index={index} goTo={goTo} />
                </div>
              </div>
              <AesResultPanel simulation={activeSimulation} verification={verification} onDecryptOutput={loadOutputForDecryption} />
              <Callout tone="warning" title="Uso exclusivamente educativo">
                Esta implementación procesa cada bloque por separado (modo ECB) para que puedas observarlo, y no protege contra ataques de canal lateral.
                Para proteger información real se usa AES-GCM desde bibliotecas auditadas o desde Web Crypto API.
              </Callout>
            </>
          ) : (
            <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-brand/10 text-accent-brand">
                <Play size={22} />
              </span>
              <p className="text-lg font-semibold text-white">Configurá los parámetros e iniciá la simulación</p>
              <p className="max-w-xl text-slate-400">
                Vas a poder avanzar operación por operación, saltar entre rondas y examinar cada byte de la matriz de estado.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
