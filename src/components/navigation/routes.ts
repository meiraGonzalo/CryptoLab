import {
  ArrowLeftRight,
  Binary,
  Dices,
  Fingerprint,
  GitCompareArrows,
  Grid3x3,
  Hash,
  Home,
  KeyRound,
  KeySquare,
  Layers,
  Lock,
  LockOpen,
  Orbit,
  ScanLine,
  Sigma,
  Waves,
  type LucideIcon,
} from 'lucide-react';

export type RouteId =
  | 'home'
  | 'aes-128'
  | 'aes-192'
  | 'aes-256'
  | 'rsa'
  | 'rsa-keygen'
  | 'rsa-encrypt'
  | 'rsa-decrypt'
  | 'sha-256'
  | 'sha-512'
  | 'hash-compare'
  | 'avalanche'
  | 'tool-text-hex'
  | 'tool-hex-binary'
  | 'tool-bytes'
  | 'tool-keygen'
  | 'tool-random'
  | 'tool-compare';

export interface RouteDefinition {
  id: RouteId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface NavigationSection {
  title: string;
  routes: RouteDefinition[];
}

export const NAVIGATION: NavigationSection[] = [
  {
    title: 'Inicio',
    routes: [{ id: 'home', label: 'Presentación', description: 'Introducción a la criptografía y a la plataforma.', icon: Home }],
  },
  {
    title: 'Criptografía simétrica',
    routes: [
      { id: 'aes-128', label: 'AES-128', description: 'Clave de 128 bits · 10 rondas.', icon: Grid3x3 },
      { id: 'aes-192', label: 'AES-192', description: 'Clave de 192 bits · 12 rondas.', icon: Grid3x3 },
      { id: 'aes-256', label: 'AES-256', description: 'Clave de 256 bits · 14 rondas.', icon: Grid3x3 },
    ],
  },
  {
    title: 'Criptografía asimétrica',
    routes: [
      { id: 'rsa', label: 'RSA', description: 'Fundamentos, modos y RSA-OAEP real.', icon: Orbit },
      { id: 'rsa-keygen', label: 'Generación de claves', description: 'p, q, n, φ(n), e y d paso a paso.', icon: KeyRound },
      { id: 'rsa-encrypt', label: 'Cifrado', description: 'C = Mᵉ mod n.', icon: Lock },
      { id: 'rsa-decrypt', label: 'Descifrado', description: 'M = Cᵈ mod n.', icon: LockOpen },
    ],
  },
  {
    title: 'Funciones hash',
    routes: [
      { id: 'sha-256', label: 'SHA-256', description: '64 rondas sobre palabras de 32 bits.', icon: Hash },
      { id: 'sha-512', label: 'SHA-512', description: '80 rondas sobre palabras de 64 bits.', icon: Hash },
      { id: 'hash-compare', label: 'Comparación de hashes', description: 'Compará huellas digitales.', icon: Fingerprint },
      { id: 'avalanche', label: 'Efecto avalancha', description: 'Un carácter, la mitad de los bits.', icon: Waves },
    ],
  },
  {
    title: 'Herramientas',
    routes: [
      { id: 'tool-text-hex', label: 'Texto ↔ hexadecimal', description: 'Conversión con UTF-8.', icon: ArrowLeftRight },
      { id: 'tool-hex-binary', label: 'Hexadecimal ↔ binario', description: 'Cada dígito, cuatro bits.', icon: Binary },
      { id: 'tool-bytes', label: 'Visualizador de bytes', description: 'Hex, decimal, binario y ASCII.', icon: ScanLine },
      { id: 'tool-keygen', label: 'Generador de claves', description: 'Claves AES y valores aleatorios.', icon: KeySquare },
      { id: 'tool-random', label: 'Números aleatorios', description: 'Fuente criptográficamente segura.', icon: Dices },
      { id: 'tool-compare', label: 'Comparador de resultados', description: 'Diferencias byte a byte y bit a bit.', icon: GitCompareArrows },
    ],
  },
];

export const ALL_ROUTES: RouteDefinition[] = NAVIGATION.flatMap((section) => section.routes);

export const ROUTE_BY_ID = Object.fromEntries(ALL_ROUTES.map((r) => [r.id, r])) as Record<RouteId, RouteDefinition>;

export function isRouteId(value: string): value is RouteId {
  return value in ROUTE_BY_ID;
}

export const CATEGORY_ICONS = { symmetric: Layers, asymmetric: Orbit, hash: Sigma };
