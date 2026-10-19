const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { validateCatalogImport } = require('../lib/catalog/validation.ts');
const { normalizeCatalogText } = require('../lib/catalog/taxonomy.ts');
const file = path.join(__dirname, '../db/imports/short-sleeve-tees.tr.2026-10-18.json');
const batch = JSON.parse(fs.readFileSync(file, 'utf8'));

test('first real batch validates and contains ten distinct short sleeve models', () => {
  const validation = validateCatalogImport(batch);
  assert.equal(validation.ok, true, validation.errors?.join('\n'));
  assert.equal(batch.products.length, 10);
  assert.ok(batch.products.every(product => product.garmentTypeId === 'short-sleeve-tee'));
  const models = batch.products.map(product => JSON.stringify([normalizeCatalogText(product.brand), normalizeCatalogText(product.model)]));
  assert.equal(new Set(models).size, 10);
  assert.equal(new Set(batch.products.map(product => product.productUrl)).size, 10);
});

test('each model has a matching official source and main-fabric evidence', () => {
  assert.equal(batch.sources.length, 10);
  for (const product of batch.products) {
    const composition = product.evidence.find(evidence => evidence.field === 'composition');
    const source = batch.sources.find(source => source.id === composition.sourceId);
    assert.equal(source.url, product.productUrl);
    assert.ok(['www.decathlon.com.tr', 'www.lcw.com', 'www.marksandspencer.com.tr'].includes(new URL(source.url).hostname));
    assert.equal(composition.basis, 'manufacturer');
    assert.ok(product.evidence.some(evidence => evidence.field === 'name' && evidence.sourceId === source.id));
    assert.deepEqual(product.facts.composition.map(component => component.part), ['shell']);
    const fibers = product.facts.composition[0].fibers;
    assert.equal(fibers.reduce((sum, fiber) => sum + fiber.percent, 0), 100);
    assert.ok(composition.note.length > 20);
  }
});

test('GSM is stored only where explicitly published, never from garment weight', () => {
  const known = Object.fromEntries(batch.products.filter(product => product.facts.gsm !== null).map(product => [product.id, product.facts.gsm]));
  assert.deepEqual(known, { 'domyos-332540': 190, 'domyos-338648': 190, 'norfolk-ragnar': 150 });
  for (const product of batch.products) assert.equal(product.evidence.some(evidence => evidence.field === 'gsm'), product.facts.gsm !== null);
  assert.equal(batch.products.find(product => product.id === 'kiprun-355949').facts.gsm, null);
});

test('unresolved variants, performance and prices stay unknown', () => {
  for (const product of batch.products) {
    for (const field of ['warmth', 'waterResistance', 'windResistance', 'breathability']) assert.equal(product.facts[field], null);
    assert.equal(product.technical, null);
    assert.deepEqual(product.offers, []);
    assert.equal(product.variants.length, 1);
    for (const field of ['gtin', 'size', 'color', 'sku']) assert.equal(product.variants[0][field], null);
    assert.ok(product.variants[0].id.endsWith('-unresolved'));
    assert.ok(product.evidence.every(evidence => evidence.basis !== 'measurement' && evidence.basis !== 'label' && evidence.basis !== 'estimate'));
  }
});

test('different running models and trim composition are not merged', () => {
  const byId = Object.fromEntries(batch.products.map(product => [product.id, product]));
  const fibers = id => Object.fromEntries(byId[id].facts.composition[0].fibers.map(fiber => [fiber.name, fiber.percent]));
  assert.deepEqual(fibers('kiprun-355949'), { Polyester: 72, Polyamide: 19, Elastane: 9 });
  assert.deepEqual(fibers('kiprun-340992'), { Polyester: 68, Polyamide: 32 });
  assert.deepEqual(fibers('domyos-332540'), { Cotton: 100 });
  assert.deepEqual(fibers('lcw-0s2159z8'), { Cotton: 96, Elastane: 4 });
  assert.deepEqual(fibers('ms-t41002101c'), { Modal: 50, Linen: 50 });
});

test('real batch roundtrips through a disposable PostgreSQL database', { skip: !process.env.CATALOG_DATA_TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.CATALOG_DATA_TEST_DATABASE_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.equal(url.pathname, '/weathrobe_catalog_data_test');
  const oldUrl = process.env.DATABASE_URL, oldPassword = process.env.CATALOG_READER_PASSWORD;
  process.env.DATABASE_URL = url.toString(); delete process.env.CATALOG_READER_PASSWORD;
  const { migrateCatalog } = require('../scripts/catalog/migrate.ts');
  const { catalogPool, closeCatalogPool } = require('../lib/catalog/database.ts');
  const { stageCatalogImport, publishCatalogImport } = require('../lib/catalog/imports.ts');
  const { searchPublishedProducts, publishedCoverage } = require('../lib/catalog/repository.ts');
  try {
    await migrateCatalog(); await migrateCatalog();
    const pool = catalogPool();
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM catalog.products')).rows[0].n, 0, 'use a new, empty test DB');
    const staged = await stageCatalogImport(batch);
    assert.equal((await stageCatalogImport(batch)).id, staged.id);
    const search = { query: '', type: 'short-sleeve-tee', countryCode: 'TR', limit: 100, offset: 0 };
    assert.equal((await searchPublishedProducts(search)).total, 0, 'drafts must not appear in search');
    const published = await publishCatalogImport(staged.id);
    assert.equal(published.products, 10);
    assert.equal((await publishCatalogImport(staged.id)).alreadyPublished, true);
    const result = await searchPublishedProducts(search);
    assert.equal(result.total, 10); assert.equal(result.sources.length, 10);
    for (const returned of result.products) {
      const original = batch.products.find(product => product.id === returned.id);
      assert.equal(returned.facts.gsm, original.facts.gsm);
      const recipe = product => Object.fromEntries(product.facts.composition[0].fibers.map(fiber => [fiber.name, fiber.percent]));
      assert.deepEqual(recipe(returned), recipe(original));
      assert.equal(returned.facts.warmth, null); assert.equal(returned.variants[0].gtin, null); assert.deepEqual(returned.offers, []);
    }
    assert.equal((await searchPublishedProducts({ ...search, query: 'merino' })).total, 1);
    assert.equal((await searchPublishedProducts({ ...search, query: 'keten' })).total, 1);
    const page = await searchPublishedProducts({ ...search, limit: 3, offset: 3 });
    assert.equal(page.products.length, 3); assert.equal(page.total, 10);
    const coverage = await publishedCoverage();
    assert.equal(coverage.length, 36);
    assert.equal(coverage.find(type => type.garmentTypeId === 'short-sleeve-tee').products, 10);
    assert.equal(coverage.filter(type => type.products > 0).length, 1);
    assert.equal((await pool.query('SELECT count(*)::integer AS n FROM catalog.legacy_profiles')).rows[0].n, 23);
    console.log('Real batch PostgreSQL QA: 10 products, 10 sources, 36 types, 23 legacy profiles preserved.');
  } finally {
    await closeCatalogPool();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    if (oldPassword === undefined) delete process.env.CATALOG_READER_PASSWORD; else process.env.CATALOG_READER_PASSWORD = oldPassword;
  }
});
