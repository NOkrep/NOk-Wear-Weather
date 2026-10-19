const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateCatalogImport } = require('../lib/catalog/validation.ts');
const { normalizeCatalogText } = require('../lib/catalog/taxonomy.ts');
const manifest = require('../db/imports/local-approved.json');
const registry = require('../db/sources/registry.json');
const fresh = require('../db/imports/multi-source-tees.2026-10-18.json');
const probe = require('../db/sources/printful-probe.2026-10-18.json');
const batches = manifest.batches.map(entry => require(path.join('../db/imports', entry.file)));
const products = batches.flatMap(batch => batch.products);

test('reviewed batches are explicit, valid and globally distinct; candidates never enter the local import list', () => {
  assert.equal(manifest.version, 1);
  assert.equal(new Set(manifest.batches.map(entry => entry.file)).size, manifest.batches.length);
  manifest.batches.forEach((entry, index) => {
    assert.match(entry.file, /^[a-z0-9][a-z0-9.-]*\.json$/);
    assert.ok(!entry.file.includes('..'));
    assert.ok(Date.parse(entry.reviewedAt) <= Date.now());
    const validated = validateCatalogImport(batches[index]);
    assert.equal(validated.ok, true, validated.errors?.join('\n'));
    assert.equal(batches[index].products.length, entry.products);
  });
  assert.equal(products.length, 146);
  assert.equal(new Set(products.map(product => product.id)).size, 146);
  assert.equal(new Set(products.map(product => JSON.stringify([normalizeCatalogText(product.brand), normalizeCatalogText(product.model)]))).size, 146);
  assert.equal(new Set(batches.flatMap(batch => batch.sources.map(source => source.id))).size, 146);
  assert.equal(products.filter(product => product.garmentTypeId === 'short-sleeve-tee').length, 39);
  assert.equal(products.filter(product => product.garmentTypeId === 'long-sleeve-tee').length, 11);
  assert.ok(products.every(product => !['Adidas', 'Bella + Canvas', 'Gildan'].includes(product.brand)));
});

test('four new providers have sourced composition; only the four explicit Stanley GSM claims are added', () => {
  assert.equal(fresh.products.length, 14);
  assert.deepEqual([...new Set(fresh.products.map(product => product.brand))].sort(), ['DeFacto', 'Koton', 'Mavi', 'Stanley/Stella']);
  const knownGsm = Object.fromEntries(fresh.products.filter(product => product.facts.gsm !== null).map(product => [product.id, product.facts.gsm]));
  assert.deepEqual(knownGsm, { 'stanley-sttu169': 180, 'stanley-sttu200': 240, 'stanley-sttm558': 200, 'stanley-sttw219': 180 });
  for (const product of fresh.products) {
    const evidence = product.evidence.find(entry => entry.field === 'composition');
    const source = fresh.sources.find(source => source.id === evidence.sourceId);
    assert.equal(source.kind, 'manufacturer');
    assert.equal(source.url, product.productUrl);
    assert.equal(evidence.basis, 'manufacturer');
    assert.ok(evidence.note.length > 40);
    assert.equal(product.evidence.some(entry => entry.field === 'gsm'), product.facts.gsm !== null);
    assert.ok(product.evidence.every(entry => entry.basis === 'manufacturer'));
    assert.deepEqual(product.facts.composition.map(part => part.part), ['shell']);
    assert.equal(product.facts.composition[0].fibers.reduce((sum, fiber) => sum + fiber.percent, 0), 100);
    assert.ok(product.name.tr && product.name.en);
  }
  const mavi = fresh.products.find(product => product.id === 'mavi-0610277');
  assert.deepEqual(Object.fromEntries(mavi.facts.composition[0].fibers.map(fiber => [fiber.name, fiber.percent])), { Polyester: 56, Cotton: 41, Elastane: 3 });
});

test('prices, performance, media and unresolved variants are not invented from page text or telemetry', () => {
  for (const product of fresh.products) {
    assert.equal(product.technical, null);
    for (const key of ['warmth', 'waterResistance', 'windResistance', 'breathability']) assert.equal(product.facts[key], null);
    assert.deepEqual(product.offers, []);
    assert.equal(product.variants.length, 1);
    for (const key of ['gtin', 'size', 'sku', 'color']) assert.equal(product.variants[0][key], null);
    assert.ok(product.variants[0].id.endsWith('-unresolved'));
    assert.equal(product.image, undefined);
  }
});

test('every approved product has exactly one provider and future sources have actionable prerequisites', () => {
  const ids = registry.sources.flatMap(source => source.catalogProductIds);
  assert.deepEqual([...ids].sort(), products.map(product => product.id).sort());
  assert.equal(new Set(registry.sources.map(source => source.id)).size, registry.sources.length);
  for (const batch of batches) for (const source of batch.sources) {
    assert.ok(registry.sources.some(provider => provider.status === 'curated' && provider.domains.includes(new URL(source.url).hostname)));
  }
  for (const id of ['defacto-tr', 'koton-tr', 'mavi-tr', 'stanley-stella-eu', 'adidas-tr', 'printful', 'awin', 'gs1', 'trendyol', 'hepsiburada']) {
    const source = registry.sources.find(source => source.id === id);
    assert.ok(source, id);
    assert.ok(source.nextSteps.length && source.references.length);
    assert.equal(source.liveSync, false);
    assert.equal(source.media.downloaded, false);
    if (source.status !== 'curated') assert.deepEqual(source.catalogProductIds, []);
  }
  for (const candidate of registry.excludedCandidates) {
    assert.ok(candidate.reason && candidate.revisitWhen);
    assert.ok(!products.some(product => product.productUrl === candidate.url));
  }
});

test('anonymous Printful probe is research only and retains variant-specific material observations', () => {
  assert.equal(probe.httpStatus, 200);
  assert.equal(probe.authentication, 'none');
  assert.equal(probe.publication, 'research-only');
  assert.equal(probe.imagesDownloaded, false);
  assert.equal(probe.products.length, 2);
  assert.ok(probe.productListObservedCount > probe.products.length);
  const bella = probe.products.find(product => product.apiProductId === 356);
  const white = bella.selectedVariantObservations.find(variant => variant.color === 'White');
  const heather = bella.selectedVariantObservations.find(variant => variant.color === 'Athletic Heather');
  assert.notDeepEqual(white.material, heather.material);
  assert.ok(bella.selectedVariantObservations.every(variant => !('image' in variant) && !('price' in variant)));
});

test('all approved batches publish idempotently into a disposable PostgreSQL catalogue', { skip: !process.env.CATALOG_SOURCE_TEST_DATABASE_URL }, async () => {
  const target = new URL(process.env.CATALOG_SOURCE_TEST_DATABASE_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(target.hostname));
  assert.equal(target.pathname, '/weathrobe_source_test');
  const oldUrl = process.env.DATABASE_URL, oldPassword = process.env.CATALOG_READER_PASSWORD;
  process.env.DATABASE_URL = target.toString(); delete process.env.CATALOG_READER_PASSWORD;
  const { migrateCatalog } = require('../scripts/catalog/migrate.ts');
  const { catalogPool, closeCatalogPool } = require('../lib/catalog/database.ts');
  const { stageCatalogImport, publishCatalogImport } = require('../lib/catalog/imports.ts');
  const { searchPublishedProducts, publishedCoverage } = require('../lib/catalog/repository.ts');
  try {
    await migrateCatalog();
    const pool = catalogPool();
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.products')).rows[0].n, 0, 'use a new empty disposable DB');
    for (const batch of batches) {
      const staged = await stageCatalogImport(batch);
      assert.equal((await stageCatalogImport(batch)).id, staged.id);
      await publishCatalogImport(staged.id);
      assert.equal((await publishCatalogImport(staged.id)).alreadyPublished, true);
    }
    const all = await searchPublishedProducts({ query: '', limit: 1000, offset: 0 });
    assert.equal(all.total, 146);
    assert.equal(all.products.length, 146);
    assert.equal(all.sources.length, 146);
    for (const product of all.products) {
      const original = products.find(original => original.id === product.id);
      const canonicalFacts = facts => ({ ...facts, composition: facts.composition?.map(part => ({ ...part, fibers: [...part.fibers].sort((a, b) => a.name.localeCompare(b.name)) })).sort((a, b) => a.part.localeCompare(b.part)) ?? null });
      assert.deepEqual(canonicalFacts(product.facts), canonicalFacts(original.facts));
      assert.deepEqual(product.evidence, original.evidence);
      assert.equal(product.variants[0].gtin, null);
    }
    assert.equal((await searchPublishedProducts({ query: 'Mavi', limit: 12, offset: 0 })).total, 4);
    assert.equal((await searchPublishedProducts({ query: '', type: 'long-sleeve-tee', limit: 12, offset: 0 })).total, 11);
    assert.equal((await searchPublishedProducts({ query: '', limit: 12, offset: 12 })).products.length, 12);
    const coverage = await publishedCoverage();
    assert.equal(coverage.length, 36);
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.garment_types WHERE target_min=100 AND target_max=100')).rows[0].n, 36);
    const beforeMigration = await pool.query('SELECT id,model,import_batch_id FROM catalog.products ORDER BY id');
    await migrateCatalog();
    assert.deepEqual((await pool.query('SELECT id,model,import_batch_id FROM catalog.products ORDER BY id')).rows, beforeMigration.rows);
    assert.equal(coverage.filter(type => type.products > 0).length, 18);
    for (const type of ['sweatshirt', 'fleece', 'woven-trousers', 'rain-jacket', 'running-shoes']) {
      const found = await searchPublishedProducts({ query: '', type, limit: 12, offset: 0 });
      assert.equal(found.total, 10, type);
      assert.equal(found.products.length, 10, type);
    }
    assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.legacy_profiles')).rows[0].n, 23);
  } finally {
    await closeCatalogPool();
    if (oldUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = oldUrl;
    if (oldPassword === undefined) delete process.env.CATALOG_READER_PASSWORD; else process.env.CATALOG_READER_PASSWORD = oldPassword;
  }
});
