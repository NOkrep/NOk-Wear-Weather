import type { BudgetSegment, ClothingItem, FeedbackRecord, WeatherConsensus } from './types';
import { generateDirectOutfit, matchAnchorItem } from './clothing-engine';
import { itemComfortAdjustment, itemIdentity, personalizeOutfit } from './comfort';
import { canRankForWeather, getItemWarmth } from './catalog-wardrobe';
import { outfitSlot, selectOutfitLayers } from './outfit-layers';
import { chooseThermalCombination, refineOutfit, thermalContext } from './outfit-thermal';

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
  const thermal = thermalContext(weather, thermalOffsetC);
  if (!lockedItems.length) {
    const pool = [...wardrobe, ...generateDirectOutfit(weather, segment, thermalOffsetC - 3, country), ...generateDirectOutfit(weather, segment, thermalOffsetC + 3, country)];
    const suggestions = refineOutfit(personalizeOutfit(direct, pool, weather, feedbacks), pool, weather, thermal);
    return { items: suggestions, lockedItems, alternatives, suggestedItems: suggestions, rainWarning: false };
  }

  const complements = lockedItems.flatMap(item => matchAnchorItem(item, weather, thermalOffsetC).complementaryItems);
  const candidates = uniqueAnchorChoices([...direct, ...complements, ...wardrobe]);
  const required = new Set<ClothingItem['category']>([...direct.map(item => item.category), ...lockedItems.map(item => item.category), 'footwear']);
  // A user-selected shirt replaces an optional hot-weather tee; explicitly selected base layers always stay.
  if (active.has('mid') && !active.has('base')) required.delete('base');
  if (active.has('base') && !active.has('mid') && weather.feelsLike + thermalOffsetC >= 23) required.delete('mid');
  const slots: ClothingItem[][] = [];
  for (const category of categoryOrder) {
    if (!required.has(category) || active.has(category)) continue;
    const desired = direct.find(item => item.category === category)?.warmth ?? (weather.feelsLike + thermalOffsetC <= 12 ? 4 : weather.feelsLike + thermalOffsetC >= 23 ? 1 : 2);
    const score = (item: ClothingItem) => {
      const protection = rainy && ['outer', 'footwear'].includes(category) ? item.waterResistance === 'waterproof' ? 18 : item.waterResistance === 'light' ? 4 : -14 : 0;
      const warmth = getItemWarmth(item);
      // Colour and formality are judged for the whole outfit in chooseThermalCombination (WW-29/3).
      return warmth === null ? -Infinity : -7 * Math.abs(warmth - desired) + protection + itemComfortAdjustment(item, weather, feedbacks);
    };
    const eligible = candidates.filter(item => canRankForWeather(item, weather) && item.category === category && !active.has(outfitSlot(item)) && !activeKeys.has(itemIdentity(item)));
    // Best-first, ties keep candidate order (same winner as the former single pick).
    slots.push(eligible.map((item, index) => ({ item, index, value: score(item) })).sort((a, b) => b.value - a.value || a.index - b.index).map(entry => entry.item));
  }
  // At or below 10 °C the cold model judges the whole outfit; above it the best-scored piece per slot wins as before.
  const suggestedItems = chooseThermalCombination(lockedItems, slots, thermal).slice(lockedItems.length);
  return {
    items: selectOutfitLayers([...lockedItems, ...suggestedItems]).active,
    lockedItems, alternatives, suggestedItems,
    rainWarning: rainy && lockedItems.some(item => item.category === 'outer' && item.waterResistance !== 'waterproof'),
  };
}
