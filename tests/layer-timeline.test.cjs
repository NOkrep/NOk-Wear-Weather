const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { generateLayerTimeline } = require('../lib/clothing-engine.ts');

// Istanbul is UTC+3 all year; 2026-11-20 07:00 local = 04:00Z.
const zone = 'Europe/Istanbul';
const at = (date, hour) => new Date(Date.parse(`${date}T00:00:00Z`) + (hour - 3) * 3_600_000).toISOString();
const point = (date, hour, temp, patch = {}) => ({ validAt: at(date, hour), timezone: zone, timeStr: `${String(hour).padStart(2, '0')}:00`, hourNumber: hour,
  temp, feelsLike: temp - 2, precipitationProb: 10, windSpeed: 8, condition: 'cloudy', suggestedAction: '', ...patch });
const weather = (hourly, patch = {}) => ({ temp: 30, feelsLike: 30, humidity: 60, dewPoint: 7, windSpeed: 8, precipitationProb: 0, uvIndex: 0,
  condition: 'cloudy', confidenceScore: 80, sources: [], timezone: zone, observedAt: at('2026-11-20', 12), hourly, ...patch });
const now = Date.parse(at('2026-11-20', 12));

test('each phase comes from that day’s own hours: coldest hour, worst rain and wind, real time range', () => {
  const hourly = [];
  for (let hour = 0; hour < 24; hour++) hourly.push(point('2026-11-20', hour, 10 + Math.round(4 * Math.sin((hour - 9) / 24 * 2 * Math.PI)),
    hour === 20 ? { precipitationProb: 70, windSpeed: 30 } : {}));
  // Tomorrow's morning is much colder and must not leak into today's plan.
  for (let hour = 0; hour < 12; hour++) hourly.push(point('2026-11-21', hour, -5));
  const steps = generateLayerTimeline(weather(hourly), 'essential', 0, 'Türkiye', now);
  assert.deepEqual(steps.map(step => step.phase), ['morning', 'midday', 'evening']);
  const today = hourly.filter(p => p.validAt.startsWith('2026-11-2') && Date.parse(p.validAt) < Date.parse(at('2026-11-21', 0)));
  const coldest = hours => Math.min(...today.filter(p => hours.includes(p.hourNumber)).map(p => p.temp));
  assert.equal(steps[0].expectedTemp, coldest([7, 8, 9, 10]));
  assert.equal(steps[0].feelsLikeTemp, coldest([7, 8, 9, 10]) - 2);
  assert.equal(steps[0].timeRange, '07:00–10:00');
  assert.equal(steps[1].timeRange, '12:00–16:00');
  assert.equal(steps[2].timeRange, '18:00–22:00');
  assert.equal(steps[2].precipitationProb, 70);
  assert.ok(steps.every(step => step.expectedTemp > 0), 'tomorrow’s −5 °C never appears');
});

test('a phase without forecast hours is left out instead of being estimated from the current reading', () => {
  const hourly = [7, 8, 9, 10, 12, 13].map(hour => point('2026-11-20', hour, 12));
  const steps = generateLayerTimeline(weather(hourly), 'essential', 0, 'Türkiye', now);
  assert.deepEqual(steps.map(step => step.phase), ['morning', 'midday']);
  assert.equal(steps[1].timeRange, '12:00–13:00');
  assert.ok(steps.every(step => step.expectedTemp === 12), 'nothing derived from the 30 °C current reading');
});

test('no hourly forecast gives an empty plan, not fixed offsets around the current temperature', () => {
  assert.deepEqual(generateLayerTimeline(weather([]), 'essential', 0, 'Türkiye', now), []);
  assert.deepEqual(generateLayerTimeline(weather(undefined), 'essential', 0, 'Türkiye', now), []);
});

test('a requested date picks that date’s hours', () => {
  const hourly = [point('2026-11-20', 8, 12), point('2026-11-22', 8, 3), point('2026-11-22', 19, 1)];
  const steps = generateLayerTimeline(weather(hourly, { requestedDate: '2026-11-22' }), 'essential', 0, 'Türkiye', now);
  assert.deepEqual(steps.map(step => [step.phase, step.expectedTemp]), [['morning', 3], ['evening', 1]]);
});
