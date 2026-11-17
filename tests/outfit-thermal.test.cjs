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
  assert.equal(planned.cold.input.airTempC, 3);
  assert.equal(planned.cold.input.windKmh10m, 25);
  assert.equal(planned.applies, true);
  const instant = thermal.thermalContext(weatherAt(6), -2);
  assert.equal(instant.exposureHours, thermal.DEFAULT_EXPOSURE_HOURS);
  assert.equal(instant.exposureFromPlan, false);
  assert.equal(instant.cold.input.airTempC, 4, 'cold-sensitive profile plans for a colder day');
  const mild = thermal.thermalContext(weatherAt(15));
  assert.equal(mild.cold, null, 'above 10 °C ISO 11079 does not apply');
  assert.equal(mild.warm.conditions.length, 1, 'the SET* model takes over');
  assert.equal(mild.applies, true);
});

test('a known 1–5 warmth only picks a point inside the cited type range', () => {
  assert.deepEqual(thermal.itemCloPart(piece('thin', 'bottom', 'woven-trousers', 1)).clo, { min: 0.15, max: 0.15 });
  assert.deepEqual(thermal.itemCloPart(piece('thick', 'bottom', 'woven-trousers', 5)).clo, { min: 0.24, max: 0.24 });
  assert.deepEqual(thermal.itemCloPart(piece('unknown', 'bottom', 'woven-trousers', null)).clo, { min: 0.15, max: 0.24 });
  assert.equal(thermal.itemCloPart(piece('shell', 'outer', 'rain-jacket', 3)).clo, null);
  assert.equal(thermal.itemCloPart(piece('puffer', 'outer', 'puffer', 5)).secondary, true);
});

test('above 10 °C the SET* model swaps a heavy preferred outfit for a lighter one on a hot day', () => {
  const hot = thermal.thermalContext(weatherAt(30, { humidity: 50, windSpeed: 8 }));
  const base = [piece('long', 'base', 'long-sleeve-tee', 5), piece('tee', 'base', 'short-sleeve-tee', 1)];
  const bottom = [piece('jeans', 'bottom', 'jeans', 3), piece('shorts', 'bottom', 'shorts', 1)];
  const shoes = [piece('sneakers', 'footwear', 'sneakers', 1)];
  const preferred = [base[0], piece('sweater', 'mid', 'sweater', 5), bottom[0], shoes[0]];
  assert.equal(thermal.assessItems(preferred, hot).fit, 'excess');
  const chosen = thermal.chooseThermalCombination([], [base, bottom, shoes], hot);
  assert.notEqual(thermal.assessItems(chosen, hot).fit, 'excess', kinds(chosen).join(','));
  assert.ok(thermal.assessItems(chosen, hot).ensemble.icl.max < thermal.assessItems(preferred, hot).ensemble.icl.min);
  assert.match(thermal.thermalNote(thermal.assessItems(preferred, hot), 'tr'), /^SET\* modeline göre bu kombin sıcak gelir; daha hafif bir parça seç\.$/);
});

test('direct sun makes the same outfit feel warmer (SolarCal)', () => {
  const outfit = [piece('tee', 'base', 'short-sleeve-tee', 1), piece('jeans', 'bottom', 'jeans', 3), piece('sneakers', 'footwear', 'sneakers', 1)];
  const base = { lat: 41, lon: 29, observedAt: '2026-06-21T10:07:30Z', humidity: 50, windSpeed: 8 };
  const shade = thermal.thermalContext(weatherAt(22, base));
  const sunny = thermal.thermalContext(weatherAt(22, { ...base, directNormalIrradiance: 800 }));
  assert.equal(shade.warm.sun, false);
  assert.equal(sunny.warm.sun, true);
  assert.ok(sunny.warm.conditions[0].deltaMrt > 5, `dMRT ${sunny.warm.conditions[0].deltaMrt}`);
  assert.ok(thermal.assessItems(outfit, sunny).warm.hottest > thermal.assessItems(outfit, shade).warm.hottest);
  const night = thermal.thermalContext(weatherAt(22, { ...base, observedAt: '2026-06-21T22:00:00Z', directNormalIrradiance: 800 }));
  assert.equal(night.warm.conditions[0].deltaMrt, 0, 'no sun below the horizon');
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
  assert.match(thermal.thermalNote(thermal.assessItems(preferred, thermal.thermalContext(weatherAt(18))), 'tr'), /^SET\* modeline göre/);
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
  assert.ok(verdict.ensemble.citedMin < context.cold.neededClo);
  assert.equal(verdict.fit, 'unknown');
  assert.match(thermal.thermalNote(verdict, 'tr'), /^Mont\/kaban yalıtımı yalnız ikincil, doğrulanmamış kaynaktan biliniyor; 60 dk \(varsayılan süre\) için uygunluk doğrulanamadı\.$/);
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

test('planned hours carry their own solar radiation through parsing and every hour above 10 °C is checked', () => {
  const { parseForecastSource } = require('../lib/weather-forecast.ts');
  const t0 = Date.parse('2026-06-21T09:00:00Z') / 1000;
  const source = parseForecastSource('Open-Meteo', { timezone: 'Europe/Istanbul', hourly: {
    time: [t0, t0 + 3600], temperature_2m: [24, 27], apparent_temperature: [24, 28], relative_humidity_2m: [50, 45], dew_point_2m: [12, 13],
    wind_speed_10m: [8, 10], precipitation_probability: [0, 0], weather_code: [0, 0], is_day: [1, 1], direct_normal_irradiance: [650, null],
  } }, 41, 29);
  assert.equal(source.points[0].directNormalIrradiance, 650);
  assert.equal(source.points[1].directNormalIrradiance, undefined, 'a missing value is not zero');
  const planned = weatherAt(24, { lat: 41, lon: 29, directNormalIrradiance: 999, hourly: source.points,
    selection: { date: '2026-06-21', startAt: '2026-06-21T09:00:00Z', endAt: '2026-06-21T11:00:00Z', point: false, minTemp: 24, maxTemp: 27, minFeelsLike: 24, maxFeelsLike: 28, maxWind: 10, maxPrecipitation: 0 } });
  const context = thermal.thermalContext(planned);
  assert.equal(context.cold, null);
  assert.equal(context.warm.conditions.length, 2);
  assert.ok(context.warm.conditions[0].deltaMrt > 0 && context.warm.conditions[1].deltaMrt === 0, 'current radiation is not reused for planned hours');
  assert.equal(context.exposureHours, 2);
});
