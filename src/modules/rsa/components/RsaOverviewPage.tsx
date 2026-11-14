import { ArrowRight, FlaskConical, KeyRound, Lock, LockOpen, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/common/Button';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { MathFormula } from '@/components/common/MathFormula';
import { PageHeader } from '@/components/layout/PageHeader';
import { useNavigate } from '@/stores/navigationStore';
import { useRsaStore } from '../store/rsaStore';
import { RealRsaLab } from './RealRsaLab';
import { RelationshipDiagram } from './RelationshipDiagram';

const COMPARISON: [string, string, string][] = [
  ['Tamaño de los primos', 'De 2 a 10 dígitos', '1024 bits o más (≈ 309 dígitos)'],
  ['Relleno (padding)', 'Ninguno: C = Mᵉ mod n', 'OAEP con SHA-256 y bytes aleatorios'],
  ['Mismo mensaje, dos cifrados', 'Mismo resultado (determinista)', 'Resultados distintos (probabilista)'],
  ['Cálculos visibles', 'Todos: p, q, φ(n), d y cada potencia', 'Ninguno: la clave privada no es extraíble'],
  ['Generación de primos', 'Aleatoria (getRandomValues) + Miller–Rabin', 'Motor criptográfico del navegador'],
  ['Uso adecuado', 'Aprender y verificar a mano', 'Proteger datos reales'],
];

export default function RsaOverviewPage() {
  const navigate = useNavigate();
  const keyResult = useRsaStore((s) => s.keyResult);

  return (
    <div>
      <PageHeader
        eyebrow="Criptografía asimétrica"
        title="RSA"
        description="Rivest–Shamir–Adleman (1977): un sistema de clave pública basado en la dificultad de factorizar el producto de dos números primos grandes."
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <FlowCard icon={<KeyRound size={18} />} title="Generación de claves" formula="d \equiv e^{-1} \pmod{\varphi(n)}" onClick={() => navigate('rsa-keygen')} />
          <FlowCard icon={<Lock size={18} />} title="Cifrado" formula="C = M^{e} \bmod n" onClick={() => navigate('rsa-encrypt')} />
          <FlowCard icon={<LockOpen size={18} />} title="Descifrado" formula="M = C^{d} \bmod n" onClick={() => navigate('rsa-decrypt')} />
        </div>

        {keyResult.ok && (
          <Card>
            <CardHeader title="Cómo se relacionan los parámetros" subtitle="Diagrama con el par de claves educativo actual." />
            <CardBody>
              <RelationshipDiagram rsaKey={keyResult.key} />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Dos modos de funcionamiento" subtitle="El RSA matemático sirve para comprender; el RSA real agrega relleno, aleatoriedad y claves enormes." />
          <CardBody className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-[15px]">
                <thead>
                  <tr className="border-b border-white/[0.07] text-left">
                    <th className="py-2.5 pr-4 font-medium text-slate-400" />
                    <th className="py-2.5 pr-4 font-semibold text-purple-200">
                      <span className="flex items-center gap-2">
                        <FlaskConical size={16} /> Modo educativo
                      </span>
                    </th>
                    <th className="py-2.5 font-semibold text-emerald-200">
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={16} /> Modo criptográfico real
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(([label, edu, real]) => (
                    <tr key={label} className="border-b border-white/[0.04]">
                      <td className="py-2.5 pr-4 text-slate-400">{label}</td>
                      <td className="py-2.5 pr-4 text-slate-200">{edu}</td>
                      <td className="py-2.5 text-slate-200">{real}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <RealRsaLab />
      </div>
    </div>
  );
}

function FlowCard({ icon, title, formula, onClick }: { icon: ReactNode; title: string; formula: string; onClick: () => void }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-brand/10 text-accent-brand">{icon}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      <div className="panel-inset px-3 py-3 text-center text-lg">
        <MathFormula tex={formula} />
      </div>
      <Button variant="subtle" size="sm" className="mt-auto self-start" onClick={onClick}>
        Abrir simulador <ArrowRight size={15} />
      </Button>
    </Card>
  );
}
