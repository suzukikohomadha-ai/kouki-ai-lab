import iconv from 'iconv-lite';

export type EncodingHint = 'auto' | 'utf8' | 'shift_jis';
export type OutputEncoding = 'utf8_bom' | 'utf8' | 'shift_jis';

export interface DecodeResult {
  text: string;
  encoding: 'utf8' | 'shift_jis';
  hadBom: boolean;
}

export function decodeBytes(bytes: Uint8Array, hint: EncodingHint): DecodeResult {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: new TextDecoder('utf-8').decode(bytes.subarray(3)), encoding: 'utf8', hadBom: true };
  }
  if (hint === 'utf8') {
    return { text: new TextDecoder('utf-8').decode(bytes), encoding: 'utf8', hadBom: false };
  }
  if (hint === 'shift_jis') {
    return { text: iconv.decode(Buffer.from(bytes), 'shift_jis'), encoding: 'shift_jis', hadBom: false };
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { text, encoding: 'utf8', hadBom: false };
  } catch {
    return { text: iconv.decode(Buffer.from(bytes), 'shift_jis'), encoding: 'shift_jis', hadBom: false };
  }
}

export function encodeText(text: string, encoding: OutputEncoding): Uint8Array {
  if (encoding === 'shift_jis') return new Uint8Array(iconv.encode(text, 'shift_jis'));
  const body = new TextEncoder().encode(text);
  if (encoding === 'utf8') return body;
  const out = new Uint8Array(body.length + 3);
  out.set([0xef, 0xbb, 0xbf], 0);
  out.set(body, 3);
  return out;
}
