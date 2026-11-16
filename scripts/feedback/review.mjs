import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function reviewReports(args, directory = process.env.WEAR_WEATHER_REPORTS_DIR || path.join(process.cwd(), '.data', 'reports')) {
  let id, limit = 20;
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === '--id' && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(args[i + 1] || '')) id = args[i + 1];
    else if (args[i] === '--limit' && /^\d+$/.test(args[i + 1] || '') && Number(args[i + 1]) >= 1 && Number(args[i + 1]) <= 100) limit = Number(args[i + 1]);
    else throw new Error('Use --limit 1..100 or --id <report UUID>.');
  }
  let data;
  try { data = JSON.parse(await readFile(path.join(directory, 'reports.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { total: 0, reports: [] }; throw new Error('Report storage could not be read. Existing files were preserved.'); }
  if (data.version !== 1 || !Array.isArray(data.reports)) throw new Error('Invalid report storage; no changes made.');
  // Explicit projection keeps anti-abuse identifiers out of operator output and backups of listings.
  if (id) {
    const r = data.reports.find(row => row.submissionId === id);
    if (!r) throw new Error('Report not found.');
    return { id: r.submissionId, createdAt: r.createdAt, category: r.category, locale: r.locale, description: r.description, steps: r.steps };
  }
  return { total: data.reports.length, reports: data.reports.slice(-limit).reverse().map(r => ({
    id: r.submissionId, createdAt: r.createdAt, category: r.category, locale: r.locale,
  })) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  reviewReports(process.argv.slice(2)).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    console.error(error.message); process.exitCode = 1;
  });
}
