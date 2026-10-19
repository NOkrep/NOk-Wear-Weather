const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { fixture } = require('./catalog-fixture.cjs');
const { validateCatalogImport } = require('../lib/catalog/validation.ts');
const { GARMENT_TYPES, findGarmentTypes, LEGACY_TYPE_MAP, normalizeCatalogText } = require('../lib/catalog/taxonomy.ts');
const { LEGACY_GARMENT_CATALOG, VERIFIED_GARMENT_CATALOG, searchGarmentCatalog } = require('../lib/clothing-catalog.ts');

test('36 stable bilingual types include dress coverage and five distinct accessories', () => {
  assert.equal(GARMENT_TYPES.length,36);
  assert.equal(new Set(GARMENT_TYPES.map(t => t.id)).size,36);
  assert.deepEqual(GARMENT_TYPES.find(t => t.id === 'dress').slots,['torso','upper-legs']);
  assert.equal(GARMENT_TYPES.filter(t => t.group === 'accessory').length,5);
  for (const type of GARMENT_TYPES) assert.ok(type.tr && type.en && type.slots.length);
  assert.equal(findGarmentTypes('İÇLİK')[0].id,'thermal-top');
  assert.equal(normalizeCatalogText('YAĞMURLUK'),'yagmurluk');
});
test('legacy IDs and aliases survive without being promoted into real products', () => {
  assert.equal(LEGACY_GARMENT_CATALOG.length,23);
  assert.equal(VERIFIED_GARMENT_CATALOG,LEGACY_GARMENT_CATALOG);
  assert.equal(LEGACY_TYPE_MAP['cat-mid-1'],'shirt');
  assert.equal(LEGACY_TYPE_MAP['cat-mid-5'],'fleece');
  assert.equal(LEGACY_TYPE_MAP['cat-bot-3'],undefined);
  assert.equal(searchGarmentCatalog('İÇLİK').length,2);
});
test('unknown remains null and valid imports are not mutated', () => {
  const input = fixture(), before = JSON.stringify(input), result = validateCatalogImport(input);
  assert.equal(result.ok,true);
  assert.equal(result.value.products[0].facts.waterResistance,null);
  assert.equal(JSON.stringify(input),before);
});
test('known facts require field evidence and composition totals for each component', () => {
  const input = fixture(), p = input.products[0];
  p.facts.composition = [{ part: 'shell', fibers: [{ name: 'Cotton', percent: 80 },{ name: 'Polyester', percent: 20 }] }];
  assert.equal(validateCatalogImport(input).ok,false);
  p.evidence.push({ field: 'composition', sourceId: 'fixture-source', basis: 'manufacturer' });
  assert.equal(validateCatalogImport(input).ok,true);
  p.facts.composition[0].fibers[0].percent = 60;
  assert.equal(validateCatalogImport(input).ok,false);
});
test('estimates cannot masquerade as fabric or lab measurements', () => {
  const input = fixture(), p = input.products[0];
  p.facts.warmth = 2;
  p.evidence.push({ field: 'warmth', sourceId: 'fixture-source', basis: 'estimate', note: 'Initial profile estimate; not measured.' });
  assert.equal(validateCatalogImport(input).ok,true);
  p.evidence[1].basis = 'measurement';
  assert.equal(validateCatalogImport(input).ok,false);
  p.evidence[1].basis = 'label';
  assert.equal(validateCatalogImport(input).ok,false);
});
test('invalid checksum, duplicate GTIN and duplicate brand/model are rejected', () => {
  const input = fixture(), p = input.products[0];
  p.variants[0].gtin = '04006381333932';
  assert.equal(validateCatalogImport(input).ok,false);
  p.variants[0].gtin = '04006381333931';
  p.variants.push({ ...p.variants[0], id: 'fixture-coat-l', size: 'L' });
  assert.equal(validateCatalogImport(input).ok,false);
  p.variants.pop();
  input.products.push({ ...structuredClone(p), id: 'other', variants: [{ ...p.variants[0], id: 'other-variant', gtin: null }], offers: [] });
  assert.equal(validateCatalogImport(input).ok,false);
});
test('offers require same-product variant, known source, numeric price and observed date', () => {
  for (const [field,value] of [['variantId','other-product'],['sourceId','missing'],['price',-1],['price','100'],['currency','TRY;'],['checkedAt','2099-01-01T00:00:00Z']]) {
    const input = fixture(); input.products[0].offers[0][field] = value;
    assert.equal(validateCatalogImport(input).ok,false,field);
  }
});
test('unknown fields, credentials in URLs, incomplete facts and malformed arrays fail safely', () => {
  for (const input of [null,[],{}, { ...fixture(), sources: 'bad' }]) assert.equal(validateCatalogImport(input).ok,false);
  const input = fixture(); input.products[0].location = 'must not be imported';
  assert.equal(validateCatalogImport(input).ok,false);
  delete input.products[0].location;
  input.sources[0].url = 'https://user:secret@example.com/product';
  assert.equal(validateCatalogImport(input).ok,false);
  input.sources[0].url = 'https://example.invalid/product';
  delete input.products[0].facts.gsm;
  assert.equal(validateCatalogImport(input).ok,false);
});
