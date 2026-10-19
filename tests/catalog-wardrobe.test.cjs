const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { catalogProductToWardrobe, getItemWarmth, canRankForWeather, catalogMaterial } = require('../lib/catalog-wardrobe.ts');
const { addWardrobeItem, saveWardrobeList, getStoredWardrobe, matchFromUserWardrobe, DEFAULT_WARDROBE_ITEMS } = require('../lib/wardrobe-storage.ts');
const { itemIdentity, personalizeOutfit, itemComfortAdjustment } = require('../lib/comfort.ts');
const { matchSelectedItems, uniqueAnchorChoices } = require('../lib/outfit-matching.ts');
const batch = require('../db/imports/short-sleeve-tees.tr.2026-10-18.json');
const weather = { temp: 14, feelsLike: 14, condition: 'cloudy', windSpeed: 10, precipitationProb: 0, humidity: 50, dewPoint: 6, uvIndex: 0, hourly: [] };
const item = () => catalogProductToWardrobe(batch.products[0], batch.sources, 'owned-real-product');

function withStorage(work) {
  const previousWindow = global.window, previousStorage = global.localStorage;
  const values = new Map();
  global.window = {};
  global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try { work(); } finally { global.window = previousWindow; global.localStorage = previousStorage; }
}

test('all ten products retain sourced facts, evidence and bilingual names through wardrobe serialization', () => {
  for (const product of batch.products) {
    const before = JSON.stringify(product);
    const owned = JSON.parse(JSON.stringify(catalogProductToWardrobe(product, batch.sources, product.id)));
    assert.deepEqual(owned.catalogFacts, product.facts);
    assert.deepEqual(owned.catalogEvidence, product.evidence);
    assert.equal(owned.nameEn, product.name.en);
    assert.equal(owned.productId, product.id);
    assert.equal(owned.productUrl, product.productUrl);
    assert.equal(owned.garmentTypeId, product.garmentTypeId);
    assert.equal(owned.warmth, null);
    assert.equal(owned.windResistance, null);
    assert.equal(owned.waterResistance, null);
    assert.equal(owned.segment, null);
    assert.equal(owned.colorType, 'unknown');
    assert.equal(owned.barcode, undefined);
    assert.equal(owned.variantId, undefined);
    assert.equal(owned.catalogSources.length, 1);
    assert.equal(JSON.stringify(product), before);
  }
  const merino = batch.products.find(product => product.id === 'norfolk-ragnar');
  assert.ok(catalogMaterial(merino, 'tr').includes('Merinos yünü'));
  assert.ok(catalogMaterial(merino, 'en').includes('Merino wool'));
});

test('stored product deduplication preserves the original personal estimate and old wardrobe rows', () => withStorage(() => {
  const legacy = DEFAULT_WARDROBE_ITEMS[0];
  saveWardrobeList([legacy]);
  const owned = { ...item(), personalWarmth: 3 };
  addWardrobeItem(owned);
  addWardrobeItem({ ...item(), id: 'second-attempt', personalWarmth: 1 });
  const stored = getStoredWardrobe();
  assert.equal(stored.length, 2);
  assert.deepEqual(stored[1], legacy);
  assert.equal(stored[0].personalWarmth, 3);
  assert.equal(stored[0].warmth, null);
  assert.equal(itemIdentity(stored[0]), `product:${owned.productId}`);
  assert.equal(uniqueAnchorChoices([owned, { ...owned, id: 'duplicate' }]).length, 1);
}));

test('unrated products never gain an automatic warmth score; a separate personal estimate enables ranking', () => {
  const owned = item();
  assert.equal(getItemWarmth(owned), null);
  assert.equal(canRankForWeather(owned, weather), false);
  assert.equal(matchFromUserWardrobe([owned], weather).selectedItems.length, 0);
  const estimated = { ...owned, personalWarmth: 3 };
  assert.equal(canRankForWeather(estimated, weather), true);
  assert.equal(getItemWarmth(estimated), 3);
  const legacy = DEFAULT_WARDROBE_ITEMS.filter(piece => piece.category !== 'base' || piece.id === 'w-base-white-tee');
  const matched = matchFromUserWardrobe([...legacy, estimated], weather);
  assert.equal(matched.selectedItems.find(piece => piece.category === 'base').productId, owned.productId);
  assert.equal(estimated.catalogFacts.warmth, null);
  assert.equal(estimated.warmth, null);
  for (const invalid of [0, 6, '3', NaN]) assert.equal(getItemWarmth({ ...owned, personalWarmth: invalid }), null);
  assert.equal(canRankForWeather(estimated, undefined), false);
});

test('manual anchors keep unrated real products while automatic complements exclude them', () => {
  const owned = item();
  const manual = matchSelectedItems([owned], weather);
  assert.equal(manual.lockedItems[0], owned);
  assert.equal(manual.items.find(piece => piece.category === 'base'), owned);
  const automatic = matchSelectedItems([DEFAULT_WARDROBE_ITEMS.find(piece => piece.category === 'mid')], { ...weather, feelsLike: 5 }, { wardrobe: [owned] });
  assert.ok(automatic.suggestedItems.every(piece => piece.productId !== owned.productId));
  assert.equal(itemIdentity({ ...owned, id: 'changed-local-id' }), itemIdentity(owned));
});

test('personal warmth does not establish rain or wind protection or bypass negative feedback checks', () => {
  const outer = { ...item(), category: 'outer', personalWarmth: 5 };
  assert.equal(canRankForWeather(outer, weather), true);
  assert.equal(canRankForWeather(outer, { ...weather, precipitationProb: 80 }), false);
  assert.equal(canRankForWeather(outer, { ...weather, windSpeed: 30 }), false);
  const base = DEFAULT_WARDROBE_ITEMS[0];
  const negative = [{ clothingResult: 'froze', context: { worn: true, liveWeather: true, itemKey: itemIdentity(base), feelsLike: 14 } }];
  assert.equal(personalizeOutfit([base], [item()], weather, negative)[0], base);
  const result = matchSelectedItems([outer], { ...weather, precipitationProb: 80 });
  assert.equal(result.rainWarning, true);
  assert.equal(result.lockedItems[0], outer);
});

test('source snapshots are independent, repellent values map explicitly, unsupported one-piece slots are rejected', () => {
  const owned = item();
  owned.catalogFacts.gsm = 999;
  assert.notEqual(owned.catalogFacts.gsm, batch.products[0].facts.gsm);
  const repellent = structuredClone(batch.products[0]);
  repellent.facts.waterResistance = 'repellent';
  const converted = catalogProductToWardrobe(repellent, batch.sources, 'repellent');
  assert.equal(converted.waterResistance, 'light');
  assert.equal(converted.catalogFacts.waterResistance, 'repellent');
  assert.throws(() => catalogProductToWardrobe({ ...repellent, garmentTypeId: 'dress' }, batch.sources, 'dress'), /Unsupported wardrobe slot/);
});

test('personal product feedback follows the catalogue identity after reload without enabling community sharing', () => {
  const owned = item();
  const records = [{ clothingResult: 'froze', context: { worn: true, liveWeather: true, itemKey: itemIdentity(owned), feelsLike: weather.feelsLike } }];
  const reloaded = JSON.parse(JSON.stringify({ ...owned, id: 'different-local-row' }));
  assert.ok(itemComfortAdjustment(reloaded, weather, records) < 0);
  const { communityPayload } = require('../lib/comfort.ts');
  assert.equal(communityPayload(records[0]), null);
});
