import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { communitySummary, contribute, deleteContributions, validateContribution } from '@/lib/community-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const cookieName = 'ww_contributor';
function validOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === request.headers.get('host'); } catch { return false; }
}
function tokenFrom(request: NextRequest) {
  const value = request.cookies.get(cookieName)?.value;
  return value && /^[a-f0-9]{48}$/.test(value) ? value : null;
}
export async function POST(request: NextRequest) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Origin rejected' }, { status: 403 });
  if (Number(request.headers.get('content-length') || 0) > 2048) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  try {
    const text = await request.text();
    if (text.length > 2048) return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    const input = validateContribution(JSON.parse(text));
    if (!input) return NextResponse.json({ error: 'Invalid contribution' }, { status: 400 });
    const token = tokenFrom(request) || randomBytes(24).toString('hex');
    const result = await contribute(input, token);
    const response = NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(cookieName, token, { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'strict', path: '/api/community', maxAge: 180 * 86400 });
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid JSON' : (error as Error).message === 'DAILY_LIMIT' ? 'Daily contribution limit' : 'Contribution could not be saved' }, { status: error instanceof SyntaxError ? 400 : (error as Error).message === 'DAILY_LIMIT' ? 429 : 503 }); }
}
export async function DELETE(request: NextRequest) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Origin rejected' }, { status: 403 });
  try {
    const token = tokenFrom(request);
    if (token) await deleteContributions(token);
    const response = NextResponse.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(cookieName, '', { httpOnly: true, sameSite: 'strict', path: '/api/community', maxAge: 0 });
    return response;
  } catch { return NextResponse.json({ error: 'Deletion could not be completed' }, { status: 503 }); }
}
export async function GET() {
  try { return NextResponse.json({ candidates: await communitySummary(), policy: 'review-required', minimumContributors: 30 }, { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ error: 'Community storage unavailable' }, { status: 503 }); }
}
