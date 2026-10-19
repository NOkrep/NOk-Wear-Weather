import type { BudgetSegment, ClothingItem, FeedbackRecord, WeatherConsensus } from './types';
import { generateDirectOutfit, matchAnchorItem } from './clothing-engine';
import { itemComfortAdjustment, itemIdentity, personalizeOutfit } from './comfort';
import { canRankForWeather, getItemWarmth } from './catalog-wardrobe';
import { outfitSlot, selectOutfitLayers } from './outfit-layers';

const categoryOrder: ClothingItem['category'][] = ['base', 'mid', 'outer', 'bottom', 'footwear', 'accessory'];

export function toggleAnchorSelection(selected: string[], key: string): string[] {
  return selected.includes(key) ? selected.filter(value => value !== key) : [...selected, key];
}

export function uniqueAnchorChoices(items: ClothingItem[]): ClothingItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = itemIdentity(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function colourCompatibility(colour: string, others: ClothingItem[]): number {
  const hsl = (hex: string) => {
    if (!/^#[a-f\d]{6}$/i.test(hex)) return { hue: 0, saturation: 0 };
    const [r, g, b] = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const lightness = (max + min) / 2;
    if (!delta || lightness < .12 || lightness > .88) return { hue: 0, saturation: 0 };
    const hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return { hue: (hue * 60 + 360) % 360, saturation: delta / (1 - Math.abs(2 * lightness - 1)) };
  };
  const candidate = hsl(colour);
  if (candidate.saturation < .18) return 2;
  return others.reduce((score, item) => {
    const other = hsl(item.colorHex);
    if (other.saturation < .18) return score + 2;
    const difference = Math.abs(candidate.hue - other.hue);
    const angle = Math.min(difference, 360 - difference);
    return score + (angle <= 35 || angle >= 150 ? 2 : -1);
  }, 0) / Math.max(1, others.length);
}

export interface MultiAnchorMatch {
  items: ClothingItem[];
  lockedItems: ClothingItem[];
  alternatives: ClothingItem[];
  suggestedItems: ClothingItem[];
  rainWarning: boolean;
}

/** Last selected piece per slot is worn; independent accessories remain together. */
export function matchSelectedItems(
  selected: ClothingItem[],
  weather: WeatherConsensus,
  options: { segment?: BudgetSegment; country?: string; thermalOffsetC?: number; wardrobe?: ClothingItem[]; feedbacks?: FeedbackRecord[] } = {},
): MultiAnchorMatch {
  const { segment = 'essential', country = 'Türkiye', thermalOffsetC = 0, wardrobe = [], feedbacks = [] } = options;
  const direct = generateDirectOutfit(weather, segment, thermalOffsetC, country);
  const choices = uniqueAnchorChoices(selected);
  const { active: lockedItems, slots: active } = selectOutfitLayers(choices);
  const activeKeys = new Set(lockedItems.map(itemIdentity));
  const alternatives = choices.filter(item => !activeKeys.has(itemIdentity(item)));
  const rainy = weather.precipitationProb >= 40 || ['rainy', 'stormy'].includes(weather.condition);
  if (!lockedItems.length) {
    const suggestions = personalizeOutfit(direct, [...wardrobe, ...generateDirectOutfit(weather, segment, thermalOffsetC - 3, country), ...generateDirectOutfit(weather, segment, thermalOffsetC + 3, country)], weather, feedbacks);
    return { items: suggestions, lockedItems, alternatives, suggestedItems: suggestions, rainWarning: false };
  }

  const complements = lockedItems.flatMap(item => matchAnchorItem(item, weather, thermalOffsetC).complementaryItems);
  const candidates = uniqueAnchorChoices([...direct, ...complements, ...wardrobe]);
  const required = new Set<ClothingItem['category']>([...direct.map(item => item.category), ...lockedItems.map(item => item.category), 'footwear']);
  // A user-selected shirt replaces an optional hot-weather tee; explicitly selected base layers always stay.
  if (active.has('mid') && !active.has('base')) required.delete('base');
  if (active.has('base') && !active.has('mid') && weather.feelsLike + thermalOffsetC >= 23) required.delete('mid');
  const suggestedItems: ClothingItem[] = [];
  for (const category of categoryOrder) {
    if (!required.has(category) || active.has(category)) continue;
    const desired = direct.find(item => item.category === category)?.warmth ?? (weather.feelsLike + thermalOffsetC <= 12 ? 4 : weather.feelsLike + thermalOffsetC >= 23 ? 1 : 2);
    const score = (item: ClothingItem) => {
      const protection = rainy && ['outer', 'footwear'].includes(category) ? item.waterResistance === 'waterproof' ? 18 : item.waterResistance === 'light' ? 4 : -14 : 0;
      const warmth = getItemWarmth(item);
      const colour = item.colorType === 'unknown' ? 0 : colourCompatibility(item.colorHex, lockedItems.filter(other => other.colorType !== 'unknown'));
      return warmth === null ? -Infinity : -7 * Math.abs(warmth - desired) + protection + colour + itemComfortAdjustment(item, weather, feedbacks);
    };
    const eligible = candidates.filter(item => canRankForWeather(item, weather) && item.category === category && !active.has(outfitSlot(item)) && !activeKeys.has(itemIdentity(item)));
    const best = eligible.reduce<ClothingItem | undefined>((winner, item) => !winner || score(item) > score(winner) ? item : winner, undefined);
    if (best) suggestedItems.push(best);
  }
  return {
    items: selectOutfitLayers([...lockedItems, ...suggestedItems]).active,
    lockedItems, alternatives, suggestedItems,
    rainWarning: rainy && lockedItems.some(item => item.category === 'outer' && item.waterResistance !== 'waterproof'),
  };
}
