const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, f);
const { resolveStopWeatherAtTime, computeCompositeItineraryWeather, fetchWeatherConsensus } = require('../lib/weather-service.ts');
const { normalizeWeather, mapWmoToCondition } = require('../lib/weather-condition.ts');
function loadApi(file, fetcher, clock) {
  const RealDate = Date;
  class ClockDate extends RealDate {
    constructor(...args) { super(...(args.length ? args : [clock.now])); }
    static now() { return clock.now; }
  }
  const module = { exports: {} };
  const context = { module, exports: module.exports, URL, Date: ClockDate, console, AbortSignal,
    fetch: fetcher, require: name => name === 'next/server'
      ? { NextResponse: { json: (body, options) => ({ body, options }) } }
      : require(name.startsWith('@/') ? path.join(root, name.slice(2) + '.ts') : name) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  return module.exports;
}
const request = url => ({ url, headers: new Headers() });
const json = body => ({ ok: true, json: async () => body });
function meteo(at, extra = {}) {
  const start = Date.parse('2026-01-15T21:00Z') / 1000;
  const time = Array.from({ length: 48 }, (_, i) => start + i * 3600);
  return { timezone: 'Europe/Istanbul', current: { time: at / 1000, is_day: 0, temperature_2m: 10,
    apparent_temperature: 9, relative_humidity_2m: 60, weather_code: 0, wind_speed_10m: 5, precipitation: 0 },
    daily: { time: [start, start + 86400], sunrise: [start + 8 * 3600, start + 32 * 3600], sunset: [start + 18 * 3600, start + 42 * 3600] },
    hourly: { time, temperature_2m: time.map(() => 10), apparent_temperature: time.map(() => 9),
      weather_code: time.map(() => 0), wind_speed_10m: time.map(() => 5), precipitation_probability: time.map(() => 0),
      is_day: time.map((_, i) => Number(i % 24 >= 8 && i % 24 < 18)), uv_index: time.map(() => 0) }, ...extra };
}
test('night WMO providers cannot outvote the night symbol; cached response crosses sunrise', async () => {
  const clock = { now: Date.parse('2026-01-16T04:55Z') };
  const payload = meteo(clock.now);
  let calls = 0;
  const api = loadApi('app/api/weather/route.ts', async url => {
    calls++;
    if (String(url).includes('open-meteo.com')) return json(payload);
    throw new Error('provider offline');
  }, clock);
  const first = (await api.GET(request('https://fixture/api/weather?lat=41&lon=29'))).body;
  assert.equal(first.condition, 'clear_night');
  assert.equal(first.timezone, 'Europe/Istanbul');
  assert.ok(first.hourly.every(h => h.validAt.endsWith('Z')));
  const before = calls;
  clock.now = Date.parse('2026-01-16T05:05Z');
  const second = (await api.GET(request('https://fixture/api/weather?lat=41&lon=29'))).body;
  assert.equal(second.cached, true);
  assert.equal(second.condition, 'sunny');
  assert.equal(calls, before);
  assert.equal(first.condition, 'clear_night', 'cache normalization must not mutate earlier responses');
});
test('selected midnight uses dated points and never borrows the daytime hour', () => {
  const weather = { temp: 20, feelsLike: 20, precipitationProb: 0, windSpeed: 5, condition: 'sunny',
    timezone: 'Europe/Istanbul', lat: 41, lon: 29, sources: [], hourly: [
      { validAt: '2026-01-15T20:00Z', hourNumber: 23, temp: 8, condition: 'clear_night' },
      { validAt: '2026-01-16T03:00Z', hourNumber: 6, temp: 20, condition: 'sunny' },
    ] };
  const result = resolveStopWeatherAtTime(weather, '00:30', Date.parse('2026-01-15T21:30Z'));
  assert.equal(result.condition, 'clear_night');
  assert.equal(result.forecastAvailable, false, 'no nearby forecast for the selected instant');
});

test('selected minutes cross sunset while the same hourly weather stays clear', () => {
  const at = Date.parse('2026-01-16T15:30Z');
  const weather = { ...meteo(at), lat: 41, lon: 29, temp: 10, feelsLike: 9,
    condition: 'sunny', sources: [], solarDays: [{ date: '2026-01-16', sunrise: '2026-01-16T05:00Z', sunset: '2026-01-16T15:15Z' }],
    hourly: [{ validAt: '2026-01-16T15:00Z', temp: 10, feelsLike: 9, condition: 'sunny', isDay: true }],
  };
  const before = resolveStopWeatherAtTime(weather, '18:14', at);
  const after = resolveStopWeatherAtTime(weather, '18:15', at);
  assert.equal(before.condition, 'sunny');
  assert.equal(after.condition, 'clear_night');
  assert.equal(after.forecastAvailable, true);
  assert.equal(after.validAt, '2026-01-16T15:15:00.000Z');
});

test('legacy hourly records and expired live readings cannot masquerade as a dated forecast', () => {
  const at = Date.parse('2026-01-16T21:30Z');
  const legacy = { lat: 41, lon: 29, timezone: 'Europe/Istanbul', condition: 'sunny', sources: [],
    hourly: [{ timeStr: '00:00', hourNumber: 0, condition: 'sunny', temp: 30 }] };
  const snapshot = JSON.stringify(legacy);
  assert.equal(normalizeWeather(legacy, at).hourly.length, 0);
  assert.equal(normalizeWeather(legacy, at).condition, 'clear_night');
  assert.equal(resolveStopWeatherAtTime(legacy, '00:30', at).forecastAvailable, false);
  assert.equal(computeCompositeItineraryWeather([{ weather: legacy }], legacy, at), null);
  assert.equal(JSON.stringify(legacy), snapshot);
  assert.equal(mapWmoToCondition(0), 'partly_cloudy', 'unknown phase never invents sunshine');
});

test('a fresh current reading changes phase while the page stays open, then uses dated hourly data', () => {
  const at = Date.parse('2026-01-16T14:55Z');
  const weather = { lat: 41, lon: 29, timezone: 'Europe/Istanbul', fetchedAt: new Date(at).toISOString(),
    condition: 'sunny', temp: 12, feelsLike: 12, sources: [], forecastAvailable: true,
    solarDays: [{ date: '2026-01-16', sunrise: '2026-01-16T05:00Z', sunset: '2026-01-16T15:00Z' }],
    hourly: [{ validAt: '2026-01-16T15:00Z', temp: 8, feelsLike: 7, condition: 'sunny' }],
  };
  assert.equal(resolveStopWeatherAtTime(weather, '', at).condition, 'sunny');
  assert.equal(resolveStopWeatherAtTime(weather, '', at + 6 * 60000).condition, 'clear_night');
  assert.equal(resolveStopWeatherAtTime(weather, '', at + 20 * 60000).temp, 8);
  const composite = computeCompositeItineraryWeather([{ weather, preferredTime: '18:30' }], null, at);
  assert.equal(composite.condition, 'clear_night');
  assert.equal(composite.isDay, false);
});

test('the clothing timeline receives only the resolved local day, not both days equal clock hours', () => {
  const now = Date.parse('2026-01-16T09:00Z');
  const weather = { condition: 'sunny', timezone: 'Europe/Istanbul', lat: 41, lon: 29, sources: [],
    hourly: [
      { validAt: '2026-01-16T09:00Z', hourNumber: 12, temp: 10, feelsLike: 10 },
      { validAt: '2026-01-17T09:00Z', hourNumber: 12, temp: 30, feelsLike: 30 },
    ] };
  const composite = computeCompositeItineraryWeather([{ weather, preferredTime: '12:00' }], null, now);
  assert.equal(composite.temp, 10);
  assert.equal(composite.hourly.length, 1);
  assert.equal(weather.hourly.length, 2, 'do not trim the reusable forecast in place');
});

test('all optional clear providers share the night context; a cloudy dry station stays cloudy', async () => {
  const clock = { now: Date.parse('2026-01-16T21:00Z') };
  const api = loadApi('app/api/weather/route.ts', async url => {
    const target = String(url);
    if (target.includes('open-meteo')) return json(meteo(clock.now));
    if (target.includes('brightsky')) return json({ weather: { temperature: 10, condition: 'dry', icon: 'cloudy', cloud_cover: 100 } });
    if (target.includes('api.met.no')) return json({ properties: { timeseries: [{ data: { instant: { details: {
      air_temperature: 10, relative_humidity: 60, wind_speed: 2,
    } }, next_1_hours: { summary: { symbol_code: 'clearsky_night' }, details: {} } } }] } });
    if (target.includes('weatherapi')) return json({ current: { temp_c: 10, feelslike_c: 9, humidity: 60, wind_kph: 5, is_day: 0, condition: { text: 'Clear' } } });
    if (target.includes('openweathermap')) return json({ main: { temp: 10, feels_like: 9, humidity: 60 }, weather: [{ main: 'Clear' }] });
    throw new Error('unexpected provider');
  }, clock);
  const req = request('https://fixture/api/weather?lat=41&lon=29');
  req.headers.set('x-weatherapi-key', 'synthetic-key');
  req.headers.set('x-owm-key', 'synthetic-key');
  const result = await api.GET(req);
  assert.equal(result.body.sources.length, 5);
  assert.equal(result.body.condition, 'clear_night');
  assert.equal(result.body.sources.find(s => s.sourceName.includes('Bright Sky')).condition, 'cloudy');
  assert.ok(result.body.sources.every(s => s.isDay === false && s.condition !== 'sunny'));
  assert.equal(result.options.headers['Cache-Control'], 'no-store');
});

test('provider outage has no fabricated sunny hourly points and no success confidence', async () => {
  const clock = { now: Date.parse('2026-01-16T21:00Z') };
  const api = loadApi('app/api/weather/route.ts', async () => { throw new Error('offline'); }, clock);
  const { body } = await api.GET(request('https://fixture/api/weather?lat=41&lon=29'));
  assert.equal(body.forecastAvailable, false);
  assert.equal(body.confidenceScore, 0);
  assert.equal(body.hourly.length, 0);
  assert.equal(body.isDay, false);
  assert.ok(body.sources.every(s => !s.isAvailable && s.condition !== 'sunny'));
});

test('a cache hit after local midnight re-evaluates date and selects the new day point', async () => {
  const clock = { now: Date.parse('2026-01-15T20:55Z') };
  const api = loadApi('app/api/weather/route.ts', async url => {
    if (String(url).includes('open-meteo')) return json(meteo(clock.now));
    throw new Error('offline');
  }, clock);
  await api.GET(request('https://fixture/api/weather?lat=41&lon=29'));
  clock.now += 10 * 60000;
  const { body } = await api.GET(request('https://fixture/api/weather?lat=41&lon=29'));
  assert.equal(body.cached, true);
  const result = resolveStopWeatherAtTime(body, '00:05', clock.now);
  assert.equal(result.validAt, '2026-01-15T21:05:00.000Z');
  assert.equal(result.forecastAvailable, true);
  assert.equal(result.condition, 'clear_night');
});

test('route arrivals retain their UTC date across midnight and use each stop local zone', async () => {
  const clock = { now: Date.parse('2026-01-15T20:00Z') };
  const api = loadApi('app/api/route/route.ts', async url => {
    if (String(url).includes('router.project-osrm')) return json({ routes: [{ distance: 180000, duration: 7200,
      geometry: { coordinates: [[29, 41], [30, 41], [31, 41], [32, 41]] } }] });
    if (String(url).includes('open-meteo')) {
      const eastern = new URL(url).searchParams.get('longitude') === '32';
      const data = meteo(clock.now, eastern ? { timezone: 'Asia/Tbilisi' } : {});
      for (const [key, values] of Object.entries(data.hourly)) values.unshift(key === 'time' ? values[0] - 3600 : values[0]);
      return json(data);
    }
    return json({});
  }, clock);
  const { body, options } = await api.GET(request('https://fixture/api/route?fromLat=41&fromLon=29&toLat=41&toLon=32&departureTime=23:30'));
  assert.equal(body.stops[0].validAt, '2026-01-15T20:30:00.000Z');
  const end = body.stops.at(-1);
  assert.equal(end.validAt, '2026-01-15T22:30:00.000Z');
  assert.equal(end.timeStr, '02:30');
  assert.equal(end.condition, 'clear_night');
  assert.equal(end.forecastAvailable, true);
  assert.ok(body.stops.every(s => s.forecastAvailable && s.condition === 'clear_night'));
  assert.equal(options.headers['Cache-Control'], 'private, no-store');
});

test('forecast uses a coarse grid and geocoding bypasses persistent fetch caches', async () => {
  const clock = { now: Date.parse('2026-01-15T22:00Z') };
  const requestedUrls = [];
  const weather = loadApi('app/api/weather/route.ts', async (url, init) => {
    requestedUrls.push({ url: new URL(url), cache: init.cache });
    return new URL(url).hostname === 'api.open-meteo.com' ? json(meteo(clock.now)) : { ok: false };
  }, clock);
  const first = await weather.GET(request('https://fixture/api/weather?lat=41.123456&lon=29.987654'));
  assert.equal(first.body.lat, 41.12);
  assert.equal(first.body.lon, 29.99);
  const cached = await weather.GET(request('https://fixture/api/weather?lat=41.124001&lon=29.986001'));
  assert.equal(cached.body.cached, true);
  assert.equal(cached.body.lat, 41.12);
  assert.ok(requestedUrls.length > 0);
  for (const { url, cache } of requestedUrls) {
    assert.equal(cache, 'no-store');
    assert.doesNotMatch(url.href, /41\.123456|29\.987654/);
  }

  const queries = [];
  const geocode = loadApi('app/api/geocode/route.ts', async (url, init) => {
    queries.push({ url: new URL(url), init });
    return json({});
  }, clock);
  for (const query of ['lat=41.123456&lon=29.987654', 'q=Example+district', 'lat=41.1suffix&lon=29']) {
    const result = await geocode.GET(request(`https://fixture/api/geocode?${query}`));
    assert.equal(result.options.headers['Cache-Control'], 'private, no-store');
  }
  assert.equal(queries.length, 2);
  assert.ok(queries.every(({ init }) => init.cache === 'no-store' && !init.next));
  // Reverse geocoding answers at district level; the provider only receives ~110 m precision.
  assert.equal(queries[0].url.searchParams.get('lat'), '41.123');
  assert.equal(queries[0].url.searchParams.get('lon'), '29.988');
  assert.match(queries[0].init.headers['User-Agent'], /^Weathrobe\/\d+\.\d+\.\d+ \(\+https:\/\/github\.com\/NOkrep\/NOk-Wear-Weather\)$/);
  assert.equal(queries[1].url.searchParams.get('name'), 'Example district');
});

function loadUi(file, overrides = {}, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  const stub = () => null;
  const load = name => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (name === '@/lib/i18n') return { useLocale: () => ({ t: value => value, locale: 'tr' }) };
    if (name.startsWith('@/components/') && !['WeatherIcon', 'HourlyForecastChart'].includes(name.split('/').at(-1))) {
      return new Proxy({}, { get: () => stub });
    }
    if (name.startsWith('@/')) {
      const target = name.slice(2);
      return target.startsWith('components/') ? loadUi(target + '.tsx', overrides, cache) : require(path.join(root, target + '.ts'));
    }
    if (name === './WeatherIcon') return loadUi('components/WeatherIcon.tsx', overrides, cache);
    return require(name);
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, { module, exports: module.exports, require: load, console, Date, Intl });
  cache.set(file, module.exports);
  return module.exports;
}

test('actual React hero, stop and hourly icons agree with the night label and location date', async () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const clock = { now: Date.parse('2026-01-15T21:30Z') };
  const api = loadApi('app/api/weather/route.ts', async url => {
    if (String(url).includes('open-meteo')) return json(meteo(clock.now));
    throw new Error('offline');
  }, clock);
  const weather = (await api.GET(request('https://fixture/api/weather?lat=41&lon=29'))).body;
  const stateReact = { ...React, useState: initial => {
    if (Array.isArray(initial) && initial[0]?.id === 'stop-initial') {
      return React.useState([{ ...initial[0], weather, preferredTime: '00:30' }]);
    }
    if (typeof initial === 'function') return React.useState(clock.now);
    return React.useState(initial);
  } };
  const { default: Home } = loadUi('app/page.tsx', { react: stateReact });
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.match(html, /condition-name">Açık gece</);
  assert.match(html, /16 Ocak/);
  assert.ok((html.match(/lucide-moon/g) || []).length >= 2, 'hero and selected stop both show the moon');
  const { HourlyForecastChart } = loadUi('components/HourlyForecastChart.tsx');
  const chart = renderToStaticMarkup(React.createElement(HourlyForecastChart, { consensus: weather, districtName: 'Fixture', now: clock.now }));
  assert.match(chart, /dateTime="2026-01-15T21:00:00.000Z"/i);
  assert.match(chart, /lucide-moon/);
  assert.doesNotMatch(chart.split('hourly-cell-current')[1].split('</article>')[0], /lucide-sun/);
});

test('shared icon uses a moon for partly cloudy nights and no sun for unknown phase', () => {
  const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
  const { WeatherIcon } = loadUi('components/WeatherIcon.tsx');
  assert.match(renderToStaticMarkup(React.createElement(WeatherIcon, { condition: 'partly_cloudy', isDay: false })), /lucide-cloud-moon/);
  assert.match(renderToStaticMarkup(React.createElement(WeatherIcon, { condition: 'partly_cloudy', isDay: true })), /lucide-cloud-sun/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(WeatherIcon, { condition: 'sunny' })), /lucide-sun/);
});

test('client failure keeps personal sentinels untouched and supplies no fake forecast', async () => {
  const originalFetch = global.fetch, originalWindow = global.window, originalStorage = global.localStorage;
  const personal = new Map([['wear_weather_wardrobe', 'PERSONAL'], ['wear_weather_feedback', 'PRIVATE']]);
  const before = JSON.stringify([...personal]);
  const originalError = console.error;
  try {
    global.window = {};
    global.localStorage = { getItem: key => personal.get(key) ?? null, setItem: () => assert.fail('write'), clear: () => assert.fail('clear'), removeItem: () => assert.fail('delete') };
    global.fetch = async () => { throw new Error('offline'); };
    console.error = () => {};
    const weather = await fetchWeatherConsensus({ lat: 0, lon: 0, country: '', city: '', district: '' });
    assert.equal(weather.lat, 0);
    assert.equal(weather.lon, 0);
    assert.equal(weather.forecastAvailable, false);
    assert.equal(weather.confidenceScore, 0);
    assert.equal(weather.hourly.length, 0);
    assert.equal(JSON.stringify([...personal]), before);
  } finally {
    global.fetch = originalFetch; global.window = originalWindow; global.localStorage = originalStorage; console.error = originalError;
  }
});

test('service worker purges old first-party API entries only from app caches and never replays them offline', async () => {
  const listeners = {}, entries = new Map([
    ['https://fixture/api/weather?lat=41', 'OLD SUN'], ['https://fixture/api/route', 'OLD ROUTE'],
    ['https://fixture/personal-sentinel', 'PRIVATE'], ['https://fixture/api/catalog', 'CATALOG'],
    ['https://fixture/api/geocode?q=example', 'OLD SEARCH'], ['https://other.test/api/geocode', 'OTHER ORIGIN'],
  ]);
  const cache = { keys: async () => [...entries.keys()].map(url => ({ url })), delete: async req => entries.delete(req.url) };
  let lookupCount = 0;
  const opened = [];
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8'), {
    URL, Response, self: { location: { origin: 'https://fixture' }, addEventListener: (name, listener) => { listeners[name] = listener; }, clients: { claim: async () => {} } },
    caches: { keys: async () => ['wear-weather-v0.3.0', 'unrelated'], open: async key => { opened.push(key); return cache; }, match: () => { lookupCount++; return 'OLD SUN'; } },
    fetch: async (_, init) => { assert.equal(init.cache, 'no-store'); throw new Error('offline'); },
  });
  let work;
  listeners.activate({ waitUntil: p => { work = p; } });
  await work;
  assert.deepEqual(opened, ['wear-weather-v0.3.0']);
  assert.deepEqual([...entries.values()], ['PRIVATE', 'OTHER ORIGIN']);
  for (const endpoint of ['weather', 'route', 'geocode?q=example', 'catalog', 'health']) {
    listeners.fetch({ request: { method: 'GET', url: `https://fixture/api/${endpoint}` }, respondWith: p => { work = p; } });
    const response = await work;
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(lookupCount, 0);
});
