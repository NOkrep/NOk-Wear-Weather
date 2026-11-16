const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const thermal = require('../lib/outfit-thermal.ts');
const { matchSelectedItems } = require('../lib/outfit-matching.ts');
const { matchFromUserWardrobe } = require('../lib/wardrobe-storage.ts');

const weatherAt = (temp, patch = {}) => ({ temp, feelsLike: temp - 2, condition: 'cloudy', windSpeed: 12, precipitationProb: 0, humidity: 70, dewPoint: 0, uvIndex: 0, hourly: [], ...patch });
const piece = (id, category, garmentTypeId, warmth, patch = {}) => ({ id, category, garmentTypeId, name: id, segment: 'essential', material: 'test', warmth,
  waterResistance: 'none', windResistance: 'medium', colorHex: '#505c5c', colorName: 'test', colorType: 'neutral', description: 'test', dataSource: 'user', isUserOwned: true, ...patch });
const kinds = items => items.map(item => item.garmentTypeId);

test('context uses the coldest planned hour, strongest wind and the plan length', () => {
  const planned = thermal.thermalContext(weatherAt(6, { selection: { date: '2026-11-20', startAt: '2026-11-20T08:00:00Z', endAt: '2026-11-20T10:30:00Z', point: false, minTemp: 3, maxTemp: 7, minFeelsLike: 0, maxFeelsLike: 5, maxWind: 25, maxPrecipitation: 0 } }));
  assert.equal(planned.exposureHours, 2.5);
  assert.equal(planned.exposureFromPlan, true);
  assert.equal(planned.input.airTempC, 3);
  assert.equal(planned.input.windKmh10m, 25);
  assert.equal(planned.applies, true);
  const instant = thermal.thermalContext(weatherAt(6), -2);
  assert.equal(instant.exposureHours, thermal.DEFAULT_EXPOSURE_HOURS);
  assert.equal(instant.exposureFromPlan, false);
  assert.equal(instant.input.airTempC, 4, 'cold-sensitive profile plans for a colder day');
  assert.equal(thermal.thermalContext(weatherAt(15)).applies, false, 'above 10 °C ISO 11079 does not apply');
});

test('a known 1–5 warmth only picks a point inside the cited type range', () => {
  assert.deepEqual(thermal.itemCloPart(piece('thin', 'bottom', 'woven-trousers', 1)).clo, { min: 0.15, max: 0.15 });
  assert.deepEqual(thermal.itemCloPart(piece('thick', 'bottom', 'woven-trousers', 5)).clo, { min: 0.24, max: 0.24 });
  assert.deepEqual(thermal.itemCloPart(piece('unknown', 'bottom', 'woven-trousers', null)).clo, { min: 0.15, max: 0.24 });
  assert.equal(thermal.itemCloPart(piece('shell', 'outer', 'rain-jacket', 3)).clo, null);
  assert.equal(thermal.itemCloPart(piece('puffer', 'outer', 'puffer', 5)).secondary, true);
});

test('above 10 °C the first option of every slot wins, exactly as before', () => {
  const context = thermal.thermalContext(weatherAt(18));
  const tee = piece('tee', 'base', 'short-sleeve-tee', 1), sweater = piece('sweater', 'mid', 'sweater', 4);
  assert.deepEqual(thermal.chooseThermalCombination([], [[tee, sweater]], context), [tee]);
});

test('in the cold a warmer option replaces a preferred piece that would not cover the trip', () => {
  const context = thermal.thermalContext(weatherAt(6));
  const base = [piece('tee', 'base', 'short-sleeve-tee', 1), piece('thermal', 'base', 'thermal-top', 4)];
  const mid = [piece('cardigan', 'mid', 'cardigan', 1), piece('fleece', 'mid', 'fleece', 4)];
  const outer = [piece('jacket', 'outer', 'light-jacket', 1), piece('warm-jacket', 'outer', 'light-jacket', 5)];
  const bottom = [piece('chinos', 'bottom', 'woven-trousers', 1), piece('joggers', 'bottom', 'joggers', 4)];
  const shoes = [piece('sneakers', 'footwear', 'sneakers', 1), piece('boots', 'footwear', 'winter-boots', 4)];
  const preferred = [base[0], mid[0], outer[0], bottom[0], shoes[0]];
  assert.equal(thermal.assessItems(preferred, context).fit, 'insufficient');
  const chosen = thermal.chooseThermalCombination([], [base, mid, outer, bottom, shoes], context);
  const verdict = thermal.assessItems(chosen, context);
  assert.equal(verdict.fit, 'acceptable', kinds(chosen).join(','));
  assert.ok(verdict.ensemble.icl.min > thermal.assessItems(preferred, context).ensemble.icl.min);
  assert.match(thermal.thermalNote(verdict, 'tr'), /^ISO 11079'a göre 60 dk \(varsayılan süre\) dışarıda kalmaya yeterli\.$/);
  assert.match(thermal.thermalNote(thermal.assessItems(preferred, context), 'en'), /^ISO 11079: not warm enough for 60 min \(default time\); you would start getting cold after about \d+ min\. Add a warmer layer\.$/);
  assert.match(thermal.thermalNote(thermal.assessItems(preferred, thermal.thermalContext(weatherAt(18))), 'tr'), /kural tabanlı/);
});

test('Match and Wardrobe paths keep locked pieces and pick a warm enough completion', () => {
  const cold = weatherAt(-2, { windSpeed: 20 });
  const shirt = piece('my-shirt', 'mid', 'shirt', 2);
  const wardrobe = [
    piece('tee', 'base', 'short-sleeve-tee', 1), piece('thermal', 'base', 'thermal-top', 4),
    piece('jacket', 'outer', 'light-jacket', 1), piece('puffer', 'outer', 'puffer', 5),
    piece('chinos', 'bottom', 'woven-trousers', 1), piece('joggers', 'bottom', 'joggers', 4),
    piece('sneakers', 'footwear', 'sneakers', 1), piece('boots', 'footwear', 'winter-boots', 4),
  ];
  const context = thermal.thermalContext(cold);
  const matched = matchSelectedItems([shirt], cold, { wardrobe });
  assert.ok(matched.items.includes(shirt), 'the user-selected shirt stays');
  assert.notEqual(thermal.assessItems(matched.items, context).fit, 'insufficient', kinds(matched.items).join(','));

  const fromWardrobe = matchFromUserWardrobe([...wardrobe, piece('cardigan', 'mid', 'cardigan', 2)], cold);
  assert.ok(fromWardrobe.selectedItems.some(item => item.id === 'puffer'), kinds(fromWardrobe.selectedItems).join(','));
  assert.notEqual(thermal.assessItems(fromWardrobe.selectedItems, context).fit, 'insufficient', kinds(fromWardrobe.selectedItems).join(','));
});

test('a secondary coat value never decides a verdict either way', () => {
  const context = thermal.thermalContext(weatherAt(-2, { windSpeed: 20 }));
  const outfit = [piece('thermal', 'base', 'thermal-top', 4), piece('cardigan', 'mid', 'cardigan', 2), piece('puffer', 'outer', 'puffer', 5),
    piece('joggers', 'bottom', 'joggers', 4), piece('boots', 'footwear', 'winter-boots', 4)];
  const verdict = thermal.assessItems(outfit, context);
  assert.ok(verdict.ensemble.citedMin < context.neededClo);
  assert.equal(verdict.fit, 'unknown');
  assert.match(thermal.thermalNote(verdict, 'tr'), /^Mont\/kaban yalıtımı yalnız ikincil, doğrulanmamış kaynaktan biliniyor; 60 dk \(varsayılan süre\) için yeterlilik doğrulanamadı\.$/);
  assert.match(thermal.thermalNote(verdict, 'en'), /^Coat\/jacket insulation is only known from a secondary, unverified source/);
  const withoutCoat = outfit.filter(item => item.id !== 'puffer');
  assert.equal(thermal.assessItems(withoutCoat, context).fit, 'insufficient', 'fully cited outfits can still be judged too cold');
});

test('secondary coat values do not swap a puffer for a trench coat (Erzurum regression)', () => {
  const { generateDirectOutfit } = require('../lib/clothing-engine.ts');
  const { personalizeOutfit } = require('../lib/comfort.ts');
  const { DEFAULT_WARDROBE_ITEMS } = require('../lib/wardrobe-storage.ts');
  const cold = weatherAt(0, { feelsLike: -3, windSpeed: 5 });
  const base = generateDirectOutfit(cold, 'essential', 0, 'Türkiye');
  const pool = [...DEFAULT_WARDROBE_ITEMS, ...generateDirectOutfit(cold, 'essential', -3, 'Türkiye'), ...generateDirectOutfit(cold, 'essential', 3, 'Türkiye')];
  const personalised = personalizeOutfit(base, pool, cold, []);
  const refined = thermal.refineOutfit(personalised, pool, cold, thermal.thermalContext(cold));
  const outer = refined.find(item => item.category === 'outer');
  assert.equal(outer, personalised.find(item => item.category === 'outer'), `kept ${outer?.name}`);
  assert.notEqual(outer.id, 'w-outer-trench');
});
