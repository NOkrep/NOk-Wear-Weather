const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
test('restored pre-expansion catalogue migrates 32 to 36 types without changing 74 products, source facts or publication hashes', {skip: !process.env.CATALOG_MIGRATION_TEST_DATABASE_URL}, async () => {
  const target = new URL(process.env.CATALOG_MIGRATION_TEST_DATABASE_URL);
  assert.ok(['127.0.0.1','localhost'].includes(target.hostname));
  assert.equal(target.pathname,'/weathrobe_migration_test');
  const oldUrl=process.env.DATABASE_URL, oldPassword=process.env.CATALOG_READER_PASSWORD;
  process.env.DATABASE_URL=target.toString(); delete process.env.CATALOG_READER_PASSWORD;
  const { catalogPool, closeCatalogPool } = require('../lib/catalog/database.ts');
  const { migrateCatalog } = require('../scripts/catalog/migrate.ts');
  const pool=catalogPool();
  const snapshot=async () => {
    const tables=['products','sources','materials','field_evidence','variants','offers','legacy_profiles','import_batches'];
    const output={};
    for(const name of tables) output[name]=(await pool.query('SELECT row_to_json(t)::text AS data FROM catalog.'+name+' t ORDER BY row_to_json(t)::text')).rows;
    return output;
  };
  try {
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.products')).rows[0].n,74);
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.garment_types')).rows[0].n,32);
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.garment_types WHERE target_min=10 AND target_max=15')).rows[0].n,32);
    const before=await snapshot();
    await migrateCatalog(); await migrateCatalog();
    assert.deepEqual(await snapshot(),before);
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.garment_types WHERE target_min=100 AND target_max=100')).rows[0].n,36);
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.legacy_profiles')).rows[0].n,23);
    const aliases=(await pool.query("SELECT aliases FROM catalog.garment_types WHERE id='shirt'")).rows[0].aliases;
    assert.ok(!aliases.includes('polo') && !aliases.includes('blouse'));
  } finally {
    await closeCatalogPool();
    if(oldUrl===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=oldUrl;
    if(oldPassword===undefined)delete process.env.CATALOG_READER_PASSWORD;else process.env.CATALOG_READER_PASSWORD=oldPassword;
  }
});

