/**
 * WW-29/1 thermal clothing core. Pure functions; not yet wired into outfit ranking.
 *
 * - Garment and ensemble insulation: ISO 9920:2009 (summation, area factor, boundary air
 *   layer) with the wind/walking correction of ISO 9920:2007 as given in ISO 7730 Annex C.
 * - Required clothing insulation: ISO 11079:2007 Annex A (IREQ, ICL, DLE).
 *
 * The formulas are ported from pythermalcomfort (MIT License, Copyright (c) 2019
 * Federico Tartarini), https://github.com/pythermalcomfort/pythermalcomfort,
 * modules `clothing/*` and `models/ireq.py`. Licence text: THIRD_PARTY_NOTICES.md.
 * Garment clo values come from the ASHRAE 55 garment table as published in
 * pythermalcomfort `utilities.clo_individual_garments`. Unknown stays `null` (WW-10).
 */
import type { GarmentTypeId } from './catalog/taxonomy';

export const MET_TO_W_M2 = 58.15;
export const CLO_TO_M2K_W = 0.155;
/** ISO 9920 static boundary air layer, clo. */
export const STATIC_AIR_LAYER_CLO = 0.7;
/** ASHRAE 55 "Men's underwear"; ensembles in the standard tables include underwear. Assumption, not measured per user. */
export const UNDERWEAR_CLO = 0.04;

export type Activity = 'resting' | 'walking' | 'active';
export type CloRange = { min: number; max: number };
export type GarmentCloEntry = {
  /** Static intrinsic garment insulation range, clo; `null` when no cited value exists. */
  clo: CloRange | null;
  /** ASHRAE 55 table rows used (exact names from the source table). */
  reference: string[];
  /**
   * `exact`: same garment; `nearest`: closest listed garment, wording kept visible;
   * `secondary`: value from a secondary copy of a table whose primary source was not checked (shown as unverified).
   */
  match: 'exact' | 'nearest' | 'secondary' | 'derived' | 'none';
  /** `derived`: measured lower value only; warmer garments of the same type exist, so the upper end is open */
  openUpper?: boolean;
};

const entry = (min: number, max: number, match: 'exact' | 'nearest' | 'secondary', ...reference: string[]): GarmentCloEntry => ({ clo: { min, max }, reference, match });
const none: GarmentCloEntry = { clo: null, reference: [], match: 'none' };

/** Down jacket, coat and parka values as reproduced by Engineering ToolBox from ASHRAE garment tables; primary source not checked. */
/** Lee, Zhang & Arens 2013 (CBE, UC Berkeley): measured ensembles; garment values derived by difference. */
export const CBE_2013_SOURCE = 'https://escholarship.org/uc/item/18f0r375';
export const SECONDARY_OUTERWEAR_SOURCE = 'https://www.engineeringtoolbox.com/clo-clothing-thermal-insulation-d_732.html';

/**
 * Indoor ASHRAE 55 values. Shells, softshells, hats, scarves and gloves are not in that table and stay
 * `null`. Puffer and coat/parka use secondary values (user decision, WW-29/2a). They are shown as
 * unverified and never decide a verdict: the coat/parka type also holds light trench coats, and the
 * puffer value is low for high-loft garments.
 */
export const GARMENT_CLO: Readonly<Record<GarmentTypeId, GarmentCloEntry>> = {
  'short-sleeve-tee': entry(0.08, 0.08, 'exact', 'T-shirt'),
  'long-sleeve-tee': entry(0.2, 0.25, 'nearest', 'Long underwear top', 'Long sleeve shirt (thin)'),
  'tank-top': entry(0.12, 0.12, 'nearest', 'Sleeveless scoop-neck blouse'),
  shirt: entry(0.19, 0.25, 'nearest', 'Short-sleeve dress shirt', 'Long-sleeve dress shirt'),
  'thermal-top': entry(0.2, 0.2, 'exact', 'Long underwear top'),
  sweatshirt: entry(0.34, 0.34, 'exact', 'Long-sleeve sweat shirt'),
  sweater: entry(0.25, 0.36, 'nearest', 'Long sleeve shirt (thin)', 'Long sleeve shirt (thick)'),
  cardigan: entry(0.25, 0.36, 'nearest', 'Long sleeve shirt (thin)', 'Long sleeve shirt (thick)'),
  fleece: entry(0.34, 0.34, 'nearest', 'Long-sleeve sweat shirt'),
  'light-jacket': entry(0.36, 0.44, 'nearest', 'Single-breasted coat (thin)', 'Single-breasted coat (thick)'),
  windbreaker: none,
  'rain-jacket': none,
  softshell: none,
  // CBE 2013: four winter jackets over the same base ensemble add 0.22–0.35 clo → 0.26–0.42 per garment (÷ 0.835).
  // Only the lowest is used as a floor; high-loft down jackets are far warmer, so the upper end stays open.
  puffer: { clo: { min: 0.26, max: 0.26 }, reference: ['CBE 2013 winter jacket (lowest of four, by difference)'], match: 'derived', openUpper: true },
  'coat-parka': entry(0.6, 0.7, 'secondary', 'Coat', 'Parka'),
  jeans: entry(0.24, 0.24, 'nearest', 'Thick trousers'),
  'woven-trousers': entry(0.15, 0.24, 'exact', 'Thin trousers', 'Thick trousers'),
  joggers: entry(0.28, 0.28, 'exact', 'Sweatpants'),
  leggings: entry(0.15, 0.15, 'nearest', 'Long underwear bottoms'),
  shorts: entry(0.06, 0.08, 'exact', 'Short shorts', 'Walking shorts'),
  skirt: entry(0.14, 0.23, 'exact', 'Thin skirt', 'Thick skirt'),
  dress: entry(0.29, 0.47, 'nearest', 'Short-sleeve shirt dress', 'Long-sleeve shirt dress (thick)'),
  sneakers: entry(0.02, 0.02, 'exact', 'Shoes or sandals'),
  'running-shoes': entry(0.02, 0.02, 'exact', 'Shoes or sandals'),
  sandals: entry(0.02, 0.02, 'exact', 'Shoes or sandals'),
  'rain-boots': entry(0.1, 0.1, 'exact', 'Boots'),
  'winter-boots': entry(0.1, 0.1, 'nearest', 'Boots'),
  socks: entry(0.02, 0.06, 'exact', 'Ankle socks', 'Knee socks (thick)'),
  beanie: none,
  'sun-hat': none,
  scarf: none,
  gloves: none,
  'polo-shirt': entry(0.17, 0.17, 'exact', 'Short-sleeve knit shirt'),
  blouse: entry(0.19, 0.25, 'nearest', 'Short-sleeve dress shirt', 'Long-sleeve dress shirt'),
  gilet: entry(0.1, 0.17, 'nearest', 'Sleeveless vest (thin)', 'Sleeveless vest (thick)'),
  'rain-poncho': none,
  // CBE 2013 short trench coat over a turtleneck ensemble: 1.24 − (0.80 + turtleneck − shirt 0.11) = 0.33 clo → 0.40 per garment.
  // Two-step difference and lined winter trenches are warmer, so this is a floor with an open upper end.
  'trench-coat': { clo: { min: 0.4, max: 0.4 }, reference: ['CBE 2013 short trench coat (two-step difference)'], match: 'derived', openUpper: true },
};

/** ASHRAE 55 typical tasks (pythermalcomfort `met_typical_tasks`); walking speed per ISO 11079 limits (≤ 1.2 m/s). */
export const ACTIVITY_PROFILE: Readonly<Record<Activity, { met: number; walkSpeed: number; reference: string }>> = {
  resting: { met: 1.2, walkSpeed: 0.0052 * (1.2 * MET_TO_W_M2 - 58), reference: 'Standing, relaxed' },
  walking: { met: 2.0, walkSpeed: 0.89, reference: 'Walking 2mph (3.2kmh)' },
  active: { met: 2.6, walkSpeed: 1.2, reference: 'Walking 3mph (4.8kmh); speed capped at the ISO 11079 limit' },
};

// ---- ISO 9920 clothing insulation ------------------------------------------------------

/** ISO 9920:2009 §4.3: intrinsic ensemble insulation from garment values, clo. */
export function ensembleIntrinsicClo(garmentClo: number[]): number {
  return garmentClo.reduce((sum, value) => sum + value, 0) * 0.835 + 0.161;
}

/** ISO 9920:2009 §5: clothing area factor; stated range 0.2–1.7 clo. */
export function clothingAreaFactor(icl: number): number {
  return 1 + 0.28 * icl;
}

const correctionNude = (vr: number, vw: number) => Math.exp(-0.533 * (vr - 0.15) + 0.069 * (vr - 0.15) ** 2 - 0.462 * vw + 0.201 * vw ** 2);
const correctionNormal = (vr: number, vw: number) => Math.exp(-0.281 * (vr - 0.15) + 0.044 * (vr - 0.15) ** 2 - 0.492 * vw + 0.176 * vw ** 2);

/** ISO 9920:2009 §6: resultant boundary air layer insulation, clo. */
export function airLayerInsulation(vr: number, walkSpeed: number, iaStatic = STATIC_AIR_LAYER_CLO): number {
  return correctionNude(vr, walkSpeed) * iaStatic;
}

/** ISO 9920: resultant total insulation I_T,r for 0 < I_T < 2 clo (high-clothing equation not implemented). */
export function totalInsulationResultant(iT: number, vr: number, walkSpeed: number, iaStatic: number, icl: number): number {
  if (icl === 0) return iaStatic * correctionNude(vr, walkSpeed);
  const normal = iT * correctionNormal(vr, walkSpeed);
  if (icl > 0.6) return normal;
  return ((0.6 - icl) * iaStatic * correctionNude(vr, walkSpeed) + icl * normal) / 0.6;
}

/** Activity-generated relative air speed used with the ISO 7730 dynamic clothing correction. */
export function relativeAirSpeed(v: number, met: number): number {
  return met > 1 ? v + 0.3 * (met - 1) : v;
}

/** ISO 7730 Annex C (from ISO 9920:2007): dynamic intrinsic clothing insulation I_cl,r, clo. */
export function dynamicClo(clo: number, met: number, v: number, ia = STATIC_AIR_LAYER_CLO): number {
  const fcl = clothingAreaFactor(clo);
  const iT = clo + ia / fcl;
  const walkSpeed = Math.min(0.7, Math.max(0, 0.0052 * (met * MET_TO_W_M2 - 58)));
  const vr = relativeAirSpeed(v, met);
  return totalInsulationResultant(iT, vr, walkSpeed, ia, clo) - airLayerInsulation(vr, walkSpeed, ia) / fcl;
}

// ---- ISO 11079 required clothing insulation ----------------------------------------------

export type IreqInput = {
  tdb: number; tr: number; vr: number; rh: number;
  /** met */ met: number;
  /** basic clothing insulation actually worn, clo (used for DLE) */ clo: number;
  /** air permeability, l/(m² s) */ p: number;
  walkSpeed: number;
  /** external work, met */ wme?: number;
};
export type IreqResult = {
  ireqMin: number; ireqNeutral: number;
  /** required basic clothing insulation, clo */ iclMin: number; iclNeutral: number;
  /** duration limited exposure, hours; Infinity means more than 8 h */ dleMin: number; dleNeutral: number;
  /** false outside ISO 11079 limits (tdb > 10 °C, met, vr or walking speed out of range) */
  withinIsoLimits: boolean;
};

const vapourPressure = (temperature: number) => 0.1333 * Math.exp(18.6686 - 4030.183 / (temperature + 235));

function radiationCoefficient(clothingTemperature: number, tr: number): number {
  const arAdu = 0.77;
  const deltaT = clothingTemperature - tr;
  if (Math.abs(deltaT) < 1e-4) return 5.67e-8 * 0.95 * arAdu * 4 * (273 + (clothingTemperature + tr) / 2) ** 3;
  return (5.67e-8 * 0.95 * arAdu * ((273 + clothingTemperature) ** 4 - (273 + tr) ** 4)) / deltaT;
}

function solveCriterion(input: Required<IreqInput>, met: number, wme: number, skinTemperature: number, wetness: number) {
  const { tdb, tr, vr, rh, p, walkSpeed } = input;
  const cloM2kW = input.clo * CLO_TO_M2K_W;
  const airInsulation = 0.092 * Math.exp(-0.15 * vr - 0.22 * walkSpeed) - 0.0045;
  const constantPart = 0.54 * Math.exp(-0.15 * vr - 0.22 * walkSpeed) * p ** 0.075 - 0.06 * Math.log(p) + 0.5;
  const expiredTemperature = 29 + 0.2 * tdb;
  const expiredVapour = vapourPressure(expiredTemperature);
  const ambientVapour = (rh / 100) * vapourPressure(tdb);
  const skinVapour = vapourPressure(skinTemperature);
  const respiratory = 1.73e-2 * met * (expiredVapour - ambientVapour) + 1.4e-3 * met * (expiredTemperature - tdb);
  const heatLoss = (insulation: number, fcl: number, storage: number) => {
    const evaporative = wetness * (skinVapour - ambientVapour) / ((0.06 / 0.38) * (airInsulation + insulation));
    const clothingTemperature = skinTemperature - insulation * (met - wme - evaporative - respiratory - storage);
    const hr = radiationCoefficient(clothingTemperature, tr);
    const radiation = fcl * hr * (clothingTemperature - tr);
    const convection = fcl * (1 / airInsulation - hr) * (clothingTemperature - tdb);
    return { clothingTemperature, radiation, convection, balance: met - wme - evaporative - respiratory - radiation - convection - storage };
  };

  // Bisection on required insulation (m²K/W), as in ISO 11079 Annex A.
  let ireq = 0.5, factor = 0.5, step = { clothingTemperature: 0, radiation: 0, convection: 0, balance: 1 };
  for (let i = 0; i < 150 && Math.abs(step.balance) > 0.01; i++) {
    step = heatLoss(ireq, 1 + 1.197 * ireq, 0);
    if (step.balance > 0) { ireq -= factor; factor /= 2; } else ireq += factor;
  }
  const ireqFinal = (skinTemperature - step.clothingTemperature) / (step.radiation + step.convection);

  // Heat storage with the worn clothing, for the duration limited exposure.
  let storage = -40, storageFactor = 500, resultant = cloM2kW, balance = 1;
  for (let i = 0; i < 150 && Math.abs(balance) > 0.01; i++) {
    const fcl = 1 + 1.197 * resultant;
    resultant = (cloM2kW + 0.085 / fcl) * constantPart - airInsulation / fcl;
    balance = heatLoss(resultant, fcl, storage).balance; // area factor from the previous estimate, as in the reference
    if (balance > 0) { storage += storageFactor; storageFactor /= 2; } else storage -= storageFactor;
  }
  const dle = storage === 0 ? Infinity : -40 / storage;
  const fclFinal = 1 + 1.197 * ireqFinal;
  const iclRaw = (ireqFinal + airInsulation / fclFinal) / constantPart - 0.085 / fclFinal;
  return { ireq: ireqFinal / CLO_TO_M2K_W, icl: iclRaw / CLO_TO_M2K_W, dle: dle > 8 || dle < 0 ? Infinity : dle };
}

/** ISO 11079:2007 Annex A. Results outside the standard's limits are still returned, flagged by `withinIsoLimits`. */
export function ireq(input: IreqInput): IreqResult {
  const full = { wme: 0, ...input };
  const met = full.met * MET_TO_W_M2, wme = full.wme * MET_TO_W_M2;
  const minimum = solveCriterion(full, met, wme, 33.34 - 0.0354 * met, 0.06);
  const neutral = solveCriterion(full, met, wme, 35.7 - 0.0285 * met, 0.001 * met);
  const minimumWalk = Math.min(0.0052 * (met - 58), 1.2);
  const withinIsoLimits = met >= 58 && met <= 400 && full.tdb <= 10 && full.vr >= 0.4 && full.vr <= 18
    && full.walkSpeed >= minimumWalk && full.walkSpeed <= 1.2;
  return {
    ireqMin: minimum.ireq, ireqNeutral: neutral.ireq, iclMin: minimum.icl, iclNeutral: neutral.icl,
    dleMin: minimum.dle, dleNeutral: neutral.dle, withinIsoLimits,
  };
}

// ---- Weather → requirement, outfit → insulation, fit ----------------------------------------

/**
 * Forecast wind is reported at 10 m; the body sees roughly 1.1 m. Logarithmic wind profile with an
 * open-terrain roughness length of 0.01 m (assumption; urban streets are usually calmer).
 */
export const WIND_10M_TO_BODY = Math.log(1.1 / 0.01) / Math.log(10 / 0.01);

export type RequirementInput = {
  airTempC: number; relativeHumidity: number; windKmh10m: number; activity: Activity;
  /** mean radiant temperature; defaults to air temperature (sun and sky radiation not modelled yet) */ radiantTempC?: number;
  /** clothing air permeability, l/(m² s); 50 as in the pythermalcomfort example, ~8 for windproof shells (ISO 11079 Table F1 examples) */ airPermeability?: number;
};
export type Requirement = {
  /** required basic clothing insulation, clo */ iclMin: number; iclNeutral: number;
  /** `iso11079`: within the standard; `extended`: same heat balance outside its limits, not validated */
  method: 'iso11079' | 'extended';
  inputs: { met: number; walkSpeed: number; vr: number; tr: number; p: number };
};

function ireqFor(input: RequirementInput, wornClo: number) {
  const profile = ACTIVITY_PROFILE[input.activity];
  const vr = Math.min(18, Math.max(0.4, (input.windKmh10m / 3.6) * WIND_10M_TO_BODY));
  const tr = input.radiantTempC ?? input.airTempC, p = input.airPermeability ?? 50;
  const inputs = { met: profile.met, walkSpeed: profile.walkSpeed, vr, tr, p };
  return { inputs, result: ireq({ tdb: input.airTempC, tr, vr, rh: input.relativeHumidity, met: profile.met, clo: wornClo, p, walkSpeed: profile.walkSpeed }) };
}

/** Steady-state requirement (long exposure). Short trips are judged with `durationLimitedExposure`. */
export function requiredInsulation(input: RequirementInput): Requirement {
  const { inputs, result } = ireqFor(input, 1);
  return {
    iclMin: Math.max(0, result.iclMin), iclNeutral: Math.max(0, result.iclNeutral),
    method: result.withinIsoLimits ? 'iso11079' : 'extended', inputs,
  };
}

/** ISO 11079 DLE for the worn basic insulation: hours before body cooling reaches the limit; Infinity = over 8 h. */
export function durationLimitedExposure(input: RequirementInput, wornClo: number): { min: number; neutral: number } {
  const { result } = ireqFor(input, wornClo);
  return { min: result.dleMin, neutral: result.dleNeutral };
}

export type EnsembleEstimate = {
  /** ISO 9920 intrinsic insulation including the underwear assumption, clo */
  icl: CloRange & { mid: number };
  /** garment types without a cited value; the estimate is then a lower bound */
  unknownTypes: string[];
  /** garment types with only a secondary, unverified value; they never decide a verdict */
  lowerBoundTypes: string[];
  /** garment types with a measured floor but an open upper end (e.g. puffer); they can prove enough warmth, never a shortfall */
  openUpperTypes: string[];
  /** cited garments without open/secondary values only (underwear included), clo — used for ranking */
  closedMin: number;
  /** ISO 9920 intrinsic insulation of the fully cited garments only (underwear included), clo */
  citedMin: number;
  references: string[];
};

export type EnsemblePart = { key: string; clo: CloRange | null; reference: string[]; lowerBound?: boolean; openUpper?: boolean };

export function estimateEnsembleParts(parts: readonly EnsemblePart[]): EnsembleEstimate {
  const known: CloRange[] = [{ min: UNDERWEAR_CLO, max: UNDERWEAR_CLO }];
  const unknownTypes: string[] = [];
  const lowerBoundTypes: string[] = [];
  const openUpperTypes: string[] = [];
  const references = new Set<string>(["Men's underwear"]);
  for (const part of parts) {
    if (!part.clo) { unknownTypes.push(part.key); continue; }
    if (part.lowerBound) lowerBoundTypes.push(part.key);
    if (part.openUpper) openUpperTypes.push(part.key);
    known.push(part.clo);
    part.reference.forEach(reference => references.add(reference));
  }
  const min = ensembleIntrinsicClo(known.map(range => range.min));
  const max = ensembleIntrinsicClo(known.map(range => range.max));
  const citedMin = ensembleIntrinsicClo(parts.filter(part => part.clo && !part.lowerBound).map(part => part.clo!.min).concat(UNDERWEAR_CLO));
  const closedMin = ensembleIntrinsicClo(parts.filter(part => part.clo && !part.lowerBound && !part.openUpper).map(part => part.clo!.min).concat(UNDERWEAR_CLO));
  return { icl: { min, max, mid: (min + max) / 2 }, unknownTypes, lowerBoundTypes, openUpperTypes, citedMin, closedMin, references: [...references] };
}

export function estimateEnsemble(typeIds: readonly string[]): EnsembleEstimate {
  return estimateEnsembleParts(typeIds.map(id => {
    const garment = (GARMENT_CLO as Record<string, GarmentCloEntry | undefined>)[id];
    return { key: id, clo: garment?.clo ?? null, reference: garment?.reference ?? [], lowerBound: garment?.match === 'secondary', openUpper: garment?.openUpper };
  }));
}

/**
 * ISO 11079 interpretation: worn basic insulation should not exceed ICL_neutral, and below ICL_min the
 * exposure is limited by DLE. A planned exposure shorter than DLE_min is acceptable.
 * Unknown garments only add insulation, so they can hide a shortfall but never an excess.
 */
export type ThermalFit = 'insufficient' | 'acceptable' | 'excess' | 'unknown';
export type OutfitAssessment = {
  fit: ThermalFit; ensemble: EnsembleEstimate; requirement: Requirement;
  /** DLE_min (hours) for the lower and upper insulation estimate */ dleHours: { low: number; high: number };
};

export function assessOutfit(typeIds: readonly string[], input: RequirementInput, exposureHours = 8): OutfitAssessment {
  return assessEnsemble(estimateEnsemble(typeIds), input, exposureHours);
}

/**
 * Smallest basic insulation whose DLE_min covers the exposure (DLE grows with insulation). At or above
 * 8 h this is ICL_min. Lets a search compare outfits with one number instead of re-running DLE.
 */
export function insulationForExposure(input: RequirementInput, exposureHours: number, requirement = requiredInsulation(input)): number {
  if (exposureHours >= 8) return requirement.iclMin;
  if (durationLimitedExposure(input, 0).min >= exposureHours) return 0;
  let low = 0, high = Math.max(requirement.iclMin, 0.01);
  for (let i = 0; i < 30; i++) {
    const middle = (low + high) / 2;
    if (durationLimitedExposure(input, middle).min >= exposureHours) high = middle; else low = middle;
  }
  return high;
}

/** Fit from insulation alone; equivalent to comparing DLE with the exposure. */
export function thermalFit(ensemble: EnsembleEstimate, requirement: Requirement, neededClo: number): ThermalFit {
  // Outside ISO 11079 (e.g. above 10 °C) sweating dominates and the cold model gives no verdict.
  if (requirement.method === 'extended') return 'unknown';
  // Secondary values are not trusted either way: a trench coat and a parka share one type range.
  if (ensemble.citedMin > requirement.iclNeutral) return 'excess';
  if (ensemble.citedMin >= neededClo) return 'acceptable'; // cited garments alone are enough
  if (ensemble.unknownTypes.length || ensemble.lowerBoundTypes.length || ensemble.openUpperTypes.length) return 'unknown';
  return ensemble.icl.max < neededClo ? 'insufficient' : 'unknown';
}

export function assessEnsemble(ensemble: EnsembleEstimate, input: RequirementInput, exposureHours = 8, requirement = requiredInsulation(input), neededClo = insulationForExposure(input, exposureHours, requirement)): OutfitAssessment {
  const dleHours = { low: durationLimitedExposure(input, ensemble.icl.min).min, high: durationLimitedExposure(input, ensemble.icl.max).min };
  return { fit: thermalFit(ensemble, requirement, neededClo), ensemble, requirement, dleHours };
}
