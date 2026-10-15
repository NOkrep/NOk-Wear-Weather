import { NextRequest, NextResponse } from 'next/server';
import { normalizeBarcode, type ProductLookup } from '@/lib/product-lookup';

const cache = new Map<string, { expires: number; result: ProductLookup }>();
const limits = new Map<string, { count: number; expires: number }>();
let daily = { count: 0, day: '' };

export async function GET(request: NextRequest) {
  const barcode = normalizeBarcode(request.nextUrl.searchParams.get('barcode') || '');
  if (!barcode) return NextResponse.json({ error: 'Geçerli bir EAN / UPC barkodu gir.' }, { status: 400 });
  const cached = cache.get(barcode);
  if (cached && cached.expires > Date.now()) return NextResponse.json(cached.result);
  const now = Date.now();
  if (limits.size > 2000) for (const [key, value] of limits) if (value.expires < now) limits.delete(key);
  const client = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const limit = limits.get(client);
  if (limit && limit.expires > now && limit.count >= 6) return NextResponse.json({ barcode, found: false, source: 'manual', status: 'rate-limited' }, { status: 429 });
  limits.set(client, { count: limit && limit.expires > now ? limit.count + 1 : 1, expires: limit && limit.expires > now ? limit.expires : now + 60_000 });
  const day = new Date().toISOString().slice(0, 10);
  if (daily.day !== day) daily = { day, count: 0 };
  // Shared free-provider budget, with room for other requests using this server's IP.
  if (daily.count >= 90) return NextResponse.json({ barcode, found: false, source: 'manual', status: 'rate-limited' }, { status: 429 });
  daily.count++;
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ barcode, found: false, source: 'manual', status: response.status === 429 ? 'rate-limited' : 'unavailable' });
    const body = await response.json();
    const item = body.items?.find((candidate: { ean?: string; upc?: string }) => [candidate.ean, candidate.upc].some(code => code?.padStart(14, '0') === barcode.padStart(14, '0')));
    const result: ProductLookup = item ? { barcode, found: true, title: String(item.title || '').slice(0, 200), brand: String(item.brand || '').slice(0, 100), model: String(item.model || '').slice(0, 100), source: 'UPCitemdb', status: 'found' } : { barcode, found: false, source: 'manual', status: 'not-found' };
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(barcode, { expires: now + 10 * 60_000, result });
    return NextResponse.json(result);
  } catch { return NextResponse.json({ barcode, found: false, source: 'manual', status: 'unavailable' }); }
}
