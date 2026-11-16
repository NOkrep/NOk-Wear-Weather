import { NextResponse } from 'next/server';
import { catalogPool } from '@/lib/catalog/database';
import { releaseIdentity } from '@/lib/release';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const identity = releaseIdentity();
  const headers = { 'Cache-Control': 'no-store, max-age=0' };
  if (!process.env.DATABASE_URL) return NextResponse.json({ status: 'degraded', ...identity, catalogue: 'not-configured' }, { status: 503, headers });
  try {
    const result = await catalogPool().query(`SELECT
      (SELECT count(*)::integer FROM catalog.products p JOIN catalog.import_batches b ON b.id=p.import_batch_id WHERE b.state='published') AS products,
      (SELECT count(*)::integer FROM catalog.garment_types) AS types`);
    return NextResponse.json({ status: 'ok', ...identity, catalogue: 'postgresql', ...result.rows[0] }, { headers });
  } catch {
    return NextResponse.json({ status: 'degraded', ...identity, catalogue: 'unavailable' }, { status: 503, headers });
  }
}
