const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const { CREDITS, CREDIT_KINDS } = require('../lib/credits.ts');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const coveredBy = name => CREDITS.find(credit => (credit.packages ?? []).some(entry => entry === name || (entry === '@types/*' && name.startsWith('@types/'))));

test('every dependency is thanked with the licence its own package declares', () => {
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(dependencies)) {
    const credit = coveredBy(name);
    assert.ok(credit, `${name} is missing from lib/credits.ts`);
    const declared = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).license;
    assert.ok(credit.license.split(' / ').includes(declared), `${name}: credits say ${credit.license}, package says ${declared}`);
  }
});

test('every credit names its source, licence and use in both languages', () => {
  const ids = new Set();
  const kinds = new Set(CREDIT_KINDS.map(group => group.kind));
  for (const credit of CREDITS) {
    assert.ok(!ids.has(credit.id), `duplicate ${credit.id}`);
    ids.add(credit.id);
    assert.ok(kinds.has(credit.kind), credit.id);
    for (const field of ['name', 'by', 'license']) assert.ok(credit[field]?.trim(), `${credit.id}.${field}`);
    for (const link of [credit.url, credit.licenseUrl].filter(Boolean)) assert.match(link, /^https:\/\//, credit.id);
    assert.ok(credit.usage.tr.trim() && credit.usage.en.trim() && credit.usage.tr !== credit.usage.en, `${credit.id} usage`);
  }
});

test('ported code and external services used by the app are credited', () => {
  const thermal = fs.readFileSync(path.join(root, 'lib/thermal-model.ts'), 'utf8');
  assert.match(thermal, /pythermalcomfort \(MIT License, Copyright \(c\) 2019/);
  const notices = fs.readFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(notices, /Copyright \(c\) 2019 Federico Tartarini/);
  assert.ok(CREDITS.some(credit => credit.id === 'pythermalcomfort' && credit.license === 'MIT'));

  // Every third-party host the server routes call must map to a credit.
  const hostCredit = {
    'api.open-meteo.com': 'open-meteo', 'geocoding-api.open-meteo.com': 'open-meteo', 'api.met.no': 'met-norway',
    'api.brightsky.dev': 'bright-sky', 'api.weatherapi.com': 'weatherapi', 'api.openweathermap.org': 'openweathermap',
    'nominatim.openstreetmap.org': 'openstreetmap', 'router.project-osrm.org': 'osrm', 'api.upcitemdb.com': 'upcitemdb',
  };
  const sources = ['app/api', 'lib', 'components'].flatMap(dir => fs.readdirSync(path.join(root, dir), { recursive: true })
    .filter(file => /\.(ts|tsx)$/.test(file)).map(file => fs.readFileSync(path.join(root, dir, file), 'utf8')));
  const hosts = new Set(sources.flatMap(source => [...source.matchAll(/https:\/\/(api[\w.-]*|[\w-]+api[\w.-]*|nominatim[\w.-]*|router[\w.-]*)\.(?:com|no|dev|org)/g)]
    .map(match => new URL(match[0]).hostname)));
  for (const host of hosts) {
    const id = hostCredit[host];
    assert.ok(id && CREDITS.some(credit => credit.id === id), `${host} has no credit`);
  }
});
