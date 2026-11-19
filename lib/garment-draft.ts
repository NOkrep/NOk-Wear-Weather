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

// The description is normalised to lower-case ASCII words separated by single spaces, padded with a space at both ends.
// Turkish stems match at a word start, so suffixes still count ("yünlü", "kalın") but "since" no longer hides "ince".
// English words (WW-10 B2 follow-up) match whole words only.
const stems = (...list: string[]) => new RegExp(` (${list.join('|')})`);
const words = (...list: string[]) => new RegExp(` (${list.join('|')}) `);
type Rule = [RegExp, RegExp];

const COLOURS: [Rule, string, string][] = [
  [[stems('beyaz', 'krem', 'ekru'), words('white', 'cream', 'ivory', 'ecru', 'off white')], 'Beyaz / ekru', '#f8fafc'],
  [[stems('bej', 'kum rengi', 'tas rengi'), words('beige', 'sand', 'stone')], 'Bej', '#d6d3d1'],
  [[stems('siyah'), words('black')], 'Siyah', '#18181b'],
  [[stems('lacivert'), words('navy')], 'Lacivert', '#1e3a8a'],
  [[stems('mavi'), words('blue')], 'Mavi', '#3b82f6'],
  [[stems('haki', 'yesil'), words('khaki', 'green', 'olive')], 'Haki / yeşil', '#3f6212'],
  [[stems('gri', 'antrasit'), words('grey', 'gray', 'charcoal')], 'Gri', '#6b7280'],
  [[stems('kirmizi', 'bordo'), words('red', 'burgundy')], 'Kırmızı / bordo', '#991b1b'],
  [[stems('kahve', 'taba'), words('brown', 'tan')], 'Kahverengi', '#78350f'],
];
/** The material is named in the language the user wrote it in. */
const MATERIALS: [RegExp, string, RegExp, string][] = [
  [stems('keten'), 'Keten', words('linen'), 'Linen'], [stems('kasmir'), 'Kaşmir', words('cashmere'), 'Cashmere'],
  [stems('merinos'), 'Merinos yünü', words('merino'), 'Merino wool'], [stems('yun'), 'Yün', words('wool', 'woollen', 'woolen'), 'Wool'],
  [stems('polar'), 'Polar', words('fleece'), 'Fleece'], [stems('deri'), 'Deri', words('leather'), 'Leather'], [stems('pamuk'), 'Pamuk', words('cotton'), 'Cotton'],
];
const CATEGORY_RULES: [ClothingItem['category'], Rule][] = [
  ['base', [stems('tisort', 't shirt', 'iclik', 'atlet'), words('tee', 'tank', 'undershirt', 'vest top')]],
  ['outer', [stems('ceket', 'mont', 'kaban', 'trenckot', 'yagmurluk', 'parka'), words('jacket', 'coat', 'anorak', 'raincoat', 'trench')]],
  ['bottom', [stems('pantolon', 'jean', 'sort', 'esofman', 'etek'), words('kot', 'trousers', 'pants', 'shorts', 'skirt', 'joggers')]],
  ['footwear', [stems('ayakkabi', 'sneaker', 'loafer', 'sandalet'), words('bot', 'shoe', 'shoes', 'boot', 'boots', 'trainers', 'sandal', 'sandals')]],
  ['accessory', [stems('sapka', 'atki', 'bere', 'eldiven', 'corap'), words('hat', 'cap', 'scarf', 'beanie', 'gloves', 'mittens', 'socks')]],
];
const WARM: Rule = [stems('kislik', 'kalin', 'yun', 'polar', 'kasmir', 'astarli'), words('winter', 'thick', 'wool', 'woollen', 'woolen', 'fleece', 'cashmere', 'lined', 'insulated', 'padded')];
const LIGHT: Rule = [stems('keten', 'yazlik', 'ince', 'tul'), words('linen', 'summer', 'thin', 'lightweight', 'sheer')];
const WATERPROOF: Rule = [stems('su gecirmez', 'gore tex', 'goretex'), words('waterproof')];
const REPELLENT: Rule = [stems('su itici'), words('water repellent', 'showerproof', 'dwr')];
const WINDPROOF: Rule = [stems('ruzgar gecirmez', 'ruzgarlik'), words('windproof', 'windbreaker')];

/** Local rules: only what the user's own words say; temperature words become a suggestion, not a fact. */
export function rulesDraft(description: string): GarmentDraft {
  const lower = ` ${normalizeCatalogText(description).replace(/[^a-z0-9]+/g, ' ')} `;
  const has = (pattern: RegExp) => pattern.test(lower);
  const either = ([tr, en]: Rule) => has(tr) || has(en);
  const garmentTypeId = matchGarmentType(description);
  const category = groupOf(garmentTypeId) ?? CATEGORY_RULES.find(([, rule]) => either(rule))?.[0] ?? 'mid';
  const colour = COLOURS.find(([rule]) => either(rule));
  const material = MATERIALS.map(([tr, trName, en, enName]) => has(tr) ? trName : has(en) ? enName : null).find(Boolean) ?? null;
  const warm = either(WARM), light = either(LIGHT);
  return {
    name: description.trim().slice(0, 120) || 'Yeni gardırop parçası',
    category, garmentTypeId,
    material,
    colorName: colour?.[1] ?? null,
    colorHex: colour?.[2] ?? null,
    suggestions: {
      warmth: warm && !light ? 4 : light && !warm ? 1 : null,
      waterResistance: either(WATERPROOF) ? 'waterproof' : either(REPELLENT) ? 'light' : null,
      windResistance: either(WINDPROOF) ? 'high' : null,
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
