/**
 * WW-10 B2: garment drafts from Gemini or local rules never invent facts. Unknown stays `null`;
 * guesses travel separately as `suggestions` and only reach the wardrobe after the user confirms them.
 */
import type { ClothingItem } from './types';
import { GARMENT_TYPES, normalizeCatalogText, type GarmentTypeId } from './catalog/taxonomy';

export type Warmth = NonNullable<ClothingItem['warmth']>;
export type DraftSuggestions = {
  warmth: Warmth | null;
  waterResistance: NonNullable<ClothingItem['waterResistance']> | null;
  windResistance: NonNullable<ClothingItem['windResistance']> | null;
};
export type GarmentDraft = {
  name: string;
  category: ClothingItem['category'];
  garmentTypeId: GarmentTypeId | null;
  material: string | null;
  colorName: string | null;
  colorHex: string | null;
  suggestions: DraftSuggestions;
  source: 'gemini' | 'rules';
};

const CATEGORIES: ClothingItem['category'][] = ['base', 'mid', 'outer', 'bottom', 'footwear', 'accessory'];
/** Wardrobe slots exist for these groups only; one-piece garments have no slot rule yet. */
const WARDROBE_TYPES = GARMENT_TYPES.filter(type => type.group !== 'one_piece');
export const DRAFT_TYPE_IDS = WARDROBE_TYPES.map(type => type.id);

const isWarmth = (value: unknown): value is Warmth => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | null => (allowed as readonly unknown[]).includes(value) ? value as T : null;
const text = (value: unknown, max = 120): string | null => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
const hex = (value: unknown): string | null => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;

/** Whole-word match of a type's Turkish/English names and aliases; the longest term wins. */
export function matchGarmentType(description: string): GarmentTypeId | null {
  const haystack = ` ${normalizeCatalogText(description).replace(/[^a-z0-9]+/g, ' ')} `;
  let best: { id: GarmentTypeId; length: number } | null = null;
  for (const type of WARDROBE_TYPES) {
    const terms = [...type.tr.split('/'), ...type.en.split('/'), ...type.aliases].map(term => normalizeCatalogText(term).replace(/[^a-z0-9]+/g, ' ').trim()).filter(Boolean);
    for (const term of terms) if (haystack.includes(` ${term} `) && (!best || term.length > best.length)) best = { id: type.id, length: term.length };
  }
  return best?.id ?? null;
}

const groupOf = (id: GarmentTypeId | null) => id ? WARDROBE_TYPES.find(type => type.id === id)?.group as ClothingItem['category'] | undefined : undefined;

/** Gemini output → draft. Anything missing or outside the allowed values becomes `null`, never a default. */
export function sanitizeAiDraft(value: unknown, fallbackName: string): GarmentDraft {
  const parsed = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const garmentTypeId = oneOf(parsed.garmentTypeId, DRAFT_TYPE_IDS);
  const category = groupOf(garmentTypeId) ?? oneOf(parsed.category, CATEGORIES) ?? 'mid';
  const colorHex = hex(parsed.colorHex);
  return {
    name: text(parsed.name) ?? (fallbackName.trim().slice(0, 120) || 'Yeni gardırop parçası'),
    category, garmentTypeId,
    material: text(parsed.material),
    colorName: colorHex ? text(parsed.colorName, 60) : null,
    colorHex,
    suggestions: {
      warmth: isWarmth(parsed.warmth) ? parsed.warmth : null,
      waterResistance: oneOf(parsed.waterResistance, ['none', 'light', 'waterproof'] as const),
      windResistance: oneOf(parsed.windResistance, ['low', 'medium', 'high'] as const),
    },
    source: 'gemini',
  };
}

const COLOURS: [RegExp, string, string][] = [
  [/beyaz|krem|ekru/, 'Beyaz / ekru', '#f8fafc'], [/bej|kum rengi|tas rengi/, 'Bej', '#d6d3d1'], [/siyah/, 'Siyah', '#18181b'],
  [/lacivert/, 'Lacivert', '#1e3a8a'], [/mavi/, 'Mavi', '#3b82f6'], [/haki|yesil/, 'Haki / yeşil', '#3f6212'],
  [/gri|antrasit/, 'Gri', '#6b7280'], [/kirmizi|bordo/, 'Kırmızı / bordo', '#991b1b'], [/kahve|taba/, 'Kahverengi', '#78350f'],
];
const MATERIALS: [RegExp, string][] = [[/keten/, 'Keten'], [/kasmir/, 'Kaşmir'], [/merinos/, 'Merinos yünü'], [/yun/, 'Yün'], [/polar/, 'Polar'], [/deri/, 'Deri'], [/pamuk/, 'Pamuk']];

/** Local rules: only what the user's own words say; temperature words become a suggestion, not a fact. */
export function rulesDraft(description: string): GarmentDraft {
  const lower = ` ${normalizeCatalogText(description).replace(/[^a-z0-9]+/g, ' ')} `;
  const has = (pattern: RegExp) => pattern.test(lower);
  const garmentTypeId = matchGarmentType(description);
  let category = groupOf(garmentTypeId);
  if (!category) {
    category = has(/tisort|t shirt|iclik|atlet/) ? 'base' : has(/ceket|mont|kaban|trenckot|yagmurluk|parka/) ? 'outer'
      : has(/pantolon| kot |jean|sort|esofman|etek/) ? 'bottom' : has(/ayakkabi| bot |sneaker|loafer|sandalet/) ? 'footwear'
      : has(/sapka|atki|bere|eldiven|corap/) ? 'accessory' : 'mid';
  }
  const colour = COLOURS.find(([pattern]) => has(pattern));
  const material = MATERIALS.find(([pattern]) => has(pattern));
  const warm = has(/kislik|kalin|yun|polar|kasmir|astarli/), light = has(/keten|yazlik|ince|tul/);
  return {
    name: description.trim().slice(0, 120) || 'Yeni gardırop parçası',
    category, garmentTypeId,
    material: material?.[1] ?? null,
    colorName: colour?.[1] ?? null,
    colorHex: colour?.[2] ?? null,
    suggestions: {
      warmth: warm && !light ? 4 : light && !warm ? 1 : null,
      waterResistance: has(/su gecirmez|gore tex|goretex/) ? 'waterproof' : has(/su itici/) ? 'light' : null,
      windResistance: has(/ruzgar gecirmez|ruzgarlik/) ? 'high' : null,
    },
    source: 'rules',
  };
}

export type DraftChoices = {
  name: string; category: ClothingItem['category']; garmentTypeId: GarmentTypeId | null; material: string;
  colorHex: string | null; warmth: Warmth | null;
  waterResistance: ClothingItem['waterResistance']; windResistance: ClothingItem['windResistance'];
};

/** Only what the user confirmed is stored; everything else stays unknown. */
export function draftToWardrobeItem(choices: DraftChoices, id: string): ClothingItem {
  const material = choices.material.trim();
  return {
    id, name: choices.name.trim() || 'Yeni gardırop parçası', category: choices.category,
    ...(choices.garmentTypeId ? { garmentTypeId: choices.garmentTypeId } : {}),
    segment: 'essential', material: material || 'Kumaş içeriği bilinmiyor', materialConfirmed: Boolean(material),
    warmth: choices.warmth, waterResistance: choices.waterResistance, windResistance: choices.windResistance,
    colorHex: choices.colorHex ?? '#c7cebf', colorName: choices.colorHex ? 'Seçtiğim renk' : 'Renk bilinmiyor',
    colorType: choices.colorHex ? 'neutral' : 'unknown',
    description: 'Kullanıcının onayladığı taslak. Onaylanmayan değerler bilinmiyor olarak kaldı.',
    dataSource: 'user', isUserOwned: true,
  };
}
