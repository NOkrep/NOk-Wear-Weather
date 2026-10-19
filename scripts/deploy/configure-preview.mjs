import { randomBytes, randomUUID } from 'node:crypto';
import { lstat, readFile, rename, rm, writeFile, chmod } from 'node:fs/promises';
import { isIP } from 'node:net';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { pathToFileURL } from 'node:url';

export function previewHostname(input) {
  if (typeof input !== 'string' || input !== input.trim() || input.length > 253) throw new Error('Provide a public hostname without https://, spaces or a path.');
  const hostname = input.toLowerCase();
  const labels = hostname.split('.');
  if (isIP(hostname) || labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(hostname)) {
    throw new Error('A public DNS hostname is required for browser-trusted HTTPS.');
  }
  return hostname;
}

async function optionalFile(file) {
  try {
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 64 * 1024) throw new Error('Settings must be a regular file smaller than 64 KiB.');
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

/** Explicit server command. Never prints credentials or overwrites a local DB setting. */
export async function configurePreview(directory, input) {
  const domain = previewHostname(input);
  const root = path.resolve(directory);
  for (const name of ['.env.local', '.env.production', '.env.production.local']) {
    if (await optionalFile(path.join(root, name)) !== null) throw new Error('Additional environment files exist; review their precedence before configuring this preview.');
  }
  const file = path.join(root, '.env');
  const before = await optionalFile(file);
  let after;
  if (before === null) {
    after = [
      '# Generated on the preview server. Do not commit, upload or share this file.',
      `POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}`,
      `CATALOG_READER_PASSWORD=${randomBytes(32).toString('hex')}`,
      'GEMINI_API_KEY=', `APP_DOMAIN=${domain}`, `APP_URL=https://${domain}`, '',
    ].join('\n');
    await writeFile(file, after, { flag: 'wx', mode: 0o600 });
  } else {
    const values = parseEnv(before);
    const keys = ['POSTGRES_PASSWORD', 'CATALOG_READER_PASSWORD', 'APP_DOMAIN', 'APP_URL', 'GEMINI_API_KEY', 'API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY', 'DATABASE_URL'];
    for (const key of keys) {
      if ([...before.matchAll(new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`, 'gm'))].length > 1) throw new Error('Duplicate environment settings exist; existing file was preserved.');
    }
    if (values.DATABASE_URL) throw new Error('A DATABASE_URL already exists; refusing to retarget a local or external database.');
    if (['GEMINI_API_KEY', 'API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY'].some(key => values[key]?.trim())) throw new Error('An AI API key is configured; review billing and access limits before publishing. Existing file was preserved.');
    if (![values.POSTGRES_PASSWORD, values.CATALOG_READER_PASSWORD].every(value => typeof value === 'string' && /^[a-zA-Z0-9]{24,128}$/.test(value)) || values.POSTGRES_PASSWORD === values.CATALOG_READER_PASSWORD) {
      throw new Error('Two distinct database passwords are required; existing credentials were preserved.');
    }
    if (values.APP_DOMAIN && !['localhost', domain].includes(values.APP_DOMAIN)) throw new Error('A different hostname is already configured; existing settings were preserved.');
    if (values.APP_URL && !['http://localhost:3000', `https://${domain}`].includes(values.APP_URL)) throw new Error('A different APP_URL is already configured; existing settings were preserved.');
    after = before;
    for (const [key, value] of [['APP_DOMAIN', domain], ['APP_URL', `https://${domain}`]]) {
      const pattern = new RegExp(`^([\\t ]*(?:export[\\t ]+)?${key}[\\t ]*=)[^\\r\\n]*`, 'm');
      after = pattern.test(after) ? after.replace(pattern, `$1${value}`) : `${after}${after.endsWith('\n') ? '' : '\n'}${key}=${value}\n`;
    }
    if (after !== before) {
      const temporary = path.join(root, `.env.preview.${randomUUID()}.tmp`);
      try {
        await writeFile(temporary, after, { flag: 'wx', mode: 0o600 });
        await rename(temporary, file);
      } finally {
        await rm(temporary, { force: true });
      }
    }
    if (process.platform !== 'win32') await chmod(file, 0o600);
  }
  return { domain, url: `https://${domain}`, created: before === null, changed: after !== before };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [flag, domain, ...extra] = process.argv.slice(2);
  if (flag !== '--domain' || !domain || extra.length) {
    console.error('Usage: node scripts/deploy/configure-preview.mjs --domain PUBLIC_HOSTNAME');
    process.exitCode = 1;
  } else {
    configurePreview(process.cwd(), domain).then(result => console.log(`Preview settings ready for ${result.url}. Credentials were not printed; AI API keys remain disabled.`)).catch(error => {
      console.error(error instanceof Error ? error.message : 'Could not configure preview settings.');
      process.exitCode = 1;
    });
  }
}
