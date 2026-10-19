import { normalizeBarcode } from '../product-lookup';
import { GARMENT_TYPES, normalizeCatalogText } from './taxonomy';
import type { CatalogImport } from './model';

type ObjectValue = Record<string, unknown>;
export type ValidationResult = { ok: true; value: CatalogImport } | { ok: false; errors: string[] };
const factFields = ['composition', 'gsm', 'warmth', 'waterResistance', 'windResistance', 'breathability'];

/** Strict, bounded imports. Validation never fills gaps with guessed material or protection. */
export function validateCatalogImport(input: unknown): ValidationResult {
  const errors: string[] = [];
  const fail = (path: string, message: string) => { if (errors.length < 100) errors.push(`${path}: ${message}`); };
  function object(value: unknown, path: string, keys: string[]): ObjectValue {
    if (!value || typeof value !== 'object' || Array.isArray(value)) { fail(path, 'expected object'); return {}; }
    const row = value as ObjectValue;
    for (const key of Object.keys(row)) if (!keys.includes(key)) fail(`${path}.${key}`, 'unknown field');
    return row;
  }
  function text(value: unknown, path: string, max = 200): value is string {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) { fail(path, `expected non-empty text, max ${max}`); return false; }
    return true;
  }
  function id(value: unknown, path: string) {
    if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,79}$/.test(value)) fail(path, 'invalid stable identifier');
  }
  function oneOf(value: unknown, path: string, allowed: readonly unknown[]) { if (!allowed.includes(value)) fail(path, 'invalid value'); }
  function list(value: unknown, path: string, min: number, max: number): unknown[] {
    if (!Array.isArray(value) || value.length < min || value.length > max) { fail(path, `expected ${min}–${max} entries`); return []; }
    return value;
  }
  function url(value: unknown, path: string) {
    if (!text(value, path, 2000)) return;
    try { const u = new URL(value); if (u.protocol !== 'https:' || u.username || u.password) fail(path, 'expected HTTPS URL without credentials'); }
    catch { fail(path, 'invalid URL'); }
  }
  function date(value: unknown, path: string) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value) > Date.now() + 300_000) fail(path, 'expected UTC timestamp, not in the future');
  }
  function unique(seen: Set<unknown>, value: unknown, path: string) { if (seen.has(value)) fail(path, 'duplicate'); seen.add(value); }
  const batch = object(input, 'batch', ['version', 'sources', 'products']);
  oneOf(batch.version, 'version', [1]);
  const sources = new Map<unknown, ObjectValue>();
  for (const [i, value] of list(batch.sources, 'sources', 1, 2000).entries()) {
    const p = `sources[${i}]`, s = object(value, p, ['id', 'kind', 'title', 'url', 'accessedAt']);
    id(s.id, `${p}.id`); text(s.title, `${p}.title`, 300); url(s.url, `${p}.url`); date(s.accessedAt, `${p}.accessedAt`);
    oneOf(s.kind, `${p}.kind`, ['manufacturer', 'retailer', 'label', 'laboratory']);
    if (sources.has(s.id)) fail(`${p}.id`, 'duplicate'); sources.set(s.id, s);
  }
  const productIds = new Set(), modelKeys = new Set(), variantIds = new Set(), gtins = new Set(), offerIds = new Set();
  for (const [i, value] of list(batch.products, 'products', 1, 1000).entries()) {
    const p = `products[${i}]`;
    const product = object(value, p, ['id', 'garmentTypeId', 'brand', 'model', 'name', 'productUrl', 'technical', 'facts', 'evidence', 'variants', 'offers']);
    id(product.id, `${p}.id`); unique(productIds, product.id, `${p}.id`);
    oneOf(product.garmentTypeId, `${p}.garmentTypeId`, GARMENT_TYPES.map(type => type.id));
    text(product.brand, `${p}.brand`); text(product.model, `${p}.model`);
    if (typeof product.brand === 'string' && typeof product.model === 'string') unique(modelKeys, `${normalizeCatalogText(product.brand)}\u0000${normalizeCatalogText(product.model)}`, `${p}.brand/model`);
    const name = object(product.name, `${p}.name`, ['tr', 'en']); text(name.tr, `${p}.name.tr`); text(name.en, `${p}.name.en`);
    url(product.productUrl, `${p}.productUrl`); oneOf(product.technical, `${p}.technical`, [true, false, null]);
    const facts = object(product.facts, `${p}.facts`, factFields);
    if (facts.composition !== null) {
      const parts = new Set();
      for (const [j, entry] of list(facts.composition, `${p}.facts.composition`, 1, 3).entries()) {
        const fp = `${p}.facts.composition[${j}]`, part = object(entry, fp, ['part', 'fibers']);
        oneOf(part.part, `${fp}.part`, ['shell', 'lining', 'fill']); unique(parts, part.part, `${fp}.part`);
        let total = 0; const fibers = new Set();
        for (const [k, entry] of list(part.fibers, `${fp}.fibers`, 1, 15).entries()) {
          const f = object(entry, `${fp}.fibers[${k}]`, ['name', 'percent']);
          if (text(f.name, `${fp}.fibers[${k}].name`, 80)) unique(fibers, normalizeCatalogText(f.name), `${fp}.fibers[${k}].name`);
          if (typeof f.percent !== 'number' || !Number.isFinite(f.percent) || f.percent <= 0 || f.percent > 100) fail(`${fp}.fibers[${k}].percent`, 'expected percentage > 0 and <= 100');
          else total += f.percent;
        }
        if (Math.abs(total - 100) > 0.1) fail(fp, 'fiber percentages must total 100 for each known component');
      }
    }
    if (facts.gsm !== null && (typeof facts.gsm !== 'number' || !Number.isFinite(facts.gsm) || facts.gsm <= 0 || facts.gsm > 5000)) fail(`${p}.facts.gsm`, 'expected positive GSM <= 5000 or null');
    oneOf(facts.warmth, `${p}.facts.warmth`, [null, 1, 2, 3, 4, 5]);
    oneOf(facts.waterResistance, `${p}.facts.waterResistance`, [null, 'none', 'repellent', 'waterproof']);
    for (const field of ['windResistance', 'breathability']) oneOf(facts[field], `${p}.facts.${field}`, [null, 'low', 'medium', 'high']);
    const evidenceFields = new Set();
    for (const [j, entry] of list(product.evidence, `${p}.evidence`, 1, 40).entries()) {
      const ep = `${p}.evidence[${j}]`, e = object(entry, ep, ['field', 'sourceId', 'basis', 'note']);
      oneOf(e.field, `${ep}.field`, ['name', 'technical', ...factFields]);
      oneOf(e.basis, `${ep}.basis`, ['manufacturer', 'label', 'measurement', 'estimate']);
      if (!sources.has(e.sourceId)) fail(`${ep}.sourceId`, 'source not in batch');
      const source = sources.get(e.sourceId);
      if (e.basis === 'measurement' && source?.kind !== 'laboratory') fail(ep, 'measurement requires a laboratory source');
      if (e.basis === 'label' && source?.kind !== 'label') fail(ep, 'label confirmation requires a label source');
      if (e.basis === 'estimate' && (e.field !== 'warmth' || !text(e.note, `${ep}.note`, 500))) fail(ep, 'only warmth can be estimated, with an explanation');
      else if (e.note !== undefined) text(e.note, `${ep}.note`, 500);
      if (typeof e.field === 'string' && e.field !== 'name' && (e.field === 'technical' ? product.technical : facts[e.field]) === null) fail(ep, 'cannot assert evidence for an unknown field');
      evidenceFields.add(e.field);
    }
    for (const field of ['name', ...(product.technical === null ? [] : ['technical']), ...factFields.filter(field => facts[field] !== null)]) {
      if (!evidenceFields.has(field)) fail(`${p}.evidence`, `missing evidence for ${field}`);
    }
    const localVariants = new Set();
    for (const [j, entry] of list(product.variants, `${p}.variants`, 1, 500).entries()) {
      const vp = `${p}.variants[${j}]`, v = object(entry, vp, ['id', 'gtin', 'size', 'color', 'sku']);
      id(v.id, `${vp}.id`); unique(variantIds, v.id, `${vp}.id`); localVariants.add(v.id);
      if (v.gtin !== null) {
        if (typeof v.gtin !== 'string' || !/^\d{14}$/.test(v.gtin) || !normalizeBarcode(v.gtin)) fail(`${vp}.gtin`, 'expected checksum-valid GTIN padded to 14 digits, or null');
        unique(gtins, v.gtin, `${vp}.gtin`);
      }
      for (const field of ['size', 'color', 'sku']) if (v[field] !== null) text(v[field], `${vp}.${field}`, 100);
    }
    for (const [j, entry] of list(product.offers, `${p}.offers`, 0, 1000).entries()) {
      const op = `${p}.offers[${j}]`, o = object(entry, op, ['id', 'variantId', 'sourceId', 'country', 'currency', 'price', 'checkedAt', 'availability']);
      id(o.id, `${op}.id`); unique(offerIds, o.id, `${op}.id`);
      if (!localVariants.has(o.variantId)) fail(`${op}.variantId`, 'variant must belong to this product');
      if (!sources.has(o.sourceId)) fail(`${op}.sourceId`, 'source not in batch');
      if (typeof o.country !== 'string' || !/^[A-Z]{2}$/.test(o.country)) fail(`${op}.country`, 'expected two-letter country code');
      if (typeof o.currency !== 'string' || !/^[A-Z]{3}$/.test(o.currency)) fail(`${op}.currency`, 'expected three-letter currency code');
      if (typeof o.price !== 'number' || !Number.isFinite(o.price) || o.price < 0 || o.price > 100_000_000 || Math.abs(o.price * 10000 - Math.round(o.price * 10000)) > 0.001) fail(`${op}.price`, 'expected non-negative price with <= 4 decimals');
      date(o.checkedAt, `${op}.checkedAt`); oneOf(o.availability, `${op}.availability`, ['in_stock', 'out_of_stock', 'unknown']);
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: input as CatalogImport };
}
