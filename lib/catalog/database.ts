import { Pool, type PoolClient } from 'pg';

const shared = globalThis as typeof globalThis & { weathrobeCatalogPool?: Pool };
export function catalogPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for catalogue database commands');
  if (!shared.weathrobeCatalogPool) {
    shared.weathrobeCatalogPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000,
      statement_timeout: 5000, application_name: 'weathrobe-catalog',
    });
    // Never log connection strings, queries or product import payloads.
    shared.weathrobeCatalogPool.on('error', () => console.error('Catalogue database connection lost'));
  }
  return shared.weathrobeCatalogPool;
}

export async function closeCatalogPool() {
  const pool = shared.weathrobeCatalogPool;
  delete shared.weathrobeCatalogPool;
  if (pool) await pool.end();
}

export async function transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await catalogPool().connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
