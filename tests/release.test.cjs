const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const helpers = import(pathToFileURL(path.join(root, 'scripts/deploy/check-release.mjs')));
const recovery = import(pathToFileURL(path.join(root, 'scripts/deploy/recovery.mjs')));
const packaging = import(pathToFileURL(path.join(root, 'scripts/deploy/package-release.mjs')));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'weathrobe-release-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(folder)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(folder).startsWith('weathrobe-release-test-'));
    await fs.rm(folder, { recursive: true, force: true });
  });
  const put = async (name, bytes) => { await fs.mkdir(path.dirname(path.join(folder, name)), { recursive: true }); await fs.writeFile(path.join(folder, name), bytes); };
  const profile = { targetVersion: '0.6.0', composeFiles: ['docker-compose.yml'], runbook: 'deploy/RELEASE.md', evidenceRecord: 'deploy/RELEASE_EVIDENCE.md',
    previousArchive: 'artifacts/releases/previous.tar.gz', previousSha256: digest('immutable synthetic archive'), persistentVolumes: ['postgres_data', 'community_data', 'reports_data'],
    localChecks: [['node', 'scripts/deploy/check-release.mjs'], ['node', '--test', 'tests/*.test.cjs']], containerChecks: [['node', 'scripts/deploy/rehearse-release.mjs']] };
  for (const [name, bytes] of Object.entries({
    'package.json': JSON.stringify({ version: '0.6.0' }), 'package-lock.json': JSON.stringify({ version: '0.6.0', packages: { '': { version: '0.6.0' } } }),
    Dockerfile: 'org.opencontainers.image.version="0.6.0"\norg.opencontainers.image.version="0.6.0"',
    'docker-compose.yml': '  postgres_data:\n  community_data:\n  reports_data:\n127.0.0.1:3000:3000\nreports_data:/app/.data/reports',
    '.dockerignore': 'artifacts\n', 'public/sw.js': "const CACHE_NAME = 'wear-weather-v0.6.0';", 'next.config.ts': '// fixture', 'tsconfig.json': '{}',
    'db/imports/local-approved.json': '{}', 'deploy/Caddyfile': '# synthetic', 'deploy/RELEASE.md': '# runbook', 'deploy/RELEASE_EVIDENCE.md': '# evidence',
    'deploy/release-profile.json': JSON.stringify(profile), 'artifacts/releases/previous.tar.gz': 'immutable synthetic archive', 'app/page.tsx': '// source A',
  })) await put(name, bytes);
  return { folder, put, profile };
}

test('release gates reject missing, stale or substituted checks before creating a source package', async t => {
  const { folder, put, profile } = await fixture(t), { checkRelease, assertPackagingReady, verifySource } = await helpers;
  const current = await checkRelease(folder);
  await assert.rejects(assertPackagingReady(folder));
  const { packageRelease } = await packaging;
  await assert.rejects(packageRelease({ directory: folder, name: 'not-yet-approved' }));
  await assert.rejects(fs.access(path.join(folder, 'artifacts/releases/not-yet-approved.tar.gz')));
  const checks = [...profile.localChecks.slice(1), ...profile.containerChecks].map(command => ({ command, exitCode: 0 }));
  const proof = { status: 'passed', version: current.version, sourceId: current.sourceId, checks };
  await put('.data/release-checks/0.6.0.json', JSON.stringify(proof));
  assert.equal((await assertPackagingReady(folder)).sourceId, current.sourceId);
  checks[0].command = ['node', 'different-check'];
  await put('.data/release-checks/0.6.0.json', JSON.stringify(proof));
  await assert.rejects(assertPackagingReady(folder), /complete passing/);
  checks[0].command = profile.localChecks[1];
  await put('.data/release-checks/0.6.0.json', JSON.stringify(proof));
  const result = await packageRelease({ directory: folder, name: 'verified-fixture' });
  const manifest = JSON.parse(await fs.readFile(result.sourceManifest, 'utf8'));
  assert.equal(manifest.version, '0.6.0'); assert.equal(manifest.sourceId, current.sourceId); assert.equal(manifest.sha256, result.sha256);
  assert.ok(manifest.sourceFiles.some(([name]) => name === 'app/page.tsx'));
  assert.equal((await verifySource(folder, result.sourceManifest)).verified, true);
  await put('app/page.tsx', '// source changed after verification');
  await assert.rejects(verifySource(folder, result.sourceManifest), /checksum differs/);
  await assert.rejects(assertPackagingReady(folder), /complete passing/);
});

test('version mismatch and altered previous archive cannot pass release preflight', async t => {
  const { folder, put } = await fixture(t), { checkRelease } = await helpers;
  await put('public/sw.js', "const CACHE_NAME = 'wear-weather-v0.4.0';");
  await assert.rejects(checkRelease(folder), /worker version/);
  await put('public/sw.js', "const CACHE_NAME = 'wear-weather-v0.6.0';");
  await put('artifacts/releases/previous.tar.gz', 'replaced archive');
  await assert.rejects(checkRelease(folder), /previous release checksum/);
});

test('recovery encryption authenticates data and checksum verification rejects substitution or missing inventory', async t => {
  const { folder, put } = await fixture(t), { encrypt, decrypt, verifyRecovery, authenticateRecovery } = await recovery;
  const phrase = 'Synthetic sufficiently long test passphrase', secret = Buffer.from('SYNTHETIC-PRIVATE-SETTINGS');
  const encrypted = encrypt(secret, phrase);
  assert.ok(!encrypted.includes(secret)); assert.deepEqual(decrypt(encrypted, phrase), secret);
  assert.throws(() => encrypt(secret, 'short')); assert.throws(() => decrypt(encrypted, 'Different long synthetic passphrase'));
  const modified = JSON.parse(encrypted.toString()); modified.tag = '0'.repeat(32);
  assert.throws(() => decrypt(Buffer.from(JSON.stringify(modified)), phrase));
  const files = ['catalog.dump.enc', 'settings.env.enc'].map(name => ({ name, bytes: encrypted.length, sha256: digest(encrypted) }));
  const manifest = { version: 1, databaseDigest: 'a'.repeat(64), dbMajor: 17, appImage: 'sha256:' + 'b'.repeat(64), dbImage: 'sha256:' + 'c'.repeat(64), files, missingFiles: ['community.json', 'reports.json'] };
  manifest.authentication = encrypt(Buffer.from(JSON.stringify(manifest)), phrase).toString('base64');
  authenticateRecovery(manifest, phrase);
  assert.throws(() => authenticateRecovery({ ...manifest, dbImage: 'sha256:' + 'd'.repeat(64) }, phrase), /authentication failed/);
  for (const file of files) await put('backup/' + file.name, encrypted);
  await put('backup/backup.json', JSON.stringify(manifest));
  assert.equal((await verifyRecovery(path.join(folder, 'backup'))).files.length, 2);
  await put('backup/catalog.dump.enc', 'corrupted');
  await assert.rejects(verifyRecovery(path.join(folder, 'backup')));
  await put('backup/catalog.dump.enc', encrypted); manifest.missingFiles = [];
  await put('backup/backup.json', JSON.stringify(manifest));
  await assert.rejects(verifyRecovery(path.join(folder, 'backup')), /Incomplete recovery/);
});

function health(query, configured = true) {
  const module = { exports: {} };
  const context = { module, exports: module.exports, process: { env: configured ? { DATABASE_URL: 'not-a-real-connection-string' } : {} }, require: name => {
    if (name === 'next/server') return { NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) } };
    if (name === '@/lib/release') return { releaseIdentity: () => ({ version: '0.6.0', sourceId: 'a'.repeat(64) }) };
    if (name === '@/lib/catalog/database') return { catalogPool: () => ({ query }) };
    throw new Error('Unexpected dependency');
  } };
  const source = require('node:fs').readFileSync(path.join(root, 'app/api/health/route.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return module.exports.GET;
}
test('health distinguishes a real readable catalogue from unavailable storage without leaking failure details', async () => {
  const ok = await health(async sql => { assert.match(sql, /^SELECT/); assert.ok(!sql.includes('legacy_profiles')); return { rows: [{ products: 146, types: 36 }] }; })();
  assert.equal(ok.status, 200); assert.equal(ok.body.products, 146); assert.equal(ok.body.version, '0.6.0'); assert.match(ok.headers['Cache-Control'], /no-store/);
  const missing = await health(() => { throw new Error('must not connect'); }, false)(); assert.equal(missing.status, 503);
  const failed = await health(async () => { throw new Error('PRIVATE DATABASE DETAIL'); })();
  assert.equal(failed.status, 503); assert.equal(failed.body.catalogue, 'unavailable'); assert.ok(!JSON.stringify(failed).includes('PRIVATE'));
});

test('service worker never substitutes cached health when offline', async () => {
  const events = {}, self = { location: { origin: 'https://example.test' }, addEventListener: (name, callback) => { events[name] = callback; } };
  let caching = 0, response;
  vm.runInNewContext(await fs.readFile(path.join(root, 'public/sw.js'), 'utf8'), { self, URL, Response,
    fetch: async (_, options) => { assert.equal(options.cache, 'no-store'); throw new Error('offline'); },
    caches: { match: () => { caching++; return new Response('{"status":"ok"}'); }, open: () => { caching++; } } });
  events.fetch({ request: { url: 'https://example.test/api/health', method: 'GET' }, respondWith: value => { response = value; } });
  assert.equal((await response).status, 503); assert.equal(caching, 0);
});
