import { ArrowRight, Fingerprint, KeyRound, Layers, Lock, Orbit, ShieldCheck, Sigma } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/common/Card';
import { ALL_ROUTES, type RouteId } from '@/components/navigation/routes';
import { useNavigate } from '@/stores/navigationStore';
import { cn } from '@/utils/cn';

const FEATURED: RouteId[] = ['aes-128', 'aes-256', 'rsa-keygen', 'rsa-encrypt', 'sha-256', 'avalanche'];

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-10">
      <section className="panel relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
        <HeroBackdrop />
        <div className="relative max-w-2xl">
          <p className="label-caps mb-3 text-accent-brand">Laboratorio visual de criptografía</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">Mirá por dentro los algoritmos que protegen la información.</h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            Cada byte, cada ronda y cada operación matemática, calculados de verdad y representados paso a paso. Avanzá, retrocedé y examiná los valores
            intermedios de AES, RSA y SHA-2.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('aes-128')}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent-brand px-5 font-semibold text-ink-950 transition-colors hover:bg-sky-300"
            >
              Comenzar con AES <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate('sha-256')}
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 font-medium text-slate-200 transition-colors hover:bg-white/[0.08]"
            >
              Explorar SHA-256
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold text-white">¿Qué es la criptografía?</h2>
        <p className="mb-5 max-w-3xl text-slate-400">
          Es el conjunto de técnicas matemáticas que permiten mantener la información confidencial, verificar que no fue alterada y comprobar quién la
          envió. Se organiza en tres grandes familias:
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          <CategoryCard
            icon={<Layers size={20} />}
            tone="data"
            title="Simétrica"
            subtitle="Una sola clave compartida"
            description="La misma clave cifra y descifra. Es muy rápida y se usa para proteger grandes volúmenes de datos."
            diagram={<SymmetricDiagram />}
            example="AES"
            onClick={() => navigate('aes-128')}
          />
          <CategoryCard
            icon={<Orbit size={20} />}
            tone="result"
            title="Asimétrica"
            subtitle="Un par de claves: pública y privada"
            description="Se cifra con la clave pública y solo la privada descifra. Resuelve cómo compartir secretos con desconocidos."
            diagram={<AsymmetricDiagram />}
            example="RSA"
            onClick={() => navigate('rsa')}
          />
          <CategoryCard
            icon={<Sigma size={20} />}
            tone="sub"
            title="Funciones hash"
            subtitle="Sin clave · sin vuelta atrás"
            description="Generan una huella de longitud fija. No se pueden invertir y cualquier cambio altera el resultado por completo."
            diagram={<HashDiagram />}
            example="SHA-256 · SHA-512"
            onClick={() => navigate('sha-256')}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-xl font-semibold text-white">Simuladores</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURED.map((id) => {
            const route = ALL_ROUTES.find((r) => r.id === id)!;
            const Icon = route.icon;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className="panel group flex items-center gap-4 p-4 text-left transition-colors hover:border-accent-brand/30"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-accent-brand">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{route.label}</span>
                  <span className="block text-sm text-slate-400">{route.description}</span>
                </span>
                <ArrowRight size={18} className="text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-brand" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Principle icon={<Lock size={18} />} title="Cálculos reales">
          Cada valor intermedio proviene de una implementación completa del algoritmo, no de animaciones ilustrativas.
        </Principle>
        <Principle icon={<ShieldCheck size={18} />} title="Resultados verificados">
          Los resultados se comparan con Web Crypto API del navegador y con vectores de prueba oficiales (FIPS-197 y FIPS 180-4).
        </Principle>
        <Principle icon={<Fingerprint size={18} />} title="Todo en tu navegador">
          No hay servidor: los mensajes y las claves nunca salen de tu equipo. Las claves se generan con crypto.getRandomValues.
        </Principle>
      </section>

      <p className="flex items-center gap-2 text-sm text-slate-500">
        <KeyRound size={15} /> Las implementaciones educativas están pensadas para aprender. Para proteger información real usá bibliotecas auditadas.
      </p>
    </div>
  );
}

const TONE_RING = { data: 'text-accent-data bg-accent-data/10', result: 'text-accent-result bg-accent-result/10', sub: 'text-accent-sub bg-accent-sub/10' };

function CategoryCard({ icon, tone, title, subtitle, description, diagram, example, onClick }: { icon: ReactNode; tone: keyof typeof TONE_RING; title: string; subtitle: string; description: string; diagram: ReactNode; example: string; onClick: () => void }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', TONE_RING[tone])}>{icon}</span>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="my-5 flex h-24 items-center justify-center rounded-lg bg-ink-900/60">{diagram}</div>
      <p className="text-[15px] text-slate-300">{description}</p>
      <button type="button" onClick={onClick} className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-medium text-accent-brand hover:text-sky-300">
        Ver {example} <ArrowRight size={15} />
      </button>
    </Card>
  );
}

function Principle({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="panel p-5">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] text-accent-brand">{icon}</span>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-1 text-[15px] text-slate-400">{children}</p>
    </div>
  );
}

const svgText = { fontFamily: 'Inter, sans-serif', fontSize: 11, fill: '#94a3b8' };

function SymmetricDiagram() {
  return (
    <svg viewBox="0 0 240 80" className="h-20 w-full max-w-[260px]" aria-hidden>
      <rect x="6" y="28" width="48" height="26" rx="6" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" />
      <text x="30" y="45" textAnchor="middle" {...svgText} fill="#bfdbfe">texto</text>
      <rect x="96" y="28" width="48" height="26" rx="6" fill="rgba(148,163,184,0.1)" stroke="#64748b" />
      <text x="120" y="45" textAnchor="middle" {...svgText}>cifrado</text>
      <rect x="186" y="28" width="48" height="26" rx="6" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" />
      <text x="210" y="45" textAnchor="middle" {...svgText} fill="#bfdbfe">texto</text>
      <path d="M56 41 H92 M146 41 H182" stroke="#475569" strokeWidth="1.5" />
      <circle cx="74" cy="16" r="7" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="164" cy="16" r="7" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
      <text x="120" y="74" textAnchor="middle" {...svgText} fill="#fcd34d">misma clave</text>
    </svg>
  );
}

function AsymmetricDiagram() {
  return (
    <svg viewBox="0 0 240 80" className="h-20 w-full max-w-[260px]" aria-hidden>
      <rect x="6" y="28" width="48" height="26" rx="6" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" />
      <text x="30" y="45" textAnchor="middle" {...svgText} fill="#bfdbfe">texto</text>
      <rect x="96" y="28" width="48" height="26" rx="6" fill="rgba(148,163,184,0.1)" stroke="#64748b" />
      <text x="120" y="45" textAnchor="middle" {...svgText}>cifrado</text>
      <rect x="186" y="28" width="48" height="26" rx="6" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" />
      <text x="210" y="45" textAnchor="middle" {...svgText} fill="#bfdbfe">texto</text>
      <path d="M56 41 H92 M146 41 H182" stroke="#475569" strokeWidth="1.5" />
      <circle cx="74" cy="16" r="7" fill="none" stroke="#34d399" strokeWidth="1.5" />
      <circle cx="164" cy="16" r="7" fill="none" stroke="#f472b6" strokeWidth="1.5" />
      <text x="74" y="74" textAnchor="middle" {...svgText} fill="#6ee7b7">pública</text>
      <text x="164" y="74" textAnchor="middle" {...svgText} fill="#f9a8d4">privada</text>
    </svg>
  );
}

function HashDiagram() {
  return (
    <svg viewBox="0 0 240 80" className="h-20 w-full max-w-[260px]" aria-hidden>
      <rect x="6" y="18" width="70" height="44" rx="6" fill="rgba(96,165,250,0.12)" stroke="#60a5fa" />
      <text x="41" y="44" textAnchor="middle" {...svgText} fill="#bfdbfe">cualquier dato</text>
      <path d="M78 40 H104" stroke="#475569" strokeWidth="1.5" />
      <circle cx="122" cy="40" r="17" fill="rgba(192,132,252,0.12)" stroke="#c084fc" />
      <text x="122" y="44" textAnchor="middle" {...svgText} fill="#e9d5ff">H</text>
      <path d="M140 40 H166" stroke="#475569" strokeWidth="1.5" />
      <rect x="168" y="30" width="66" height="20" rx="5" fill="rgba(52,211,153,0.12)" stroke="#34d399" />
      <text x="201" y="44" textAnchor="middle" {...svgText} fill="#a7f3d0">a3f9…07c1</text>
      <text x="122" y="74" textAnchor="middle" {...svgText}>sin vuelta atrás</text>
    </svg>
  );
}

function HeroBackdrop() {
  const cells = Array.from({ length: 48 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-60 min-[1400px]:block" aria-hidden>
      <div className="grid grid-cols-8 gap-2">
        {cells.map((i) => {
          const tones = ['border-accent-data/30', 'border-accent-key/30', 'border-accent-sub/30', 'border-accent-result/30', 'border-white/[0.06]', 'border-white/[0.06]'];
          return (
            <span key={i} className={cn('mono flex h-11 w-11 items-center justify-center rounded-md border text-xs text-slate-600', tones[(i * 7) % tones.length])}>
              {((i * 73 + 41) % 256).toString(16).padStart(2, '0')}
            </span>
          );
        })}
      </div>
    </div>
  );
}
