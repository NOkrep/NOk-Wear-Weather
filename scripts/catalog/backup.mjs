import { spawn } from 'node:child_process';
import { mkdir, open, rename, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// Stream binary pg_dump directly; PowerShell redirection can corrupt binary dumps.
const args = process.argv.slice(2);
let backupDirectory, container;
for (let i=0; i<args.length; i+=2) {
  if (!args[i+1]) throw new Error('Expected --directory <path> or --container <name>');
  if (args[i] === '--directory') backupDirectory = args[i+1];
  else if (args[i] === '--container' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/.test(args[i+1])) container = args[i+1];
  else throw new Error('Expected --directory <path> or --container <name>');
}
const directory = path.resolve(backupDirectory || '.data/backups');
await mkdir(directory, { recursive: true });
const target = path.join(directory, `catalog-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}.dump`);
const temporary = `${target}.partial`;
const file = await open(temporary,'wx',0o600);
const command = container ? ['exec',container] : ['compose','exec','-T','db'];
const child = spawn('docker', [...command,'sh','-c','exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom'], { stdio: ['ignore','pipe','inherit'], windowsHide: true });
try {
  const completion = new Promise((resolve,reject) => {
    child.on('error',reject);
    child.on('close',code => code === 0 ? resolve() : reject(new Error(`pg_dump exited with ${code}`)));
  });
  await Promise.all([pipeline(child.stdout,file.createWriteStream()),completion]);
  await rename(temporary,target);
  console.log(`Backup: ${target}. Copy to independent storage and test restoring into an empty database.`);
} catch {
  child.kill(); await file.close().catch(() => {}); await unlink(temporary).catch(() => {});
  console.error('Backup failed; no completed dump was published.'); process.exitCode = 1;
}
