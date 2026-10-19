import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { catalogPool, closeCatalogPool } from '../../lib/catalog/database';
import { validateCatalogImport } from '../../lib/catalog/validation';
import { publishCatalogImport, rejectCatalogImport, stageCatalogImport } from '../../lib/catalog/imports';
import { publishedCoverage } from '../../lib/catalog/repository';
import { migrateCatalog } from './migrate';

if (existsSync('.env')) process.loadEnvFile('.env');

async function main() {
  const [command,argument,confirmation] = process.argv.slice(2);
  if (command === 'migrate') {
    await migrateCatalog(); console.log('Catalogue schema ready: 32 types; legacy profiles preserved.');
  } else if (command === 'validate' || command === 'stage') {
    if (!argument) throw new Error('JSON file path required');
    if ((await stat(argument)).size > 5 * 1024 * 1024) throw new Error('Import exceeds 5 MiB');
    const validation = validateCatalogImport(JSON.parse(await readFile(argument,'utf8')));
    if (!validation.ok) throw new Error(validation.errors.join('\n'));
    if (command === 'validate') console.log(`Valid: ${validation.value.products.length} products. No database changes.`);
    else console.log(JSON.stringify(await stageCatalogImport(validation.value),null,2));
  } else if (command === 'inspect' || command === 'publish' || command === 'reject') {
    if (!argument || !/^[0-9a-f-]{36}$/i.test(argument)) throw new Error('Batch UUID required');
    if (command === 'inspect') {
      const result = await catalogPool().query('SELECT id,state,created_at,payload FROM catalog.import_batches WHERE id=$1',[argument]);
      if (!result.rowCount) throw new Error('Batch not found');
      console.log(JSON.stringify(result.rows[0],null,2));
    } else {
      if (confirmation !== '--reviewed') throw new Error('Inspect source accuracy and usage permission first; then pass --reviewed');
      console.log(JSON.stringify(command === 'publish' ? await publishCatalogImport(argument) : await rejectCatalogImport(argument)));
    }
  } else if (command === 'coverage') {
    console.table(await publishedCoverage());
  } else throw new Error('Commands: migrate | validate <file> | stage <file> | inspect <uuid> | publish <uuid> --reviewed | reject <uuid> --reviewed | coverage');
}
main().catch(error => {
  // pg errors can contain row data in detail; emit only controlled validation text or a code.
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  console.error(code ? `Catalogue command failed (${code}); check database setup or conflicting identities.` : error instanceof Error ? error.message : 'Catalogue command failed');
  process.exitCode = 1;
}).finally(closeCatalogPool);
