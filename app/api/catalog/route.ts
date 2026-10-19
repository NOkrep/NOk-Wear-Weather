import { NextRequest, NextResponse } from 'next/server';
import { getMarketProfileForCountry } from '@/lib/clothing-catalog';
import { catalogResponse } from '@/lib/catalog/service';
import { GARMENT_TYPES } from '@/lib/catalog/taxonomy';
import { sanitizeInput } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = sanitizeInput(params.get('q') || '', 80);
  const group = params.get('category') || 'all';
  const tier = params.get('tier') || 'all';
  const type = params.get('type') || '';
  const country = sanitizeInput(params.get('country') || 'Türkiye', 40);
  const countryCode = params.get('countryCode') || (/^(tr|türkiye|turkey)$/i.test(country) ? 'TR' : /^[A-Z]{2}$/.test(country) ? country : undefined);
  const limit = Number(params.get('limit') ?? 30), offset = Number(params.get('offset') ?? 0);
  if ((group !== 'all' && !GARMENT_TYPES.some(t => t.group === group)) ||
      !['all','essential','smart','luxury','premium'].includes(tier) ||
      (type && !GARMENT_TYPES.some(t => t.id === type)) ||
      (countryCode && !/^[A-Z]{2}$/.test(countryCode)) ||
      !Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 100000) {
    return NextResponse.json({ error: 'Invalid catalogue filters' }, { status: 400 });
  }
  const data = await catalogResponse({ query: q, group: group === 'all' ? undefined : group, type: type || undefined, tier, countryCode, limit, offset });
  return NextResponse.json({ marketProfile: getMarketProfileForCountry(country), ...data }, {
    headers: { 'Cache-Control': data.productStatus === 'unavailable' ? 'no-store' : 'public, max-age=0, s-maxage=15' },
  });
}
