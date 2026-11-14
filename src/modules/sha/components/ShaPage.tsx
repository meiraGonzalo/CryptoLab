import { motion } from 'framer-motion';
import { Hash, Loader2, Play, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Callout } from '@/components/common/Callout';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { ExplanationPanel } from '@/components/common/ExplanationPanel';
import { Field, FieldError, Select, TextArea } from '@/components/common/Field';
import { ModeBadge } from '@/components/common/ModeBadge';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ValueBox } from '@/components/common/ValueBox';
import { SimulationControls } from '@/components/controls/SimulationControls';
import { PageHeader } from '@/components/layout/PageHeader';
import type { RouteId } from '@/components/navigation/routes';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { useKeyboardStepping } from '@/hooks/useKeyboardStepping';
import { useNavigate } from '@/stores/navigationStore';
import { INPUT_ENCODING_LABELS, bytesToHex, type InputEncoding } from '@/utils/bytes';
import { SHA_PARAMETERS } from '../engine/constants';
import { sha } from '../engine/sha2';
import type { ShaStep, ShaStepKind, ShaTrace, ShaVariant } from '../types';
import { useShaPlayback, useShaStore, validateShaInput, type ShaVerification } from '../store/shaStore';
import { ShaProgress } from './ShaProgress';
import { DigestView, FinalView, InitView } from './views/HashStateViews';
import { BlocksView, BytesView, LengthView, PaddingView, type ShaViewProps } from './views/PreparationViews';
import { RoundView } from './views/RoundView';
import { ScheduleView } from './views/ScheduleView';

const VIEWS: Record<ShaStepKind, (props: ShaViewProps) => JSX.Element> = {
  bytes: BytesView,
  padding: PaddingView,
  length: LengthView,
  blocks: BlocksView,
  schedule: ScheduleView,
  init: InitView,
  round: RoundView,
  final: FinalView,
  digest: DigestView,
};

function describePosition(step: ShaStep, trace: ShaTrace): string {
  if (step.blockIndex < 0) return step.kind === 'digest' ? 'Resultado final' : 'Preparación del mensaje';
  const block = `Bloque ${step.blockIndex + 1} de ${trace.blocks.length}`;
  return step.kind === 'round' ? `${block} · Ronda ${step.round} de ${trace.params.rounds - 1}` : `${block} · ${step.title}`;
}

export default function ShaPage({ route }: { route: RouteId }) {
  const variant: ShaVariant = route === 'sha-512' ? 'sha512' : 'sha256';
  const params = SHA_PARAMETERS[variant];
  const navigate = useNavigate();

  const text = useShaStore((s) => s.text);
  const encoding = useShaStore((s) => s.encoding);
  const setText = useShaStore((s) => s.setText);
  const setEncoding = useShaStore((s) => s.setEncoding);
  const start = useShaStore((s) => s.start);
  const trace = useShaStore((s) => s.trace);
  const traceVersion = useShaStore((s) => s.traceVersion);
  const configVersion = useShaStore((s) => s.configVersion);
  const verification = useShaStore((s) => s.verification);
  const steps = useShaPlayback((s) => s.steps);
  const index = useShaPlayback((s) => s.index);
  const speed = useShaPlayback((s) => s.speed);
  const goTo = useShaPlayback((s) => s.goTo);
  const [startError, setStartError] = useState<string | null>(null);

  const { bytes, error } = validateShaInput(text, encoding);
  const livePreview = bytes ? bytesToHex(sha(bytes, variant)) : '';
  const activeTrace = trace && trace.params.variant === variant ? trace : null;
  const isStale = Boolean(activeTrace) && traceVersion !== configVersion;
  const step = activeTrace ? steps[index] : undefined;

  useAutoPlay(useShaPlayback, 1600);
  useKeyboardStepping(useShaPlayback, Boolean(step));

  const blocksNeeded = bytes ? Math.ceil((bytes.length + 1 + params.lengthBytes) / params.blockBytes) : 0;
  const View = step ? VIEWS[step.kind] : null;

  return (
    <div>
      <PageHeader
        eyebrow="Funciones hash"
        title={params.name}
        description={`Una función hash transforma cualquier mensaje en una huella de ${params.digestBytes * 8} bits. Es determinista, imposible de invertir en la práctica y extremadamente sensible a cualquier cambio.`}
        badges={
          <>
            <ModeBadge mode="educational" />
            <Badge tone="data">Bloques de {params.blockBytes * 8} bits</Badge>
            <Badge tone="sub">Palabras de {params.wordBits} bits</Badge>
            <Badge tone="neutral">{params.rounds} rondas</Badge>
            <Badge tone="result">Salida de {params.digestBytes * 8} bits</Badge>
          </>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader icon={<Hash size={17} />} title="Mensaje de entrada" subtitle="Modificá el mensaje y observá cómo cambia el hash en tiempo real." />
          <CardBody className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4">
                <Field label="Algoritmo">
                  <SegmentedControl
                    ariaLabel="Algoritmo"
                    value={variant}
                    onChange={(v) => navigate(v === 'sha512' ? 'sha-512' : 'sha-256')}
                    options={[
                      { value: 'sha256', label: 'SHA-256' },
                      { value: 'sha512', label: 'SHA-512' },
                    ]}
                  />
                </Field>
                <Field label="Codificación">
                  <Select value={encoding} onChange={(e) => setEncoding(e.target.value as InputEncoding)} aria-label="Codificación de entrada" className="w-auto">
                    {(Object.keys(INPUT_ENCODING_LABELS) as InputEncoding[]).map((enc) => (
                      <option key={enc} value={enc}>
                        {INPUT_ENCODING_LABELS[enc]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field
                label="Mensaje"
                htmlFor="sha-input"
                error={error}
                hint={bytes ? `${bytes.length} bytes → ${blocksNeeded} bloque(s) de ${params.blockBytes * 8} bits tras el relleno` : undefined}
              >
                <TextArea id="sha-input" value={text} onChange={(e) => setText(e.target.value)} invalid={Boolean(error)} mono={encoding !== 'utf8'} rows={3} placeholder="Escribí cualquier texto (también puede estar vacío)" />
              </Field>
            </div>
            <div className="flex flex-col gap-4">
              <ValueBox label={`${params.name} en tiempo real`} value={livePreview} tone="result" hint="Calculado con la implementación educativa al escribir." />
              <div className="mt-auto flex flex-col gap-2">
                {startError && <FieldError message={startError} />}
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Play size={18} />}
                  className="w-full justify-center"
                  disabled={!bytes}
                  onClick={() => setStartError(start(variant))}
                >
                  {isStale ? 'Aplicar cambios y visualizar' : activeTrace ? 'Reiniciar visualización' : 'Visualizar paso a paso'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {isStale && (
          <Callout tone="warning" title="El mensaje cambió" action={<Button size="sm" variant="primary" onClick={() => setStartError(start(variant))}>Aplicar</Button>}>
            La visualización corresponde al mensaje anterior.
          </Callout>
        )}

        {activeTrace && step && View ? (
          <>
            <SimulationControls useStore={useShaPlayback} groupLabel="etapa" position={describePosition(step, activeTrace)} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card className="min-w-0">
                <CardHeader title={step.title} subtitle={describePosition(step, activeTrace)} />
                <CardBody className="min-h-[420px]">
                    <motion.div key={step.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 / speed }}>
                      <View trace={activeTrace} blockIndex={step.blockIndex} round={step.round} inputText={text} isUtf8={encoding === 'utf8' && !isStale} />
                    </motion.div>
                </CardBody>
              </Card>
              <div className="flex flex-col gap-6">
                <ExplanationPanel stepKey={step.id} title={step.title} explanation={step.explanation} />
                <ShaProgress trace={activeTrace} steps={steps} index={index} goTo={goTo} />
              </div>
            </div>
            <ShaResult trace={activeTrace} verification={verification} />
          </>
        ) : (
          <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-brand/10 text-accent-brand">
              <Play size={22} />
            </span>
            <p className="text-lg font-semibold text-white">Visualizá el cálculo completo del hash</p>
            <p className="max-w-xl text-slate-400">Relleno, expansión del mensaje, las {params.rounds} rondas con sus registros y la composición del resultado final.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function ShaResult({ trace, verification }: { trace: ShaTrace; verification: ShaVerification }) {
  const digestHex = bytesToHex(trace.digest);
  return (
    <Card>
      <CardHeader title={`Hash ${trace.params.name}`} subtitle="Resultado de la implementación educativa comparado con la del navegador." />
      <CardBody className="space-y-3">
        <ValueBox label="Implementación educativa" value={digestHex} tone="result" />
        {verification.status === 'running' && (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Calculando con Web Crypto API…
          </p>
        )}
        {verification.referenceHex && <ValueBox label="Web Crypto API (crypto.subtle.digest)" value={verification.referenceHex} tone="brand" />}
        {verification.status === 'verified' && (
          <Callout tone="success" title={<span className="flex items-center gap-2"><ShieldCheck size={16} /> Resultados idénticos</span>}>
            El hash calculado paso a paso coincide exactamente con el de la implementación nativa del navegador.
          </Callout>
        )}
        {verification.status === 'mismatch' && (
          <Callout tone="danger" title={<span className="flex items-center gap-2"><ShieldAlert size={16} /> Los resultados no coinciden</span>} />
        )}
        {verification.status === 'unavailable' && <Callout tone="info">Web Crypto API no está disponible en este contexto (se requiere HTTPS o localhost).</Callout>}
        <Callout tone="info" title="Un hash no es un cifrado">
          {trace.params.name} no usa clave y no tiene operación de descifrado: no es posible recuperar el mensaje a partir del hash. Solo puede verificarse si
          un mensaje dado produce el mismo resultado.
        </Callout>
      </CardBody>
    </Card>
  );
}
