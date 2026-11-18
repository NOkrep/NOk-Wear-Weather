const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const carry = require('../lib/carry-along.ts');
const thermal = require('../lib/outfit-thermal.ts');

const now = Date.parse('2026-11-20T09:00:00Z'); // 12:00 in Istanbul
const hour = (offsetHours, temp, patch = {}) => ({ validAt: new Date(now + offsetHours * 3_600_000).toISOString(), timeStr: '', hourNumber: 0,
  temp, feelsLike: temp, precipitationProb: 0, windSpeed: 10, condition: 'cloudy', suggestedAction: '', ...patch });
const weather = (hourly, patch = {}) => ({ temp: 15, feelsLike: 15, humidity: 60, dewPoint: 7, windSpeed: 10, precipitationProb: 0, uvIndex: 0,
  condition: 'cloudy', confidenceScore: 80, sources: [], timezone: 'Europe/Istanbul', observedAt: new Date(now).toISOString(), hourly, ...patch });
const piece = (id, category, garmentTypeId, warmth, patch = {}) => ({ id, category, garmentTypeId, name: id, segment: 'essential', material: 'test', warmth,
  waterResistance: 'none', windResistance: 'medium', colorHex: '#505c5c', colorName: 'test', colorType: 'neutral', description: 'test', dataSource: 'user', isUserOwned: true, ...patch });

const outfit = [piece('tee', 'base', 'short-sleeve-tee', 1), piece('jacket', 'outer', 'light-jacket', 1), piece('jeans', 'bottom', 'jeans', 3), piece('sneakers', 'footwear', 'sneakers', 1)];
const fleece = piece('fleece', 'mid', 'fleece', 4), cardigan = piece('cardigan', 'mid', 'cardigan', 1), shell = piece('shell', 'outer', 'rain-jacket', 2, { waterResistance: 'waterproof' });

test('a colder evening suggests the lightest single layer that covers it', () => {
  const day = weather([hour(1, 15), hour(4, 12), hour(7, 8)]);
  const result = carry.carryAlong(outfit, [cardigan, fleece], day, 0, now);
  const colder = result.suggestions.find(s => s.reason === 'colder');
  assert.ok(colder, JSON.stringify(result));
  assert.equal(colder.temp, 8);
  assert.equal(colder.timeLabel, '19:00');
  if (colder.status === 'add') {
    const at = thermal.thermalContext({ ...day, temp: 8, hourly: [], observedAt: colder.at && new Date(colder.at).toISOString() }, 0, 'walking', colder.at);
    assert.equal(thermal.assessItems([...outfit, colder.item], at).fit, 'acceptable', colder.item.id);
    assert.equal(thermal.assessItems(outfit, at).fit, 'insufficient');
  } else assert.equal(colder.status, 'none', 'never claims a piece it cannot judge');
  assert.equal(outfit.length, 4, 'the outfit itself is never changed');
  assert.match(carry.carryNote(colder, colder.item ? colder.item.id : null, 'tr', false), /19:00 itibarıyla 8°; ISO 11079 modeline göre/);
});

test('rain later in the day suggests a waterproof outer layer, or says none is available', () => {
  const wet = weather([hour(2, 15, { precipitationProb: 70 })]);
  const withShell = carry.carryAlong(outfit, [shell], wet, 0, now).suggestions.find(s => s.reason === 'rain');
  assert.equal(withShell.status, 'add');
  assert.equal(withShell.item.id, 'shell');
  assert.equal(carry.carryNote(withShell, 'Yağmurluk', 'tr', false), 'Yanına al: Yağmurluk — 14:00 civarı yağış olasılığı %70.');
  const without = carry.carryAlong(outfit, [fleece], wet, 0, now).suggestions.find(s => s.reason === 'rain');
  assert.equal(without.status, 'none');
  assert.match(carry.carryNote(without, null, 'en', true), /your wardrobe has no waterproof outer layer to carry\.$/);
  const alreadyWaterproof = [...outfit.filter(item => item.category !== 'outer'), shell];
  assert.equal(carry.carryAlong(alreadyWaterproof, [], wet, 0, now).suggestions.length, 0);
  assert.equal(carry.carryAlong(outfit, [shell], weather([hour(2, 15, { precipitationProb: 70 })], { precipitationProb: 60 }), 0, now).suggestions.length, 0, 'already raining: the outfit itself handles rain');
});

test('only the next 8 hours of today count; plans and missing forecasts suggest nothing', () => {
  const late = weather([hour(9, 2), hour(14, 0, { precipitationProb: 90 })]);
  const result = carry.carryAlong(outfit, [fleece, shell], late, 0, now);
  assert.deepEqual(result, { suggestions: [], missingForecast: false }, 'beyond 8 hours or past midnight is ignored, and that is not missing data');
  const lateEvening = Date.parse('2026-11-20T20:30:00Z'); // 23:30 in Istanbul
  assert.deepEqual(carry.carryAlong(outfit, [fleece], weather([{ ...hour(12, 2) }]), 0, lateEvening), { suggestions: [], missingForecast: false });
  assert.deepEqual(carry.carryAlong(outfit, [fleece], weather([hour(-3, 15), hour(-1, 14)]), 0, lateEvening), { suggestions: [], missingForecast: false }, 'only past hours of today: the day is over, not missing');
  const planned = weather([hour(1, 2)], { selection: { date: '2026-11-20', startAt: new Date(now).toISOString(), endAt: new Date(now + 7_200_000).toISOString(), point: false, minTemp: 2, maxTemp: 15, minFeelsLike: 2, maxFeelsLike: 15, maxWind: 10, maxPrecipitation: 0 } });
  assert.deepEqual(carry.carryAlong(outfit, [fleece], planned, 0, now), { suggestions: [], missingForecast: false }, 'a planned outfit already covers its window');
  assert.equal(carry.carryAlong(outfit, [fleece], weather([]), 0, now).missingForecast, true);
});
