import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FEEDBACK_MAX_BYTES, validateProductFeedback } from '@/lib/product-feedback';
import { ProductFeedbackError, saveProductFeedback } from '@/lib/product-feedback-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const cookieName = 'ww_reporter';
const noStore = { 'Cache-Control': 'no-store' };
let windowStart = 0, attempts = 0;

function reply(error: string, status: number, retry = false) {
  return NextResponse.json({ error }, { status, headers: { ...noStore, ...(retry ? { 'Retry-After': '60' } : {}) } });
}

/** Bound the stream itself; Content-Length can be missing or false. */
async function readBody(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > FEEDBACK_MAX_BYTES) { void reader.cancel().catch(() => {}); return null; }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    if (!origin || !['http:', 'https:'].includes(new URL(origin).protocol)
      || new URL(origin).host !== request.headers.get('host')
      || request.headers.get('sec-fetch-site') === 'cross-site') return reply('ORIGIN_REJECTED', 403);
  } catch { return reply('ORIGIN_REJECTED', 403); }
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return reply('JSON_REQUIRED', 415);
  const now = Date.now();
  if (now - windowStart >= 60000) { windowStart = now; attempts = 0; }
  if (++attempts > 60) return reply('RATE_LIMIT', 429, true);
  if (Number(request.headers.get('content-length') || 0) > FEEDBACK_MAX_BYTES) return reply('TOO_LARGE', 413);
  try {
    const text = await readBody(request);
    if (text === null) return reply('TOO_LARGE', 413);
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return reply('INVALID_REPORT', 400); }
    const input = validateProductFeedback(parsed);
    if (!input) return reply('INVALID_REPORT', 400);
    const cookie = request.cookies.get(cookieName)?.value;
    const token = cookie && /^[a-f0-9]{64}$/.test(cookie) ? cookie : randomBytes(32).toString('hex');
    const result = await saveProductFeedback(input, token);
    const response = NextResponse.json({ saved: true, id: result.id, createdAt: result.createdAt }, {
      status: result.duplicate ? 200 : 201, headers: noStore,
    });
    // Created only after the user explicitly submits; no browser fingerprint or IP is collected.
    response.cookies.set(cookieName, token, { httpOnly: true, secure: request.nextUrl.protocol === 'https:',
      sameSite: 'strict', path: '/api/feedback', maxAge: 86400 });
    return response;
  } catch (error) {
    if (error instanceof ProductFeedbackError) {
      if (error.code === 'RATE_LIMIT') return reply('RATE_LIMIT', 429, true);
      if (error.code === 'CONFLICT') return reply('SUBMISSION_CONFLICT', 409);
      if (error.code === 'INVALID') return reply('INVALID_REPORT', 400);
    }
    return reply('STORAGE_UNAVAILABLE', 503, true);
  }
}

// Reading reports requires filesystem/Docker authorization, never a public HTTP credential.
export function GET() { return reply('METHOD_NOT_ALLOWED', 405); }
