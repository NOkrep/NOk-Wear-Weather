import { LEGACY_GARMENT_CATALOG, searchGarmentCatalog } from '../clothing-catalog';
import { GARMENT_TYPES, LEGACY_TYPE_MAP, PILOT_TARGET } from './taxonomy';
import { publishedCoverage, searchPublishedProducts, type CatalogSearch } from './repository';

export async function catalogResponse(search: CatalogSearch & { tier?: string }) {
  const profiles = searchGarmentCatalog(search.query, search.group ?? 'all', search.tier ?? 'all')
    .filter(item => !search.type || LEGACY_TYPE_MAP[item.id] === search.type);
  const base = {
    version: 2, types: GARMENT_TYPES, pilotTarget: PILOT_TARGET,
    // Existing consumers still receive profiles. Canonical products never lose unknowns in a legacy adapter.
    results: profiles, profiles, legacyProfileCount: LEGACY_GARMENT_CATALOG.length,
    priceSegmentPolicy: 'legacy-profiles-only' as const,
    countryCode: search.countryCode ?? null,
    limit: search.limit, offset: search.offset,
  };
  if (!process.env.DATABASE_URL) return {
    ...base, backend: 'local-profiles' as const, productStatus: 'not-configured' as const,
    products: [], sources: [], totalProducts: 0,
    coverage: GARMENT_TYPES.map(type => ({ garmentTypeId: type.id, products: 0 })),
  };
  try {
    const [catalog,coverage] = await Promise.all([searchPublishedProducts(search),publishedCoverage()]);
    return { ...base, backend: 'postgresql' as const, productStatus: 'available' as const, products: catalog.products, sources: catalog.sources, totalProducts: catalog.total, coverage };
  } catch {
    console.error('Catalogue database unavailable; serving legacy profiles');
    return { ...base, backend: 'local-profiles' as const, productStatus: 'unavailable' as const, products: [], sources: [], totalProducts: null, coverage: null };
  }
}
