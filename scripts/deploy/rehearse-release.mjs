import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkRelease, releaseIdentity } from './check-release.mjs';
import { docker, backupRecovery, verifyRecovery, restoreCheck, databaseDigest } from './recovery.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function build(args) {
  const result = spawnSync('docker', ['build', '--load', ...args], { stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error('Required container build failed');
}
async function waitFor(operation, description) {
  let last;
  for (let n = 0; n < 80; n++) {
    try { const value = await operation(); if (value) return value; } catch (error) { last = error; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(description + ' did not become ready' + (last ? ' (last probe failed)' : ''));
}

export async function rehearseRelease(root = process.cwd()) {
  const identity = await checkRelease(root), label = randomUUID(), prefix = 'weathrobe-ww05-' + label.slice(0, 8);
  const work = path.join(root, '.data/release-rehearsal', label), previous = path.join(work, 'previous');
  await mkdir(previous, { recursive: true, mode: 0o700 });
  const archive = path.join(root, identity.profile.previousArchive);
  const extract = spawnSync('tar', ['-xzf', archive, '-C', previous], { encoding: 'utf8', windowsHide: true });
  if (extract.status !== 0) throw new Error('Verified previous archive could not be extracted');
  const oldTag = 'weathrobe-ww05-previous:' + identity.profile.previousSha256.slice(0, 12);
  const newTag = 'weathrobe-ww05-app:' + identity.sourceId.slice(0, 16), toolsTag = 'weathrobe-ww05-tools:' + identity.sourceId.slice(0, 16);
  console.log('Building immutable previous archive and current source in isolated images');
  build(['--target', 'runner', '-t', oldTag, previous]);
  build(['--target', 'tools', '-t', oldTag + '-tools', previous]);
  build(['--target', 'tools', '--build-arg', 'WEATHROBE_SOURCE_ID=' + identity.sourceId, '-t', toolsTag, root]);
  build(['--target', 'runner', '--build-arg', 'WEATHROBE_SOURCE_ID=' + identity.sourceId, '-t', newTag, root]);
  if ((await releaseIdentity(root)).sourceId !== identity.sourceId) throw new Error('Source changed during container build');
  const imageId = tag => docker(['image', 'inspect', '--format', '{{.Id}}', tag]).toString().trim();
  const oldImage = imageId(oldTag), newImage = imageId(newTag), toolsImage = imageId(toolsTag), oldTools = imageId(oldTag + '-tools');
  const network = prefix + '-net', dbName = prefix + '-db', volumes = [prefix + '-db-data', prefix + '-community', prefix + '-reports'];
  const password = randomBytes(32).toString('hex'), reader = randomBytes(32).toString('hex'), passphrase = randomBytes(32).toString('hex');
  const resourceLabel = 'nok.weathrobe.release-test=' + label;
  const settings = path.join(work, 'synthetic.env');
  await writeFile(settings, `POSTGRES_PASSWORD=${password}\nCATALOG_READER_PASSWORD=${reader}\nGEMINI_API_KEY=\nAPP_URL=http://localhost:3000\n`, { flag: 'wx', mode: 0o600 });
  const createdVolumes = [], containers = [];
  let networkCreated = false;
  const environment = { DATABASE_URL: `postgresql://weathrobe_owner:${password}@${dbName}:5432/weathrobe`, CATALOG_READER_PASSWORD: reader };
  const runTool = (image, command = []) => docker(['run', '--rm', '--network', network, '-e', 'DATABASE_URL', '-e', 'CATALOG_READER_PASSWORD',
    ...(command.length ? ['--entrypoint', 'node'] : []), image, ...command], { env: environment });
  const storage = (volume, file) => docker(['run', '--rm', '--network', 'none', '-v', volume + ':/data:ro', '--entrypoint', 'node', toolsImage, '-e',
    `const fs=require('fs'),c=require('crypto');const b=fs.readFileSync('/data/${file}');const j=JSON.parse(b);console.log(JSON.stringify({sha256:c.createHash('sha256').update(b).digest('hex'),count:Array.isArray(j)?j.length:j.reports.length}));`]).toString();
  const appIds = [];
  const startApp = async (image, modern) => {
    const id = docker(['run', '-d', '--name', prefix + '-app-' + appIds.length, '--label', resourceLabel, '--network', 'bridge',
      '-p', '127.0.0.1::3000', '-e', 'DATABASE_URL', '-e', 'GEMINI_API_KEY=', '-e', 'WEAR_WEATHER_COMMUNITY_DIR=/app/.data/community',
      '-v', volumes[1] + ':/app/.data/community', ...(modern ? ['-e', 'WEAR_WEATHER_REPORTS_DIR=/app/.data/reports', '-v', volumes[2] + ':/app/.data/reports'] : []), image],
      { env: { DATABASE_URL: `postgresql://catalog_reader:${reader}@${dbName}:5432/weathrobe` } }).toString().trim();
    appIds.push(id); containers.push(id);
    // Docker 29 does not publish ports on an internal-only network. Keep DB internal; only this loopback-bound app also joins bridge.
    docker(['network', 'connect', network, id]);
    const port = docker(['port', id, '3000/tcp']).toString().trim();
    assert.match(port, /^127\.0\.0\.1:\d+$/);
    const url = 'http://' + port;
    await waitFor(async () => (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok, 'Application');
    const response = await fetch(url + '/api/catalog?limit=1');
    const catalog = await response.json();
    assert.equal(catalog.backend, 'postgresql'); assert.equal(catalog.productStatus, 'available'); assert.equal(catalog.totalProducts, 146); assert.equal(catalog.types.length, 36);
    if (modern) {
      const healthResponse = await fetch(url + '/api/health'); const health = await healthResponse.json();
      assert.equal(healthResponse.status, 200); assert.match(healthResponse.headers.get('cache-control'), /no-store/);
      assert.equal(health.version, identity.version); assert.equal(health.sourceId, identity.sourceId); assert.equal(health.products, 146); assert.equal(health.types, 36);
      assert.equal(docker(['image', 'inspect', '--format', '{{index .Config.Labels "org.opencontainers.image.revision"}}', image]).toString().trim(), identity.sourceId);
    }
    return { id, url };
  };
  const community = async app => {
    const response = await fetch(app.url + '/api/community', { method: 'POST', headers: { origin: app.url, 'content-type': 'application/json' }, body: JSON.stringify({
      version: 1, consent: true, product: 'gtin:04006381333931', outcome: 'perfect', temperatureBand: 15, windBand: 'calm', rainBand: 'dry', activity: 'walking' }) });
    assert.equal(response.status, 200);
  };
  const report = { version: 1, submissionId: randomUUID(), category: 'bug', description: 'Synthetic WW-05 preservation rehearsal', steps: 'Synthetic fixture only', locale: 'en', consent: true };
  const feedback = async (app, duplicate) => {
    const response = await fetch(app.url + '/api/feedback', { method: 'POST', headers: { origin: app.url, 'content-type': 'application/json' }, body: JSON.stringify(report) });
    assert.equal(response.status, duplicate ? 200 : 201); assert.equal((await response.json()).saved, true);
  };
  try {
    docker(['network', 'create', '--internal', '--label', resourceLabel, network]); networkCreated = true;
    for (const volume of volumes) { docker(['volume', 'create', '--label', resourceLabel, volume]); createdVolumes.push(volume); }
    // Pulling a standard PostgreSQL image is intentional; no existing database is attached.
    const db = docker(['run', '-d', '--name', dbName, '--label', resourceLabel, '--network', network, '-v', volumes[0] + ':/var/lib/postgresql/data',
      '-e', 'POSTGRES_USER=weathrobe_owner', '-e', 'POSTGRES_DB=weathrobe', '-e', 'POSTGRES_PASSWORD', 'postgres:17-alpine'], { env: { POSTGRES_PASSWORD: password } }).toString().trim();
    containers.push(db);
    await waitFor(() => docker(['exec', db, 'pg_isready', '-U', 'weathrobe_owner', '-d', 'weathrobe'], { allowFailure: true }).status === 0, 'Database');
    runTool(oldTools);
    runTool(oldTools, ['--import', 'tsx', 'scripts/catalog/import-reviewed.ts', '--reviewed']);
    const originalDb = databaseDigest(db);
    let app = await startApp(oldImage, false);
    await community(app);
    const oldCommunity = storage(volumes[1], 'contributions.json');
    docker(['stop', app.id]);
    const firstBackup = path.join(work, 'before-upgrade');
    await backupRecovery({ app: app.id, db, settings, directory: firstBackup, passphrase });
    const oldRestore = await restoreCheck({ directory: firstBackup, toolsImage, passphrase });
    assert.equal(oldRestore.restored, true);
    runTool(toolsImage); runTool(toolsImage);
    assert.equal(databaseDigest(db), originalDb);
    app = await startApp(newImage, true);
    assert.equal(storage(volumes[1], 'contributions.json'), oldCommunity);
    await community(app); await feedback(app, false);
    const modernCommunity = storage(volumes[1], 'contributions.json'), modernReports = storage(volumes[2], 'reports.json');
    assert.equal(JSON.parse(modernCommunity).count, 2); assert.equal(JSON.parse(modernReports).count, 1);
    assert.equal((await fetch(app.url + '/api/feedback')).status, 405);
    assert.equal((await fetch(app.url + '/.data/reports/reports.json')).status, 404);
    const assets = JSON.parse(await readFile(path.join(root, 'artifacts/previews/ww21-studio/manifest.json'), 'utf8')).assets;
    for (const asset of assets) { const r = await fetch(app.url + asset.production.src); assert.equal(r.status, 200); assert.equal(hash(Buffer.from(await r.arrayBuffer())), asset.production.sha256); }
    docker(['stop', app.id]);
    const afterBackup = path.join(work, 'after-upgrade'), copiedBackup = path.join(work, 'copy-verification');
    const recovery = await backupRecovery({ app: app.id, db, settings, directory: afterBackup, passphrase });
    await cp(afterBackup, copiedBackup, { recursive: true, force: false, errorOnExist: true });
    assert.deepEqual(await verifyRecovery(copiedBackup), recovery);
    const restored = await restoreCheck({ directory: copiedBackup, toolsImage, passphrase });
    app = await startApp(oldImage, false);
    assert.equal(databaseDigest(db), originalDb); assert.equal(storage(volumes[1], 'contributions.json'), modernCommunity); assert.equal(storage(volumes[2], 'reports.json'), modernReports);
    await community(app); docker(['stop', app.id]);
    app = await startApp(newImage, true); await feedback(app, true);
    assert.equal(JSON.parse(storage(volumes[1], 'contributions.json')).count, 3); assert.equal(storage(volumes[2], 'reports.json'), modernReports);
    assert.equal(databaseDigest(db), originalDb);
    const result = { status: 'passed', version: identity.version, sourceId: identity.sourceId, verifiedAt: new Date().toISOString(), oldImage, newImage, toolsImage,
      catalogue: { products: 146, types: 36, beforeAfterDigest: originalDb }, communityRowsAfterRollbackAndForward: 3, reportsAfterRetry: 1,
      assetsVerified: assets.length, previousRestore: oldRestore, currentRestore: restored, copiedBackupVerified: true,
      offServerCopy: 'SIMULATION ONLY: separate directory on the same workstation; not a real off-server live backup', liveDeployment: false };
    await writeFile(path.join(work, 'result.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    for (const id of containers.reverse()) {
      const actual = docker(['inspect', '--format', '{{index .Config.Labels "nok.weathrobe.release-test"}}', id], { allowFailure: true });
      if (actual.status === 0 && actual.stdout.toString().trim() === label) docker(['rm', '-f', id]);
    }
    for (const volume of createdVolumes) {
      if (docker(['volume', 'inspect', '--format', '{{index .Labels "nok.weathrobe.release-test"}}', volume]).toString().trim() === label) docker(['volume', 'rm', volume]);
    }
    if (networkCreated && docker(['network', 'inspect', '--format', '{{index .Labels "nok.weathrobe.release-test"}}', network]).toString().trim() === label) docker(['network', 'rm', network]);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) rehearseRelease().catch(error => { console.error(error.message); process.exitCode = 1; });
