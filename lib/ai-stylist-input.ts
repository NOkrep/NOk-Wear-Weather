export const AI_MAX_DESCRIPTION_LENGTH = 1000;
export const AI_MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const AI_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const maxImageCharacters = Math.ceil(AI_MAX_IMAGE_BYTES / 3) * 4;
const maxBodyBytes = maxImageCharacters + 16 * 1024;

export async function readStylistBody(request: Request, signal: AbortSignal): Promise<Record<string, unknown> | null> {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) throw new TypeError('Missing body');
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    signal.throwIfAborted();
    while (true) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBodyBytes) { cancel(); return null; }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Invalid body');
  return value as Record<string, unknown>;
}

export function decodeStylistImage(value: unknown, mimeType: unknown): string | null {
  const mime = AI_IMAGE_TYPES.find(type => type === mimeType);
  if (!mime || typeof value !== 'string') return null;
  const prefix = `data:${mime};base64,`;
  const data = value.startsWith(prefix) ? value.slice(prefix.length) : value;
  if (!data || data.length > maxImageCharacters || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return null;
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length > AI_MAX_IMAGE_BYTES) return null;
  if (mime === 'image/jpeg' && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return data;
  if (mime === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return data;
  if (mime === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return data;
  return null;
}
