import { itemComfortAdjustment, readFeedback } from './comfort';
import { ClothingItem, WeatherConsensus, WardrobeOutfitMatch } from './types';
import { canRankForWeather, getItemWarmth } from './catalog-wardrobe';
import { accessoryRelevant, outfitSlot } from './outfit-layers';

const WARDROBE_STORAGE_KEY = 'wear_weather_user_wardrobe_v1';

export const DEFAULT_WARDROBE_ITEMS: ClothingItem[] = [
  {
    id: 'w-base-white-tee',
    name: 'Beyaz Pamuklu Basic Tişört',
    category: 'base',
    segment: 'essential',
    material: '%100 Taranmış Pamuk',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Optik Beyaz',
    colorHex: '#ffffff',
    colorType: 'light',
    description: 'Her mevsim iç katman veya sıcak havada tek başına kullanılan temel parça.',
    isUserOwned: true,
  },
  {
    id: 'w-base-black-long',
    name: 'Siyah Uzun Kollu Termal / Pamuklu İçlik',
    category: 'base',
    segment: 'essential',
    material: 'Pamuk-Elastan Termal Dokuma',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Siyah',
    colorHex: '#18181b',
    colorType: 'dark',
    description: 'Serin ve soğuk günlerde vücut ısısını koruyan alt taban.',
    isUserOwned: true,
  },
  {
    id: 'w-mid-oxford-shirt',
    name: 'Açık Mavi Oxford Gömlek',
    category: 'mid',
    segment: 'essential',
    material: '%100 Pamuk Oxford',
    warmth: 2,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Açık Mavi',
    colorHex: '#93c5fd',
    colorType: 'light',
    description: 'Ilıman havalarda tişört üstüne veya tek başına nefes alan gömlek.',
    isUserOwned: true,
  },
  {
    id: 'w-mid-grey-hoodie',
    name: 'Melanj Gri Kapüşonlu Sweatshirt',
    category: 'mid',
    segment: 'essential',
    material: 'Şardonlu 3 İplik Pamuk',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Melanj Grisi',
    colorHex: '#9ca3af',
    colorType: 'neutral',
    description: 'Serin rüzgarlı havalarda ceket altına veya tek başına konforlu orta katman.',
    isUserOwned: true,
  },
  {
    id: 'w-outer-trench',
    name: 'Bej Su İtici Trençkot / Rüzgarlık',
    category: 'outer',
    segment: 'essential',
    material: 'Sıkı Dokuma Gabardin (Su İtici)',
    warmth: 3,
    waterResistance: 'light',
    windResistance: 'high',
    colorName: 'Klasik Bej',
    colorHex: '#d4b996',
    colorType: 'light',
    description: 'Geçiş mevsimlerinde rüzgarı ve hafif yağışı kesen dış katman.',
    isUserOwned: true,
  },
  {
    id: 'w-outer-puffer',
    name: 'Lacivert Kapüşonlu Şişme Mont',
    category: 'outer',
    segment: 'essential',
    material: 'Su Geçirmez Mikrofiber & Elyaf Dolgu',
    warmth: 5,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Derin Lacivert',
    colorHex: '#1e3a8a',
    colorType: 'dark',
    description: 'Soğuk, fırtınalı ve yağışlı kış günleri için tam koruma.',
    isUserOwned: true,
  },
  {
    id: 'w-bottom-jeans',
    name: 'Koyu Mavi Denim Pantolon (Kot)',
    category: 'bottom',
    segment: 'essential',
    material: '%100 Dayanıklı Denim',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'İndigo',
    colorHex: '#1e293b',
    colorType: 'dark',
    description: 'Günlük şehir kullanımına ve serin havalara uygun kot pantolon.',
    isUserOwned: true,
  },
  {
    id: 'w-bottom-chino',
    name: 'Taş Rengi İnce Chino / Keten Pantolon',
    category: 'bottom',
    segment: 'essential',
    material: 'İnce Pamuk-Keten Karışım',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Taş Beji',
    colorHex: '#e7e5e4',
    colorType: 'light',
    description: 'Sıcak ve güneşli havalarda terletmeyen hafif alt giyim.',
    isUserOwned: true,
  },
  {
    id: 'w-foot-sneaker',
    name: 'Beyaz Günlük Deri/Kanvas Sneaker',
    category: 'footwear',
    segment: 'essential',
    material: 'Nefes Alan Saya & Kauçuk Taban',
    warmth: 2,
    waterResistance: 'light',
    windResistance: 'medium',
    colorName: 'Beyaz',
    colorHex: '#f8fafc',
    colorType: 'light',
    description: 'Kuru ve ılıman günlerde uzun yürüyüşler için ideal.',
    isUserOwned: true,
  },
  {
    id: 'w-foot-boot',
    name: 'Siyah Su Geçirmez Kışlık Deri Bot',
    category: 'footwear',
    segment: 'premium',
    material: 'Su Geçirmez Deri & Kaymaz Taban',
    warmth: 4,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Siyah',
    colorHex: '#09090b',
    colorType: 'dark',
    description: 'Yağmurlu, çamurlu ve soğuk havalarda ayakları kuru tutar.',
    isUserOwned: true,
  },
];

export function getStoredWardrobe(): ClothingItem[] {
  if (typeof window === 'undefined') return DEFAULT_WARDROBE_ITEMS;
  try {
    const raw = localStorage.getItem(WARDROBE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(DEFAULT_WARDROBE_ITEMS));
      return DEFAULT_WARDROBE_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_WARDROBE_ITEMS;
  } catch {
    return DEFAULT_WARDROBE_ITEMS;
  }
}

export function saveWardrobeList(items: ClothingItem[]): ClothingItem[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(items));
  }
  return items;
}

export function addWardrobeItem(item: ClothingItem): ClothingItem[] {
  const current = getStoredWardrobe();
  if (item.productId && current.some(existing => existing.productId === item.productId && existing.variantId === item.variantId)) return current;
  const updated = [{ ...item, isUserOwned: true }, ...current];
  return saveWardrobeList(updated);
}

export function removeWardrobeItem(id: string): ClothingItem[] {
  const current = getStoredWardrobe();
  const updated = current.filter((i) => i.id !== id);
  return saveWardrobeList(updated);
}

export function resetWardrobeToDefaults(): ClothingItem[] {
  return saveWardrobeList(DEFAULT_WARDROBE_ITEMS);
}

// Smart Wardrobe Matching Algorithm (Matches user's own closet to current weather & personal thermal offset)
export function matchFromUserWardrobe(
  wardrobe: ClothingItem[],
  weather: WeatherConsensus,
  thermalOffsetC: number = 0
): WardrobeOutfitMatch {
  const effectiveTemp = weather.feelsLike + thermalOffsetC;
  const isRainy = weather.precipitationProb >= 40 || weather.condition === 'rainy' || weather.condition === 'stormy';
  const isWindy = weather.windSpeed >= 20;
  const isHot = effectiveTemp >= 23;
  const isCold = effectiveTemp <= 11;

  // Determine ideal warmth level (1 to 5)
  let targetWarmth = 2;
  if (effectiveTemp <= 5) targetWarmth = 5;
  else if (effectiveTemp <= 11) targetWarmth = 4;
  else if (effectiveTemp <= 17) targetWarmth = 3;
  else if (effectiveTemp <= 23) targetWarmth = 2;
  else targetWarmth = 1;

  const comfortRecords = readFeedback();
  const scoreItem = (item: ClothingItem): number => {
    const warmth = getItemWarmth(item);
    if (warmth === null) return -Infinity;
    let score = 100 - Math.abs(warmth - targetWarmth) * 22;

    // Color thermal science bonus
    if (isHot && item.colorType === 'light') score += 12;
    if (isHot && item.colorType === 'dark') score -= 10;
    if (isCold && item.colorType === 'dark') score += 10;

    // Rain resistance bonus
    if (isRainy) {
      if (item.waterResistance === 'waterproof') score += 25;
      else if (item.waterResistance === 'light') score += 10;
      else if (item.category === 'outer' || item.category === 'footwear') score -= 18;
    }

    // Wind resistance bonus
    if (isWindy) {
      if (item.windResistance === 'high') score += 15;
      else if (item.windResistance === 'medium') score += 6;
    }

    return score + itemComfortAdjustment(item, weather, comfortRecords);
  };

  const pickBest = (category: ClothingItem['category']): ClothingItem | null => {
    const candidates = wardrobe.filter((i) => i.category === category && canRankForWeather(i, weather));
    if (candidates.length === 0) return null;
    const sorted = [...candidates].sort((a, b) => scoreItem(b) - scoreItem(a));
    return sorted[0];
  };

  const selectedItems: ClothingItem[] = [];
  const missingCategories: string[] = [];

  // 1. Base Layer (Always needed)
  const baseItem = pickBest('base');
  if (baseItem) selectedItems.push(baseItem);
  else missingCategories.push('İç Katman (Tişört / İçlik)');

  // 2. Mid Layer (Needed when effectiveTemp <= 20°C)
  if (effectiveTemp <= 20) {
    const midItem = pickBest('mid');
    if (midItem) selectedItems.push(midItem);
    else missingCategories.push('Orta Katman (Gömlek / Sweatshirt / Triko)');
  }

  // 3. Outer Layer (Needed when effectiveTemp <= 16°C or rainy/windy)
  if (effectiveTemp <= 16 || isRainy || isWindy) {
    const outerItem = pickBest('outer');
    if (outerItem) {
      selectedItems.push(outerItem);
      if (isRainy && (outerItem.waterResistance === 'none' || outerItem.waterResistance === null)) {
        missingCategories.push('Su Geçirmez Yağmurluk / Kabuk Ceket');
      }
    } else {
      missingCategories.push('Dış Katman (Ceket / Trençkot / Mont)');
    }
  }

  // 4. Bottom Layer (Always needed)
  const bottomItem = pickBest('bottom');
  if (bottomItem) selectedItems.push(bottomItem);
  else missingCategories.push('Alt Giyim (Pantolon / Şort)');

  // 5. Footwear (Always needed)
  const footItem = pickBest('footwear');
  if (footItem) selectedItems.push(footItem);
  else missingCategories.push('Ayakkabı / Bot');

  // 6. Optional Accessory if available and relevant
  const accessories = new Map<string, ClothingItem>();
  for (const item of wardrobe.filter(item => item.category === 'accessory' && canRankForWeather(item, weather) && accessoryRelevant(item, weather))) {
    const slot = outfitSlot(item), current = accessories.get(slot);
    if (!current || scoreItem(item) > scoreItem(current)) accessories.set(slot, item);
  }
  selectedItems.push(...accessories.values());

  const coverageScore = Math.max(
    25,
    Math.min(100, Math.round(100 - missingCategories.length * 20))
  );

  let summaryNote = `Dolabınızdaki ${wardrobe.length} parça arasından ${weather.temp}°C (Hissedilen ${weather.feelsLike}°C) ve %${weather.precipitationProb} yağış olasılığına en uygun ${selectedItems.length} parça eşleştirildi.`;
  if (missingCategories.length > 0) {
    summaryNote += ` Tam koruma için dolabınıza ekleyebileceğiniz eksik parça: ${missingCategories.join(', ')}.`;
  }

  return {
    selectedItems,
    missingCategories,
    coverageScore,
    summaryNote,
  };
}
