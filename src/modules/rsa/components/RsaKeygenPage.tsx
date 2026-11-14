import { motion } from 'framer-motion';
import { Dices, KeyRound, Sparkles } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { ExplanationPanel } from '@/components/common/ExplanationPanel';
import { Field, Select, TextInput } from '@/components/common/Field';
import { MathFormula } from '@/components/common/MathFormula';
import { ModeBadge } from '@/components/common/ModeBadge';
import { SimulationControls } from '@/components/controls/SimulationControls';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { useKeyboardStepping } from '@/hooks/useKeyboardStepping';
import { createSimulationStore } from '@/stores/createSimulationStore';
import { cn } from '@/utils/cn';
import { buildKeygenSteps, type KeygenStep } from '../engine/keygenSteps';
import { PRIME_RANGES } from '../engine/primes';
import type { ModularInverseTrace, RsaKey, RsaKeySize } from '../types';
import { useRsaStore } from '../store/rsaStore';
import { PrivateKeyPanel, PublicKeyPanel } from './KeyPanels';
import { RelationshipDiagram } from './RelationshipDiagram';

const useKeygenPlayback = createSimulationStore<KeygenStep>();

export default function RsaKeygenPage() {
  const { pInput, qInput, eInput, keySize, keyResult, setP, setQ, setE, setKeySize, generatePrimes, suggestExponent } = useRsaStore();
  const steps = useKeygenPlayback((s) => s.steps);
  const index = useKeygenPlayback((s) => s.index);
  const goTo = useKeygenPlayback((s) => s.goTo);

  const keySteps = useMemo(() => (keyResult.ok ? buildKeygenSteps(keyResult.key) : []), [keyResult]);
  useEffect(() => {
    const current = useKeygenPlayback.getState();
    useKeygenPlayback.setState({ steps: keySteps, index: Math.min(current.index, Math.max(0, keySteps.length - 1)) });
  }, [keySteps]);

  useAutoPlay(useKeygenPlayback, 2600);
  useKeyboardStepping(useKeygenPlayback, keyResult.ok);

  const errorFor = (field: 'p' | 'q' | 'e') => (keyResult.ok ? null : (keyResult.errors.find((e) => e.field === field)?.message ?? null));
  const generalError = keyResult.ok ? null : keyResult.errors.find((e) => e.field === 'general')?.message;
  const step = keyResult.ok ? steps[index] : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Criptografía asimétrica · RSA"
        title="Generación de claves"
        description="RSA usa un par de claves relacionadas matemáticamente: una pública para cifrar y una privada para descifrar. Seguí cómo se obtienen a partir de dos números primos."
        badges={<ModeBadge mode="educational" />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            icon={<KeyRound size={17} />}
            title="Parámetros"
            subtitle="Ingresá los valores manualmente o generalos de forma aleatoria con una fuente criptográficamente segura."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Select aria-label="Tamaño de los primos" value={keySize} onChange={(e) => setKeySize(e.target.value as RsaKeySize)} className="h-9 w-auto">
                  {(Object.keys(PRIME_RANGES) as RsaKeySize[]).map((size) => (
                    <option key={size} value={size}>
                      {PRIME_RANGES[size].label}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="primary" icon={<Dices size={15} />} onClick={generatePrimes} className="h-9">
                  Generar aleatoriamente
                </Button>
              </div>
            }
          />
          <CardBody className="space-y-4">
            <p className="text-sm text-slate-500">{PRIME_RANGES[keySize].description}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Primo p" htmlFor="rsa-p" error={errorFor('p')}>
                <TextInput id="rsa-p" mono inputMode="numeric" value={pInput} onChange={(e) => setP(e.target.value)} invalid={Boolean(errorFor('p'))} />
              </Field>
              <Field label="Primo q" htmlFor="rsa-q" error={errorFor('q')}>
                <TextInput id="rsa-q" mono inputMode="numeric" value={qInput} onChange={(e) => setQ(e.target.value)} invalid={Boolean(errorFor('q'))} />
              </Field>
              <Field
                label="Exponente público e"
                htmlFor="rsa-e"
                error={errorFor('e')}
                hint="Dejalo vacío para elegirlo automáticamente."
                actions={
                  <Button size="sm" variant="ghost" icon={<Sparkles size={14} />} onClick={suggestExponent}>
                    Sugerir
                  </Button>
                }
              >
                <TextInput id="rsa-e" mono inputMode="numeric" value={eInput} onChange={(e) => setE(e.target.value)} invalid={Boolean(errorFor('e'))} />
              </Field>
            </div>
            {generalError && <Callout tone="danger">{generalError}</Callout>}
            {keyResult.ok && keyResult.warnings.map((w) => <Callout key={w} tone="warning">{w}</Callout>)}
          </CardBody>
        </Card>

        {keyResult.ok && step ? (
          <>
            <SimulationControls useStore={useKeygenPlayback} groupLabel="etapa" position={`Paso ${index + 1} de ${steps.length}: ${step.title}`} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col gap-6">
                <Card>
                  <CardHeader title={step.title} subtitle={`Paso ${index + 1} de ${steps.length}`} />
                  <CardBody className="min-h-[260px]">
                      <motion.div key={step.id + keyResult.key.n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                        <div className="panel-inset px-4 py-5 text-lg">
                          <MathFormula display tex={step.formula} />
                        </div>
                        <StepDetail step={step} rsaKey={keyResult.key} inverseTrace={keyResult.inverseTrace} />
                      </motion.div>
                  </CardBody>
                </Card>
                <StepTimeline steps={steps} index={index} goTo={goTo} rsaKey={keyResult.key} />
              </div>
              <ExplanationPanel stepKey={step.id} title={step.title} explanation={step.explanation} />
            </div>
            <Card>
              <CardHeader title="Relación entre los parámetros" subtitle="Cada valor se deriva de los anteriores. Solo e y n se hacen públicos." />
              <CardBody>
                <RelationshipDiagram rsaKey={keyResult.key} />
              </CardBody>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StepDetail({ step, rsaKey, inverseTrace }: { step: KeygenStep; rsaKey: RsaKey; inverseTrace: ModularInverseTrace }) {
  switch (step.kind) {
    case 'p':
    case 'q': {
      const value = step.kind === 'p' ? rsaKey.p : rsaKey.q;
      return (
        <div className="flex flex-wrap gap-3">
          <Badge tone="data">Primo verificado (Miller–Rabin)</Badge>
          <Badge tone="neutral">{value.toString(2).length} bits</Badge>
          <Badge tone="neutral">Binario: {value.toString(2)}</Badge>
        </div>
      );
    }
    case 'n':
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniValue label="p" value={rsaKey.p} tone="text-blue-200" />
          <MiniValue label="q" value={rsaKey.q} tone="text-blue-200" />
          <MiniValue label="n" value={rsaKey.n} tone="text-white" />
        </div>
      );
    case 'phi':
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniValue label="p − 1" value={rsaKey.p - 1n} tone="text-blue-200" />
          <MiniValue label="q − 1" value={rsaKey.q - 1n} tone="text-blue-200" />
          <MiniValue label="φ(n)" value={rsaKey.phi} tone="text-purple-200" />
        </div>
      );
    case 'e':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniValue label="e" value={rsaKey.e} tone="text-emerald-200" />
          <MiniValue label="φ(n)" value={rsaKey.phi} tone="text-purple-200" />
        </div>
      );
    case 'd':
      return <EuclidTable trace={inverseTrace} />;
    case 'public':
      return <PublicKeyPanel rsaKey={rsaKey} />;
    case 'private':
      return <PrivateKeyPanel rsaKey={rsaKey} />;
  }
}

function MiniValue({ label, value, tone }: { label: string; value: bigint; tone: string }) {
  return (
    <div className="panel-inset px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <p className={cn('mono break-all text-lg', tone)}>{value.toString()}</p>
    </div>
  );
}

function EuclidTable({ trace }: { trace: ModularInverseTrace }) {
  const keyRow = Math.max(0, trace.rows.length - 2);
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">Algoritmo de Euclides extendido: se divide sucesivamente y se actualiza el coeficiente t.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Dividendo</th>
              <th className="py-2 pr-3 font-medium">Divisor</th>
              <th className="py-2 pr-3 font-medium">Cociente q</th>
              <th className="py-2 pr-3 font-medium">Resto</th>
              <th className="py-2 font-medium">t nuevo = t₀ − q·t₁</th>
            </tr>
          </thead>
          <tbody>
            {trace.rows.map((row, i) => (
              <tr key={i} className={cn('border-b border-white/[0.03]', row.remainder === trace.gcd && i === keyRow && 'bg-accent-private/10')}>
                <td className="mono py-1.5 pr-3 text-slate-300">{row.dividend.toString()}</td>
                <td className="mono py-1.5 pr-3 text-slate-300">{row.divisor.toString()}</td>
                <td className="mono py-1.5 pr-3 text-amber-200">{row.quotient.toString()}</td>
                <td className="mono py-1.5 pr-3 text-slate-300">{row.remainder.toString()}</td>
                <td className="mono py-1.5 text-slate-200">{row.nextCoefficient.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-400">
        El último resto no nulo es mcd = {trace.gcd.toString()} (fila resaltada). Su coeficiente t ={' '}
        <span className="mono text-slate-200">{trace.rows[keyRow]?.nextCoefficient.toString()}</span>, reducido módulo φ(n), da d ={' '}
        <span className="mono text-pink-200">{trace.inverse?.toString()}</span>.
      </p>
    </div>
  );
}

function StepTimeline({ steps, index, goTo, rsaKey }: { steps: KeygenStep[]; index: number; goTo: (i: number) => void; rsaKey: RsaKey }) {
  const values: Record<KeygenStep['kind'], string> = {
    p: rsaKey.p.toString(),
    q: rsaKey.q.toString(),
    n: rsaKey.n.toString(),
    phi: rsaKey.phi.toString(),
    e: rsaKey.e.toString(),
    d: rsaKey.d.toString(),
    public: `(${rsaKey.e}, ${rsaKey.n})`,
    private: `(${rsaKey.d}, ${rsaKey.n})`,
  };
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-semibold text-slate-200">Recorrido completo</p>
      <ol className="grid gap-2 sm:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                i === index ? 'border-accent-brand/50 bg-accent-brand/10' : i < index ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]' : 'border-white/[0.04] opacity-60 hover:opacity-100',
              )}
            >
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', i <= index ? 'bg-accent-brand text-ink-950' : 'bg-ink-600 text-slate-400')}>
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-slate-200">{s.title}</span>
                <span className="mono block truncate text-sm text-slate-500">{i <= index ? values[s.kind] : '···'}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </Card>
  );
}
