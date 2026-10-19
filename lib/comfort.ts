import type { ClothingItem, FeedbackRecord, ThermalProfile, WeatherConsensus } from './types';
import { canRankForWeather, getItemWarmth } from './catalog-wardrobe';
import { outfitSlot } from './outfit-layers';

export const FEEDBACK_KEY = 'wear_weather_feedbacks';
export const COMMUNITY_CONSENT_KEY = 'wear_weather_community_consent_v1';

export function itemIdentity(item: ClothingItem): string {
  return item.barcode ? `gtin:${item.barcode.padStart(14, '0')}` : item.productId ? `product:${item.productId}${item.variantId ? `:variant:${item.variantId}` : ''}` : item.catalogId ? `catalog:${item.catalogId}` : `item:${item.id}`;
}

export function readFeedback(): FeedbackRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const data: unknown = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
    return Array.isArray(data) ? data.filter(record => record && typeof record.id === 'string' && typeof record.clothingResult === 'string') : [];
  } catch { return []; }
}

/** Shrink small samples toward zero; item-specific reports affect item ranking separately. */
export function computeThermalProfile(records: FeedbackRecord[]): ThermalProfile {
  const relevant = records.filter(record => !record.context?.itemKey && ['froze', 'sweated', 'color_hot', 'perfect'].includes(record.clothingResult)).slice(0, 30);
  const sum = relevant.reduce((total, record) => total + (record.clothingResult === 'froze' ? -1 : ['sweated', 'color_hot'].includes(record.clothingResult) ? 1 : 0), 0);
  const offsetC = Math.round(Math.max(-3, Math.min(3, 3 * sum / (3 + relevant.length))) * 10) / 10;
  return {
    offsetC, feedbackCount: records.length,
    label: offsetC < 0 ? `Soğuğa hassas (${offsetC}°)` : offsetC > 0 ? `Sıcağa hassas (+${offsetC}°)` : 'Dengeli profil',
  };
}

export function itemComfortAdjustment(item: ClothingItem, weather: WeatherConsensus, records: FeedbackRecord[]): number {
  const key = itemIdentity(item);
  const relevant = records.filter(record => record.context?.worn && record.context.itemKey === key && record.context.liveWeather && Math.abs(record.context.feelsLike - weather.feelsLike) <= 5).slice(0, 20);
  if (!relevant.length) return 0;
  const sum = relevant.reduce((total, record) => total + (record.clothingResult === 'perfect' ? 4 : record.clothingResult === 'wet' ? weather.precipitationProb >= 40 ? -12 : 0 : -8), 0);
  return Math.max(-12, Math.min(8, sum / (2 + relevant.length)));
}

export function personalizeOutfit(items: ClothingItem[], alternatives: ClothingItem[], weather: WeatherConsensus, records: FeedbackRecord[]): ClothingItem[] {
  const target = weather.feelsLike <= 5 ? 5 : weather.feelsLike <= 11 ? 4 : weather.feelsLike <= 17 ? 3 : weather.feelsLike <= 23 ? 2 : 1;
  const score = (item: ClothingItem) => {
    const warmth = getItemWarmth(item);
    return warmth === null ? -Infinity : -3 * Math.abs(warmth - target) + itemComfortAdjustment(item, weather, records);
  };
  return items.map(item => {
    if (itemComfortAdjustment(item, weather, records) >= 0) return item;
    const candidates = alternatives.filter(candidate => canRankForWeather(candidate, weather) && outfitSlot(candidate) === outfitSlot(item) && itemIdentity(candidate) !== itemIdentity(item) && (weather.precipitationProb < 40 || item.waterResistance !== 'waterproof' || candidate.waterResistance === 'waterproof'));
    return candidates.reduce((best, candidate) => score(candidate) > score(best) ? candidate : best, item);
  });
}

/** Explicit allowlist: no location, notes, avatar, timestamps or local wardrobe IDs. */
export function communityPayload(record: FeedbackRecord) {
  const context = record.context;
  if (!context?.worn || !context.liveWeather || !context.itemKey?.startsWith('gtin:')) return null;
  return {
    version: 1, consent: true,
    product: context.itemKey,
    outcome: record.clothingResult,
    temperatureBand: Math.floor(context.feelsLike / 5) * 5,
    windBand: context.windSpeed >= 25 ? 'windy' : 'calm',
    rainBand: context.precipitationProb >= 40 ? 'rain' : 'dry',
    activity: context.activity,
  };
}
