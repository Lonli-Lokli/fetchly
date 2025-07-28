import { compress, decompress } from 'brotli-compress';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function base62Encode(buffer: Uint8Array): string {
  let num = BigInt(
    '0x' + [...buffer].map((b) => b.toString(16).padStart(2, '0')).join('')
  );
  let out = '';
  while (num > 0) {
    out = BASE62[Number(num % 62n)] + out;
    num /= 62n;
  }
  return out || '0';
}

function base62Decode(input: string): Uint8Array {
  let num = BigInt(0);
  for (const char of input) {
    num = num * 62n + BigInt(BASE62.indexOf(char));
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return new Uint8Array(bytes);
}

export async function encode(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const inputBytes = encoder.encode(input);
  const compressed = await compress(inputBytes);
  return base62Encode(compressed);
}

export async function decode(encoded: string): Promise<string>;
export async function decode(encoded: undefined): Promise<undefined>;
export async function decode(encoded: string | undefined): Promise<string | undefined> {
  if (encoded === undefined) return undefined;
  const compressed = base62Decode(encoded);
  const decompressed = await decompress(compressed);
  const decoder = new TextDecoder();
  return decoder.decode(decompressed);
}