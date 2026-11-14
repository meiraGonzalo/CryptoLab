import { ChevronLeft, ChevronRight, KeyRound } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { Callout } from '@/components/common/Callout';
import { MathFormula } from '@/components/common/MathFormula';
import { CELL_TONE_CLASSES, type Tone } from '@/components/common/tones';
import { StateMatrix } from '@/components/visualizations/StateMatrix';
import { Legend } from '@/components/visualizations/Legend';
import { cn } from '@/utils/cn';
import { hexToBytes, validateHex } from '@/utils/bytes';
import { expandKey, validateAesKey } from '../engine/keyExpansion';
import { AES_PARAMETERS, type AesVariant, type AesWord, type KeyWordDerivation } from '../types';
import { hex2 } from './views/viewTypes';

const wordHex = (w: AesWord) => w.map(hex2).join('');

/** Visualización de la expansión de clave (Key Expansion). */
export function KeyExpansionView({ variant, keyHex }: { variant: AesVariant; keyHex: string }) {
  const { nk, nr } = AES_PARAMETERS[variant];
  const keyError = validateHex(keyHex) ?? validateAesKey(hexToBytes(keyHex), variant);
  const schedule = useMemo(() => (keyError ? null : expandKey(hexToBytes(keyHex), variant)), [keyError, keyHex, variant]);
  const [selected, setSelected] = useState(nk);
  const [roundKey, setRoundKey] = useState(0);

  if (!schedule) {
    return (
      <Callout tone="warning" title="Clave no válida">
        {keyError} Corregí la clave en la pestaña de simulación para ver su expansión.
      </Callout>
    );
  }

  const totalWords = schedule.words.length;
  const index = Math.min(selected, totalWords - 1);
  const derivation = schedule.derivations[index];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          icon={<KeyRound size={17} />}
          title="Palabras de la clave expandida"
          subtitle={`La clave de ${nk * 32} bits se divide en ${nk} palabras de 32 bits y se expande a ${totalWords} palabras: ${nr + 1} claves de ronda de 4 palabras.`}
        />
        <CardBody className="space-y-4">
          <Legend
            items={[
              { tone: 'key', label: 'Clave original' },
              { tone: 'sub', label: 'RotWord + SubWord + Rcon (i mod Nk = 0)' },
              ...(nk > 6 ? [{ tone: 'shift' as Tone, label: 'SubWord (i mod Nk = 4)' }] : []),
              { tone: 'neutral', label: 'Solo XOR' },
            ]}
          />
          <div className="space-y-2 overflow-x-auto">
            {Array.from({ length: nr + 1 }, (_, r) => (
              <div key={r} className="flex w-max items-center gap-2">
                <span className="w-20 shrink-0 text-sm text-slate-500">Ronda {r}</span>
                {[0, 1, 2, 3].map((c) => {
                  const i = r * 4 + c;
                  const d = schedule.derivations[i];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelected(i)}
                      className={cn(
                        'mono flex h-10 items-center gap-2 rounded-md border px-2.5 text-sm transition-[box-shadow]',
                        CELL_TONE_CLASSES[kindTone(d)],
                        i === index && 'ring-2 ring-accent-brand ring-offset-2 ring-offset-ink-800',
                      )}
                    >
                      <span className="text-xs text-slate-400">w{i}</span>
                      {wordHex(d.result)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Derivación de w${index}`}
          subtitle={describeDerivation(derivation, nk)}
          actions={
            <>
              <Button size="sm" variant="ghost" icon={<ChevronLeft size={16} />} onClick={() => setSelected(Math.max(0, index - 1))} disabled={index === 0}>
                Anterior
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(Math.min(totalWords - 1, index + 1))} disabled={index === totalWords - 1}>
                Siguiente <ChevronRight size={16} />
              </Button>
            </>
          }
        />
        <CardBody className="space-y-5">
          <DerivationPipeline derivation={derivation} nk={nk} />
          <div className="panel-inset p-4">
            <MathFormula display tex={derivationFormula(derivation, nk)} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Claves de ronda"
          subtitle="Cada clave de ronda es una matriz de 4 × 4: sus cuatro palabras forman las columnas."
          actions={
            <div className="flex flex-wrap gap-1">
              {schedule.roundKeys.map((_, r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoundKey(r)}
                  className={cn('mono h-8 min-w-[2.25rem] rounded-md px-2 text-sm', r === roundKey ? 'bg-accent-key/20 text-amber-100' : 'text-slate-400 hover:bg-white/[0.06]')}
                >
                  K{r}
                </button>
              ))}
            </div>
          }
        />
        <CardBody className="flex flex-wrap items-center justify-center gap-8">
          <StateMatrix bytes={schedule.roundKeys[roundKey]} tone="key" size="lg" label={`Clave de ronda ${roundKey} = w${roundKey * 4} … w${roundKey * 4 + 3}`} showAxes />
        </CardBody>
      </Card>
    </div>
  );
}

function kindTone(d: KeyWordDerivation): Tone {
  switch (d.kind) {
    case 'original':
      return 'key';
    case 'rotSubRcon':
      return 'sub';
    case 'sub':
      return 'shift';
    default:
      return 'neutral';
  }
}

function describeDerivation(d: KeyWordDerivation, nk: number): string {
  switch (d.kind) {
    case 'original':
      return `Las primeras ${nk} palabras se copian directamente de la clave original.`;
    case 'rotSubRcon':
      return `Como ${d.index} es múltiplo de Nk = ${nk}, la palabra anterior pasa por RotWord, SubWord y el XOR con Rcon antes de combinarse.`;
    case 'sub':
      return `En AES-256, cuando i mod 8 = 4 se aplica SubWord a la palabra anterior.`;
    default:
      return `w${d.index} = w${d.index - nk} ⊕ w${d.index - 1}.`;
  }
}

function derivationFormula(d: KeyWordDerivation, nk: number): string {
  const i = d.index;
  const t = (w: AesWord | null) => (w ? `\\texttt{${wordHex(w)}}` : '');
  switch (d.kind) {
    case 'original':
      return `w_{${i}} = \\text{clave}[${4 * i}..${4 * i + 3}] = ${t(d.result)}`;
    case 'rotSubRcon':
      return `w_{${i}} = w_{${i - nk}} \\oplus \\big(\\text{SubWord}(\\text{RotWord}(w_{${i - 1}})) \\oplus \\text{Rcon}_{${i / nk}}\\big) = ${t(d.wordNkBefore)} \\oplus ${t(d.temp)} = ${t(d.result)}`;
    case 'sub':
      return `w_{${i}} = w_{${i - nk}} \\oplus \\text{SubWord}(w_{${i - 1}}) = ${t(d.wordNkBefore)} \\oplus ${t(d.temp)} = ${t(d.result)}`;
    default:
      return `w_{${i}} = w_{${i - nk}} \\oplus w_{${i - 1}} = ${t(d.wordNkBefore)} \\oplus ${t(d.previous)} = ${t(d.result)}`;
  }
}

function WordBox({ word, label, tone }: { word: AesWord; label: ReactNode; tone: Tone }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <div className="flex gap-1">
        {word.map((b, i) => (
          <span key={i} className={cn('mono flex h-10 w-10 items-center justify-center rounded-md border text-[15px]', CELL_TONE_CLASSES[tone])}>
            {hex2(b)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center px-1 pt-5 text-slate-500">
      <span className="text-xs">{label}</span>
      <span className="text-xl leading-none">→</span>
    </div>
  );
}

function DerivationPipeline({ derivation: d, nk }: { derivation: KeyWordDerivation; nk: number }) {
  if (d.kind === 'original') {
    return (
      <div className="flex justify-center">
        <WordBox word={d.result} label={`w${d.index} (bytes ${4 * d.index}–${4 * d.index + 3} de la clave)`} tone="key" />
      </div>
    );
  }
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex w-max items-start gap-2">
        <WordBox word={d.previous!} label={`w${d.index - 1}`} tone="neutral" />
        {d.afterRotWord && (
          <>
            <Arrow label="RotWord" />
            <WordBox word={d.afterRotWord} label="Rotación" tone="shift" />
          </>
        )}
        {d.afterSubWord && (
          <>
            <Arrow label="SubWord" />
            <WordBox word={d.afterSubWord} label="S-Box" tone="sub" />
          </>
        )}
        {d.rcon && (
          <>
            <Arrow label="⊕ Rcon" />
            <div className="flex flex-col gap-3">
              <WordBox word={d.rcon} label={`Rcon[${d.index / nk}]`} tone="mix" />
              <WordBox word={d.temp!} label="temp" tone="sub" />
            </div>
          </>
        )}
        <Arrow label={`⊕ w${d.index - nk}`} />
        <div className="flex flex-col gap-3">
          <WordBox word={d.wordNkBefore!} label={`w${d.index - nk}`} tone="key" />
          <WordBox word={d.result} label={`w${d.index}`} tone="xor" />
        </div>
      </div>
    </div>
  );
}
