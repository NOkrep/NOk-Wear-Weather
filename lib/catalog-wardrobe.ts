import type { ClothingItem, WeatherConsensus } from './types';
import type { CatalogProduct, CatalogSource } from './catalog/model';
import { GARMENT_TYPES } from './catalog/taxonomy';

const fibers: Record<string, string> = {
  Cotton: 'Pamuk', Polyester: 'Polyester', Polyamide: 'Poliamid', Elastane: 'Elastan',
  'Merino wool': 'Merinos yünü', Modal: 'Modal', Linen: 'Keten',
};

export function catalogMaterial(product: CatalogProduct, locale: 'tr' | 'en'): string {
  const shell = product.facts.composition?.find(part => part.part === 'shell');
  return shell?.fibers.map(fiber => `${fiber.percent}% ${locale === 'tr' ? fibers[fiber.name] ?? fiber.name : fiber.name}`).join(' · ')
    || (locale === 'tr' ? 'Kumaş içeriği bilinmiyor' : 'Fabric composition unknown');
}

export function getItemWarmth(item: ClothingItem): NonNullable<ClothingItem['warmth']> | null {
  const valid = (value: unknown): value is NonNullable<ClothingItem['warmth']> => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
  // A personal estimate can guide this user's ranking without modifying manufacturer facts.
  if (item.dataSource === 'catalog' && valid(item.personalWarmth)) return item.personalWarmth;
  return valid(item.warmth) ? item.warmth : null;
}

export function canRankForWeather(item: ClothingItem, weather: WeatherConsensus): boolean {
  if (!weather) return false;
  if (getItemWarmth(item) === null) return false;
  if (item.dataSource !== 'catalog') return true; // Preserve historical profile behaviour.
  const rain = weather.precipitationProb >= 40 || ['rainy', 'stormy', 'snowy'].includes(weather.condition);
  if (rain && ['outer', 'footwear'].includes(item.category) && item.waterResistance === null) return false;
  if (weather.windSpeed >= 20 && item.category === 'outer' && item.windResistance === null) return false;
  return true;
}

export function catalogProductToWardrobe(product: CatalogProduct, sources: CatalogSource[], id: string): ClothingItem {
  const type = GARMENT_TYPES.find(type => type.id === product.garmentTypeId);
  // One-piece garments need a separate slot rule; never silently turn a dress into a tee.
  if (!type || type.group === 'one_piece') throw new Error('Unsupported wardrobe slot');
  const sourceIds = new Set(product.evidence.map(evidence => evidence.sourceId));
  return {
    id, productId: product.id, garmentTypeId: product.garmentTypeId,
    name: product.name.tr, nameEn: product.name.en, category: type.group,
    segment: null, material: catalogMaterial(product, 'tr'), materialEn: catalogMaterial(product, 'en'),
    warmth: product.facts.warmth,
    waterResistance: product.facts.waterResistance === 'repellent' ? 'light' : product.facts.waterResistance,
    windResistance: product.facts.windResistance,
    colorHex: '#c7cebf', colorName: 'Renk bilinmiyor · temsili çizim', colorType: 'unknown',
    description: 'Kaynaklı katalog ürünü · bilinmeyen teknik bilgiler korunur.',
    brandHint: `${product.brand} / ${product.model}`, brand: product.brand, model: product.model, productUrl: product.productUrl,
    isUserOwned: true, dataSource: 'catalog', materialConfirmed: false, personalWarmth: null,
    catalogFacts: structuredClone(product.facts), catalogEvidence: structuredClone(product.evidence),
    catalogSources: structuredClone(sources.filter(source => sourceIds.has(source.id))),
  };
}
