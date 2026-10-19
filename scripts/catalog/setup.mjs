import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

// Explicit user command; never overwrites an existing environment file or deploys anything.
const file = path.resolve('.env');
try {
  await writeFile(file, [
    '# Generated locally. Do not commit or share this file.',
    `POSTGRES_PASSWORD=${randomBytes(32).toString('hex')}`,
    `CATALOG_READER_PASSWORD=${randomBytes(32).toString('hex')}`,
    'GEMINI_API_KEY=', 'APP_DOMAIN=localhost', 'APP_URL=http://localhost:3000', '',
  ].join('\n'), { flag: 'wx', mode: 0o600 });
  console.log(`Created ${file}. Passwords were not printed. Review domain settings before deployment.`);
} catch (error) {
  console.error(error.code === 'EEXIST' ? '.env already exists; preserved. Add the documented catalogue variables manually.' : 'Could not create environment file.');
  process.exitCode = 1;
}
