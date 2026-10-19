import { catalogPool } from './database';
import { normalizeBarcode } from '../product-lookup';
import { GARMENT_TYPES, normalizeCatalogText } from './taxonomy';
import type { CatalogProduct, CatalogSource, CatalogFacts } from './model';

export interface CatalogSearch {
  query: string;
  type?: string;
  group?: string;
  countryCode?: string;
  limit: number;
  offset: number;
}

export async function searchPublishedProducts(search: CatalogSearch) {
  const pool = catalogPool();
  const query = normalizeCatalogText(search.query);
  const barcode = normalizeBarcode(search.query.trim());
  const values = [query, search.type ?? null, search.group ?? null, barcode?.padStart(14, '0') ?? null];
  const where = `FROM catalog.products p
    JOIN catalog.import_batches b ON b.id=p.import_batch_id AND b.state='published'
    JOIN catalog.garment_types t ON t.id=p.garment_type_id
    WHERE ($1::text='' OR p.search_vector @@ plainto_tsquery('simple',$1)
      OR position($1 in p.search_text)>0 OR EXISTS(SELECT 1 FROM catalog.variants v WHERE v.product_id=p.id AND v.gtin=$4))
      AND ($2::text IS NULL OR p.garment_type_id=$2)
      AND ($3::text IS NULL OR t.group_name=$3)`;
  // Country selects offer observations below. Missing prices do not hide a known product
  // and historical prices never establish current stock or market availability.
  const [rows, count] = await Promise.all([
    pool.query(`SELECT p.* ${where} ORDER BY p.id LIMIT $5 OFFSET $6`, [...values, search.limit, search.offset]),
    pool.query(`SELECT count(*)::integer AS total ${where}`, values),
  ]);
  const ids = rows.rows.map(row => row.id);
  if (!ids.length) return { products: [] as CatalogProduct[], sources: [] as CatalogSource[], total: count.rows[0].total as number };
  const [variants, offers, materials, evidence, sources] = await Promise.all([
    pool.query('SELECT id,product_id,gtin,size,color,sku FROM catalog.variants WHERE product_id=ANY($1::text[]) ORDER BY id', [ids]),
    pool.query(`SELECT o.*,v.product_id FROM catalog.offers o JOIN catalog.variants v ON v.id=o.variant_id
      WHERE v.product_id=ANY($1::text[]) AND ($2::text IS NULL OR o.country=$2) ORDER BY o.checked_at DESC,o.id`, [ids,search.countryCode ?? null]),
    pool.query('SELECT * FROM catalog.materials WHERE product_id=ANY($1::text[]) ORDER BY part,fiber', [ids]),
    pool.query('SELECT * FROM catalog.field_evidence WHERE product_id=ANY($1::text[]) ORDER BY id', [ids]),
    pool.query(`SELECT DISTINCT s.* FROM catalog.sources s WHERE s.id IN (
      SELECT source_id FROM catalog.field_evidence WHERE product_id=ANY($1::text[])
      UNION SELECT o.source_id FROM catalog.offers o JOIN catalog.variants v ON v.id=o.variant_id WHERE v.product_id=ANY($1::text[]) AND ($2::text IS NULL OR o.country=$2)) ORDER BY s.id`, [ids,search.countryCode ?? null]),
  ]);
  const products: CatalogProduct[] = rows.rows.map(row => {
    const components = new Map<string, { name: string; percent: number }[]>();
    for (const m of materials.rows.filter(m => m.product_id === row.id)) components.set(m.part, [...(components.get(m.part) ?? []), { name: m.fiber, percent: Number(m.percent) }]);
    const composition: CatalogFacts['composition'] = components.size ? [...components].map(([part,fibers]) => ({ part: part as 'shell' | 'lining' | 'fill', fibers })) : null;
    return {
      id: row.id, garmentTypeId: row.garment_type_id, brand: row.brand, model: row.model,
      name: { tr: row.name_tr, en: row.name_en }, productUrl: row.product_url, technical: row.technical,
      facts: { composition, gsm: row.gsm === null ? null : Number(row.gsm), warmth: row.warmth, waterResistance: row.water_resistance, windResistance: row.wind_resistance, breathability: row.breathability },
      evidence: evidence.rows.filter(e => e.product_id === row.id).map(e => ({ field: e.field, sourceId: e.source_id, basis: e.basis, ...(e.note ? { note: e.note } : {}) })),
      variants: variants.rows.filter(v => v.product_id === row.id).map(v => ({ id: v.id, gtin: v.gtin, size: v.size, color: v.color, sku: v.sku })),
      offers: offers.rows.filter(o => o.product_id === row.id).map(o => ({ id: o.id, variantId: o.variant_id, sourceId: o.source_id, country: o.country, currency: o.currency, price: Number(o.price), checkedAt: new Date(o.checked_at).toISOString(), availability: o.availability })),
    };
  });
  return { products, sources: sources.rows.map(s => ({ id: s.id, kind: s.kind, title: s.title, url: s.url, accessedAt: new Date(s.accessed_at).toISOString() })) as CatalogSource[], total: count.rows[0].total as number };
}

export async function publishedCoverage() {
  const result = await catalogPool().query(`SELECT p.garment_type_id,count(*)::integer AS count
    FROM catalog.products p JOIN catalog.import_batches b ON b.id=p.import_batch_id AND b.state='published' GROUP BY p.garment_type_id`);
  const counts = new Map<string,number>(result.rows.map(row => [row.garment_type_id,row.count]));
  return GARMENT_TYPES.map(type => ({ garmentTypeId: type.id, products: counts.get(type.id) ?? 0 }));
}
