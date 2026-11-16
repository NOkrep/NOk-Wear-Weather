const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const transpile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
require.extensions['.ts'] = (module, file) => module._compile(transpile(file), file);

const endpoint = 'https://fixture.test/api/ai-stylist';
const personalKey = 'personal_key_fixture_never_real';
function request(body, headers = {}, signal) {
  return new Request(endpoint, { method: 'POST', body, duplex: 'half', signal,
    headers: { host: 'fixture.test', 'content-type': 'application/json', ...headers } });
}

function loadRoute(generate = async () => ({})) {
  const savedKeys = [];
  const messages = [];
  const clock = { now: 1_000_000 };
  const module = { exports: {} };
  vm.runInNewContext(transpile(path.join(root, 'app/api/ai-stylist/route.ts')), {
    module, exports: module.exports, URL, AbortSignal,
    Date: class extends Date { static now() { return clock.now; } },
    process: { env: { GEMINI_API_KEY: 'operator_key_fixture_never_real', API_KEY: 'fallback_key_fixture', NEXT_PUBLIC_GEMINI_API_KEY: 'legacy_key_fixture' } },
    console: { error: (...args) => messages.push(args), warn: (...args) => messages.push(args), log: (...args) => messages.push(args) },
    require: name => {
      if (name === 'next/server') return { NextResponse: Response };
      if (name === '@google/genai') return {
        Type: { OBJECT: 'OBJECT', STRING: 'STRING', INTEGER: 'INTEGER', ARRAY: 'ARRAY' },
        GoogleGenAI: class { constructor({ apiKey }) { savedKeys.push(apiKey); this.models = { generateContent: generate }; } },
      };
      return require(path.join(root, `${name.slice(2)}.ts`));
    },
  });
  return { POST: module.exports.POST, clock, savedKeys, messages };
}

const description = JSON.stringify({ mode: 'analyze_garment', descriptionText: 'Yün kaban' });

test('anonymous drafts use the rule engine even if operator Gemini keys are present', async () => {
  const { POST, savedKeys } = loadRoute();
  const response = await POST(request(description));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const draft = await response.json();
  assert.equal(draft.modelUsed, 'local-heuristic');
  assert.equal(draft.item.category, 'outer');
  assert.deepEqual(savedKeys, []);
});

test('only the supplied key reaches Gemini and provider failures stay out of logs', async () => {
  const calls = [];
  const { POST, savedKeys, messages } = loadRoute(async input => { calls.push(input); throw Error(personalKey); });
  const headers = { origin: 'https://fixture.test', 'x-gemini-key': personalKey };
  const response = await POST(request(description, headers));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).modelUsed, 'local-heuristic');
  assert.deepEqual(savedKeys, [personalKey]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].config.httpOptions.retryOptions.attempts, 1);
  assert.equal(calls[0].config.automaticContinuation, false);
  assert.equal(calls[0].config.maxOutputTokens, 1024);
  assert.ok(calls[0].config.abortSignal instanceof AbortSignal);
  assert.deepEqual(messages, []);
});

test('invalid and oversized streamed requests are rejected before making provider calls', async () => {
  const { POST, savedKeys } = loadRoute();
  const photo = JSON.stringify({ mode: 'analyze_garment', imageBase64: 'not-an-image', mimeType: 'image/png' });
  assert.equal((await POST(request(description, { origin: 'https://other.test' }))).status, 403);
  assert.equal((await POST(request(description, { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await POST(request('{'))).status, 400);
  assert.equal((await POST(request(photo))).status, 422);
  assert.equal((await POST(request(photo, { 'x-gemini-key': personalKey }))).status, 400);
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(3 * 1024 * 1024)); },
    cancel() { cancelled = true; },
  });
  assert.equal((await POST(request(stream, { 'content-length': '8' }))).status, 413);
  assert.ok(cancelled);
  assert.deepEqual(savedKeys, []);
});

test('admitted concurrency and per-process rate limits do not depend on caller-supplied IP headers', async () => {
  const { POST, clock } = loadRoute();
  const aborts = Array.from({ length: 4 }, () => new AbortController());
  const pending = aborts.map(abort => POST(request(new ReadableStream(), {}, abort.signal)));
  const busy = await POST(request(description));
  assert.equal(busy.status, 429);
  assert.equal(busy.headers.get('Retry-After'), '60');
  for (const abort of aborts) abort.abort();
  for (const response of await Promise.all(pending)) assert.equal(response.status, 408);
  for (let index = 0; index < 26; index++) {
    assert.equal((await POST(request(description, { 'x-forwarded-for': `192.0.2.${index}` }))).status, 200);
  }
  assert.equal((await POST(request(description))).status, 429);
  clock.now += 60_000;
  assert.equal((await POST(request(description))).status, 200);
});

test('a photo with a caller key reaches Gemini, and provider failure cannot create an empty draft', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS2sAAAAASUVORK5CYII=', 'base64');
  const photo = JSON.stringify({ mode: 'analyze_garment', imageBase64: `data:image/png;base64,${png.toString('base64')}`, mimeType: 'image/png' });
  const headers = { 'x-gemini-key': personalKey };
  const calls = [];
  const { POST } = loadRoute(async input => {
    calls.push(input);
    if (calls.length > 1) throw Error('Fixture failure');
    return { text: JSON.stringify({ name: 'Fixture garment', category: 'outer', warmth: 4 }) };
  });
  const success = await POST(request(photo, headers));
  assert.equal(success.status, 200);
  assert.equal((await success.json()).item.name, 'Fixture garment');
  assert.deepEqual(Buffer.from(calls[0].contents[0].inlineData.data, 'base64'), png);
  const failed = await POST(request(photo, headers));
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).error, 'PHOTO_ANALYSIS_UNAVAILABLE');
});
