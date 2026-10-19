const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { GARMENT_TYPES, PILOT_TARGET, findGarmentTypes } = require('../lib/catalog/taxonomy.ts');
const { catalogProgress } = require('../scripts/catalog/progress.ts');
const manifest = require('../db/imports/local-approved.json');
const expansion = manifest.batches.filter(entry => entry.file.includes('.expansion.')).map(entry => require(path.join('../db/imports',entry.file)));
const products = expansion.flatMap(batch => batch.products);
const product = id => products.find(row => row.id === id);
const fibers = (id,part='shell') => Object.fromEntries(product(id).facts.composition.find(row => row.part===part).fibers.map(row => [row.name,row.percent]));
test('100 is a per-type real model target; 180 illustration presets are never counted as products', async () => {
  assert.deepEqual(PILOT_TARGET, { minimum:100, maximum:100 });
  const report = await catalogProgress();
  assert.equal(report.types,36);
  assert.equal(report.target,3600);
  assert.equal(report.products,146);
  assert.equal(report.remaining,3454);
  assert.equal(report.completedTypes,0);
  assert.equal(report.rows.filter(row => row.products>0).length,18);
  assert.equal(report.rows.find(row => row.id==='short-sleeve-tee').products,39);
  for (const id of ['polo-shirt','blouse','gilet','rain-poncho']) {
    assert.ok(GARMENT_TYPES.some(row => row.id===id));
    assert.ok(report.rows.find(row => row.id===id).products>0,id);
  }
  assert.deepEqual(findGarmentTypes('blouse').map(row=>row.id),['blouse']);
  assert.deepEqual(findGarmentTypes('polo shirt').map(row=>row.id),['polo-shirt']);
});
test('72 new real models preserve mixed fibres, EVA, separate lining/fill, and manufacturer-only protection', () => {
  assert.equal(products.length,72);
  assert.deepEqual(fibers('stanley-sttu263'),{Cotton:60,Modal:40});
  assert.deepEqual(fibers('stanley-sttw264'),{Cotton:60,Modal:40});
  assert.deepEqual(fibers('stanley-stau296'),{Cotton:93,Elastane:1,Polyamide:6});
  assert.deepEqual(fibers('quechua-339021'),{'Ethylene vinyl acetate':100});
  assert.deepEqual(fibers('koton-5sak60077ew'),{Viscose:100});
  assert.deepEqual(fibers('stanley-stau893','lining'),{Cotton:100});
  assert.deepEqual(fibers('stanley-stju250','fill'),{Polyester:100});
  assert.equal(product('stanley-stju293').facts.gsm,38);
  assert.equal(product('stanley-stju293').facts.waterResistance,'repellent');
  assert.equal(product('btwin-343195').facts.waterResistance,'waterproof');
  assert.ok(product('simond-324443').evidence.find(row=>row.field==='composition').note.includes('poliüretan'));
  assert.ok(!product('simond-324443').facts.composition.some(part=>part.part==='fill'));
  assert.ok(!product('stanley-stau297').facts.composition.some(part=>part.part==='lining'));
  for (const row of products) {
    assert.equal(row.facts.warmth,null);
    assert.equal(row.facts.windResistance,null);
    assert.equal(row.facts.breathability,null);
    assert.equal(row.technical,null);
    assert.deepEqual(row.offers,[]);
    assert.equal(row.variants.length,1);
    for (const field of ['size','color','sku','gtin']) assert.equal(row.variants[0][field],null);
    assert.ok(row.evidence.every(entry=>entry.basis==='manufacturer'));
  }
});

