import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { releaseFiles } from './package-release.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function releaseIdentity(root = process.cwd()) {
  const files = (await releaseFiles(root)).filter(file => !file.endsWith('.md'));
  const hashes = [];
  for (const file of files) hashes.push([file, sha(await readFile(path.join(root, file)))]);
  return { version: JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version,
    sourceId: sha(JSON.stringify(hashes)), files: hashes };
}

export async function checkRelease(root = process.cwd()) {
  const read = file => readFile(path.join(root, file), 'utf8');
  const profile = JSON.parse(await read('deploy/release-profile.json'));
  const pkg = JSON.parse(await read('package.json')), lock = JSON.parse(await read('package-lock.json'));
  if (pkg.version !== profile.targetVersion || lock.version !== pkg.version || lock.packages[''].version !== pkg.version) throw new Error('Package/profile/lock versions differ');
  if (!(await read('public/sw.js')).includes(`const CACHE_NAME = 'wear-weather-v${pkg.version}';`)) throw new Error('Service worker version differs');
  if ((await read('Dockerfile')).split(`org.opencontainers.image.version="${pkg.version}"`).length !== 3) throw new Error('Container versions differ');
  const compose = await read('docker-compose.yml');
  for (const volume of profile.persistentVolumes) if (!compose.includes(`  ${volume}:`)) throw new Error('Persistent volume missing: ' + volume);
  if (!compose.includes('127.0.0.1:3000:3000') || !compose.includes('reports_data:/app/.data/reports')) throw new Error('Runtime bindings changed');
  if (!(await read('.dockerignore')).split(/\r?\n/).includes('artifacts')) throw new Error('Build context must exclude release archives and preview sources');
  for (const file of [...profile.composeFiles, profile.runbook, profile.evidenceRecord]) {
    const target = path.resolve(root, file);
    if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error('Profile path escapes project');
    await readFile(target);
  }
  const old = await readFile(path.join(root, profile.previousArchive));
  if (sha(old) !== profile.previousSha256) throw new Error('Immutable previous release checksum mismatch');
  return { profile, ...await releaseIdentity(root) };
}

export async function assertPackagingReady(root = process.cwd()) {
  const identity = await checkRelease(root);
  const proof = JSON.parse(await readFile(path.join(root, '.data/release-checks', identity.version + '.json'), 'utf8'));
  const expected = [...identity.profile.localChecks.slice(1), ...identity.profile.containerChecks];
  if (proof.sourceId !== identity.sourceId || proof.version !== identity.version || proof.status !== 'passed'
    || !Array.isArray(proof.checks) || proof.checks.length !== identity.profile.localChecks.length + identity.profile.containerChecks.length - 1
    || proof.checks.some(c => c.exitCode !== 0)
    || JSON.stringify(proof.checks.map(c => c.command)) !== JSON.stringify(expected)) throw new Error('Current source has no complete passing release gates');
  return { ...identity, proof };
}

export async function verifySource(root, manifestFile) {
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8')), files = await releaseFiles(root);
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.archiveFiles)
    || JSON.stringify(manifest.archiveFiles.map(([name]) => name)) !== JSON.stringify(files)) throw new Error('Extracted source file inventory differs');
  for (const [name, digest] of manifest.archiveFiles) if (sha(await readFile(path.join(root, name))) !== digest) throw new Error('Extracted source checksum differs');
  const identity = await releaseIdentity(root);
  if (identity.sourceId !== manifest.sourceId || identity.version !== manifest.version) throw new Error('Extracted source identity differs');
  return { verified: true, version: identity.version, sourceId: identity.sourceId, files: files.length };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === '--verify-source') { console.log(JSON.stringify(await verifySource(process.cwd(), args[1]))); return; }
  if (args.length && args.join(' ') !== '--all') throw new Error('Usage: node scripts/deploy/check-release.mjs [--all]');
  const root = process.cwd(), identity = await checkRelease(root);
  if (!args.length) { console.log(JSON.stringify({ version: identity.version, sourceId: identity.sourceId, files: identity.files.length, previousArchiveVerified: true })); return; }
  const commands = [...identity.profile.localChecks.slice(1), ...identity.profile.containerChecks];
  const checks = [];
  for (const command of commands) {
    if (command[0] !== 'node' || command.some(arg => /[\r\n]/.test(arg))) throw new Error('Unexpected release command');
    console.log('Release check: ' + command.join(' '));
    const started = new Date().toISOString();
    const result = spawnSync(process.execPath, command.slice(1), { cwd: root, stdio: 'inherit', windowsHide: true,
      env: { ...process.env, WEATHROBE_SOURCE_ID: identity.sourceId } });
    checks.push({ command, started, exitCode: result.status });
    if (result.error || result.status !== 0) throw new Error('Required check failed; packaging remains blocked');
  }
  if ((await releaseIdentity(root)).sourceId !== identity.sourceId) throw new Error('Sources changed during checks; rerun the gates');
  const directory = path.join(root, '.data/release-checks');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(path.join(directory, identity.version + '.json'), JSON.stringify({ version: identity.version, sourceId: identity.sourceId,
    status: 'passed', verifiedAt: new Date().toISOString(), checks }, null, 2) + '\n', { mode: 0o600 });
  console.log('All local preparation gates passed. Live transition gates remain separate.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
