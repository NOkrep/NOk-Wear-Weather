// Synthetic test-only data. Never seeded, shipped to the public API, or counted as real products.
exports.fixture = () => ({
  version: 1,
  sources: [{ id: 'fixture-source', kind: 'manufacturer', title: 'Synthetic test fixture', url: 'https://example.invalid/fixture', accessedAt: '2026-10-01T10:00:00Z' }],
  products: [{
    id: 'fixture-coat', garmentTypeId: 'rain-jacket', brand: 'Fixture', model: 'Test only',
    name: { tr: 'Deneme yağmurluğu', en: 'Fixture rain jacket' }, productUrl: 'https://example.invalid/fixture', technical: null,
    facts: { composition: null, gsm: null, warmth: null, waterResistance: null, windResistance: null, breathability: null },
    evidence: [{ field: 'name', sourceId: 'fixture-source', basis: 'manufacturer' }],
    variants: [{ id: 'fixture-coat-m', gtin: '04006381333931', size: 'M', color: 'Blue', sku: null }],
    offers: [{ id: 'fixture-offer-1', variantId: 'fixture-coat-m', sourceId: 'fixture-source', country: 'TR', currency: 'TRY', price: 1250.5, checkedAt: '2026-10-01T10:00:00Z', availability: 'unknown' }],
  }],
});
