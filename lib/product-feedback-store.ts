import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { sameProductFeedback, validateProductFeedback, type ProductFeedbackRecord, type ProductFeedbackSubmission } from './product-feedback';

export class ProductFeedbackError extends Error {
  constructor(public code: 'RATE_LIMIT' | 'FULL' | 'CONFLICT' | 'INVALID' | 'BUSY') { super(code); }
}
interface Ledger {
  version: 1;
  reports: ProductFeedbackRecord[];
  limits: { client: string; at: number }[];
}
let queue: Promise<unknown> = Promise.resolve();
let pending = 0;

/** shortcut: one Node writer, matching the current single-replica Compose deployment.
 * Before adding replicas, move this transaction and its limits into a shared database.
 */
export async function saveProductFeedback(input: ProductFeedbackSubmission, token: string, now = Date.now(),
  directory = process.env.WEAR_WEATHER_REPORTS_DIR || path.join(process.cwd(), '.data', 'reports')) {
  const validated = validateProductFeedback(input);
  if (!validated || !/^[a-f0-9]{64}$/.test(token)) throw new ProductFeedbackError('INVALID');
  if (pending >= 20) throw new ProductFeedbackError('BUSY');
  pending++;
  const run = queue.then(async () => {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const file = path.join(directory, 'reports.json');
    let ledger: Ledger = { version: 1, reports: [], limits: [] };
    try {
      ledger = JSON.parse(await readFile(file, 'utf8'));
      if (ledger.version !== 1 || !Array.isArray(ledger.reports) || !Array.isArray(ledger.limits)
        || ledger.reports.some(r => !r || !Number.isFinite(Date.parse(r.createdAt))
          || !validateProductFeedback({ version: r.version, submissionId: r.submissionId, category: r.category,
            description: r.description, steps: r.steps, locale: r.locale, consent: r.consent }))
        || ledger.limits.some(l => !/^[a-f0-9]{64}$/.test(l.client) || !Number.isFinite(l.at))) {
        throw new Error('Invalid report storage');
      }
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const existing = ledger.reports.find(r => r.submissionId === validated.submissionId);
    if (existing) {
      if (!sameProductFeedback(existing, validated)) throw new ProductFeedbackError('CONFLICT');
      return { id: existing.submissionId, createdAt: existing.createdAt, duplicate: true };
    }
    if (ledger.reports.length >= 10000) throw new ProductFeedbackError('FULL');
    const client = createHash('sha256').update(token).digest('hex');
    const limits = ledger.limits.filter(l => l.at > now - 86400000);
    const minute = limits.filter(l => l.at > now - 60000);
    if (limits.length >= 200 || minute.length >= 20 || limits.filter(l => l.client === client).length >= 10
      || minute.filter(l => l.client === client).length >= 3) throw new ProductFeedbackError('RATE_LIMIT');
    const report: ProductFeedbackRecord = { ...validated, createdAt: new Date(now).toISOString() };
    const updated: Ledger = { version: 1, reports: [...ledger.reports, report], limits: [...limits, { client, at: now }] };
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      const handle = await open(temporary, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(updated), 'utf8'); await handle.sync(); }
      finally { await handle.close(); }
      await rename(temporary, file);
    } catch (error) { await unlink(temporary).catch(() => {}); throw error; }
    return { id: report.submissionId, createdAt: report.createdAt, duplicate: false };
  });
  queue = run.catch(() => {});
  try { return await run; } finally { pending--; }
}
