import { readFile, writeFile } from 'node:fs/promises';
import { GARMENT_TYPES, PILOT_TARGET, normalizeCatalogText } from '../../lib/catalog/taxonomy';
import { validateCatalogImport } from '../../lib/catalog/validation';

/** Counts only validated, explicitly reviewed real models. No generated designs or legacy profiles. */
export async function catalogProgress() {
  const manifest = JSON.parse(await readFile('db/imports/local-approved.json', 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.batches)) throw new Error('Invalid manifest');
  const ids = new Set<string>(), models = new Set<string>(), files = new Set<string>();
  const counts = new Map<string, number>();
  for (const entry of manifest.batches) {
    if (typeof entry.file !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.json$/.test(entry.file) || entry.file.includes('..') || files.has(entry.file)) throw new Error('Invalid import path');
    files.add(entry.file);
    if (!Number.isFinite(Date.parse(entry.reviewedAt)) || Date.parse(entry.reviewedAt) > Date.now()) throw new Error('Unreviewed import');
    const checked = validateCatalogImport(JSON.parse(await readFile('db/imports/' + entry.file, 'utf8')));
    if (!checked.ok) throw new Error(checked.errors.join('\n'));
    if (checked.value.products.length !== entry.products) throw new Error('Manifest count mismatch');
    for (const product of checked.value.products) {
      const model = normalizeCatalogText(product.brand) + '\u0000' + normalizeCatalogText(product.model);
      if (ids.has(product.id) || models.has(model)) throw new Error('Duplicate real model: ' + product.id);
      ids.add(product.id); models.add(model);
      counts.set(product.garmentTypeId, (counts.get(product.garmentTypeId) ?? 0) + 1);
    }
  }
  const rows = GARMENT_TYPES.map(type => ({ id: type.id, tr: type.tr, products: counts.get(type.id) ?? 0, target: PILOT_TARGET.minimum, remaining: Math.max(0, PILOT_TARGET.minimum - (counts.get(type.id) ?? 0)) }));
  return { products: ids.size, target: rows.reduce((sum,row) => sum + row.target,0), remaining: rows.reduce((sum,row) => sum + row.remaining,0), types: rows.length, completedTypes: rows.filter(row => row.remaining === 0).length, batches: files.size, rows };
}
async function main() {
  const report = await catalogProgress();
  if (process.argv.includes('--write')) {
    const md = '# Gerçek ürün hedef ilerlemesi\n\nÜretim: ' + new Date().toISOString() + '\n\nİncelenmiş aktarım listesi: **' + report.products + ' / ' + report.target + '** gerçek model. Tamamlanan tür: ' + report.completedTypes + ' / ' + report.types + '. Kalan: ' + report.remaining + '.\n\nBu rapor onaylı JSON gruplarını sayar; veritabanına yayın durumu ayrıca kontrol edilir. Renk/beden varyantları, 23 eski öneri profili ve temsili çizimler sayıya dahil değildir.\n\n| Tür | Gerçek model | Hedef | Kalan |\n|---|---:|---:|---:|\n' + report.rows.map(row => '| ' + row.tr + ' | ' + row.products + ' | ' + row.target + ' | ' + row.remaining + ' |').join('\n') + '\n\nYenile: `node node_modules/tsx/dist/cli.mjs scripts/catalog/progress.ts --write`. Yeni veriler kaynak gözlemi, alan kanıtı, tekil marka/model kontrolü ve kontrollü yayından geçmelidir.\n';
    await writeFile('db/sources/catalog-progress.md', md);
  }
  console.log(process.argv.includes('--json') ? JSON.stringify(report, null, 2) : `${report.products} / ${report.target} sourced models; ${report.remaining} remaining; ${report.completedTypes} / ${report.types} types complete; ${report.batches} reviewed batches.`);
}
if (process.argv[1]?.replace(/\\/g,'/').endsWith('/progress.ts')) main().catch(error => { console.error(error instanceof Error ? error.message : 'Progress failed'); process.exitCode = 1; });

