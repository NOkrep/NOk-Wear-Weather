import type { ClothingItem } from './types';
import { GARMENT_TYPES, LEGACY_TYPE_MAP, type GarmentTypeId } from './catalog/taxonomy';
import { findGarmentDesign } from './garment-designs';

/** Personal illustration settings, never manufacturer facts or technical performance. */
export interface GarmentAppearance {
  version: 1;
  garmentTypeId?: GarmentTypeId;
  designId?: string;
  neckline?: 'crew' | 'v' | 'collar' | 'polo' | 'turtle' | 'hood';
  sleeve?: 'none' | 'short' | 'three-quarter' | 'long';
  fit?: 'slim' | 'regular' | 'relaxed' | 'oversized';
  length?: 'cropped' | 'regular' | 'long';
  pattern?: 'plain' | 'stripes' | 'checks' | 'dots' | 'colour-block';
  color?: string;
  accentColor?: string;
}
export type AppearanceItem = Pick<ClothingItem, 'name' | 'category' | 'colorHex'> & Partial<Pick<ClothingItem, 'id' | 'catalogId' | 'garmentTypeId' | 'personalAppearance' | 'dataSource' | 'colorType'>>;
export const APPEARANCE_OPTIONS = {
  neckline: { crew: 'Bisiklet yaka', v: 'V yaka', collar: 'Gömlek yaka', polo: 'Polo yaka', turtle: 'Balıkçı yaka', hood: 'Kapüşon' },
  sleeve: { none: 'Kolsuz', short: 'Kısa kol', 'three-quarter': 'Truvakar kol', long: 'Uzun kol' },
  fit: { slim: 'Dar kesim', regular: 'Düz kesim', relaxed: 'Rahat kesim', oversized: 'Bol kesim' },
  length: { cropped: 'Kısa boy', regular: 'Standart boy', long: 'Uzun boy' },
  pattern: { plain: 'Düz renk', stripes: 'Çizgili', checks: 'Ekose', dots: 'Puantiyeli', 'colour-block': 'Renk bloklu' },
} as const;
export const GARMENT_PALETTE = ['#f3efe6', '#24282e', '#6b7380', '#263e60', '#9eb8c4', '#8b9b78', '#d8c1a0', '#8d444b', '#ba744c', '#d5acc3'];
export const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
export function sleeveOptions(type: GarmentTypeId | undefined) {
  const fixed = type === 'short-sleeve-tee' ? 'short' : type === 'long-sleeve-tee' || type === 'thermal-top' ? 'long' : type === 'tank-top' || type === 'gilet' ? 'none' : undefined;
  return Object.fromEntries(Object.entries(APPEARANCE_OPTIONS.sleeve).filter(([key]) => !fixed || key === fixed));
}
const isType = (value: unknown): value is GarmentTypeId => GARMENT_TYPES.some(type => type.id === value);
const savedTypes: Record<string, GarmentTypeId> = {
  'w-base-white-tee': 'short-sleeve-tee', 'w-base-black-long': 'thermal-top',
  'w-mid-oxford-shirt': 'shirt', 'w-mid-grey-hoodie': 'sweatshirt',
  'w-outer-trench': 'coat-parka', 'w-outer-puffer': 'puffer',
  'w-bottom-jeans': 'jeans', 'w-bottom-chino': 'woven-trousers',
  'w-foot-sneaker': 'sneakers', 'w-foot-boot': 'winter-boots', 'cat-bot-3': 'shorts',
};
export function sourceGarmentType(item: AppearanceItem): GarmentTypeId | undefined {
  if (isType(item.garmentTypeId)) return item.garmentTypeId;
  const key = item.catalogId ?? item.id ?? '';
  const value = Object.hasOwn(LEGACY_TYPE_MAP, key) ? LEGACY_TYPE_MAP[key] : Object.hasOwn(savedTypes, key) ? savedTypes[key] : undefined;
  return isType(value) ? value : undefined;
}
export function editableGarmentTypes(item: AppearanceItem) {
  const existing = sourceGarmentType(item);
  return GARMENT_TYPES.filter(type => type.group === item.category || type.id === existing);
}
export function normalizeGarmentAppearance(value: unknown, item: AppearanceItem): GarmentAppearance {
  const result: GarmentAppearance = { version: 1 };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  const input = value as Record<string, unknown>;
  if (input.version !== 1) return result;
  if (editableGarmentTypes(item).some(type => type.id === input.garmentTypeId)) result.garmentTypeId = input.garmentTypeId as GarmentTypeId;
  for (const field of ['neckline', 'sleeve', 'fit', 'length', 'pattern'] as const) {
    if (typeof input[field] === 'string' && Object.hasOwn(APPEARANCE_OPTIONS[field], input[field])) Object.assign(result, { [field]: input[field] });
  }
  if (isHexColor(input.color)) result.color = input.color.toLowerCase();
  if (isHexColor(input.accentColor)) result.accentColor = input.accentColor.toLowerCase();
  const type = result.garmentTypeId ?? sourceGarmentType(item);
  const design = findGarmentDesign(type, input.designId);
  if (design) result.designId = design.id;
  if (result.sleeve && !Object.hasOwn(sleeveOptions(type), result.sleeve)) delete result.sleeve;
  if (!isUpperGarment(type, item.category)) {
    delete result.neckline; delete result.sleeve;
  }
  if (item.category === 'accessory' || item.category === 'footwear') {
    delete result.fit; delete result.length;
  }
  return result;
}
export function isUpperGarment(type: GarmentTypeId | undefined, category: ClothingItem['category']) {
  return type === 'dress' || ['base', 'mid', 'outer'].includes(category);
}
/** Defaults describe our representative drawing, not the real product's cut. */
export function resolveGarmentAppearance(item: AppearanceItem) {
  const saved = normalizeGarmentAppearance(item.personalAppearance, item);
  const type = saved.garmentTypeId ?? sourceGarmentType(item);
  const design = findGarmentDesign(type, saved.designId);
  const personal = { ...design?.appearance, ...saved };
  const key = item.catalogId ?? item.id;
  const hoodie = type === 'rain-jacket' || key === 'cat-mid-3' || key === 'w-mid-grey-hoodie' || key === 'w-outer-puffer' || key === 'anc-grey-hoodie';
  const neckline = hoodie || type === 'rain-poncho' ? 'hood' : type === 'polo-shirt' ? 'polo' : type === 'gilet' ? 'turtle' : type === 'shirt' || type === 'light-jacket' || type === 'coat-parka' ? 'collar' : key === 'cat-mid-7' || key === 'p-1' ? 'turtle' : key === 's-8' || key === 'p-8' ? 'polo' : 'crew';
  return {
    type, design, neckline: personal.neckline ?? neckline,
    sleeve: personal.sleeve ?? (type === 'tank-top' || type === 'dress' || type === 'gilet' ? 'none' : type === 'short-sleeve-tee' || type === 'polo-shirt' ? 'short' : 'long'),
    fit: personal.fit ?? 'regular', length: personal.length ?? 'regular',
    pattern: personal.pattern ?? (key === 'cat-mid-4' ? 'checks' : 'plain'),
    color: personal.color ?? (isHexColor(item.colorHex) ? item.colorHex : '#c7cebf'),
    accentColor: personal.accentColor ?? '#f3efe6',
    personal: Object.keys(personal).length > 1,
    umbrella: key === 'cat-acc-1',
  };
}
