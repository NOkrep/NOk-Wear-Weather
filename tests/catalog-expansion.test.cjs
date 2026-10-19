const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { validateCatalogImport } = require('../lib/catalog/validation.ts');
const { catalogProductToWardrobe, canRankForWeather } = require('../lib/catalog-wardrobe.ts');
const types = ['sweatshirt', 'fleece', 'woven-trousers', 'rain-jacket', 'running-shoes'];
const batches = types.map(type => require('../db/imports/' + type + '.2026-10-18.json'));
const products = batches.flatMap(batch => batch.products);
const byId = id => products.find(product => product.id === id);
const fibers = (id, part = 'shell') => Object.fromEntries(byId(id).facts.composition.find(component => component.part === part).fibers.map(fiber => [fiber.name, fiber.percent]));

test('five complete pilot groups contain fifty distinct official models, never fifty colours', () => {
  assert.equal(products.length, 50);
  const sourceUrls = batches.flatMap(batch => batch.sources.map(source => source.url));
  assert.equal(new Set(sourceUrls).size, 50);
  const decathlonCodes = sourceUrls.filter(url => url.includes('decathlon.com.tr')).map(url => url.match(/R-p-(\d+)/)[1]);
  assert.equal(new Set(decathlonCodes).size, 40);
  for (let index = 0; index < types.length; index++) {
    const batch = batches[index], result = validateCatalogImport(batch);
    assert.equal(result.ok, true, result.errors?.join('\n'));
    assert.equal(batch.products.length, 10);
    assert.ok(batch.products.every(product => product.garmentTypeId === types[index]));
    for (const product of batch.products) {
      assert.ok(!/çocuk|kids|baby/i.test(product.name.tr + product.name.en));
      const source = batch.sources.find(source => source.url === product.productUrl);
      assert.equal(source.kind, 'manufacturer');
      assert.equal(product.evidence.find(evidence => evidence.field === 'composition').sourceId, source.id);
      assert.ok(product.evidence.every(evidence => evidence.basis === 'manufacturer'));
      assert.deepEqual(product.offers, []);
      assert.deepEqual(product.variants, [{ id: product.id + '-unresolved', gtin: null, size: null, color: null, sku: null }]);
    }
  }
});

test('GSM belongs to the main fabric; garment weights and reinforcement weights never replace it', () => {
  const expected = {
    'stanley-stsu953': 500, 'stanley-sasu024': 350, 'stanley-sasu028': 400,
    'stanley-sasu038': 280, 'stanley-stsu229': 280, 'stanley-stsu867': 500,
    'stanley-stsu868': 280, 'stanley-stsu205': 280, 'stanley-stsu866': 500, 'stanley-stsu177': 350,
    'solognac-350567': 200, 'quechua-375770': 300, 'quechua-138705': 140, 'decathlon-332494': 240,
    'solognac-144110': 157, 'solognac-306447': 157,
  };
  assert.deepEqual(Object.fromEntries(products.filter(product => product.facts.gsm !== null).map(product => [product.id, product.facts.gsm])), expected);
  assert.equal(byId('forclaz-306949').facts.gsm, null);
  assert.match(byId('forclaz-306949').evidence.find(e => e.field === 'composition').note, /157.*ek kumaş/);
  assert.ok(products.filter(product => product.garmentTypeId === 'running-shoes').every(product => product.facts.gsm === null));
  assert.ok(products.every(product => product.technical === null && product.facts.warmth === null && product.facts.windResistance === null && product.facts.breathability === null));
});

test('component boundaries, mixed fibres and uncertain claims survive the factual records', () => {
  assert.deepEqual(fibers('quechua-346726'), { Cotton: 18, Elastane: 1, Linen: 33, Lyocell: 48 });
  assert.deepEqual(fibers('solognac-144110'), { Polyamide: 94, Elastane: 6 });
  assert.deepEqual(fibers('kiprun-352928'), { 'Thermoplastic polyurethane': 32, Polyester: 68 });
  for (const product of products.filter(product => product.garmentTypeId === 'running-shoes')) {
    assert.deepEqual(product.facts.composition.map(part => part.part), ['shell', 'lining']);
    assert.deepEqual(fibers(product.id, 'lining'), { Polyester: 100 });
    assert.match(product.evidence.find(e => e.field === 'composition').note, /dış taban/);
    assert.equal(product.facts.waterResistance, null);
  }
  const rain = products.filter(product => product.garmentTypeId === 'rain-jacket');
  assert.equal(rain.filter(product => product.facts.waterResistance === 'waterproof').length, 9);
  assert.equal(byId('quechua-134585').facts.waterResistance, 'repellent');
  for (const product of rain) {
    assert.deepEqual(fibers(product.id), { Polyester: 100 });
    assert.ok(!product.facts.composition.some(part => part.part === 'fill'));
    assert.ok(product.evidence.find(e => e.field === 'waterResistance').note);
  }
});

test('all fifty models reach the correct wardrobe slot without inventing warmth or changing source facts', () => {
  const weather = { temp: 14, feelsLike: 14, condition: 'cloudy', windSpeed: 10, precipitationProb: 0, humidity: 50, dewPoint: 6, uvIndex: 0, hourly: [] };
  const slots = { sweatshirt: 'mid', fleece: 'mid', 'woven-trousers': 'bottom', 'rain-jacket': 'outer', 'running-shoes': 'footwear' };
  for (const batch of batches) for (const product of batch.products) {
    const before = JSON.stringify(product);
    const owned = JSON.parse(JSON.stringify(catalogProductToWardrobe(product, batch.sources, product.id)));
    assert.equal(owned.category, slots[product.garmentTypeId]);
    assert.deepEqual(owned.catalogFacts, product.facts);
    assert.deepEqual(owned.catalogEvidence, product.evidence);
    assert.equal(owned.catalogSources.length, 1);
    assert.equal(owned.brand, product.brand);
    assert.equal(owned.warmth, null);
    assert.equal(canRankForWeather(owned, weather), false);
    assert.equal(owned.waterResistance, product.facts.waterResistance === 'repellent' ? 'light' : product.facts.waterResistance);
    assert.equal(JSON.stringify(product), before);
  }
});

