import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { transaction } from '../../lib/catalog/database';
import { GARMENT_TYPES, LEGACY_TYPE_MAP, PILOT_TARGET } from '../../lib/catalog/taxonomy';
import { LEGACY_GARMENT_CATALOG } from '../../lib/clothing-catalog';

export async function migrateCatalog() {
  await transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('weathrobe-catalog-migrate'))");
    await client.query('CREATE TABLE IF NOT EXISTS public.weathrobe_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory = path.join(process.cwd(), 'db', 'migrations');
    for (const name of (await readdir(directory)).filter(name => /^\d+_[a-z_]+\.sql$/.test(name)).sort()) {
      const sql = await readFile(path.join(directory,name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM public.weathrobe_migrations WHERE name=$1', [name]);
      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}; create a new migration instead`);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO public.weathrobe_migrations(name,checksum) VALUES($1,$2)', [name,checksum]);
    }
    for (const type of GARMENT_TYPES) await client.query(`INSERT INTO catalog.garment_types
      (id,group_name,label_tr,label_en,slots,aliases,target_min,target_max) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)
      ON CONFLICT(id) DO NOTHING`, [type.id,type.group,type.tr,type.en,JSON.stringify(type.slots),JSON.stringify(type.aliases),PILOT_TARGET.minimum,PILOT_TARGET.maximum]);
    for (const profile of LEGACY_GARMENT_CATALOG) await client.query(`INSERT INTO catalog.legacy_profiles(id,garment_type_id,payload)
      VALUES($1,$2,$3::jsonb) ON CONFLICT(id) DO NOTHING`, [profile.id,LEGACY_TYPE_MAP[profile.id] ?? null,JSON.stringify(profile)]);

    // Optional deployment reader: cannot read draft payloads or mutate the catalogue.
    const password = process.env.CATALOG_READER_PASSWORD;
    if (password) {
      if (!/^[a-zA-Z0-9]{24,128}$/.test(password)) throw new Error('CATALOG_READER_PASSWORD must have 24–128 alphanumeric characters');
      const role = await client.query("SELECT 1 FROM pg_roles WHERE rolname='catalog_reader'");
      const command = role.rowCount ? 'ALTER ROLE catalog_reader LOGIN PASSWORD %L' : 'CREATE ROLE catalog_reader LOGIN PASSWORD %L';
      const formatted = await client.query('SELECT format($1::text,$2::text) AS sql', [command,password]);
      await client.query(formatted.rows[0].sql);
      await client.query(`GRANT USAGE ON SCHEMA catalog TO catalog_reader;
        GRANT SELECT ON catalog.garment_types,catalog.products,catalog.sources,catalog.materials,catalog.field_evidence,catalog.variants,catalog.offers TO catalog_reader;
        GRANT SELECT(id,state) ON catalog.import_batches TO catalog_reader`);
    }
  });
}
