const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, f);
const { localDateKey, localTimeLabel, resolveWeatherInstant, daylightAt } = require('../lib/weather-time.ts');

test('location date crosses midnight independently of the host clock', () => {
  const at = Date.parse('2026-01-15T21:30:00Z');
  assert.equal(localDateKey(at, 'Europe/Istanbul'), '2026-01-16');
  assert.equal(localTimeLabel(at, 'America/New_York'), '16:30');
  assert.equal(resolveWeatherInstant('00:30', 'Europe/Istanbul', at), at);
});
test('DST missing time is rejected; repeated time resolves deterministically to its first instant', () => {
  assert.equal(resolveWeatherInstant('02:30', 'Europe/Berlin', Date.parse('2026-03-29T12:00Z')), null);
  assert.equal(resolveWeatherInstant('02:30', 'Europe/Berlin', Date.parse('2026-10-25T12:00Z')), Date.parse('2026-10-25T00:30Z'));
  assert.equal(resolveWeatherInstant('25:00', 'Europe/Istanbul', Date.now()), null);
});
test('sunrise inclusive, sunset exclusive, at the selected minute', () => {
  const context = { timezone: 'Europe/Istanbul', lat: 41, lon: 29, solarDays: [
    { date: '2026-01-15', sunrise: '2026-01-15T05:25Z', sunset: '2026-01-15T15:01Z' },
  ] };
  assert.equal(daylightAt(context, Date.parse('2026-01-15T05:24:59Z')), false);
  assert.equal(daylightAt(context, Date.parse('2026-01-15T05:25Z')), true);
  assert.equal(daylightAt(context, Date.parse('2026-01-15T15:01Z')), false);
});
test('solar fallback follows hemisphere and polar seasons instead of a fixed clock', () => {
  const polar = { lat: 78.22, lon: 15.65 };
  assert.equal(daylightAt(polar, Date.parse('2026-06-21T23:00Z')), true);
  assert.equal(daylightAt(polar, Date.parse('2026-12-21T11:00Z')), false);
  assert.equal(daylightAt({ lat: -33.87, lon: 151.21 }, Date.parse('2026-01-15T12:00Z')), false);
  assert.equal(daylightAt({}, Date.now()), null);
});

test('half-hour and quarter-hour zones resolve real instants; explicit dates retain their offset', () => {
  assert.equal(resolveWeatherInstant('23:45', 'Asia/Kathmandu', Date.parse('2026-01-15T12:00Z')), Date.parse('2026-01-15T18:00Z'));
  assert.equal(resolveWeatherInstant('00:15', 'Australia/Adelaide', Date.parse('2026-01-15T18:00Z')), Date.parse('2026-01-15T13:45Z'));
  assert.equal(resolveWeatherInstant('2026-01-18T23:30:00-05:00', 'Europe/Istanbul', 0), Date.parse('2026-01-19T04:30Z'));
});

test('all supported host time zones produce the same location result', () => {
  const { execFileSync } = require('node:child_process');
  const code = `${fs.readFileSync(__filename, 'utf8').split("test('location")[0].replace(/const \{ test \}.*\n/, '')}
    process.stdout.write(JSON.stringify([localDateKey(Date.parse('2026-01-15T22:00Z'),'Europe/Istanbul'),
      resolveWeatherInstant('00:30','Europe/Istanbul',Date.parse('2026-01-15T22:00Z'))]));`;
  const results = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo'].map(TZ => execFileSync(process.execPath, ['-e', code], {
    cwd: __dirname, env: { ...process.env, TZ }, encoding: 'utf8',
  }));
  assert.equal(new Set(results).size, 1);
});
