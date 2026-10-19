const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const configuration = import(pathToFileURL(path.join(root, 'scripts/deploy/configure-preview.mjs')));
const packaging = import(pathToFileURL(path.join(root, 'scripts/deploy/package-release.mjs')));

async function temporary(t) {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'weathrobe-deployment-test-'));
  t.after(async () => {
    // Verify the resolved absolute target before recursively removing this test fixture.
    const base = path.resolve(os.tmpdir());
    const target = path.resolve(folder);
    assert.equal(path.dirname(target), base);
    assert.ok(path.basename(target).startsWith('weathrobe-deployment-test-'));
    await fs.rm(target, { recursive: true, force: true });
  });
  return folder;
}

async function put(folder, relative, content) {
  const file = path.join(folder, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

test('preview creates private, independent credentials and can be rerun without changing them', async t => {
  const folder = await temporary(t);
  const { configurePreview } = await configuration;
  const hostname = 'weathrobe-203-0-113-10.sslip.io';
  const first = await configurePreview(folder, hostname);
  const before = await fs.readFile(path.join(folder, '.env'), 'utf8');
  const { parseEnv } = require('node:util');
  const values = parseEnv(before);
  assert.equal(first.created, true);
  assert.match(values.POSTGRES_PASSWORD, /^[a-f0-9]{64}$/);
  assert.match(values.CATALOG_READER_PASSWORD, /^[a-f0-9]{64}$/);
  assert.notEqual(values.POSTGRES_PASSWORD, values.CATALOG_READER_PASSWORD);
  assert.equal(values.GEMINI_API_KEY, '');
  assert.equal(values.APP_URL, `https://${hostname}`);
  const second = await configurePreview(folder, hostname);
  assert.equal(second.changed, false);
  assert.equal(await fs.readFile(path.join(folder, '.env'), 'utf8'), before);
  if (process.platform !== 'win32') assert.equal((await fs.stat(path.join(folder, '.env'))).mode & 0o777, 0o600);
});

test('preview converts only localhost domain settings, preserving credentials and unknown settings', async t => {
  const folder = await temporary(t);
  const { configurePreview } = await configuration;
  const initial = `# preserve this comment\nPOSTGRES_PASSWORD=${'a'.repeat(64)}\nCATALOG_READER_PASSWORD=${'b'.repeat(64)}\nGEMINI_API_KEY=\nAPP_DOMAIN=localhost\nAPP_URL=http://localhost:3000\nOTHER_SETTING=keep-me\n`;
  await put(folder, '.env', initial);
  await configurePreview(folder, 'weathrobe-203-0-113-10.sslip.io');
  const after = await fs.readFile(path.join(folder, '.env'), 'utf8');
  assert.ok(after.includes('# preserve this comment'));
  assert.ok(after.includes('OTHER_SETTING=keep-me'));
  assert.ok(after.includes(`POSTGRES_PASSWORD=${'a'.repeat(64)}`));
  assert.ok(after.includes(`CATALOG_READER_PASSWORD=${'b'.repeat(64)}`));
  assert.ok(!after.includes('APP_DOMAIN=localhost'));
});

test('preview refuses local DBs, paid keys, duplicate settings and retargeting without touching existing bytes', async t => {
  const { configurePreview } = await configuration;
  const base = `POSTGRES_PASSWORD=${'a'.repeat(64)}\nCATALOG_READER_PASSWORD=${'b'.repeat(64)}\n`;
  for (const extra of ['DATABASE_URL=postgresql://fixture-only\n', 'GEMINI_API_KEY=fixture-only\n', 'API_KEY=fixture-only\n', 'NEXT_PUBLIC_GEMINI_API_KEY=fixture-only\n', 'APP_DOMAIN=other.example.org\n', 'APP_DOMAIN=localhost\nAPP_DOMAIN=localhost\n']) {
    const folder = await temporary(t);
    await put(folder, '.env', base + extra);
    await assert.rejects(configurePreview(folder, 'weathrobe-203-0-113-10.sslip.io'));
    assert.equal(await fs.readFile(path.join(folder, '.env'), 'utf8'), base + extra);
  }
});

test('preview rejects environment precedence conflicts and malformed hostnames before writing', async t => {
  const { configurePreview, previewHostname } = await configuration;
  for (const input of ['localhost', '127.0.0.1', 'https://example.org', 'example.org/path', 'example.org\nAPI_KEY=x', 'abc.local', '-bad.example.org', 'a..example.org']) assert.throws(() => previewHostname(input));
  const folder = await temporary(t);
  await put(folder, '.env.local', '# fixture');
  await assert.rejects(configurePreview(folder, 'weathrobe-203-0-113-10.sslip.io'), /precedence/);
  await assert.rejects(fs.access(path.join(folder, '.env')));
});

async function releaseFixture(t) {
  const folder = await temporary(t);
  for (const name of ['package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml', '.dockerignore', 'next.config.ts', 'tsconfig.json', 'db/imports/local-approved.json', 'deploy/Caddyfile']) await put(folder, name, name.endsWith('.json') ? '{}' : '# fixture');
  await put(folder, 'app/page.tsx', '// current working copy');
  return folder;
}

test('release archive includes current sources and reviewed data, excluding credentials and local state', async t => {
  const folder = await releaseFixture(t);
  const { packageRelease } = await packaging;
  for (const name of ['.env', '.env.local', '.git/config', '.data/community.json', 'node_modules/dummy.js', 'public/credential.key', 'public/secret.pem', 'scripts/private/identity.txt', 'lib/.env.local', 'db/backups/private.dump']) await put(folder, name, 'fixture-not-for-release');
  await put(folder, '.env.example', 'GEMINI_API_KEY=');
  const result = await packageRelease({ directory: folder, name: 'test-preview' });
  const listing = spawnSync('tar', ['-tzf', result.archive], { encoding: 'utf8', windowsHide: true });
  assert.equal(listing.status, 0, listing.stderr);
  assert.ok(listing.stdout.includes('app/page.tsx'));
  assert.ok(listing.stdout.includes('db/imports/local-approved.json'));
  assert.ok(listing.stdout.includes('.env.example'));
  assert.ok(!listing.stdout.includes('.env.local'));
  assert.ok(!listing.stdout.includes('.git/'));
  assert.ok(!listing.stdout.includes('.data/'));
  assert.ok(!listing.stdout.includes('credential.key'));
  assert.ok(!listing.stdout.includes('node_modules/'));
  const digest = createHash('sha256').update(await fs.readFile(result.archive)).digest('hex');
  assert.equal(result.sha256, digest);
  assert.equal(await fs.readFile(result.checksum, 'utf8'), `${digest}  test-preview.tar.gz\n`);
  const saved = await fs.readFile(result.archive);
  await assert.rejects(packageRelease({ directory: folder, name: 'test-preview' }), /already exists/);
  assert.deepEqual(await fs.readFile(result.archive), saved);
});

test('renaming private key material cannot smuggle it into a source archive', async t => {
  const folder = await releaseFixture(t);
  const { packageRelease } = await packaging;
  await put(folder, 'public/innocent.txt', ['-----BEGIN ', 'OPENSSH PRIVATE KEY-----', '\nsynthetic fixture'].join(''));
  await assert.rejects(packageRelease({ directory: folder, name: 'test-preview' }), /Private key material/);
});

test('reviewed catalogue preflight validates all 146 products without needing a database', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/catalog/import-reviewed.ts', '--check'], { cwd: root, encoding: 'utf8', windowsHide: true, env: { ...process.env, DATABASE_URL: '' } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /146 reviewed products in 20 batches/);
  assert.match(result.stdout, /36 types/);
});

test('reviewed importer requires explicit review and rejects traversal or a bad later batch before DB access', async t => {
  const folder = await temporary(t);
  const driver = path.join(folder, 'driver.cjs');
  const reviewedModule = path.join(root, 'scripts/catalog/import-reviewed.ts');
  await fs.writeFile(driver, `require(${JSON.stringify(path.join(root, 'node_modules/tsx/dist/cjs/index.cjs'))});\nconst {loadReviewedCatalog}=require(${JSON.stringify(reviewedModule)});\nloadReviewedCatalog(${JSON.stringify(folder)}).then(()=>{process.exitCode=9}).catch(()=>{console.log('preflight-rejected')});\n`);
  const invalid = { version: 1, batches: [{ file: '../outside.json', products: 1, reviewedAt: '2026-10-18T00:00:00Z' }] };
  await put(folder, 'db/imports/local-approved.json', JSON.stringify(invalid));
  const traversal = spawnSync(process.execPath, [driver], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(traversal.status, 0, traversal.stderr);
  assert.match(traversal.stdout, /preflight-rejected/);
  const manifest = require('../db/imports/local-approved.json');
  const first = manifest.batches[0];
  await put(folder, `db/imports/${first.file}`, await fs.readFile(path.join(root, 'db/imports', first.file)));
  await put(folder, 'db/imports/bad.json', '{}');
  await put(folder, 'db/imports/local-approved.json', JSON.stringify({ version: 1, batches: [first, { file: 'bad.json', products: 1, reviewedAt: first.reviewedAt }] }));
  const later = spawnSync(process.execPath, [driver], { cwd: root, encoding: 'utf8', windowsHide: true, env: { ...process.env, DATABASE_URL: 'postgresql://invalid.invalid/never-connect' } });
  assert.equal(later.status, 0, later.stderr);
  assert.match(later.stdout, /preflight-rejected/);
  const noReview = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/catalog/import-reviewed.ts'], { cwd: root, encoding: 'utf8', windowsHide: true });
  assert.equal(noReview.status, 1);
  assert.match(noReview.stderr, /Usage:/);
});

test('reviewed server import is idempotent in a disposable DB and retains read-only application access', { skip: !process.env.WEATHROBE_DEPLOY_TEST_DATABASE_URL }, async t => {
  const target = new URL(process.env.WEATHROBE_DEPLOY_TEST_DATABASE_URL);
  assert.equal(target.pathname, '/weathrobe_deployment_test');
  assert.ok(['127.0.0.1', 'localhost', 'weathrobe-release-qa-db'].includes(target.hostname));
  const folder = await temporary(t);
  const driver = path.join(folder, 'database-driver.cjs');
  await fs.writeFile(driver, `
require(${JSON.stringify(path.join(root, 'node_modules/tsx/dist/cjs/index.cjs'))});
const assert = require('node:assert/strict');
const {migrateCatalog}=require(${JSON.stringify(path.join(root, 'scripts/catalog/migrate.ts'))});
const {importReviewedCatalog}=require(${JSON.stringify(path.join(root, 'scripts/catalog/import-reviewed.ts'))});
const {catalogPool,closeCatalogPool}=require(${JSON.stringify(path.join(root, 'lib/catalog/database.ts'))});
const {Pool}=require(${JSON.stringify(path.join(root, 'node_modules/pg'))});
(async()=>{
  const pool=catalogPool();
  assert.equal((await pool.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema='catalog'")).rows[0].n,0,'Use a new empty disposable database');
  await migrateCatalog();
  assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.products')).rows[0].n,0);
  const first=await importReviewedCatalog();
  assert.deepEqual(first,{products:146,batches:20,types:36,newlyPublished:146});
  const snapshot=await pool.query('SELECT id,digest,state FROM catalog.import_batches ORDER BY id');
  assert.equal((await importReviewedCatalog()).newlyPublished,0);
  assert.deepEqual((await pool.query('SELECT id,digest,state FROM catalog.import_batches ORDER BY id')).rows,snapshot.rows);
  assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.products')).rows[0].n,146);
  assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.legacy_profiles')).rows[0].n,23);
  assert.equal((await pool.query('SELECT count(*)::int n FROM catalog.garment_types')).rows[0].n,36);
  const url=new URL(process.env.DATABASE_URL);url.username='catalog_reader';url.password=process.env.CATALOG_READER_PASSWORD;
  const reader=new Pool({connectionString:url.toString()});
  try{
    assert.equal((await reader.query('SELECT count(*)::int n FROM catalog.products')).rows[0].n,146);
    await assert.rejects(reader.query("DELETE FROM catalog.products WHERE false"),error=>error.code==='42501');
    await assert.rejects(reader.query('SELECT payload FROM catalog.import_batches LIMIT 1'),error=>error.code==='42501');
  }finally{await reader.end()}
  console.log('146 products; repeat import preserved identities; reader cannot mutate or read draft payloads');
})().catch(()=>{console.error('Disposable DB verification failed');process.exitCode=1}).finally(closeCatalogPool);
`);
  const result = spawnSync(process.execPath, [driver], {
    cwd: root, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, DATABASE_URL: target.toString() },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /repeat import preserved identities/);
});
