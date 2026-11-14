/**
 * Operaciones criptográficas reales del navegador (Web Crypto API).
 * Se usan para verificar los resultados de las implementaciones educativas y
 * para el modo criptográfico real de RSA.
 */

function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

export async function webCryptoDigest(algorithm: 'SHA-256' | 'SHA-512', data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest(algorithm, toBuffer(data)));
}

/**
 * Cifra bloques de 16 bytes de forma independiente (equivalente a ECB) usando
 * AES-CBC con un vector de inicialización en cero para cada bloque: el primer
 * bloque de CBC con IV nulo es exactamente E_K(bloque).
 */
export async function webCryptoAesEncryptBlocks(key: Uint8Array, blocks: Uint8Array[]): Promise<Uint8Array[]> {
  const cryptoKey = await crypto.subtle.importKey('raw', toBuffer(key), { name: 'AES-CBC' }, false, ['encrypt']);
  const iv = new Uint8Array(16);
  const results: Uint8Array[] = [];
  for (const block of blocks) {
    const out = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, toBuffer(block));
    results.push(new Uint8Array(out).slice(0, 16));
  }
  return results;
}

export interface RsaOaepKeyPair {
  keyPair: CryptoKeyPair;
  modulusBits: number;
  /** Módulo n en hexadecimal (exportado de la clave pública). */
  modulusHex: string;
  publicExponent: number;
}

function base64UrlToHex(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Array.from(binary, (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un par de claves RSA-OAEP con SHA-256. La clave privada se crea como
 * no extraíble: nunca sale del motor criptográfico del navegador.
 */
export async function generateRsaOaepKeyPair(modulusBits: 2048 | 3072 | 4096): Promise<RsaOaepKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: modulusBits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    false,
    ['encrypt', 'decrypt'],
  );
  const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return {
    keyPair,
    modulusBits,
    modulusHex: base64UrlToHex(jwk.n ?? ''),
    publicExponent: parseInt(base64UrlToHex(jwk.e ?? ''), 16),
  };
}

/** Longitud máxima del mensaje para RSA-OAEP con SHA-256: k − 2·hLen − 2 bytes. */
export function rsaOaepMaxMessageBytes(modulusBits: number): number {
  return modulusBits / 8 - 2 * 32 - 2;
}

export async function rsaOaepEncrypt(publicKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, toBuffer(data)));
}

export async function rsaOaepDecrypt(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, toBuffer(data)));
}
