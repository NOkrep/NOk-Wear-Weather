/**
 * WW-29/2a: applies the ISO 11079 core (lib/thermal-model.ts) to real outfits.
 * At or below 10 °C an outfit is judged as a whole for the planned time outside; above that the
 * cold model gives no verdict and the existing rule-based ranking stays in charge.
 */
import type { ClothingItem, WeatherConsensus } from './types';
import { canRankForWeather, getItemWarmth } from './catalog-wardrobe';
import { itemIdentity } from './comfort';
import { sourceGarmentType } from './garment-appearance';
import { outfitSlot } from './outfit-layers';
import {
  GARMENT_CLO, assessEnsemble, estimateEnsembleParts, insulationForExposure, requiredInsulation, thermalFit,
  type Activity, type EnsemblePart, type OutfitAssessment, type Requirement, type RequirementInput, type ThermalFit,
} from './thermal-model';

/** Used when the stop plan has no time range (user decision, WW-29/2a). */
export const DEFAULT_EXPOSURE_HOURS = 1;

export type ThermalContext = {
  input: RequirementInput; requirement: Requirement; exposureHours: number;
  /** basic insulation that covers `exposureHours` */ neededClo: number;
  /** true only inside ISO 11079 limits */ applies: boolean;
  exposureFromPlan: boolean;
};

/** Coldest planned temperature and strongest planned wind; personal offset shifts the temperature like the existing profile does. */
export function thermalContext(weather: WeatherConsensus, thermalOffsetC = 0, activity: Activity = 'walking'): ThermalContext {
  const selection = weather.selection;
  const windowHours = selection && !selection.point ? (Date.parse(selection.endAt) - Date.parse(selection.startAt)) / 3_600_000 : NaN;
  const exposureFromPlan = Number.isFinite(windowHours) && windowHours > 0;
  const exposureHours = exposureFromPlan ? windowHours : DEFAULT_EXPOSURE_HOURS;
  const input: RequirementInput = {
    airTempC: (selection ? selection.minTemp : weather.temp) + thermalOffsetC,
    relativeHumidity: Number.isFinite(weather.humidity) ? weather.humidity : 70,
    windKmh10m: selection ? selection.maxWind : weather.windSpeed,
    activity,
  };
  const requirement = requiredInsulation(input);
  const applies = requirement.method === 'iso11079';
  return { input, requirement, exposureHours, exposureFromPlan, applies, neededClo: applies ? insulationForExposure(input, exposureHours, requirement) : 0 };
}

/** Type range from the cited table; a known 1–5 warmth only picks a point inside that range (WW-10: source facts unchanged). */
export function itemCloPart(item: ClothingItem): EnsemblePart & { secondary: boolean } {
  const type = sourceGarmentType(item);
  const entry = type ? GARMENT_CLO[type] : undefined;
  if (!type || !entry?.clo) return { key: type ?? `item:${item.id}`, clo: null, reference: [], secondary: false };
  const warmth = getItemWarmth(item);
  const { min, max } = entry.clo;
  const point = warmth === null ? null : min + ((warmth - 1) / 4) * (max - min);
  return { key: type, clo: point === null ? entry.clo : { min: point, max: point }, reference: entry.reference, secondary: entry.match === 'secondary', lowerBound: entry.match === 'secondary' };
}

export type OutfitThermal = OutfitAssessment & { applies: boolean; exposureHours: number; exposureFromPlan: boolean; usesSecondary: boolean };

export function assessItems(items: readonly ClothingItem[], context: ThermalContext): OutfitThermal {
  const parts = items.map(itemCloPart);
  const assessment = assessEnsemble(estimateEnsembleParts(parts), context.input, context.exposureHours, context.requirement, context.neededClo);
  return { ...assessment, applies: context.applies, exposureHours: context.exposureHours, exposureFromPlan: context.exposureFromPlan, usesSecondary: parts.some(part => part.secondary) };
}

/**
 * Verdict first; when warmth is not proven, the smaller shortfall of the fully cited pieces next (secondary
 * lower-bound values must not decide between e.g. a puffer and a trench coat); then closeness to the preferred picks.
 */
const rankOf = (items: readonly ClothingItem[], context: ThermalContext, steps: number) => {
  const parts = items.map(itemCloPart);
  const ensemble = estimateEnsembleParts(parts);
  const fit = thermalFit(ensemble, context.requirement, context.neededClo);
  const shortfall = fit === 'acceptable' || fit === 'excess' ? 0 : Math.max(0, context.neededClo - ensemble.citedMin);
  return RANK[fit] * 1_000_000 + Math.round(shortfall * 1000) * 100 + steps;
};
const RANK: Record<ThermalFit, number> = { acceptable: 0, unknown: 1, excess: 2, insufficient: 3 };
const cloMid = (item: ClothingItem) => { const clo = itemCloPart(item).clo; return clo ? (clo.min + clo.max) / 2 : -1; };

/**
 * Each slot lists options best-first by the existing score. Outside ISO 11079 the first option of each
 * slot wins (unchanged behaviour). Inside it, the best thermal verdict wins; if warmth is not proven, the
 * smallest shortfall; then the fewest steps away from the preferred options. Each slot is limited to its top options plus its warmest option.
 */
export function chooseThermalCombination(fixed: readonly ClothingItem[], slots: readonly (readonly ClothingItem[])[], context: ThermalContext, perSlot = 3): ClothingItem[] {
  const options = slots.filter(slot => slot.length).map(slot => {
    const shortlist = slot.slice(0, perSlot);
    const warmest = slot.reduce((best, item) => cloMid(item) > cloMid(best) ? item : best, slot[0]);
    return shortlist.includes(warmest) ? shortlist : [...shortlist, warmest];
  });
  if (!context.applies) return [...fixed, ...options.map(slot => slot[0])];
  let best: { rank: number; items: ClothingItem[] } | null = null;
  const visit = (index: number, chosen: ClothingItem[], steps: number) => {
    if (index === options.length) {
      const rank = rankOf([...fixed, ...chosen], context, steps);
      if (!best || rank < best.rank) best = { rank, items: chosen };
      return;
    }
    options[index].forEach((item, position) => visit(index + 1, [...chosen, item], steps + position));
  };
  visit(0, [], 0);
  return [...fixed, ...(best as { items: ClothingItem[] } | null)?.items ?? []];
}

/**
 * Keeps each slot of a ready outfit but lets the cold model swap in a warmer eligible piece from the
 * same slot when the outfit would not cover the planned time. Same eligibility and rain rule as
 * `personalizeOutfit`.
 */
export function refineOutfit(items: readonly ClothingItem[], pool: readonly ClothingItem[], weather: WeatherConsensus, context: ThermalContext): ClothingItem[] {
  if (!context.applies) return [...items];
  const rainy = weather.precipitationProb >= 40;
  const slots = items.map(item => {
    const seen = new Set([itemIdentity(item)]);
    const candidates = pool.filter(candidate => {
      const key = itemIdentity(candidate);
      if (seen.has(key) || outfitSlot(candidate) !== outfitSlot(item) || !canRankForWeather(candidate, weather)) return false;
      if (rainy && item.waterResistance === 'waterproof' && candidate.waterResistance !== 'waterproof') return false;
      seen.add(key);
      return true;
    }).sort((a, b) => cloMid(b) - cloMid(a));
    return [item, ...candidates];
  });
  return chooseThermalCombination([], slots, context);
}

const duration = (hours: number, locale: 'tr' | 'en') => {
  const minutes = Math.max(1, Math.round(hours * 60));
  if (minutes < 90) return locale === 'en' ? `${minutes} min` : `${minutes} dk`;
  const value = Math.round(hours * 10) / 10;
  return locale === 'en' ? `${value} h` : `${String(value).replace('.', ',')} saat`;
};

/** One short, honest line for the outfit card. */
export function thermalNote(thermal: OutfitThermal, locale: 'tr' | 'en'): string {
  const en = locale === 'en';
  if (!thermal.applies) return en
    ? 'Warmth check runs at 10 °C and below (ISO 11079); in this weather the suggestion is rule-based.'
    : 'Isıl değerlendirme 10 °C ve altında yapılır (ISO 11079); bu havada öneri kural tabanlı.';
  const span = `${duration(thermal.exposureHours, locale)} ${en ? (thermal.exposureFromPlan ? '(planned time)' : '(default time)') : (thermal.exposureFromPlan ? '(plan süresi)' : '(varsayılan süre)')}`;
  const secondary = thermal.usesSecondary ? (en ? ' Coat/jacket insulation is from a secondary source and not verified.' : ' Mont/kaban yalıtımı ikincil kaynaktan, doğrulanmadı.') : '';
  const lasts = thermal.dleHours.high;
  const main = {
    acceptable: en ? `ISO 11079: warm enough for ${span} outside.` : `ISO 11079'a göre ${span} dışarıda kalmaya yeterli.`,
    insufficient: en
      ? `ISO 11079: not warm enough for ${span}; you would start getting cold after about ${duration(lasts, locale)}. Add a warmer layer.`
      : `ISO 11079'a göre ${span} için yetersiz; yaklaşık ${duration(lasts, locale)} sonra üşümeye başlarsın. Daha sıcak bir katman ekle.`,
    excess: en ? 'ISO 11079: warmer than needed; you may sweat.' : 'ISO 11079\'a göre gerekenden kalın; terleyebilirsin.',
    unknown: en ? 'Some pieces have no known insulation value, so warmth could not be confirmed.' : 'Bazı parçaların yalıtım değeri bilinmediği için ısıl yeterlilik doğrulanamadı.',
  }[thermal.fit];
  if (thermal.fit === 'unknown' && !thermal.ensemble.unknownTypes.length && thermal.ensemble.lowerBoundTypes.length) return en
    ? `Coat/jacket insulation is only known from a secondary, unverified source, so warmth for ${span} could not be confirmed.`
    : `Mont/kaban yalıtımı yalnız ikincil, doğrulanmamış kaynaktan biliniyor; ${span} için yeterlilik doğrulanamadı.`;
  return main + secondary;
}
