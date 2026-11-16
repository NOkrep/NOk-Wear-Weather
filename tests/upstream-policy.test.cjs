const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const transpile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

// Each load gets fresh module state (limits, queue, memo) so tests stay independent.
function loadFresh(file, fetcher, clock) {
  const cache = new Map();
  const load = (target, extra = {}) => {
    const full = path.join(root, target);
    if (cache.has(full)) return cache.get(full);
    const module = { exports: {} };
    cache.set(full, module.exports);
    vm.runInNewContext(transpile(full), {
      module, exports: module.exports, URL, AbortSignal, Headers, performance, setTimeout, Promise, console,
      Date: class extends Date { static now() { return clock.now; } },
      fetch: fetcher,
      require: name => {
        if (name === 'next/server') return { NextResponse: { json: (body, options) => ({ body, options }) } };
        if (name === '../package.json') return { version: '9.8.7' };
        if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
        if (name.startsWith('./')) return load(path.join(path.dirname(target), name) + '.ts');
        return require(name);
      },
      ...extra,
    });
    cache.set(full, module.exports);
    return module.exports;
  };
  return { route: load(file), policy: load('lib/upstream-policy.ts') };
}

const json = body => ({ ok: true, json: async () => body });
const request = url => ({ url, headers: new Headers() });

test('one identifying agent with the package version and the public repository', () => {
  const { policy } = loadFresh('lib/upstream-policy.ts', async () => json({}), { now: 0 });
  assert.equal(policy.UPSTREAM_USER_AGENT, 'Weathrobe/9.8.7 (+https://github.com/NOkrep/NOk-Wear-Weather)');
  assert.equal(policy.roundForReverseGeocode(41.123456), 41.123);
  assert.equal(policy.roundForRouting(-29.987654), -29.9877);
  for (const file of ['app/api/geocode/route.ts', 'app/api/route/route.ts', 'app/api/weather/route.ts']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /WearWeatherApp|nok-collective/i, file);
  }
});

test('window limit reports the real remaining wait and resets after the window', () => {
  const { policy } = loadFresh('lib/upstream-policy.ts', async () => json({}), { now: 0 });
  const admit = policy.createWindowLimit(2, 60_000);
  assert.equal(admit(1_000).ok, true);
  assert.equal(admit(2_000).ok, true);
  assert.deepEqual({ ...admit(31_500) }, { ok: false, retryAfterSeconds: 30 });
  assert.equal(admit(61_000).ok, true);
});

test('spaced queue serialises calls at least the spacing apart and drops work beyond the backlog', async () => {
  const { policy } = loadFresh('lib/upstream-policy.ts', async () => json({}), { now: 0 });
  const run = policy.createSpacedQueue(40, 2);
  const started = [];
  const task = value => async () => { started.push(performance.now()); return value; };
  const results = await Promise.all([run(task('a')), run(task('b')), run(task('c'))]);
  assert.deepEqual(results, ['a', 'b', null]);
  assert.equal(started.length, 2);
  assert.ok(started[1] - started[0] >= 35, `gap ${started[1] - started[0]}`);
  assert.equal(await run(async () => { throw Error('provider'); }).catch(error => error.message), 'provider');
  assert.equal(await run(task('d')), 'd');
});

test('reverse geocoding sends rounded points, memoises the area and returns 429 with Retry-After', async () => {
  const clock = { now: Date.parse('2026-01-15T10:00Z') };
  const calls = [];
  const { route } = loadFresh('app/api/geocode/route.ts', async (url, init) => {
    calls.push({ url: new URL(url), init });
    return json({ address: { suburb: 'Synthetic district', city: 'Synthetic city', country: 'Testland' }, display_name: 'Synthetic' });
  }, clock);

  const first = await route.GET(request('https://fixture/api/geocode?lat=41.123456&lon=29.987654'));
  assert.equal(first.body.district, 'Synthetic district');
  assert.equal(first.body.lat, 41.123456, 'the caller keeps its own coordinates');
  const near = await route.GET(request('https://fixture/api/geocode?lat=41.12301&lon=29.98799'));
  assert.equal(near.body.district, 'Synthetic district');
  assert.equal(calls.length, 1, 'same ~110 m cell is answered from memory');
  assert.equal(calls[0].url.searchParams.get('lat'), '41.123');
  assert.equal(calls[0].url.searchParams.get('lon'), '29.988');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.match(calls[0].init.headers['User-Agent'], /^Weathrobe\//);

  for (let index = 2; index < 120; index++) {
    const result = await route.GET(request(`https://fixture/api/geocode?q=Example`));
    assert.notEqual(result.options.status, 429);
  }
  const limited = await route.GET(request('https://fixture/api/geocode?q=Example'));
  assert.equal(limited.options.status, 429);
  assert.equal(limited.options.headers['Retry-After'], '60');
  assert.equal(limited.options.headers['Cache-Control'], 'private, no-store');
  const invalid = await route.GET(request('https://fixture/api/geocode?lat=91&lon=0'));
  assert.equal(invalid.options.status, 400, 'invalid input is rejected without spending the budget');
  clock.now += 60_000;
  assert.notEqual((await route.GET(request('https://fixture/api/geocode?q=Example'))).options.status, 429);
});

test('a provider failure is not memoised and keeps the neutral fallback label', async () => {
  const clock = { now: 0 };
  let fail = true;
  const { route } = loadFresh('app/api/geocode/route.ts', async () => {
    if (fail) throw Error('offline');
    return json({ address: { town: 'Recovered' } });
  }, clock);
  const fallback = await route.GET(request('https://fixture/api/geocode?lat=10&lon=10'));
  assert.equal(fallback.body.district, 'Seçili Konum');
  fail = false;
  const recovered = await route.GET(request('https://fixture/api/geocode?lat=10&lon=10'));
  assert.equal(recovered.body.district, 'Recovered');
});

test('route requests send rounded points to OSRM and Nominatim and share a per-process budget', async () => {
  const clock = { now: Date.parse('2026-01-15T08:00Z') };
  const calls = [];
  const { route } = loadFresh('app/api/route/route.ts', async (url, init = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, init });
    if (parsed.hostname === 'router.project-osrm.org') return json({ routes: [{ distance: 1000, duration: 600,
      geometry: { coordinates: [[29.12345678, 41.12345678], [29.5, 41.5], [29.7, 41.7], [30.98765432, 41.98765432]] } }] });
    if (parsed.hostname === 'nominatim.openstreetmap.org') return json({ address: { town: 'Synthetic town', city: 'Synthetic city' } });
    return { ok: false };
  }, clock);

  const url = 'https://fixture/api/route?fromLat=41.12345678&fromLon=29.12345678&toLat=41.98765432&toLon=30.98765432&departureTime=09:00';
  const first = await route.GET(request(url));
  assert.equal(first.body.stops.length, 4);
  const osrm = calls.find(call => call.url.hostname === 'router.project-osrm.org');
  assert.match(osrm.url.pathname, /29\.1235,41\.1235;30\.9877,41\.9877$/);
  const nominatim = calls.filter(call => call.url.hostname === 'nominatim.openstreetmap.org');
  assert.equal(nominatim.length, 2);
  for (const call of nominatim) {
    assert.match(call.url.searchParams.get('lat'), /^-?\d+(\.\d{1,3})?$/);
    assert.equal(call.init.headers['User-Agent'], 'Weathrobe/9.8.7 (+https://github.com/NOkrep/NOk-Wear-Weather)');
  }
  assert.equal(first.body.stops[1].name, 'Synthetic town / Synthetic city');
  for (const call of calls.filter(call => call.url.hostname.includes('open-meteo'))) {
    assert.match(call.url.searchParams.get('latitude'), /^-?\d+(\.\d{1,2})?$/);
  }

  for (let index = 1; index < 30; index++) assert.notEqual((await route.GET(request(url))).options.status, 429);
  const before = calls.length;
  const limited = await route.GET(request(url));
  assert.equal(limited.options.status, 429);
  assert.equal(calls.length, before, 'a limited request makes no provider calls');
  assert.equal((await route.GET(request('https://fixture/api/route?fromLat=99'))).options.status, 400);
});
