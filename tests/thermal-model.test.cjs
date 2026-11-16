const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const model = require('../lib/thermal-model.ts');
const { GARMENT_TYPES } = require('../lib/catalog/taxonomy.ts');

const round1 = value => Math.round(value * 10) / 10;
const close = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);

// Reference values: pythermalcomfort tests/test_clothing.py (MIT) and ISO 9920 equations.
test('ISO 9920 summation, area factor and boundary air layer', () => {
  assert.equal(model.ensembleIntrinsicClo([0.5, 0.5]), 0.835 + 0.161);
  assert.equal(model.ensembleIntrinsicClo([0]), 0.161);
  assert.equal(model.clothingAreaFactor(1), 1.28);
  close(model.airLayerInsulation(0.15, 0, 0.7), 0.7, 1e-12, 'static air layer');
  assert.ok(model.airLayerInsulation(2, 1, 0.7) < 0.7, 'wind and walking reduce the air layer');
});

test('dynamic clothing insulation matches the reference implementation', () => {
  close(model.dynamicClo(1, 1, 0.2), 0.99, 0.01, 'clo 1, met 1, v 0.2');
  assert.ok(model.dynamicClo(1, 2, 2) < model.dynamicClo(1, 1, 0.2), 'activity and wind lower insulation');
});

// ISO 11079:2007 Table F1 (as encoded in pythermalcomfort tests/test_ireq.py): rh 85, p 8.
test('IREQ reproduces ISO 11079 Table F1', () => {
  const table = [
    [0, 0, 2, 90, 2.5, 2.6, 3.1, 2.3],
    [0, 0, 2, 145, 2.5, 1.5, 1.8, Infinity],
    [-10, -10, 2, 90, 2.5, 3.5, 4.4, 0.7],
    [-10, 0, 2, 145, 2.4, 1.9, 2.4, Infinity],
    [-20, -20, 2, 115, 4.2, 3.4, 4.2, Infinity],
    [-20, -20, 7, 115, 4.2, 3.5, 5.9, 1.1],
    [-30, -30, 2, 115, 4.2, 4.0, 5.0, 2.2],
    [-30, -30, 5, 175, 4.2, 2.6, 4.0, Infinity],
  ];
  for (const [tdb, tr, vr, metW, clo, ireqNeutral, iclNeutral, dleNeutral] of table) {
    const walkSpeed = Math.max(0.5, Math.min(0.0052 * (metW - 58), 1.2));
    const result = model.ireq({ tdb, tr, vr, rh: 85, met: metW / 58.15, clo, p: 8, walkSpeed });
    const label = `tdb ${tdb}, M ${metW}`;
    close(result.ireqNeutral, ireqNeutral, 0.11, `${label} IREQneutral`);
    close(result.iclNeutral, iclNeutral, 0.11, `${label} ICLneutral`);
    if (dleNeutral === Infinity) assert.equal(result.dleNeutral, Infinity, `${label} DLE`);
    else close(result.dleNeutral, dleNeutral, 0.21, `${label} DLE`);
    assert.equal(result.withinIsoLimits, true, label);
  }
});

test('IREQ scalar examples from the reference tests', () => {
  const base = { tdb: -15, tr: -15, vr: 2, rh: 55, met: 175 / 58.15, clo: 2.8, p: 50, walkSpeed: 1.1 };
  const first = model.ireq(base);
  assert.deepEqual([first.ireqMin, first.ireqNeutral, first.iclMin, first.iclNeutral].map(round1), [1.6, 1.9, 2.2, 2.6]);
  assert.equal(first.dleMin, Infinity);
  const work = model.ireq({ ...base, wme: 1 });
  assert.deepEqual([work.ireqMin, work.ireqNeutral, work.iclMin, work.iclNeutral, work.dleMin, work.dleNeutral].map(round1), [2.7, 3.2, 3.8, 4.5, 1.3, 0.8]);
  const heavy = model.ireq({ ...base, met: 400 / 58.15, walkSpeed: 1.2 });
  assert.deepEqual([heavy.ireqMin, heavy.ireqNeutral, heavy.iclMin, heavy.iclNeutral].map(round1), [0.3, 0.6, 0.4, 0.8]);
  assert.equal(model.ireq({ ...base, tdb: 10.5 }).withinIsoLimits, false, 'above 10 °C is outside ISO 11079');
});

test('every garment type has an entry; cited values carry their source rows', () => {
  for (const type of GARMENT_TYPES) {
    const entry = model.GARMENT_CLO[type.id];
    assert.ok(entry, type.id);
    if (entry.clo) {
      assert.ok(entry.reference.length > 0 && entry.match !== 'none', type.id);
      assert.ok(entry.clo.min > 0 && entry.clo.min <= entry.clo.max && entry.clo.max < 1, type.id);
    } else assert.equal(entry.match, 'none', type.id);
  }
  assert.equal(model.GARMENT_CLO.puffer.clo, null, 'no invented value for outdoor insulation');
});

test('ensemble estimate keeps unknown garments visible and never claims a shortfall it cannot prove', () => {
  const summer = model.estimateEnsemble(['short-sleeve-tee', 'shorts', 'sneakers', 'socks']);
  assert.deepEqual(summer.unknownTypes, []);
  close(summer.icl.min, 0.835 * (0.04 + 0.08 + 0.06 + 0.02 + 0.02) + 0.161, 1e-9, 'summer min');
  const winter = model.estimateEnsemble(['thermal-top', 'sweater', 'puffer', 'jeans', 'winter-boots']);
  assert.deepEqual(winter.unknownTypes, ['puffer']);

  const coldDay = { airTempC: -5, relativeHumidity: 70, windKmh10m: 20, activity: 'walking' };
  const cold = model.requiredInsulation(coldDay);
  assert.equal(cold.method, 'iso11079');
  assert.ok(cold.iclNeutral > cold.iclMin && cold.iclMin > 0);
  const summerOutfit = ['short-sleeve-tee', 'shorts', 'sneakers', 'socks'];
  assert.equal(model.assessOutfit(summerOutfit, coldDay, 1).fit, 'insufficient');
  assert.equal(model.assessOutfit(['thermal-top', 'sweater', 'puffer', 'jeans', 'winter-boots'], coldDay, 1).fit, 'unknown', 'the missing puffer value could close the gap');
  const warm = model.assessOutfit(['short-sleeve-tee', 'shorts', 'sandals'], { ...coldDay, airTempC: 25 }, 1);
  assert.equal(warm.requirement.method, 'extended');
  assert.equal(warm.fit, 'unknown', 'no cold-model verdict outside ISO 11079');

  const mild = model.requiredInsulation({ airTempC: 18, relativeHumidity: 50, windKmh10m: 10, activity: 'walking' });
  assert.equal(mild.method, 'extended', 'outside ISO 11079 is labelled');
  assert.ok(mild.iclNeutral < cold.iclNeutral);
});

test('a short trip can be acceptable where a full day outside is not (ISO 11079 DLE)', () => {
  const day = { airTempC: 8, relativeHumidity: 70, windKmh10m: 15, activity: 'walking' };
  const outfit = ['long-sleeve-tee', 'sweater', 'jeans', 'sneakers', 'socks'];
  const short = model.assessOutfit(outfit, day, 0.5);
  const long = model.assessOutfit(outfit, day, 8);
  assert.ok(short.dleHours.low >= 0.5, `DLE ${short.dleHours.low}`);
  assert.equal(short.fit, 'acceptable');
  assert.equal(long.fit, 'insufficient');
});

test('activity and wind move the requirement in the physical direction', () => {
  const at = (activity, windKmh10m) => model.requiredInsulation({ airTempC: 0, relativeHumidity: 60, windKmh10m, activity }).iclNeutral;
  assert.ok(at('resting', 10) > at('walking', 10), 'standing still needs more insulation than walking');
  assert.ok(at('walking', 40) > at('walking', 5), 'wind raises the requirement');
  close(model.WIND_10M_TO_BODY, 0.68, 0.01, 'log wind profile factor');
});
