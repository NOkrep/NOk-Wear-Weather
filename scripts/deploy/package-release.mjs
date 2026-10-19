import { createHash } from 'node:crypto';
import { createReadStream, constants } from 'node:fs';
import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const directories = ['app', 'components', 'lib', 'public', 'db', 'scripts', 'deploy', 'tests'];
const rootFiles = ['package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml', '.dockerignore', '.env.example', 'next.config.ts', 'tsconfig.json', 'next-env.d.ts', 'postcss.config.mjs', 'postcss.config.js', 'eslint.config.mjs', 'eslint.config.js', 'README.md', 'DEVELOPMENT_HANDOFF.md', 'ARCHITECTURE_AND_ROADMAP.md', 'wear_weather_project_spec_and_handoff.md', 'MOBILE_APP_GUIDE.md', 'LICENSE', 'LICENSE.md'];
const required = ['package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml', '.dockerignore', 'next.config.ts', 'tsconfig.json', 'db/imports/local-approved.json', 'deploy/Caddyfile'];

export function excludedReleasePath(relative) {
  const normalized = relative.replaceAll('\\', '/');
  if (normalized === '.dockerignore' || normalized === '.env.example') return false;
  const parts = normalized.split('/');
  return parts.some(part => part.startsWith('.') || ['node_modules', 'artifacts', 'coverage', 'backups', 'SSH_Keys', 'private'].includes(part)) ||
    /(?:^|\/)(?:id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?|credentials(?:\.[^/]*)?|service[-_]account[^/]*)$/i.test(normalized) ||
    /\.(?:key|pem|p12|pfx|dump|sqlite3?|db|log|tsbuildinfo|zip|tar|gz|bak)$/i.test(normalized);
}

export async function releaseFiles(directory) {
  const root = path.resolve(directory);
  const result = [];
  let totalBytes = 0;
  async function visit(relative, optional = false) {
    if (excludedReleasePath(relative)) return;
    if (/[\r\n]/.test(relative)) throw new Error('Release filenames must not contain newlines.');
    const file = path.join(root, relative);
    let info;
    try { info = await lstat(file); } catch (error) { if (optional && error.code === 'ENOENT') return; throw error; }
    if (info.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in a release: ${relative}`);
    if (info.isDirectory()) {
      for (const entry of (await readdir(file)).sort()) await visit(`${relative}/${entry}`);
    } else if (info.isFile()) {
      if (info.size > 128 * 1024 * 1024) throw new Error(`Release file exceeds 128 MiB: ${relative}`);
      totalBytes += info.size;
      if (totalBytes > 512 * 1024 * 1024) throw new Error('Release sources exceed 512 MiB.');
      // Detect actual PEM key material, including keys renamed to an innocent suffix.
      const content = await readFile(file);
      if (/-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/.test(content.toString('utf8'))) throw new Error(`Private key material detected; release refused: ${relative}`);
      result.push(relative.replaceAll('\\', '/'));
    } else throw new Error(`Unsupported file in release: ${relative}`);
  }
  for (const file of rootFiles) await visit(file, true);
  for (const directoryName of directories) await visit(directoryName, true);
  for (const file of required) if (!result.includes(file)) throw new Error(`Required release file missing: ${file}`);
  return result.sort();
}

function tar(args) {
  const result = spawnSync('tar', args, { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`tar failed (${result.error?.code ?? result.status}); no completed release was produced.`);
  return result.stdout;
}

/** Archive current working files, including approved uncommitted work, never local state. */
export async function packageRelease({ directory = process.cwd(), name = 'weathrobe-preview' } = {}) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(name)) throw new Error('Invalid release name.');
  const root = await realpath(path.resolve(directory));
  const files = await releaseFiles(root);
  const output = path.join(root, 'artifacts', 'releases');
  await mkdir(output, { recursive: true });
  const resolvedOutput = await realpath(output);
  if (!resolvedOutput.startsWith(`${root}${path.sep}`)) throw new Error('Release output must stay inside the workspace.');
  const archive = path.join(resolvedOutput, `${name}.tar.gz`);
  const checksum = `${archive}.sha256`;
  for (const target of [archive, checksum]) {
    try { await lstat(target); throw new Error('Release output already exists; choose a new name. Existing files were preserved.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'weathrobe-release-'));
  const list = path.join(temporary, 'files.txt');
  const staging = path.join(temporary, 'release.tar.gz');
  try {
    await writeFile(list, `${files.join('\n')}\n`, { flag: 'wx', mode: 0o600 });
    tar(['-czf', staging, '-C', root, '-T', list]);
    const entries = tar(['-tzf', staging]).split(/\r?\n/).filter(Boolean).sort();
    if (JSON.stringify(entries) !== JSON.stringify(files) || entries.some(excludedReleasePath)) throw new Error('Archive contents differ from the reviewed file list; release refused.');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(staging)) hash.update(chunk);
    const digest = hash.digest('hex');
    await copyFile(staging, archive, constants.COPYFILE_EXCL);
    await writeFile(checksum, `${digest}  ${path.basename(archive)}\n`, { flag: 'wx', mode: 0o600 });
    return { archive, checksum, sha256: digest, files: files.length, bytes: (await stat(archive)).size };
  } finally {
    // Only the two explicitly named files in our newly created temp directory are removed.
    await rm(list, { force: true });
    await rm(staging, { force: true });
    await rmdir(temporary);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [flag, name, ...extra] = process.argv.slice(2);
  if (flag !== '--name' || !name || extra.length) {
    console.error('Usage: node scripts/deploy/package-release.mjs --name weathrobe-preview-YYYY-MM-DD');
    process.exitCode = 1;
  } else {
    packageRelease({ name }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
      console.error(error instanceof Error ? error.message : 'Could not package release.');
      process.exitCode = 1;
    });
  }
}
