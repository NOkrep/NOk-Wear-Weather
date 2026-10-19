import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { closeCatalogPool } from '../../lib/catalog/database';
import { stageCatalogImport, publishCatalogImport } from '../../lib/catalog/imports';
import { validateCatalogImport } from '../../lib/catalog/validation';
import { normalizeCatalogText, GARMENT_TYPES } from '../../lib/catalog/taxonomy';
import type { CatalogImport } from '../../lib/catalog/model';

async function jsonFile(file: string) {
  const info = await lstat(file);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 5 * 1024 * 1024) throw new Error('Reviewed input must be a regular JSON file smaller than 5 MiB.');
  return JSON.parse(await readFile(file, 'utf8'));
}

/** Preflight every approved batch before any database access; candidates are never globbed. */
export async function loadReviewedCatalog(directory = process.cwd()) {
  const base = path.join(path.resolve(directory), 'db', 'imports');
  const manifest = await jsonFile(path.join(base, 'local-approved.json'));
  if (manifest.version !== 1 || !Array.isArray(manifest.batches) || !manifest.batches.length || manifest.batches.length > 100) throw new Error('Invalid reviewed import manifest.');
  const files = new Set<string>(), products = new Set<string>(), identities = new Set<string>(), variants = new Set<string>(), gtins = new Set<string>();
  const batches: { file: string; payload: CatalogImport }[] = [];
  for (const entry of manifest.batches) {
    if (!entry || typeof entry.file !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.json$/.test(entry.file) || entry.file.includes('..') || files.has(entry.file)) throw new Error('Invalid or duplicate reviewed import path.');
    files.add(entry.file);
    if (typeof entry.reviewedAt !== 'string' || !Number.isFinite(Date.parse(entry.reviewedAt)) || Date.parse(entry.reviewedAt) > Date.now() || !Number.isInteger(entry.products) || entry.products < 1) throw new Error('Reviewed date and product count are required.');
    const validation = validateCatalogImport(await jsonFile(path.join(base, entry.file)));
    if (!validation.ok || validation.value.products.length !== entry.products) throw new Error(`Invalid reviewed data or count: ${entry.file}`);
    for (const product of validation.value.products) {
      const identity = JSON.stringify([normalizeCatalogText(product.brand), normalizeCatalogText(product.model)]);
      if (products.has(product.id) || identities.has(identity)) throw new Error('Duplicate product identity across reviewed batches.');
      products.add(product.id); identities.add(identity);
      for (const variant of product.variants) {
        if (variants.has(variant.id) || (variant.gtin !== null && gtins.has(variant.gtin))) throw new Error('Duplicate variant or GTIN across reviewed batches.');
        variants.add(variant.id);
        if (variant.gtin !== null) gtins.add(variant.gtin);
      }
    }
    batches.push({ file: entry.file, payload: validation.value });
  }
  return { batches, products: products.size, types: GARMENT_TYPES.length };
}

export async function importReviewedCatalog(directory = process.cwd()) {
  const reviewed = await loadReviewedCatalog(directory);
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be supplied by the server tools container.');
  let published = 0;
  for (const { payload } of reviewed.batches) {
    const staged = await stageCatalogImport(payload);
    const result = await publishCatalogImport(staged.id);
    if (!result.alreadyPublished) published += payload.products.length;
  }
  return { products: reviewed.products, batches: reviewed.batches.length, types: reviewed.types, newlyPublished: published };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--check', '--reviewed'].includes(args[0])) throw new Error('Usage: node --import tsx scripts/catalog/import-reviewed.ts --check | --reviewed');
  if (args[0] === '--check') {
    const result = await loadReviewedCatalog();
    console.log(`Validated ${result.products} reviewed products in ${result.batches.length} batches; taxonomy has ${result.types} types. No database changes.`);
  } else console.log(JSON.stringify(await importReviewedCatalog()));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/catalog/import-reviewed.ts')) {
  main().catch(error => {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    console.error(code ? `Reviewed import failed (${code}); credentials were not printed. Completed batches can be retried safely.` : error instanceof Error ? error.message : 'Reviewed import failed.');
    process.exitCode = 1;
  }).finally(closeCatalogPool);
}
