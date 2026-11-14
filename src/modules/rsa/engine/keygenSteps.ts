import type { SimulationStep } from '@/types/simulation';
import type { RsaKey } from '../types';
import { gcd } from './math';

export type KeygenStepKind = 'p' | 'q' | 'n' | 'phi' | 'e' | 'd' | 'public' | 'private';

export interface KeygenStep extends SimulationStep {
  kind: KeygenStepKind;
  /** Fórmula principal en notación TeX. */
  formula: string;
}

/** Los ocho pasos de la generación de claves, con valores reales calculados. */
export function buildKeygenSteps(key: RsaKey): KeygenStep[] {
  const { p, q, n, phi, e, d } = key;
  const step = (kind: KeygenStepKind, title: string, formula: string, explanation: KeygenStep['explanation']): KeygenStep => ({
    id: `keygen-${kind}`,
    groupKey: `keygen-${kind}`,
    kind,
    title,
    formula,
    explanation,
  });
  return [
    step('p', 'Selección del primo p', `p = ${p}`, {
      what: `Se elige un número primo p = ${p}.`,
      why: 'La seguridad de RSA se basa en que, conociendo n = p × q, es muy difícil recuperar p y q.',
      technical: 'Se verifica con el test de Miller–Rabin. En RSA real, p y q tienen 1024 bits o más cada uno y se generan aleatoriamente.',
    }),
    step('q', 'Selección del primo q', `q = ${q}`, {
      what: `Se elige un segundo primo q = ${q}, distinto de p.`,
      why: 'Con dos primos distintos se construye el módulo n y se puede calcular φ(n) solo si se conocen ambos.',
      technical: 'p y q deben ser de tamaño similar pero no demasiado cercanos: si |p − q| es pequeño, n se factoriza con el método de Fermat.',
    }),
    step('n', 'Cálculo del módulo n', `n = p \\times q = ${p} \\times ${q} = ${n}`, {
      what: `Se multiplica p × q y se obtiene n = ${n}.`,
      why: 'n es el módulo de todas las operaciones y forma parte de ambas claves. Es público.',
      technical: `n tiene ${n.toString(2).length} bits. El «tamaño de clave» de RSA (por ejemplo, 2048 bits) es la longitud de n.`,
    }),
    step('phi', 'Cálculo de φ(n)', `\\varphi(n) = (p-1)(q-1) = ${p - 1n} \\times ${q - 1n} = ${phi}`, {
      what: `Se calcula φ(n) = (p − 1)(q − 1) = ${phi}.`,
      why: 'φ(n) cuenta cuántos números menores que n son coprimos con n. Permite calcular d, y solo puede obtenerse conociendo p y q.',
      technical: 'Por el teorema de Euler, M^φ(n) ≡ 1 (mod n) cuando mcd(M, n) = 1: esta propiedad hace que descifrar deshaga el cifrado.',
    }),
    step('e', 'Selección del exponente público e', `1 < e < \\varphi(n), \\quad \\gcd(e, \\varphi(n)) = \\gcd(${e}, ${phi}) = ${gcd(e, phi)}`, {
      what: `Se elige e = ${e}, que cumple 1 < e < φ(n) y no comparte divisores con φ(n).`,
      why: 'e se usa para cifrar y es público. Debe ser coprimo con φ(n) para que exista su inverso d.',
      technical: 'En la práctica se usa casi siempre e = 65537 = 2¹⁶ + 1: es primo y tiene solo dos bits en 1, lo que hace eficiente el cifrado.',
    }),
    step('d', 'Cálculo del inverso modular d', `e \\cdot d \\equiv 1 \\pmod{\\varphi(n)} \\;\\Rightarrow\\; d = ${e}^{-1} \\bmod ${phi} = ${d}`, {
      what: `Se busca d tal que e · d deje resto 1 al dividirlo por φ(n). Resulta d = ${d}.`,
      why: 'd es el exponente privado: deshace exactamente lo que hace e.',
      technical: `Se calcula con el algoritmo de Euclides extendido. Comprobación: ${e} × ${d} = ${e * d} = ${(e * d) / phi} × ${phi} + ${(e * d) % phi}.`,
    }),
    step('public', 'Clave pública', `K_{\\text{pública}} = (e, n) = (${e}, ${n})`, {
      what: 'La clave pública está formada por e y n.',
      why: 'Se publica libremente: cualquiera puede usarla para cifrar mensajes que solo el dueño de la clave privada podrá leer.',
      technical: 'Conocer (e, n) no permite calcular d sin factorizar n, problema que no tiene solución eficiente conocida para n de 2048 bits.',
    }),
    step('private', 'Clave privada', `K_{\\text{privada}} = (d, n) = (${d}, ${n})`, {
      what: 'La clave privada está formada por d y n. p, q y φ(n) también deben mantenerse en secreto.',
      why: 'Solo quien posee d puede descifrar los mensajes cifrados con la clave pública.',
      technical: 'Las implementaciones reales guardan además p, q y valores derivados (CRT) para descifrar unas cuatro veces más rápido.',
    }),
  ];
}
