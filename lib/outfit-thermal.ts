/**
 * WW-29/2a–2b: judges real outfits as a whole.
 * - Cold part (coldest planned hour at or below 10 °C, within ISO 11079): IREQ/DLE for the planned time.
 * - Warm part (hours above 10 °C): Gagge two-node thermal sensation (ASHRAE 55 SET*) with sun from
 *   ASHRAE 55 SolarCal. Comfortable within ±1 (user decision), preferring closest to 0.
 * Either failing makes the outfit fail. Unknown or secondary garment values never decide a verdict.
 */
import type { ClothingItem, HourlyForecastPoint, WeatherConsensus } from './types';
import { canRankForWeather, getItemWarmth } from './catalog-wardrobe';
import { itemIdentity } from './comfort';
import { solarGain, twoNodeGagge } from './comfort-model';
import { sourceGarmentType } from './garment-appearance';
import { outfitSlot } from './outfit-layers';
import {
  ACTIVITY_PROFILE, GARMENT_CLO, WIND_10M_TO_BODY, durationLimitedExposure, estimateEnsembleParts, insulationForExposure, requiredInsulation, thermalFit,
  type Activity, type EnsembleEstimate, type EnsemblePart, type Requirement, type RequirementInput, type ThermalFit,
} from './thermal-model';
import { solarElevation } from './weather-time';

/** Used when the stop plan has no time range (user decision, WW-29/2a). */
export const DEFAULT_EXPOSURE_HOURS = 1;
/** Thermal sensation band accepted outdoors (user decision, WW-29/2b); ±0.5 is the indoor comfort band. */
export const SENSATION_LIMIT = 1;
/**
 * SolarCal assumptions for a pedestrian in a city (WW-29/2b): half the sky visible, half the body in direct
 * sun, sun beside the person (90°), ASHRAE default absorptivity 0.7, ground reflectance 0.2 for street surfaces.
 */
export const SOLAR_ASSUMPTIONS = { sharp: 90, transmittance: 1, fSvv: 0.5, fBes: 0.5, asw: 0.7, floorReflectance: 0.2 } as const;

export type WarmCondition = { tdb: number; tr: number; v: number; rh: number; deltaMrt: number };
export type ThermalContext = {
  exposureHours: number; exposureFromPlan: boolean; met: number;
  cold: { input: RequirementInput; requirement: Requirement; neededClo: number } | null;
  warm: { conditions: WarmCondition[]; sun: boolean } | null;
  /** at least one model gives verdicts */ applies: boolean;
  /** memoised thermal sensation per condition and clo (search speed) */ sensation: (index: number, clo: number) => number;
};

function solarDeltaMrt(weather: WeatherConsensus, at: number, dni: number | undefined): number {
  if (!dni || dni <= 0 || typeof weather.lat !== 'number' || typeof weather.lon !== 'number' || !Number.isFinite(at)) return 0;
  const altitude = solarElevation(at, weather.lat, weather.lon);
  if (!(altitude > 0)) return 0;
  const { deltaMrt } = solarGain({ altitude: Math.min(90, altitude), directRadiation: dni, ...SOLAR_ASSUMPTIONS });
  return Number.isFinite(deltaMrt) ? deltaMrt : 0;
}

/**
 * Coldest planned hour and strongest wind for the cold part; every planned hour above 10 °C for the warm part.
 * Personal offset shifts air temperature like the existing profile does.
 */
export function thermalContext(weather: WeatherConsensus, thermalOffsetC = 0, activity: Activity = 'walking', now = Date.now()): ThermalContext {
  const selection = weather.selection;
  const windowHours = selection && !selection.point ? (Date.parse(selection.endAt) - Date.parse(selection.startAt)) / 3_600_000 : NaN;
  const exposureFromPlan = Number.isFinite(windowHours) && windowHours > 0;
  const exposureHours = exposureFromPlan ? windowHours : DEFAULT_EXPOSURE_HOURS;
  const humidity = Number.isFinite(weather.humidity) ? weather.humidity : 70;
  const met = ACTIVITY_PROFILE[activity].met;

  const input: RequirementInput = {
    airTempC: (selection ? selection.minTemp : weather.temp) + thermalOffsetC,
    relativeHumidity: humidity, windKmh10m: selection ? selection.maxWind : weather.windSpeed, activity,
  };
  const requirement = requiredInsulation(input);
  const cold = requirement.method === 'iso11079' ? { input, requirement, neededClo: insulationForExposure(input, exposureHours, requirement) } : null;

  // Open-Meteo radiation is the mean of the preceding hour (current: preceding 15 min); the sun is placed mid-period.
  const points: { tdb: number; wind: number; rh: number; dni?: number; at: number }[] = selection
    ? (weather.hourly as (HourlyForecastPoint & { humidity?: number })[]).map(point => ({
      tdb: point.temp, wind: point.windSpeed, rh: Number.isFinite(point.humidity) ? point.humidity! : humidity,
      dni: point.directNormalIrradiance, at: Date.parse(point.validAt ?? '') - 1_800_000 }))
    : [{ tdb: weather.temp, wind: weather.windSpeed, rh: humidity, dni: weather.directNormalIrradiance, at: (Date.parse(weather.observedAt ?? '') || now) - 450_000 }];
  const conditions = points.map(point => ({ ...point, tdb: point.tdb + thermalOffsetC })).filter(point => point.tdb > 10).map(point => {
    const deltaMrt = solarDeltaMrt(weather, point.at, point.dni);
    return { tdb: point.tdb, tr: point.tdb + deltaMrt, v: Math.max(0.1, (point.wind / 3.6) * WIND_10M_TO_BODY), rh: point.rh, deltaMrt };
  });
  const warm = conditions.length ? { conditions, sun: conditions.some(condition => condition.deltaMrt >= 0.5) } : null;

  const memo = new Map<string, number>();
  const sensation = (index: number, clo: number) => {
    const key = `${index}:${clo.toFixed(2)}`;
    let value = memo.get(key);
    if (value === undefined) {
      const condition = warm!.conditions[index];
      value = twoNodeGagge({ tdb: condition.tdb, tr: condition.tr, v: condition.v, rh: condition.rh, met, clo: Number(clo.toFixed(2)) }).tSens;
      memo.set(key, value);
    }
    return value;
  };
  return { exposureHours, exposureFromPlan, met, cold, warm, applies: Boolean(cold || warm), sensation };
}

/** Type range from the cited table; a known 1–5 warmth only picks a point inside that range (WW-10: source facts unchanged). */
export function itemCloPart(item: ClothingItem): EnsemblePart & { secondary: boolean } {
  const type = sourceGarmentType(item);
  const entry = type ? GARMENT_CLO[type] : undefined;
  if (!type || !entry?.clo) return { key: type ?? `item:${item.id}`, clo: null, reference: [], secondary: false };
  // An open-ended measured floor stays a floor: a 1–5 warmth cannot place a garment inside an unknown range.
  if (entry.openUpper) return { key: type, clo: entry.clo, reference: entry.reference, secondary: false, openUpper: true };
  const warmth = getItemWarmth(item);
  const { min, max } = entry.clo;
  const point = warmth === null ? null : min + ((warmth - 1) / 4) * (max - min);
  return { key: type, clo: point === null ? entry.clo : { min: point, max: point }, reference: entry.reference, secondary: entry.match === 'secondary', lowerBound: entry.match === 'secondary' };
}

type WarmVerdict = { fit: ThermalFit; hottest: number; coldest: number; deviation: number };

/** Lower estimate: cited garments only. Upper estimate only when every garment has a cited value. */
function warmVerdict(ensemble: EnsembleEstimate, context: ThermalContext): WarmVerdict {
  const conditions = context.warm!.conditions;
  const upper = ensemble.unknownTypes.length || ensemble.lowerBoundTypes.length || ensemble.openUpperTypes.length ? null : ensemble.icl.max;
  const across = (clo: number) => conditions.map((_, index) => context.sensation(index, clo));
  const low = across(ensemble.citedMin), high = upper === null ? null : across(upper);
  const hottest = Math.max(...(high ?? low)), coldest = Math.min(...low);
  const fit: ThermalFit = Math.max(...low) > SENSATION_LIMIT ? 'excess'
    : high && Math.min(...high) < -SENSATION_LIMIT ? 'insufficient'
    : high && hottest <= SENSATION_LIMIT && coldest >= -SENSATION_LIMIT ? 'acceptable'
    : 'unknown';
  return { fit, hottest, coldest, deviation: Math.max(0, Math.abs(hottest) - 0.5, Math.abs(coldest) - 0.5) };
}

const combine = (fits: ThermalFit[]): ThermalFit =>
  fits.includes('insufficient') ? 'insufficient' : fits.includes('excess') ? 'excess' : fits.every(fit => fit === 'acceptable') ? 'acceptable' : 'unknown';

export type OutfitThermal = {
  fit: ThermalFit; ensemble: EnsembleEstimate; applies: boolean;
  exposureHours: number; exposureFromPlan: boolean; usesSecondary: boolean;
  cold: { fit: ThermalFit; requirement: Requirement; dleHours: { low: number; high: number } } | null;
  warm: (WarmVerdict & { sun: boolean }) | null;
};

export function assessItems(items: readonly ClothingItem[], context: ThermalContext): OutfitThermal {
  const parts = items.map(itemCloPart);
  const ensemble = estimateEnsembleParts(parts);
  const cold = context.cold ? {
    fit: thermalFit(ensemble, context.cold.requirement, context.cold.neededClo), requirement: context.cold.requirement,
    dleHours: { low: durationLimitedExposure(context.cold.input, ensemble.icl.min).min, high: durationLimitedExposure(context.cold.input, ensemble.icl.max).min },
  } : null;
  const warm = context.warm ? { ...warmVerdict(ensemble, context), sun: context.warm.sun } : null;
  const fits = [cold?.fit, warm?.fit].filter((fit): fit is ThermalFit => Boolean(fit));
  return { fit: fits.length ? combine(fits) : 'unknown', ensemble, applies: context.applies, exposureHours: context.exposureHours,
    exposureFromPlan: context.exposureFromPlan, usesSecondary: parts.some(part => part.secondary), cold, warm };
}

/**
 * Verdict first; when not proven, the smaller cold shortfall of the cited pieces plus the warm deviation from
 * the ±0.5 comfort band (secondary lower-bound values must not decide between e.g. a puffer and a trench coat);
 * then closeness to the preferred picks.
 */
const RANK: Record<ThermalFit, number> = { acceptable: 0, unknown: 1, excess: 2, insufficient: 3 };
const rankOf = (items: readonly ClothingItem[], context: ThermalContext, steps: number) => {
  const ensemble = estimateEnsembleParts(items.map(itemCloPart));
  const fits: ThermalFit[] = [];
  let gap = 0;
  if (context.cold) {
    const fit = thermalFit(ensemble, context.cold.requirement, context.cold.neededClo);
    fits.push(fit);
    if (fit !== 'acceptable' && fit !== 'excess') {
      // Not proven: an outfit whose outer layer may be much warmer (open or secondary value) ranks before a fully
      // cited one that falls short; within each group the warmer cited layers win.
      const open = ensemble.openUpperTypes.length || ensemble.lowerBoundTypes.length;
      gap += (open ? 0 : 100) + Math.max(0, context.cold.neededClo - ensemble.closedMin);
    }
  }
  if (context.warm) {
    const verdict = warmVerdict(ensemble, context);
    fits.push(verdict.fit);
    gap += verdict.deviation / 4; // sensation units → roughly clo-sized steps
  }
  // Verdict class always dominates the gap (gap ≤ ~110 → ≤ 1.1e7) and the gap dominates steps.
  return RANK[combine(fits)] * 1_000_000_000 + Math.round(gap * 1000) * 100 + steps;
};
const cloMid = (item: ClothingItem) => { const clo = itemCloPart(item).clo; return clo ? (clo.min + clo.max) / 2 : -1; };

/**
 * Each slot lists options best-first by the existing score. Without an applicable model the first option of
 * each slot wins (unchanged behaviour). Otherwise the best verdict wins, then the smallest gap, then the fewest
 * steps away from the preferred options. Each slot is limited to its top options plus its warmest and lightest.
 */
export function chooseThermalCombination(fixed: readonly ClothingItem[], slots: readonly (readonly ClothingItem[])[], context: ThermalContext, perSlot = 3): ClothingItem[] {
  const options = slots.filter(slot => slot.length).map(slot => {
    const shortlist = slot.slice(0, perSlot);
    const warmest = slot.reduce((best, item) => cloMid(item) > cloMid(best) ? item : best, slot[0]);
    const lightest = slot.reduce((best, item) => cloMid(item) >= 0 && (cloMid(best) < 0 || cloMid(item) < cloMid(best)) ? item : best, slot[0]);
    return [...new Set([...shortlist, warmest, lightest])];
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
 * Keeps each slot of a ready outfit but lets the models swap in another eligible piece from the same slot
 * (warmer or lighter) when that improves the verdict. Same eligibility and rain rule as `personalizeOutfit`.
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
  if (!thermal.applies) return en ? 'No comfort model applies to this weather; the suggestion is rule-based.' : 'Bu hava için konfor modeli uygulanamadı; öneri kural tabanlı.';
  const span = `${duration(thermal.exposureHours, locale)} ${en ? (thermal.exposureFromPlan ? '(planned time)' : '(default time)') : (thermal.exposureFromPlan ? '(plan süresi)' : '(varsayılan süre)')}`;
  const secondary = thermal.usesSecondary ? (en ? ' Coat/jacket insulation is from a secondary source and not verified.' : ' Mont/kaban yalıtımı ikincil kaynaktan, doğrulanmadı.') : '';
  const sun = thermal.warm?.sun ? (en ? ' (sun included)' : ' (güneş dahil)') : '';
  const { cold, warm } = thermal;

  if (thermal.fit === 'unknown') {
    if (!thermal.ensemble.unknownTypes.length && thermal.ensemble.lowerBoundTypes.length) return en
      ? `Coat/jacket insulation is only known from a secondary, unverified source, so comfort for ${span} could not be confirmed.`
      : `Mont/kaban yalıtımı yalnız ikincil, doğrulanmamış kaynaktan biliniyor; ${span} için uygunluk doğrulanamadı.`;
    if (!thermal.ensemble.unknownTypes.length && thermal.ensemble.openUpperTypes.length) return en
      ? `Only a measured lower value is known for the puffer (CBE 2013); it is not enough to confirm comfort for ${span}, though a warmer puffer may be.`
      : `Şişme mont için yalnız ölçülmüş bir alt değer biliniyor (CBE 2013); bu değer ${span} için yetmiyor, daha sıcak bir mont yetebilir.`;
    return en ? 'Some pieces have no known insulation value, so comfort could not be confirmed.' : 'Bazı parçaların yalıtım değeri bilinmediği için uygunluk doğrulanamadı.';
  }
  if (thermal.fit === 'insufficient') {
    if (cold?.fit === 'insufficient') return (en
      ? `ISO 11079: not warm enough for ${span}; you would start getting cold after about ${duration(cold.dleHours.high, locale)}. Add a warmer layer.`
      : `ISO 11079'a göre ${span} için yetersiz; yaklaşık ${duration(cold.dleHours.high, locale)} sonra üşümeye başlarsın. Daha sıcak bir katman ekle.`) + secondary;
    return (en ? `SET* model: this outfit will feel cool${sun}; add a layer.` : `SET* modeline göre bu kombin serin gelir${sun}; bir katman ekle.`) + secondary;
  }
  if (thermal.fit === 'excess') {
    if (warm?.fit === 'excess') return (en ? `SET* model: this outfit will feel warm${sun}; choose a lighter piece.` : `SET* modeline göre bu kombin sıcak gelir${sun}; daha hafif bir parça seç.`) + secondary;
    return (en ? 'ISO 11079: warmer than needed; you may sweat.' : 'ISO 11079\'a göre gerekenden kalın; terleyebilirsin.') + secondary;
  }
  const basis = cold && warm ? (en ? 'ISO 11079 and SET*' : 'ISO 11079 ve SET* modellerine') : cold ? (en ? 'ISO 11079' : 'ISO 11079\'a') : (en ? 'SET* model' : 'SET* modeline');
  return (cold && !warm
    ? (en ? `ISO 11079: warm enough for ${span} outside.` : `ISO 11079'a göre ${span} dışarıda kalmaya yeterli.`)
    : (en ? `${basis}: comfortable for ${span}${sun}.` : `${basis} göre ${span} boyunca rahat${sun}.`)) + secondary;
}
