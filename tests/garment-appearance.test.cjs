const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...rest) { return originalResolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '..', request.slice(2)) : request, parent, ...rest); };
const { GarmentVisual } = require('../components/GarmentVisual.tsx');
Module._resolveFilename = originalResolve;
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { GARMENT_TYPES } = require('../lib/catalog/taxonomy.ts');
const { APPEARANCE_OPTIONS, normalizeGarmentAppearance, resolveGarmentAppearance, sourceGarmentType } = require('../lib/garment-appearance.ts');
const { catalogProductToWardrobe } = require('../lib/catalog-wardrobe.ts');
const { saveWardrobeList, getStoredWardrobe, DEFAULT_WARDROBE_ITEMS } = require('../lib/wardrobe-storage.ts');
const { english } = require('../lib/translations.ts');
const batch = require('../db/imports/multi-source-tees.2026-10-18.json');
const owned = () => catalogProductToWardrobe(batch.products[0], batch.sources, 'my-piece');
const draw = item => renderToStaticMarkup(React.createElement(GarmentVisual, { item }));

test('all 36 stable types render locally without a product name heuristic or remote image', () => {
  assert.equal(GARMENT_TYPES.length, 36);
  for (const type of GARMENT_TYPES) {
    const item = { name: 'renamed: bot kapüşon elbise', category: type.group === 'one_piece' ? 'base' : type.group, garmentTypeId: type.id, colorHex: '#456789' };
    const markup = draw(item);
    assert.ok(markup.includes(`data-garment-type="${type.id}"`), type.id);
    assert.ok(markup.includes('<clipPath'), type.id);
    assert.ok(!/https?:|<image|undefined|NaN/.test(markup), type.id);
    assert.equal(markup, draw({ ...item, name: 'a completely different title' }));
  }
  const tee = { name: '', category: 'base', colorHex: '#456789' };
  assert.notEqual(draw({ ...tee, garmentTypeId: 'short-sleeve-tee' }), draw({ ...tee, garmentTypeId: 'long-sleeve-tee' }));
});

test('neckline, sleeve, fit, length, colour and all five patterns alter the illustration', () => {
  const item = { name: 'Shirt', category: 'mid', garmentTypeId: 'shirt', colorHex: '#456789' };
  const baseline = draw(item);
  for (const edit of [{ neckline: 'v' }, { sleeve: 'short' }, { fit: 'oversized' }, { length: 'cropped' }, { color: '#ff6600' }, { pattern: 'stripes' }, { pattern: 'checks' }, { pattern: 'dots' }, { pattern: 'colour-block' }]) {
    assert.notEqual(draw({ ...item, personalAppearance: { version: 1, ...edit } }), baseline, JSON.stringify(edit));
  }
  const striped = { ...item, personalAppearance: { version: 1, pattern: 'stripes' } };
  assert.notEqual(draw(striped), draw({ ...striped, personalAppearance: { ...striped.personalAppearance, accentColor: '#aabbcc' } }));
  for (const type of ['shorts', 'jeans', 'skirt']) {
    const bottom = { ...item, category: 'bottom', garmentTypeId: type };
    assert.notEqual(draw(bottom), draw({ ...bottom, personalAppearance: { version: 1, length: 'cropped' } }), type);
    assert.notEqual(draw(bottom), draw({ ...bottom, personalAppearance: { version: 1, fit: 'oversized' } }), type);
  }
});

test('personal illustration survives wardrobe serialization without changing source facts or thermal ranking inputs', () => {
  const previous = global.window, storage = global.localStorage;
  const records = new Map();
  global.window = {};
  global.localStorage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  try {
    const item = owned(), before = structuredClone(item);
    const appearance = normalizeGarmentAppearance({ version: 1, neckline: 'v', pattern: 'checks', fit: 'relaxed', color: '#ABCDEF' }, item);
    saveWardrobeList([{ ...item, personalAppearance: appearance }, ...DEFAULT_WARDROBE_ITEMS]);
    const [restored, ...legacy] = getStoredWardrobe();
    assert.deepEqual(legacy, DEFAULT_WARDROBE_ITEMS);
    assert.deepEqual(restored.personalAppearance, { version: 1, neckline: 'v', fit: 'relaxed', pattern: 'checks', color: '#abcdef' });
    const { personalAppearance, ...rest } = restored;
    assert.deepEqual(rest, before);
    assert.deepEqual(item, before);
    assert.equal(restored.brand, batch.products[0].brand);
    assert.equal(restored.warmth, null);
    assert.equal(restored.colorType, 'unknown');
    assert.notEqual(resolveGarmentAppearance(restored).color, restored.colorHex);
    assert.equal(personalAppearance.pattern, 'checks');
  } finally { global.window = previous; global.localStorage = storage; }
});

test('hostile or incompatible settings cannot inject assets, colours, fields, categories or contradictory sleeve types', () => {
  const item = owned();
  assert.deepEqual(normalizeGarmentAppearance({ version: 9, pattern: 'dots' }, item), { version: 1 });
  assert.deepEqual(normalizeGarmentAppearance({ version: 1, color: 'url(https://example.org)', accentColor: 'red', pattern: '__proto__', fit: 'giant', garmentTypeId: 'rain-boots', sleeve: 'long', warmth: 5, image: 'remote' }, item), { version: 1 });
  const shoe = { ...item, category: 'footwear', garmentTypeId: 'sneakers' };
  const result = normalizeGarmentAppearance({ version: 1, sleeve: 'long', neckline: 'hood', fit: 'slim', length: 'long', pattern: 'dots' }, shoe);
  assert.deepEqual(result, { version: 1, pattern: 'dots' });
  assert.equal(sourceGarmentType({ ...item, garmentTypeId: 'bad', catalogId: 'cat-mid-4' }), 'shirt');
  assert.ok(!draw({ ...item, colorHex: 'url(https://example.org)', personalAppearance: { version: 1, color: 'red' } }).includes('example.org'));
});

test('legacy IDs retain known silhouettes, unknown records stay unspecified, and all controls have English labels', () => {
  for (const item of DEFAULT_WARDROBE_ITEMS) assert.ok(sourceGarmentType(item), item.id);
  assert.equal(resolveGarmentAppearance(DEFAULT_WARDROBE_ITEMS.find(item => item.id === 'w-mid-grey-hoodie')).neckline, 'hood');
  assert.equal(sourceGarmentType({ name: 'sweater', category: 'mid', colorHex: '#123456' }), undefined);
  assert.equal(sourceGarmentType({ name: 'sweater', id: '__proto__', category: 'mid', colorHex: '#123456' }), undefined);
  for (const options of Object.values(APPEARANCE_OPTIONS)) for (const label of Object.values(options)) assert.ok(english[label], label);
});

test('all 180 original designs change real SVG geometry and retain personal-only metadata', () => {
  const { garmentDesigns, findGarmentDesign } = require('../lib/garment-designs.ts');
  const ids = new Set();
  for (const type of GARMENT_TYPES) {
    const item = { name: 'Illustration', category: type.group === 'one_piece' ? 'base' : type.group, garmentTypeId: type.id, colorHex: '#456789' };
    const designs = garmentDesigns(type.id);
    assert.equal(designs.length, 5, type.id);
    const geometries = new Set();
    for (const design of designs) {
      assert.ok(design.tr && design.en);
      assert.ok(!ids.has(design.id)); ids.add(design.id);
      const personalAppearance = normalizeGarmentAppearance({ version: 1, designId: design.id, color: '#ABCDEF', pattern: 'stripes' }, item);
      assert.equal(personalAppearance.designId, design.id);
      assert.equal(resolveGarmentAppearance({ ...item, personalAppearance }).color, '#abcdef');
      assert.equal(resolveGarmentAppearance({ ...item, personalAppearance }).pattern, 'stripes');
      const markup = draw({ ...item, personalAppearance });
      assert.ok(!/https?:|<image|undefined|NaN/.test(markup));
      // Ignore metadata, colours, useId, labels: a design must alter visible construction.
      geometries.add([...markup.matchAll(/<(?:path|circle|ellipse|rect)\b[^>]*(?:d|cx|x)="([^"]*)"[^>]*>/g)].map(match => match[0].replace(/fill="[^"]*"|stroke="[^"]*"/g,'')).join(''));
    }
    assert.equal(geometries.size, 5, type.id);
    assert.equal(findGarmentDesign(type.id, 'not-a-design'), undefined);
    const different = GARMENT_TYPES.find(candidate => candidate.id !== type.id);
    assert.equal(normalizeGarmentAppearance({ version: 1, designId: garmentDesigns(different.id)[0].id }, item).designId, undefined);
  }
  assert.equal(ids.size, 180);
});

test('saved silhouette IDs survive storage and never replace observed fabric, brand or warmth', () => {
  const previous = global.window, storage = global.localStorage;
  const records = new Map();
  global.window = {};
  global.localStorage = { getItem: key => records.get(key) ?? null, setItem: (key,value) => records.set(key,value) };
  try {
    const item = owned();
    const personalAppearance = normalizeGarmentAppearance({ version: 1, designId: item.garmentTypeId + ':2', pattern: 'checks' }, item);
    saveWardrobeList([{ ...item, personalAppearance }]);
    const [restored] = getStoredWardrobe();
    assert.deepEqual(restored.personalAppearance, personalAppearance);
    const { personalAppearance: saved, ...facts } = restored;
    assert.ok(saved.designId);
    assert.deepEqual(facts, item);
  } finally { global.window = previous; global.localStorage = storage; }
});

