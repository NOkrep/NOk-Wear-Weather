import { NextRequest, NextResponse } from 'next/server';
import {
  searchGarmentCatalog,
  getMarketProfileForCountry,
} from '@/lib/clothing-catalog';
import { sanitizeInput } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = sanitizeInput(searchParams.get('q') || '', 80);
  const category = sanitizeInput(searchParams.get('category') || 'all', 20);
  const tier = sanitizeInput(searchParams.get('tier') || 'all', 20);
  const country = sanitizeInput(searchParams.get('country') || 'Türkiye', 40);

  const marketProfile = getMarketProfileForCountry(country);
  const localMatches = searchGarmentCatalog(q, category, tier);

  const results = localMatches;

  return NextResponse.json({
    marketProfile,
    results,
  });
}
