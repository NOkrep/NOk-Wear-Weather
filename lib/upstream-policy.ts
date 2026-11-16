import { RELEASE_VERSION } from './release';

/** One identifying agent for all free third-party services (Nominatim and MET Norway require it). */
export const UPSTREAM_USER_AGENT = `Weathrobe/${RELEASE_VERSION} (+https://github.com/NOkrep/NOk-Wear-Weather)`;

/** Reverse geocoding answers at district/city level; ~110 m keeps the label without the exact point. */
export const roundForReverseGeocode = (value: number) => Number(value.toFixed(3));
/** Routing snaps to the road network; ~11 m is enough and avoids sending the exact point. */
export const roundForRouting = (value: number) => Number(value.toFixed(4));

export type Admission = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Fixed-window admission for anonymous proxy endpoints. Single process only and deliberately
 * independent of caller-supplied IP headers, like the AI stylist limit.
 */
export function createWindowLimit(limit: number, windowMs = 60_000) {
  let start = -Infinity;
  let used = 0;
  return (now: number): Admission => {
    if (now - start >= windowMs) { start = now; used = 0; }
    if (used >= limit) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((start + windowMs - now) / 1000)) };
    used++;
    return { ok: true };
  };
}

/**
 * Runs tasks one at a time with a minimum real-time gap (Nominatim policy: at most one request per
 * second). When the backlog is full the task is not run and `null` is returned, so callers fall back
 * to their own label instead of queueing without bound.
 */
export function createSpacedQueue(spacingMs: number, maxPending: number) {
  let tail: Promise<unknown> = Promise.resolve();
  let last = -Infinity;
  let pending = 0;
  return <T>(task: () => Promise<T>): Promise<T | null> => {
    if (pending >= maxPending) return Promise.resolve(null);
    pending++;
    const result = tail.then(async () => {
      const wait = last + spacingMs - performance.now();
      if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
      last = performance.now();
      return task();
    }).finally(() => { pending--; });
    tail = result.catch(() => undefined);
    return result;
  };
}

/** Small time-bounded memo for provider answers that do not change minute to minute. */
export function createMemo<T>(ttlMs: number, maxEntries: number) {
  const entries = new Map<string, { at: number; value: T }>();
  return {
    get(key: string, now: number): T | undefined {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (now - entry.at >= ttlMs) { entries.delete(key); return undefined; }
      return entry.value;
    },
    set(key: string, value: T, now: number) {
      entries.delete(key);
      entries.set(key, { at: now, value });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value as string);
    },
  };
}

const nominatimQueue = createSpacedQueue(1_100, 6);
const nominatimMemo = createMemo<Record<string, unknown>>(6 * 60 * 60 * 1000, 500);

/**
 * Shared, paced and memoised Nominatim reverse lookup. `fetcher` is the caller's fetch so that the
 * request stays inside the route (and its test double). Returns null on failure, timeout or backlog.
 */
export async function nominatimReverse(
  fetcher: typeof fetch, lat: number, lon: number, zoom: number, now: number,
): Promise<Record<string, unknown> | null> {
  const qLat = roundForReverseGeocode(lat);
  const qLon = roundForReverseGeocode(lon);
  const key = `${qLat},${qLon},${zoom}`;
  const cached = nominatimMemo.get(key, now);
  if (cached) return cached;
  const data = await nominatimQueue(async () => {
    const res = await fetcher(
      `https://nominatim.openstreetmap.org/reverse?lat=${qLat}&lon=${qLon}&format=json&accept-language=tr&zoom=${zoom}`,
      { headers: { 'User-Agent': UPSTREAM_USER_AGENT }, cache: 'no-store', signal: AbortSignal.timeout(8_000) },
    );
    return res.ok ? await res.json() as Record<string, unknown> : null;
  }).catch(() => null);
  if (data && typeof data === 'object') nominatimMemo.set(key, data, now);
  return data && typeof data === 'object' ? data : null;
}

export function tooManyRequests(admission: Extract<Admission, { ok: false }>) {
  return { status: 429, headers: { 'Cache-Control': 'private, no-store', 'Retry-After': String(admission.retryAfterSeconds) } };
}
