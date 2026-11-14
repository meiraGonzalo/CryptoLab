// Extrae valores reales del motor de CriptoLab para la presentación.
import { buildAesSimulation } from '../src/modules/aes/engine/simulation';
import { traceSha } from '../src/modules/sha/engine/sha2';
import { buildRsaKey } from '../src/modules/rsa/engine/keygen';
import { traceModPow } from '../src/modules/rsa/engine/math';
import { bytesToHex, hexToBytes, utf8ToBytes } from '../src/utils/bytes';

const hex = (a: readonly number[]) => a.map((v) => v.toString(16).padStart(2, '0'));

const sim = buildAesSimulation({
  variant: 128,
  mode: 'encrypt',
  input: utf8ToBytes('Hola, criptografía!'),
  key: hexToBytes('000102030405060708090a0b0c0d0e0f'),
  padding: 'pkcs7',
  inputEncoding: 'utf8',
  inputText: 'Hola, criptografía!',
});
const b0 = sim.steps.filter((s) => s.blockIndex === 0);
const pick = (op: string, round: number) => b0.find((s) => s.operation === op && s.round === round)!;
const out: Record<string, unknown> = {
  aesBlock0: hex(Array.from(sim.blocks[0])),
  aesKey0: hex(pick('addRoundKey', 0).roundKey!),
  aesAfterArk0: hex(pick('addRoundKey', 0).after),
  aesAfterSub1: hex(pick('subBytes', 1).after),
  aesAfterShift1: hex(pick('shiftRows', 1).after),
  aesAfterMix1: hex(pick('mixColumns', 1).after),
  aesKey1: hex(pick('addRoundKey', 1).roundKey!),
  aesAfterArk1: hex(pick('addRoundKey', 1).after),
  aesCipher: bytesToHex(sim.output),
  aesSteps: sim.steps.length,
};

const rsa = buildRsaKey('61', '53', '17');
if (rsa.ok) {
  out.rsa = { n: rsa.key.n.toString(), phi: rsa.key.phi.toString(), d: rsa.key.d.toString() };
  const enc = traceModPow(65n, 17n, 3233n);
  out.rsaEnc65 = enc.result.toString();
  out.rsaEncSteps = enc.steps.map((s) => [s.bit, s.squared.toString(), s.multiplied?.toString() ?? '-']);
  out.rsaDec = traceModPow(enc.result, rsa.key.d, 3233n).result.toString();
}

const t = traceSha(utf8ToBytes('abc'), 'sha256');
out.shaAbc = bytesToHex(t.digest);
out.shaAbcBlocks = t.blocks.length;
out.shaAbcPaddingZeros = t.padding.zeroBytes;
console.log(JSON.stringify(out, null, 1));
