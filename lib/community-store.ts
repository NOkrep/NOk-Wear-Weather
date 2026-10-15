import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeBarcode } from './product-lookup';

export interface Contribution {
  version: 1; consent: true; product: string;
  outcome: 'perfect' | 'froze' | 'sweated' | 'wet' | 'color_hot';
  temperatureBand: number; windBand: 'windy' | 'calm'; rainBand: 'rain' | 'dry';
  activity: 'resting' | 'walking' | 'active';
}
interface Row extends Contribution { participant: string; day: string }

export function validateContribution(value: unknown): Contribution | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const keys = ['version', 'consent', 'product', 'outcome', 'temperatureBand', 'windBand', 'rainBand', 'activity'];
  if (Object.keys(v).some(key => !keys.includes(key))) return null;
  if (v.version !== 1 || v.consent !== true || typeof v.product !== 'string' || !/^gtin:\d{14}$/.test(v.product) || !normalizeBarcode(v.product.slice(5))) return null;
  if (!['perfect', 'froze', 'sweated', 'wet', 'color_hot'].includes(String(v.outcome))) return null;
  if (typeof v.temperatureBand !== 'number' || v.temperatureBand < -50 || v.temperatureBand > 60 || v.temperatureBand % 5 !== 0) return null;
  if (!['calm', 'windy'].includes(String(v.windBand)) || !['rain', 'dry'].includes(String(v.rainBand)) || !['resting', 'walking', 'active'].includes(String(v.activity))) return null;
  return v as unknown as Contribution;
}

export function summarizeContributions(rows: Row[]) {
  const groups = new Map<string, Map<string, Row>>();
  for (const row of rows) {
    const key = `${row.product}|${row.temperatureBand}|${row.windBand}|${row.rainBand}|${row.activity}`;
    const group = groups.get(key) || new Map<string, Row>();
    group.set(row.participant, row);
    groups.set(key, group);
  }
  return [...groups.values()].flatMap(group => {
    const records = [...group.values()];
    if (records.length < 30) return [];
    const cold = records.filter(row => row.outcome === 'froze').length;
    const n = records.length, p = cold / n, z = 1.96;
    const lower = (p + z * z / (2 * n) - z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / (1 + z * z / n);
    if (lower < .6) return [];
    const { product, temperatureBand, windBand, rainBand, activity } = records[0];
    // Device contributions are not verified independent people. Never auto-promote.
    return [{ product, temperatureBand, windBand, rainBand, activity, contributors: n, coldRate: Math.round(100 * p), state: 'review-required' as const }];
  });
}

let queue: Promise<unknown> = Promise.resolve();
async function transaction<T>(operation: (rows: Row[]) => { rows: Row[]; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const directory = process.env.WEAR_WEATHER_COMMUNITY_DIR || path.join(process.cwd(), '.data', 'community');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const file = path.join(directory, 'contributions.json');
    let rows: Row[] = [];
    try { const parsed = JSON.parse(await readFile(file, 'utf8')); if (!Array.isArray(parsed)) throw new Error('Invalid community data'); rows = parsed; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const cutoff = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
    const { rows: updated, result } = operation(rows.filter(row => row.day >= cutoff));
    const temporary = `${file}.${randomBytes(6).toString('hex')}.tmp`;
    await writeFile(temporary, JSON.stringify(updated.slice(-10000)), { mode: 0o600 });
    await rename(temporary, file);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const participantHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function contribute(input: Contribution, token: string) {
  const participant = participantHash(token), day = new Date().toISOString().slice(0, 10);
  return transaction(rows => {
    const others = rows.filter(row => !(row.participant === participant && row.product === input.product && row.day === day));
    if (others.filter(row => row.participant === participant && row.day === day).length >= 20) throw new Error('DAILY_LIMIT');
    return { rows: [...others, { ...input, participant, day }], result: { saved: true, state: 'review-required' } };
  });
}
export function deleteContributions(token: string) {
  return transaction(rows => ({ rows: rows.filter(row => row.participant !== participantHash(token)), result: { deleted: true } }));
}
export function communitySummary() { return transaction(rows => ({ rows, result: summarizeContributions(rows) })); }
