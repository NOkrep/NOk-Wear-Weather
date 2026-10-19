/** Stable identifiers: labels may change, saved wardrobe references must not. */
export const GARMENT_TYPES = [
  { id: 'short-sleeve-tee', group: 'base', tr: 'Kısa kollu tişört', en: 'Short sleeve T-shirt', slots: ['torso'], aliases: ['tshirt', 't-shirt', 'tişört'] },
  { id: 'long-sleeve-tee', group: 'base', tr: 'Uzun kollu tişört', en: 'Long sleeve T-shirt', slots: ['torso', 'arms'], aliases: ['uzun kol', 'long sleeve'] },
  { id: 'tank-top', group: 'base', tr: 'Atlet', en: 'Tank top', slots: ['torso'], aliases: ['sleeveless', 'kolsuz'] },
  { id: 'shirt', group: 'base', tr: 'Gömlek', en: 'Shirt', slots: ['torso'], aliases: ['button-up', 'gömlek'] },
  { id: 'thermal-top', group: 'base', tr: 'Termal üst', en: 'Thermal top', slots: ['torso', 'arms'], aliases: ['içlik', 'base layer'] },
  { id: 'sweatshirt', group: 'mid', tr: 'Sweatshirt / hoodie', en: 'Sweatshirt / hoodie', slots: ['torso', 'arms'], aliases: ['kapüşonlu', 'hoodie'] },
  { id: 'sweater', group: 'mid', tr: 'Kazak', en: 'Sweater', slots: ['torso', 'arms'], aliases: ['jumper', 'triko'] },
  { id: 'cardigan', group: 'mid', tr: 'Hırka', en: 'Cardigan', slots: ['torso', 'arms'], aliases: [] },
  { id: 'fleece', group: 'mid', tr: 'Polar', en: 'Fleece', slots: ['torso', 'arms'], aliases: ['polar ceket'] },
  { id: 'light-jacket', group: 'outer', tr: 'Hafif ceket', en: 'Light jacket', slots: ['torso', 'arms'], aliases: ['denim jacket', 'kot ceket', 'blazer'] },
  { id: 'windbreaker', group: 'outer', tr: 'Rüzgârlık', en: 'Windbreaker', slots: ['torso', 'arms'], aliases: ['rüzgarlık', 'wind jacket'] },
  { id: 'rain-jacket', group: 'outer', tr: 'Yağmurluk', en: 'Rain jacket', slots: ['torso', 'arms'], aliases: ['hardshell', 'raincoat'] },
  { id: 'softshell', group: 'outer', tr: 'Softshell', en: 'Softshell', slots: ['torso', 'arms'], aliases: ['soft shell'] },
  { id: 'puffer', group: 'outer', tr: 'Şişme mont', en: 'Puffer jacket', slots: ['torso', 'arms'], aliases: ['down jacket', 'dolgulu mont'] },
  { id: 'coat-parka', group: 'outer', tr: 'Kaban / parka', en: 'Coat / parka', slots: ['torso', 'arms', 'upper-legs'], aliases: ['palto', 'overcoat'] },
  { id: 'jeans', group: 'bottom', tr: 'Jean', en: 'Jeans', slots: ['legs'], aliases: ['kot', 'denim pantolon'] },
  { id: 'woven-trousers', group: 'bottom', tr: 'Kumaş pantolon', en: 'Woven trousers', slots: ['legs'], aliases: ['chino', 'keten pantolon', 'pants'] },
  { id: 'joggers', group: 'bottom', tr: 'Eşofman altı', en: 'Joggers', slots: ['legs'], aliases: ['sweatpants', 'eşofman'] },
  { id: 'leggings', group: 'bottom', tr: 'Tayt', en: 'Leggings', slots: ['legs'], aliases: ['tights'] },
  { id: 'shorts', group: 'bottom', tr: 'Şort', en: 'Shorts', slots: ['upper-legs'], aliases: [] },
  { id: 'skirt', group: 'bottom', tr: 'Etek', en: 'Skirt', slots: ['upper-legs'], aliases: [] },
  { id: 'dress', group: 'one_piece', tr: 'Elbise', en: 'Dress', slots: ['torso', 'upper-legs'], aliases: ['tek parça', 'one piece'] },
  { id: 'sneakers', group: 'footwear', tr: 'Günlük spor ayakkabı', en: 'Everyday sneakers', slots: ['feet'], aliases: ['sneaker', 'kanvas', 'trainers'] },
  { id: 'running-shoes', group: 'footwear', tr: 'Koşu ayakkabısı', en: 'Running shoes', slots: ['feet'], aliases: ['running'] },
  { id: 'sandals', group: 'footwear', tr: 'Sandalet', en: 'Sandals', slots: ['feet'], aliases: ['sandal'] },
  { id: 'rain-boots', group: 'footwear', tr: 'Yağmur botu', en: 'Rain boots', slots: ['feet', 'ankles'], aliases: ['wellington', 'rubber boots'] },
  { id: 'winter-boots', group: 'footwear', tr: 'Kışlık bot', en: 'Winter boots', slots: ['feet', 'ankles'], aliases: ['snow boots', 'kar botu'] },
  { id: 'socks', group: 'accessory', tr: 'Çorap', en: 'Socks', slots: ['feet'], aliases: ['sock'] },
  { id: 'beanie', group: 'accessory', tr: 'Bere', en: 'Beanie', slots: ['head'], aliases: ['winter hat'] },
  { id: 'sun-hat', group: 'accessory', tr: 'Şapka', en: 'Sun hat', slots: ['head'], aliases: ['cap', 'hat'] },
  { id: 'scarf', group: 'accessory', tr: 'Atkı', en: 'Scarf', slots: ['neck'], aliases: ['boyunluk', 'snood'] },
  { id: 'gloves', group: 'accessory', tr: 'Eldiven', en: 'Gloves', slots: ['hands'], aliases: ['mittens'] },
  { id: 'polo-shirt', group: 'base', tr: 'Polo', en: 'Polo shirt', slots: ['torso', 'arms'], aliases: ['polo shirt', 'polo yaka'] },
  { id: 'blouse', group: 'base', tr: 'Bluz', en: 'Blouse', slots: ['torso', 'arms'], aliases: ['blouse', 'bluz'] },
  { id: 'gilet', group: 'outer', tr: 'Yelek', en: 'Gilet / vest', slots: ['torso'], aliases: ['vest', 'waistcoat', 'kolsuz mont'] },
  { id: 'rain-poncho', group: 'outer', tr: 'Yağmurluk pançosu', en: 'Rain poncho', slots: ['torso', 'arms', 'upper-legs'], aliases: ['poncho', 'panço'] },
] as const;

export type GarmentTypeId = (typeof GARMENT_TYPES)[number]['id'];
export type CatalogGroup = (typeof GARMENT_TYPES)[number]['group'];
export const PILOT_TARGET = { minimum: 100, maximum: 100 } as const;

export function normalizeCatalogText(value: string): string {
  return value.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').trim();
}

export function findGarmentTypes(query = '') {
  const q = normalizeCatalogText(query);
  return GARMENT_TYPES.filter(type => normalizeCatalogText([type.id, type.tr, type.en, ...type.aliases].join(' ')).includes(q));
}

/** Ambiguous legacy profiles remain unmapped; umbrella is equipment, outside the garment taxonomy. */
export const LEGACY_TYPE_MAP: Readonly<Record<string, GarmentTypeId>> = {
  'cat-base-1': 'short-sleeve-tee', 'cat-base-2': 'short-sleeve-tee',
  'cat-base-3': 'thermal-top', 'cat-base-4': 'thermal-top',
  'cat-mid-1': 'shirt', 'cat-mid-2': 'shirt', 'cat-mid-3': 'sweatshirt',
  'cat-mid-4': 'shirt', 'cat-mid-5': 'fleece', 'cat-mid-6': 'sweater', 'cat-mid-7': 'sweater',
  'cat-outer-1': 'light-jacket', 'cat-outer-2': 'coat-parka', 'cat-outer-3': 'rain-jacket',
  'cat-outer-4': 'light-jacket', 'cat-outer-5': 'puffer', 'cat-outer-6': 'rain-jacket',
  'cat-bot-1': 'jeans', 'cat-bot-2': 'woven-trousers',
  'cat-foot-1': 'sneakers', 'cat-foot-2': 'winter-boots',
};
