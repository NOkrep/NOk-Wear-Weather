import type { ClothingItem, WeatherConsensus } from './types';
import { sourceGarmentType } from './garment-appearance';

const order = ['base', 'mid', 'outer', 'bottom', 'footwear', 'accessory:feet', 'accessory:head', 'accessory:neck', 'accessory:hands', 'accessory:equipment', 'accessory:other'];

/** Slots depend on the recorded garment, never on personal illustration overrides. */
export function outfitSlot(item: ClothingItem): string {
  if (item.category !== 'accessory') return item.category;
  const type = sourceGarmentType(item);
  if (type === 'beanie' || type === 'sun-hat') return 'accessory:head';
  if (type === 'scarf') return 'accessory:neck';
  if (type === 'gloves') return 'accessory:hands';
  if (type === 'socks') return 'accessory:feet';
  if ((item.catalogId ?? item.id) === 'cat-acc-1') return 'accessory:equipment';
  return 'accessory:other';
}

/** Last chosen piece per actual slot is worn; unrelated accessory slots coexist. */
export function selectOutfitLayers(items: ClothingItem[]) {
  const slots = new Map<string, ClothingItem>();
  for (const item of items) slots.set(outfitSlot(item), item);
  const active = [...slots.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)).map(([, item]) => item);
  const winners = new Set(active);
  return { active, alternatives: items.filter(item => !winners.has(item)), slots };
}

export function accessoryRelevant(item: ClothingItem, weather: WeatherConsensus): boolean {
  const type = sourceGarmentType(item);
  if (type === 'socks') return true;
  if (type === 'beanie' || type === 'scarf' || type === 'gloves') return weather.feelsLike <= 12;
  if (type === 'sun-hat') return weather.uvIndex >= 5 || weather.feelsLike >= 25;
  return weather.precipitationProb >= 40 || weather.feelsLike <= 11 || weather.uvIndex >= 5;
}
