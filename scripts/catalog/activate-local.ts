import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { closeCatalogPool } from '../../lib/catalog/database';
import { migrateCatalog } from './migrate';
import { stageCatalogImport, publishCatalogImport } from '../../lib/catalog/imports';
import { validateCatalogImport } from '../../lib/catalog/validation';

/** Explicit local activation, never invoked implicitly by the app or a migration. */
async function main() {
  // This explicit list is reviewed in the repository; do not glob every candidate JSON file.
  const manifest = JSON.parse(await readFile('db/imports/local-approved.json', 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.batches) || !manifest.batches.length || manifest.batches.length > 100) throw new Error('Invalid local import list');
  const seen = new Set<string>();
  const approved = [];
  for (const entry of manifest.batches) {
    if (typeof entry.file !== 'string' || !/^[a-z0-9][a-z0-9.-]*\.json$/.test(entry.file) || entry.file.includes('..') || seen.has(entry.file)) throw new Error('Invalid or duplicate local import path');
    seen.add(entry.file);
    if (typeof entry.reviewedAt !== 'string' || !Number.isFinite(Date.parse(entry.reviewedAt)) || Date.parse(entry.reviewedAt) > Date.now() || !Number.isInteger(entry.products) || entry.products < 1) throw new Error('Local import review/count missing');
    const validation = validateCatalogImport(JSON.parse(await readFile(`db/imports/${entry.file}`, 'utf8')));
    if (!validation.ok) throw new Error(`Invalid reviewed batch: ${entry.file}`);
    if (validation.value.products.length !== entry.products) throw new Error(`Product count mismatch: ${entry.file}`);
    approved.push(validation.value);
  }
  if (!existsSync('.env')) {
    const setup = spawnSync(process.execPath, ['scripts/catalog/setup.mjs'], { stdio: 'inherit', windowsHide: true });
    if (setup.status !== 0) throw new Error('Could not initialize local settings');
  }
  process.loadEnvFile('.env');
  const owner = process.env.POSTGRES_PASSWORD, reader = process.env.CATALOG_READER_PASSWORD;
  if (!owner || !reader || !/^[a-zA-Z0-9]{24,128}$/.test(owner) || !/^[a-zA-Z0-9]{24,128}$/.test(reader) || owner === reader) {
    throw new Error('Set two different 24–128 character alphanumeric POSTGRES_PASSWORD and CATALOG_READER_PASSWORD values; existing settings were preserved.');
  }
  const port = Number(process.env.LOCAL_DB_PORT ?? 55442);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid LOCAL_DB_PORT');
  const readerUrl = `postgresql://catalog_reader:${reader}@127.0.0.1:${port}/weathrobe`;
  if (process.env.DATABASE_URL && process.env.DATABASE_URL !== readerUrl) throw new Error('A different DATABASE_URL is configured; refusing to replace it.');
  // A higher priority Next.js setting must not silently point the preview elsewhere.
  if (existsSync('.env.local') && /^\s*DATABASE_URL\s*=/m.test(await readFile('.env.local', 'utf8'))) {
    throw new Error('DATABASE_URL exists in .env.local; resolve its precedence before local activation. No existing setting was overwritten.');
  }
  const docker = spawnSync('docker', ['compose', '-p', 'weathrobe-local', '-f', 'docker-compose.yml', '-f', 'docker-compose.local.yml', 'up', '-d', '--wait', 'db'], {
    stdio: 'inherit', windowsHide: true,
  });
  if (docker.status !== 0) throw new Error('Local PostgreSQL did not start');
  process.env.DATABASE_URL = `postgresql://weathrobe_owner:${owner}@127.0.0.1:${port}/weathrobe`;
  await migrateCatalog();
  let published = 0;
  for (const payload of approved) {
    const batch = await stageCatalogImport(payload);
    const result = await publishCatalogImport(batch.id);
    if (!result.alreadyPublished) published += payload.products.length;
  }
  const before = await readFile('.env', 'utf8');
  const line = `DATABASE_URL="${readerUrl}"`;
  const after = /^\s*DATABASE_URL\s*=/m.test(before)
    ? before.replace(/^\s*DATABASE_URL\s*=.*$/m, line)
    : `${before.replace(/\s*$/, '')}\n\n# Local catalogue: read-only application connection\n${line}\n`;
  if (after !== before) await writeFile('.env', after, { mode: 0o600 });
  const total = approved.reduce((sum, batch) => sum + batch.products.length, 0);
  console.log(`Local catalogue ready: ${total} reviewed products across ${approved.length} batches, persistent volume, database port ${port}. ${published ? `${published} new products published.` : 'Existing publications preserved.'} Restart Next.js only if the connection settings changed. Credentials were not printed.`);
}
main().catch(error => {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  console.error(code ? `Local activation failed (${code}); settings and existing products were preserved.` : error instanceof Error ? error.message : 'Local activation failed');
  process.exitCode = 1;
}).finally(closeCatalogPool);
