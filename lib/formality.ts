/**
 * WW-29/3 formality: a rule-based scale, not a measurement. No validated formality ontology for garment
 * types was found; the levels follow the Western dress-code tiers (informal/semi-formal/formal) and the
 * colour/texture/pattern/structure rubric described by Permanent Style. 1 = sport, 2 = everyday,
 * 3 = smart casual, 4 = tailored. Hidden layers (`null`) are ignored.
 */
import type { GarmentTypeId } from './catalog/taxonomy';

export const FORMALITY: Readonly<Record<GarmentTypeId, 1 | 2 | 3 | 4 | null>> = {
  'short-sleeve-tee': 2, 'long-sleeve-tee': 2, 'tank-top': 1, shirt: 4, 'thermal-top': null,
  // Sweatshirt/hoodie is everyday wear (user decision, 18 Nov 2026): a hoodie under a trench coat is common streetwear.
  sweatshirt: 2, sweater: 3, cardigan: 3, fleece: 1,
  'light-jacket': 3, windbreaker: 2, 'rain-jacket': 2, softshell: 2, puffer: 2, 'coat-parka': 4, 'trench-coat': 4,
  jeans: 2, 'woven-trousers': 3, joggers: 1, leggings: 1, shorts: 1, skirt: 3, dress: 3,
  sneakers: 2, 'running-shoes': 1, sandals: 1, 'rain-boots': 2, 'winter-boots': 3,
  socks: null, beanie: 2, 'sun-hat': 1, scarf: 3, gloves: 3,
  'polo-shirt': 3, blouse: 4, gilet: 2, 'rain-poncho': 1,
};

/** A gap of three levels (e.g. a dress shirt with joggers) reads as a mismatch. */
export const FORMALITY_CLASH = 3;

export function formalitySpread(types: readonly (GarmentTypeId | undefined)[]): { min: number; max: number; spread: number } | null {
  const levels = types.flatMap(type => { const level = type ? FORMALITY[type] : null; return level ? [level] : []; });
  if (levels.length < 2) return null;
  const min = Math.min(...levels), max = Math.max(...levels);
  return { min, max, spread: max - min };
}
