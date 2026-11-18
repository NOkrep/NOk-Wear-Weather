const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const root = path.resolve(__dirname, '..');
const { GARMENT_TYPES, LEGACY_TYPE_MAP, findGarmentTypes } = require('../lib/catalog/taxonomy.ts');
const { garmentDesigns } = require('../lib/garment-designs.ts');
const { sourceGarmentType } = require('../lib/garment-appearance.ts');
const { ANCHOR_ITEMS } = require('../lib/clothing-engine.ts');
const { DEFAULT_WARDROBE_ITEMS } = require('../lib/wardrobe-storage.ts');
const { GARMENT_CLO } = require('../lib/thermal-model.ts');
const cbe = require('./fixtures/cbe-2013-ensembles.json');

test('trench coat is its own outer type; coat/parka keeps its identity', () => {
  const trench = GARMENT_TYPES.find(type => type.id === 'trench-coat');
  assert.equal(trench.group, 'outer');
  assert.deepEqual([trench.tr, trench.en], ['Trençkot', 'Trench coat']);
  assert.deepEqual(trench.slots, ['torso', 'arms', 'upper-legs']);
  assert.equal(findGarmentTypes('trençkot')[0].id, 'trench-coat');
  const coat = GARMENT_TYPES.find(type => type.id === 'coat-parka');
  assert.deepEqual([coat.tr, coat.aliases], ['Kaban / parka', ['palto', 'overcoat']]);
  assert.equal(GARMENT_TYPES.at(-1).id, 'trench-coat', 'appended: existing order and ids are unchanged');
});

test('every known trench profile now points at the trench type', () => {
  assert.equal(LEGACY_TYPE_MAP['cat-outer-2'], 'trench-coat');
  assert.equal(sourceGarmentType(DEFAULT_WARDROBE_ITEMS.find(item => item.id === 'w-outer-trench')), 'trench-coat');
  assert.equal(ANCHOR_ITEMS.find(item => item.id === 'anc-beige-trench').garmentTypeId, 'trench-coat');
  const engine = fs.readFileSync(path.join(root, 'lib/clothing-engine.ts'), 'utf8');
  for (const id of ['s-9', 'p-9']) assert.match(engine, new RegExp(`\\{ id: '${id}', garmentTypeId: 'trench-coat'`), id);
  assert.doesNotMatch(engine, /garmentTypeId: 'coat-parka', name: '[^']*Trençkot/, 'no trench left under coat/parka');
});

test('five trench designs; coat/parka designs and saved design ids are unchanged', () => {
  const trench = garmentDesigns('trench-coat');
  assert.equal(trench.length, 5);
  assert.deepEqual(trench.map(design => design.id), [0, 1, 2, 3, 4].map(i => `trench-coat:${i}`));
  assert.equal(trench[3].appearance.neckline, 'hood');
  assert.equal(trench[1].appearance.length, 'cropped');
  const coat = garmentDesigns('coat-parka');
  assert.deepEqual(coat.map(design => design.tr), ['Kruvaze kaban', 'Kuşaklı trenç', 'Kapüşonlu parka', 'Dik yakalı kaban', 'Geniş yakalı uzun kaban']);
});

test('trench insulation is the CBE two-step floor with an open upper end', () => {
  const { withTrench, shirtBase, turtleneckVsShirt: [turtleneck, shirt] } = cbe.trenchCoat;
  const derived = (withTrench.measured - (shirtBase.measured + turtleneck.measured - shirt.measured)) / 0.835;
  const entry = GARMENT_CLO['trench-coat'];
  assert.ok(Math.abs(entry.clo.min - derived) < 0.01, `derived ${derived.toFixed(3)}`);
  assert.equal(entry.match, 'derived');
  assert.equal(entry.openUpper, true);
  assert.equal(GARMENT_CLO['coat-parka'].match, 'secondary', 'coat/parka still decides nothing');
});

test('migration 003 adds the same type and re-points only the historical trench profile', () => {
  const sql = fs.readFileSync(path.join(root, 'db/migrations/003_trench_coat.sql'), 'utf8');
  const trench = GARMENT_TYPES.find(type => type.id === 'trench-coat');
  assert.match(sql, /INSERT INTO catalog\.garment_types[\s\S]*'trench-coat','outer','Trençkot','Trench coat'[\s\S]*ON CONFLICT \(id\) DO NOTHING;/);
  assert.ok(sql.includes(`'${JSON.stringify(trench.slots).replace(/,/g, ',')}'::jsonb`), 'slots match the taxonomy');
  assert.ok(sql.includes(`'${JSON.stringify(trench.aliases)}'::jsonb`), 'aliases match the taxonomy');
  assert.match(sql, /UPDATE catalog\.legacy_profiles SET garment_type_id='trench-coat' WHERE id='cat-outer-2' AND garment_type_id='coat-parka';/);
  assert.doesNotMatch(sql, /catalog\.products|DELETE|DROP/i, 'products are untouched');
});
