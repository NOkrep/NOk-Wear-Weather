import { createHash, randomBytes, randomUUID, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdir, readFile, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const filenames = ['catalog.dump', 'community.json', 'reports.json', 'settings.env'];
export function docker(args, { input, env = {}, allowFailure = false } = {}) {
  const result = spawnSync('docker', args, { input, env: { ...process.env, ...env }, windowsHide: true, maxBuffer: 256 * 1024 * 1024 });
  if (!allowFailure && (result.error || result.status !== 0)) throw new Error('Docker operation failed: ' + args[0] + ' (details withheld to protect runtime data)');
  return allowFailure ? result : result.stdout;
}
export function encrypt(bytes, passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length < 16) throw new Error('A recovery passphrase of at least 16 characters is required');
  const salt = randomBytes(16), iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', scryptSync(passphrase, salt, 32), iv);
  const data = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.from(JSON.stringify({ version: 1, salt: salt.toString('hex'), iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), data: data.toString('base64') }));
}
export function decrypt(bytes, passphrase) {
  let item;
  try { item = JSON.parse(bytes.toString('utf8')); } catch { throw new Error('Invalid encrypted recovery file'); }
  if (item.version !== 1 || !/^[a-f0-9]{32}$/.test(item.salt) || !/^[a-f0-9]{24}$/.test(item.iv) || !/^[a-f0-9]{32}$/.test(item.tag)) throw new Error('Invalid encrypted recovery file');
  const cipher = createDecipheriv('aes-256-gcm', scryptSync(passphrase, Buffer.from(item.salt, 'hex'), 32), Buffer.from(item.iv, 'hex'));
  cipher.setAuthTag(Buffer.from(item.tag, 'hex'));
  return Buffer.concat([cipher.update(Buffer.from(item.data, 'base64')), cipher.final()]);
}
export function authenticateRecovery(manifest, passphrase) {
  const { authentication, ...metadata } = manifest;
  if (typeof authentication !== 'string' || !decrypt(Buffer.from(authentication, 'base64'), passphrase).equals(Buffer.from(JSON.stringify(metadata)))) throw new Error('Recovery metadata authentication failed');
}
export function inspectContainer(id) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Use an exact 64-character container ID, not a guessed name');
  return JSON.parse(docker(['inspect', '--format', '{"id":{{json .Id}},"image":{{json .Image}},"running":{{json .State.Running}},"mounts":{{json .Mounts}}}', id]).toString());
}
function sql(db, query) {
  return docker(['exec', '-i', db, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'weathrobe_owner', '-d', 'weathrobe', '-At'], { input: query }).toString().trim();
}
export function databaseDigest(db) {
  const tables = sql(db, "SELECT schemaname||'.'||tablename FROM pg_tables WHERE schemaname='catalog' OR (schemaname='public' AND tablename='weathrobe_migrations') ORDER BY 1").split('\n').filter(Boolean);
  if (!tables.length || tables.some(t => !/^(catalog|public)\.[a-z_]+$/.test(t))) throw new Error('Unexpected catalogue schema');
  const rows = tables.map(table => [table, sql(db, `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text FROM ${table} t`)]);
  return hash(JSON.stringify(rows));
}
function containerFile(container, file) {
  const result = docker(['cp', container + ':' + file, '-'], { allowFailure: true });
  if (result.status !== 0) {
    // Confirm absence using the containing directory; never turn an arbitrary copy error into an empty backup.
    const directory = docker(['cp', container + ':' + path.posix.dirname(file) + '/.', '-'], { allowFailure: true });
    if (directory.status !== 0) throw new Error('Storage directory cannot be copied: ' + path.posix.dirname(file));
    const listing = spawnSync('tar', ['-tf', '-'], { input: directory.stdout, encoding: 'utf8', windowsHide: true });
    if (listing.status !== 0 || listing.stdout.split(/\r?\n/).some(n => n.replace(/^\.\//, '') === path.posix.basename(file))) throw new Error('Storage file could not be read');
    return null;
  }
  const unpack = spawnSync('tar', ['-xOf', '-', path.posix.basename(file)], { input: result.stdout, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (unpack.status !== 0) throw new Error('Could not decode copied storage file');
  try { JSON.parse(unpack.stdout.toString('utf8')); } catch { throw new Error('Private storage is not valid JSON; backup refused'); }
  return unpack.stdout;
}

export async function backupRecovery({ app, db, settings, directory, passphrase }) {
  const appInfo = inspectContainer(app), dbInfo = inspectContainer(db);
  if (appInfo.running || !dbInfo.running) throw new Error('Backup requires the explicitly selected application stopped and its database running');
  const community = appInfo.mounts.find(m => m.Destination === '/app/.data/community');
  const reports = appInfo.mounts.find(m => m.Destination === '/app/.data/reports');
  const database = dbInfo.mounts.find(m => m.Destination === '/var/lib/postgresql/data');
  if (!community || !database || community.Type !== 'volume' || database.Type !== 'volume') throw new Error('Known persistent data mappings are required');
  const info = await lstat(settings);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 65536) throw new Error('Settings must be a regular file smaller than 64 KiB');
  const configuration = await readFile(settings);
  const values = parseEnv(configuration.toString());
  if (!values.POSTGRES_PASSWORD || !values.CATALOG_READER_PASSWORD) throw new Error('Required recovery settings are missing');
  const payloads = {
    'catalog.dump': docker(['exec', db, 'pg_dump', '-U', 'weathrobe_owner', '-d', 'weathrobe', '-Fc']),
    'community.json': containerFile(app, '/app/.data/community/contributions.json'),
    'reports.json': reports ? containerFile(app, '/app/.data/reports/reports.json') : null,
    'settings.env': configuration,
  };
  if (payloads['catalog.dump'].subarray(0, 5).toString() !== 'PGDMP') throw new Error('Invalid custom-format database dump');
  // Build all authenticated encrypted payloads before creating the new backup directory.
  const encrypted = Object.entries(payloads).filter(([, bytes]) => bytes !== null).map(([name, bytes]) => ({ name, bytes: encrypt(bytes, passphrase) }));
  const manifest = { version: 1, createdAt: new Date().toISOString(), appImage: appInfo.image, dbImage: dbInfo.image,
    databaseDigest: databaseDigest(db), dbMajor: Math.floor(Number(sql(db, 'SHOW server_version_num')) / 10000), reportsMounted: Boolean(reports),
    files: encrypted.map(({ name, bytes }) => ({ name: name + '.enc', bytes: bytes.length, sha256: hash(bytes) })),
    missingFiles: Object.entries(payloads).filter(([, bytes]) => bytes === null).map(([name]) => name),
    coverage: 'Catalogue DB; contributions.json; reports.json if mounted; encrypted settings. Browser data and shared proxy certificates are separate.' };
  manifest.authentication = encrypt(Buffer.from(JSON.stringify(manifest)), passphrase).toString('base64');
  await mkdir(directory, { mode: 0o700 }); // EEXIST intentionally refuses overwriting any previous recovery copy.
  for (const item of encrypted) await writeFile(path.join(directory, item.name + '.enc'), item.bytes, { flag: 'wx', mode: 0o600 });
  await writeFile(path.join(directory, 'backup.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return manifest;
}

export async function verifyRecovery(directory) {
  const manifestFile = path.join(directory, 'backup.json'), manifestInfo = await lstat(manifestFile);
  if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink() || manifestInfo.size > 256 * 1024) throw new Error('Invalid recovery manifest file');
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestFile, 'utf8')); } catch { throw new Error('Invalid recovery manifest'); }
  if (manifest.version !== 1 || !/^[a-f0-9]{64}$/.test(manifest.databaseDigest) || !Array.isArray(manifest.files)
    || !/^sha256:[a-f0-9]{64}$/.test(manifest.dbImage) || !/^sha256:[a-f0-9]{64}$/.test(manifest.appImage) || !Number.isInteger(manifest.dbMajor) || manifest.dbMajor < 17
    || new Set(manifest.files.map(f => f.name)).size !== manifest.files.length
    || !manifest.files.some(f => f.name === 'catalog.dump.enc') || !manifest.files.some(f => f.name === 'settings.env.enc')) throw new Error('Invalid recovery manifest');
  if (!Array.isArray(manifest.missingFiles) || manifest.missingFiles.some(n => !['community.json', 'reports.json'].includes(n))
    || [...manifest.files.map(f => f.name.slice(0, -4)), ...manifest.missingFiles].sort().join('|') !== [...filenames].sort().join('|')) throw new Error('Incomplete recovery inventory');
  for (const file of manifest.files) {
    if (!filenames.map(n => n + '.enc').includes(file.name)) throw new Error('Unexpected recovery filename');
    const target = path.join(directory, file.name), info = await lstat(target);
    if (!info.isFile() || info.isSymbolicLink() || info.size !== file.bytes || info.size > 256 * 1024 * 1024) throw new Error('Invalid recovery file');
    if (hash(await readFile(target)) !== file.sha256) throw new Error('Recovery checksum mismatch: ' + file.name);
  }
  return manifest;
}

export async function restoreCheck({ directory, toolsImage, passphrase, dbImage }) {
  if (!/^sha256:[a-f0-9]{64}$/.test(toolsImage)) throw new Error('Restore requires an immutable tools image ID');
  const manifest = await verifyRecovery(directory), payloads = {};
  authenticateRecovery(manifest, passphrase);
  const restoreImage = dbImage || manifest.dbImage;
  if (!/^sha256:[a-f0-9]{64}$/.test(restoreImage)) throw new Error('Restore requires an immutable database image ID');
  const pgVersion = docker(['run', '--rm', '--network', 'none', '--entrypoint', 'postgres', restoreImage, '--version']).toString();
  if (Number(pgVersion.match(/PostgreSQL\) (\d+)\./)?.[1]) !== manifest.dbMajor) throw new Error('Restore PostgreSQL major differs from backup');
  for (const file of manifest.files) payloads[file.name.slice(0, -4)] = decrypt(await readFile(path.join(directory, file.name)), passphrase);
  const settings = parseEnv(payloads['settings.env'].toString());
  if (!settings.POSTGRES_PASSWORD || !settings.CATALOG_READER_PASSWORD) throw new Error('Restored settings are incomplete');
  const label = randomUUID(), prefix = 'weathrobe-ww05-restore-' + label.slice(0, 8), network = prefix + '-net', db = prefix + '-db';
  const volumes = [prefix + '-community', prefix + '-reports'];
  const password = randomBytes(32).toString('hex'), reader = randomBytes(32).toString('hex');
  const resourceLabel = 'nok.weathrobe.recovery=' + label;
  const createdVolumes = [];
  let networkCreated = false, databaseCreated = false;
  try {
    docker(['network', 'create', '--internal', '--label', resourceLabel, network]); networkCreated = true;
    for (const volume of volumes) { docker(['volume', 'create', '--label', resourceLabel, volume]); createdVolumes.push(volume); }
    docker(['run', '-d', '--name', db, '--label', resourceLabel, '--network', network, '--tmpfs', '/var/lib/postgresql/data',
      '-e', 'POSTGRES_USER=weathrobe_owner', '-e', 'POSTGRES_DB=weathrobe', '-e', 'POSTGRES_PASSWORD', restoreImage], { env: { POSTGRES_PASSWORD: password } }); databaseCreated = true;
    let ready = false;
    for (let n = 0; n < 60; n++) {
      if (docker(['exec', db, 'pg_isready', '-U', 'weathrobe_owner', '-d', 'weathrobe'], { allowFailure: true }).status === 0) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error('Isolated restore database did not become ready');
    docker(['exec', '-i', db, 'pg_restore', '--exit-on-error', '--no-owner', '--no-acl', '-U', 'weathrobe_owner', '-d', 'weathrobe'], { input: payloads['catalog.dump'] });
    if (databaseDigest(db) !== manifest.databaseDigest) throw new Error('Restored database content differs');
    docker(['run', '--rm', '--network', network, '-e', 'DATABASE_URL', '-e', 'CATALOG_READER_PASSWORD', toolsImage],
      { env: { DATABASE_URL: `postgresql://weathrobe_owner:${password}@${db}:5432/weathrobe`, CATALOG_READER_PASSWORD: reader } });
    if (databaseDigest(db) !== manifest.databaseDigest) throw new Error('Migration changed restored catalogue content');
    for (const [n, name] of ['community.json', 'reports.json'].entries()) {
      const volume = volumes[n], bytes = payloads[name];
      if (bytes) {
        try { JSON.parse(bytes.toString()); } catch { throw new Error('Private storage backup is not valid JSON'); }
        const file = n === 0 ? 'contributions.json' : 'reports.json';
        docker(['run', '--rm', '-i', '--network', 'none', '-v', volume + ':/restore', '--entrypoint', 'node', toolsImage, '-e',
          `const fs=require('fs');const chunks=[];process.stdin.on('data',b=>chunks.push(b));process.stdin.on('end',()=>{fs.chownSync('/restore',1001,1001);fs.chmodSync('/restore',0o700);fs.writeFileSync('/restore/${file}',Buffer.concat(chunks),{mode:0o600});fs.chownSync('/restore/${file}',1001,1001);});`], { input: bytes });
        const copied = docker(['run', '--rm', '--network', 'none', '--user', '1001:1001', '-v', volume + ':/restore:ro', '--entrypoint', 'node', toolsImage, '-e', `process.stdout.write(require('fs').readFileSync('/restore/${file}'))`]);
        if (!copied.equals(bytes)) throw new Error('Restored storage differs');
        const denied = docker(['run', '--rm', '--network', 'none', '--user', '1002:1002', '-v', volume + ':/restore:ro', '--entrypoint', 'node', toolsImage, '-e', `try{require('fs').readFileSync('/restore/${file}');process.exit(1)}catch(e){process.exit(e.code==='EACCES'?0:1)}`], { allowFailure: true });
        if (denied.status !== 0) throw new Error('Restored private storage permissions failed');
      }
    }
    const permissions = sql(db, "SELECT has_table_privilege('catalog_reader','catalog.products','SELECT') AND NOT has_table_privilege('catalog_reader','catalog.products','DELETE') AND NOT has_column_privilege('catalog_reader','catalog.import_batches','payload','SELECT')");
    if (permissions !== 't') throw new Error('Restored catalogue reader permissions failed');
    return { restored: true, databaseDigest: manifest.databaseDigest, privateFiles: Object.keys(payloads).filter(n => n.endsWith('.json')).length,
      settingsVerified: true, readerPermissionsVerified: true, privatePermissionsVerified: true, sourceDbImage: manifest.dbImage, restoredDbImage: restoreImage };
  } finally {
    // Only resources created in this invocation; verify the exact unique label before removal.
    const remove = (kind, name) => {
      const actual = docker([kind, 'inspect', '--format', '{{index .Labels "nok.weathrobe.recovery"}}', name], { allowFailure: true });
      if (actual.status === 0 && actual.stdout.toString().trim() === label) docker([kind, 'rm', name]);
    };
    if (databaseCreated) {
      const actual = docker(['inspect', '--format', '{{index .Config.Labels "nok.weathrobe.recovery"}}', db]).toString().trim();
      if (actual === label) docker(['rm', '-f', db]);
    }
    for (const volume of createdVolumes) remove('volume', volume);
    if (networkCreated) remove('network', network);
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2), options = {};
  for (let n = 0; n < args.length; n += 2) {
    if (!['--app', '--db', '--settings', '--directory', '--tools-image', '--db-image'].includes(args[n]) || !args[n + 1] || options[args[n].slice(2)]) throw new Error('Invalid recovery arguments');
    options[args[n].slice(2)] = args[n + 1];
  }
  if (!options.directory) throw new Error('An explicit backup directory is required');
  if (command === 'verify') { const m = await verifyRecovery(options.directory); console.log(JSON.stringify({ checksumsVerified: true, authenticated: false, createdAt: m.createdAt, files: m.files.length, databaseDigest: m.databaseDigest })); }
  else if (command === 'backup') { const m = await backupRecovery({ ...options, passphrase: process.env.WW_RECOVERY_PASSPHRASE }); console.log(JSON.stringify({ backupComplete: true, files: m.files.length, databaseDigest: m.databaseDigest })); }
  else if (command === 'restore-check') console.log(JSON.stringify(await restoreCheck({ directory: options.directory, toolsImage: options['tools-image'], dbImage: options['db-image'], passphrase: process.env.WW_RECOVERY_PASSPHRASE })));
  else throw new Error('Use backup, verify or restore-check; there is no live restore command');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
