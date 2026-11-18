/**
 * WW-29/3 colour harmony.
 *
 * - sRGB → CIE XYZ (D65) → CIELAB with the standard IEC 61966-2-1 and CIE 1976 formulas.
 * - Two-colour harmony after Ou, L.-C. & Luo, M. R. (2006), "A colour harmony model for two-colour
 *   combinations", Color Research & Application 31(3). Equations as republished by the same group in
 *   US patent 10,107,687 (we could not access the 2006 paper itself, so the lightness-sum term may differ
 *   slightly from the paper's printed coefficients). Larger CH means a more harmonious pair.
 *
 * A soft score: a 2016 study found such models predict garment ratings only weakly, so harmony only
 * re-orders outfits that are equally fine thermally (see outfit-thermal.ts).
 */

export type Lab = { L: number; a: number; b: number };

const toLinear = (channel: number) => { const c = channel / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const labF = (t: number) => (t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);

/** `#rrggbb` → CIELAB (D65 reference white); `null` for anything else. */
export function hexToLab(hex: string): Lab | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const [r, g, b] = [1, 3, 5].map(i => toLinear(parseInt(hex.slice(i, i + 2), 16)));
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const [fx, fy, fz] = [labF(x / 0.95047), labF(y), labF(z / 1.08883)];
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

const chroma = (c: Lab) => Math.hypot(c.a, c.b);
const hueDegrees = (c: Lab) => ((Math.atan2(c.b, c.a) * 180) / Math.PI + 360) % 360;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** Single-colour hue effect H_SY = E_C · (H_S + E_Y). */
function hueEffect(c: Lab): number {
  const C = chroma(c), h = hueDegrees(c);
  const ec = 0.5 + 0.5 * Math.tanh(-2 + 0.5 * C);
  const hs = -0.08 - 0.14 * Math.sin(rad(h + 50)) - 0.07 * Math.sin(rad(2 * h + 90));
  const x = (90 - h) / 10;
  const ey = ((0.22 * c.L - 12.8) / 10) * Math.exp(x - Math.exp(x));
  return ec * (hs + ey);
}

export type HarmonyParts = { ch: number; hc: number; hl: number; hh: number };

/** Ou & Luo two-colour harmony CH = H_C + H_L + H_H. */
export function pairHarmony(first: Lab, second: Lab): HarmonyParts {
  const c1 = chroma(first), c2 = chroma(second);
  let dh = Math.abs(hueDegrees(first) - hueDegrees(second));
  if (dh > 180) dh = 360 - dh;
  const deltaH = 2 * Math.sqrt(c1 * c2) * Math.sin(rad(dh) / 2);
  const deltaC = Math.sqrt(deltaH ** 2 + ((c1 - c2) / 1.46) ** 2);
  const hc = 0.04 + 0.53 * Math.tanh(0.8 - 0.045 * deltaC);
  const lSum = first.L + second.L, deltaL = Math.abs(first.L - second.L);
  const hl = 0.3 + 0.5 * Math.tanh(-4 + 0.029 * lSum) + 0.14 + 0.15 * Math.tanh(-2 + 0.2 * deltaL);
  const hh = hueEffect(first) + hueEffect(second);
  return { ch: hc + hl + hh, hc, hl, hh };
}

/** Mean and worst pair harmony over all distinct colours; `null` with fewer than two known colours. */
export function outfitHarmony(hexColours: readonly string[]): { score: number; worst: number; pairs: number } | null {
  const labs = [...new Set(hexColours.map(hex => hex.toLowerCase()))].flatMap(hex => { const lab = hexToLab(hex); return lab ? [lab] : []; });
  if (labs.length < 2) {
    if (labs.length !== 1 || hexColours.length < 2) return null;
    const self = pairHarmony(labs[0], labs[0]).ch;
    return { score: self, worst: self, pairs: 1 };
  }
  let total = 0, pairs = 0, worst = Infinity;
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) { const value = pairHarmony(labs[i], labs[j]).ch; total += value; worst = Math.min(worst, value); pairs++; }
  return { score: total / pairs, worst, pairs };
}
