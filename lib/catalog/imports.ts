import { createHash, randomUUID } from 'node:crypto';
import { catalogPool, transaction } from './database';
import { normalizeCatalogText, GARMENT_TYPES } from './taxonomy';
import { validateCatalogImport } from './validation';

export async function stageCatalogImport(payload: unknown) {
  const validated = validateCatalogImport(payload);
  if (!validated.ok) throw new Error(validated.errors.join('\n'));
  const data = JSON.stringify(validated.value);
  const digest = createHash('sha256').update(data).digest('hex');
  const result = await catalogPool().query(
    `INSERT INTO catalog.import_batches(id,digest,payload) VALUES($1,$2,$3::jsonb)
     ON CONFLICT(digest) DO UPDATE SET digest = EXCLUDED.digest RETURNING id,state`,
    [randomUUID(), digest, data],
  );
  return result.rows[0] as { id: string; state: string };
}

/** CLI-only administration; there is deliberately no public write/publish endpoint. */
export async function publishCatalogImport(id: string) {
  return transaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('weathrobe-catalog-publish'))");
    const result = await client.query('SELECT payload,state FROM catalog.import_batches WHERE id=$1 FOR UPDATE', [id]);
    if (!result.rowCount) throw new Error('Import batch not found');
    if (result.rows[0].state === 'published') return { published: false, alreadyPublished: true };
    if (result.rows[0].state !== 'draft') throw new Error('Only draft batches can be published');
    const validated = validateCatalogImport(result.rows[0].payload);
    if (!validated.ok) throw new Error(validated.errors.join('\n'));
    const batch = validated.value;
    for (const s of batch.sources) {
      const existing = await client.query('SELECT kind,title,url,accessed_at FROM catalog.sources WHERE id=$1', [s.id]);
      if (existing.rowCount) {
        const old = existing.rows[0];
        if (old.kind !== s.kind || old.title !== s.title || old.url !== s.url || new Date(old.accessed_at).getTime() !== Date.parse(s.accessedAt)) throw new Error(`Source identity conflict: ${s.id}. Use a new ID for a new observation.`);
      } else await client.query('INSERT INTO catalog.sources(id,kind,title,url,accessed_at) VALUES($1,$2,$3,$4,$5)', [s.id,s.kind,s.title,s.url,s.accessedAt]);
    }
    for (const p of batch.products) {
      const type = GARMENT_TYPES.find(type => type.id === p.garmentTypeId)!;
      const facts = p.facts;
      const search = normalizeCatalogText([p.brand,p.model,p.name.tr,p.name.en,type.tr,type.en,...type.aliases,...(facts.composition ?? []).flatMap(c => c.fibers.map(f => f.name))].join(' '));
      await client.query(`INSERT INTO catalog.products
        (id,garment_type_id,import_batch_id,brand,model,identity_key,name_tr,name_en,product_url,technical,gsm,warmth,water_resistance,wind_resistance,breathability,search_text)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [p.id,p.garmentTypeId,id,p.brand,p.model,JSON.stringify([normalizeCatalogText(p.brand),normalizeCatalogText(p.model)]),p.name.tr,p.name.en,p.productUrl,p.technical,facts.gsm,facts.warmth,facts.waterResistance,facts.windResistance,facts.breathability,search]);
      for (const part of facts.composition ?? []) for (const fiber of part.fibers) await client.query(
        'INSERT INTO catalog.materials(product_id,part,fiber,percent) VALUES($1,$2,$3,$4)', [p.id,part.part,fiber.name,fiber.percent]);
      for (const e of p.evidence) await client.query(
        'INSERT INTO catalog.field_evidence(product_id,field,source_id,basis,note) VALUES($1,$2,$3,$4,$5)', [p.id,e.field,e.sourceId,e.basis,e.note ?? null]);
      for (const v of p.variants) await client.query(
        'INSERT INTO catalog.variants(id,product_id,gtin,size,color,sku) VALUES($1,$2,$3,$4,$5,$6)', [v.id,p.id,v.gtin,v.size,v.color,v.sku]);
      for (const o of p.offers) await client.query(
        'INSERT INTO catalog.offers(id,variant_id,source_id,country,currency,price,checked_at,availability) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [o.id,o.variantId,o.sourceId,o.country,o.currency,o.price,o.checkedAt,o.availability]);
    }
    await client.query("UPDATE catalog.import_batches SET state='published',reviewed_at=now() WHERE id=$1", [id]);
    return { published: true, products: batch.products.length };
  });
}

export async function rejectCatalogImport(id: string) {
  const result = await catalogPool().query("UPDATE catalog.import_batches SET state='rejected',reviewed_at=now() WHERE id=$1 AND state='draft' RETURNING id", [id]);
  if (!result.rowCount) throw new Error('Draft batch not found');
}
