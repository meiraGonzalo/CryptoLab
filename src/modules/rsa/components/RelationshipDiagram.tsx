import type { RsaKey } from '../types';

function shorten(value: bigint): string {
  const s = value.toString();
  return s.length > 12 ? `${s.slice(0, 5)}…${s.slice(-4)}` : s;
}

const SANS = 'Inter, sans-serif';
const MONO = "'JetBrains Mono', monospace";

interface NodeProps {
  x: number;
  y: number;
  w?: number;
  label: string;
  value: string;
  stroke: string;
  fill: string;
}

function Node({ x, y, w = 140, label, value, stroke, fill }: NodeProps) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 26} width={w} height={52} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x} y={y - 6} textAnchor="middle" fontSize="13" fill="#94a3b8" fontFamily={SANS}>
        {label}
      </text>
      <text x={x} y={y + 15} textAnchor="middle" fontSize="15" fill="#f1f5f9" fontFamily={MONO}>
        {value}
      </text>
    </g>
  );
}

function KeyBox({ x, y, title, value, stroke, fill, titleColor }: { x: number; y: number; title: string; value: string; stroke: string; fill: string; titleColor: string }) {
  return (
    <g>
      <rect x={x - 90} y={y - 28} width={180} height={56} rx={12} fill={fill} stroke={stroke} strokeWidth={1.75} />
      <text x={x} y={y - 6} textAnchor="middle" fontSize="13" fill={titleColor} fontFamily={SANS} fontWeight="600">
        {title}
      </text>
      <text x={x} y={y + 15} textAnchor="middle" fontSize="14" fill="#f1f5f9" fontFamily={MONO}>
        {value}
      </text>
    </g>
  );
}

function Edge({ from, to, label, labelAt, dashed }: { from: [number, number]; to: [number, number]; label?: string; labelAt?: [number, number]; dashed?: boolean }) {
  return (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#52627d" strokeWidth={1.5} strokeDasharray={dashed ? '5 5' : undefined} markerEnd={dashed ? undefined : 'url(#rsa-arrow)'} />
      {label && labelAt && (
        <text x={labelAt[0]} y={labelAt[1]} textAnchor="middle" fontSize="12" fill="#94a3b8" fontFamily={SANS}>
          {label}
        </text>
      )}
    </g>
  );
}

/** Diagrama de dependencias entre p, q, n, φ(n), e y d. */
export function RelationshipDiagram({ rsaKey }: { rsaKey: RsaKey }) {
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 760 420" className="mx-auto w-full min-w-[620px] max-w-3xl" role="img" aria-label="Relación entre los parámetros de RSA">
        <defs>
          <marker id="rsa-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#52627d" />
          </marker>
        </defs>

        {/* p, q → n, φ(n) */}
        <Edge from={[200, 76]} to={[200, 132]} label="×" labelAt={[186, 108]} />
        <Edge from={[530, 76]} to={[250, 133]} />
        <Edge from={[230, 76]} to={[510, 133]} />
        <Edge from={[560, 76]} to={[560, 132]} label="(p−1)(q−1)" labelAt={[612, 108]} />
        {/* φ(n) → e, d */}
        <Edge from={[530, 186]} to={[430, 226]} label="mcd(e, φ) = 1" labelAt={[452, 196]} />
        <Edge from={[560, 186]} to={[560, 252]} />
        <Edge from={[440, 262]} to={[488, 275]} label="e · d ≡ 1 (mod φ)" labelAt={[650, 236]} />
        {/* claves */}
        <Edge from={[200, 186]} to={[200, 340]} label="n" labelAt={[188, 270]} />
        <Edge from={[350, 276]} to={[262, 341]} />
        <Edge from={[560, 306]} to={[560, 340]} />
        <Edge from={[290, 368]} to={[470, 368]} dashed label="comparten n" labelAt={[380, 360]} />

        <Node x={200} y={50} label="primo p" value={shorten(rsaKey.p)} stroke="#60a5fa" fill="rgba(96,165,250,0.08)" />
        <Node x={560} y={50} label="primo q" value={shorten(rsaKey.q)} stroke="#60a5fa" fill="rgba(96,165,250,0.08)" />
        <Node x={200} y={160} label="n = p × q" value={shorten(rsaKey.n)} stroke="#cbd5e1" fill="rgba(203,213,225,0.06)" />
        <Node x={560} y={160} label="φ(n)" value={shorten(rsaKey.phi)} stroke="#c084fc" fill="rgba(192,132,252,0.08)" />
        <Node x={380} y={250} w={120} label="e" value={shorten(rsaKey.e)} stroke="#34d399" fill="rgba(52,211,153,0.08)" />
        <Node x={560} y={280} label="d = e⁻¹ mod φ(n)" value={shorten(rsaKey.d)} stroke="#f472b6" fill="rgba(244,114,182,0.08)" />

        <KeyBox x={200} y={368} title="Clave pública" value="(e, n)" stroke="#34d399" fill="rgba(52,211,153,0.10)" titleColor="#6ee7b7" />
        <KeyBox x={560} y={368} title="Clave privada" value="(d, n)" stroke="#f472b6" fill="rgba(244,114,182,0.10)" titleColor="#f9a8d4" />
      </svg>
    </div>
  );
}
