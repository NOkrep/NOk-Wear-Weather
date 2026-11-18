/**
 * WW-29/2b warm and mild weather comfort.
 *
 * - Gagge two-node model (Gagge, Fobelets & Berglund 1986; ASHRAE 55 SET*): predicted thermal
 *   sensation (TSENS), SET* and PMV(SET) after a one-hour exposure with the given clothing.
 * - ASHRAE 55 Appendix C SolarCal: effective radiant field and mean radiant temperature increase
 *   from direct sun on the body.
 *
 * Ported from pythermalcomfort (MIT License, Copyright (c) 2019 Federico Tartarini),
 * https://github.com/pythermalcomfort/pythermalcomfort, modules `models/two_nodes_gagge.py` and
 * `models/solar_gain.py`. Licence text: THIRD_PARTY_NOTICES.md.
 */

const pSatTorr = (t: number) => Math.exp(18.6686 - 4030.183 / (t + 235));

export type TwoNodeInput = {
  tdb: number; tr: number; /** air speed m/s */ v: number; rh: number; met: number; clo: number;
  wme?: number; bodySurfaceArea?: number; pAtm?: number; position?: 'standing' | 'sitting';
  maxSkinBloodFlow?: number; maxSweating?: number; /** critical skin wettedness; computed when absent */ wMax?: number;
};
export type TwoNodeResult = {
  set: number; tSens: number; disc: number; pmvSet: number; pmvGagge: number;
  tCore: number; tSkin: number; eSkin: number; eRsw: number; mRsw: number; w: number;
};

/** pythermalcomfort `_gagge_two_nodes_optimized`, standing or sitting, defaults as in the reference. */
export function twoNodeGagge(input: TwoNodeInput): TwoNodeResult {
  const { tdb, tr, v, rh, met, clo } = input;
  const wme = input.wme ?? 0, bodySurfaceArea = input.bodySurfaceArea ?? 1.8258, pAtm = input.pAtm ?? 101325;
  const sitting = input.position === 'sitting';
  const vaporPressure = (rh * pSatTorr(tdb)) / 100;
  const maxSkinBloodFlow = input.maxSkinBloodFlow ?? 90, maxSweating = input.maxSweating ?? 500;

  const airSpeed = Math.max(v, 0.1);
  const kClo = 0.25, bodyWeight = 70, metFactor = 58.2, sbc = 0.000000056697;
  const cSw = 170, cDil = 120, cStr = 0.5;
  const tempSkinNeutral = 33.7, tempCoreNeutral = 36.8;
  let alfa = 0.1;
  const tempBodyNeutral = alfa * tempSkinNeutral + (1 - alfa) * tempCoreNeutral;
  const skinBloodFlowNeutral = 6.3;
  let tSkin = tempSkinNeutral, tCore = tempCoreNeutral, mBl = skinBloodFlowNeutral;
  let eSkin = 0.1 * met, qSensible = 0, w = 0, eRsw = 0, eDiff = 0, eMax = 0, mRsw = 0, eReq = 0, rEa = 0, rEcl = 0;
  const pressureAtm = pAtm / 101325;
  const rClo = 0.155 * clo, fACl = 1.0 + 0.15 * clo, lr = 2.2 / pressureAtm;
  const rm = (met - wme) * metFactor;
  let m = met * metFactor;
  const eComfort = Math.max(0.42 * (rm - metFactor), 0);
  const iCl = clo > 0 ? 0.45 : 1.0;
  const wMax = input.wMax || (clo > 0 ? 0.59 * airSpeed ** -0.08 : 0.38 * airSpeed ** -0.29);
  let hCc = Math.max(3.0 * pressureAtm ** 0.53, 8.600001 * (airSpeed * pressureAtm) ** 0.53);
  if (met > 0.85) hCc = Math.max(hCc, 5.66 * (met - 0.85) ** 0.39);
  let hR = 4.7, hT = hR + hCc, rA = 1.0 / (fACl * hT), tOp = (hR * tr + hCc * tdb) / hT;
  let tBody = alfa * tSkin + (1 - alfa) * tCore;
  const qRes = 0.0023 * m * (44.0 - vaporPressure);
  const cRes = 0.0014 * m * (34.0 - tdb);

  for (let step = 1; step < 60; step++) {
    let tCl = (rA * tSkin + rClo * tOp) / (rA + rClo);
    for (let i = 0; ; i++) {
      hR = 4.0 * 0.95 * sbc * ((tCl + tr) / 2.0 + 273.15) ** 3.0 * (sitting ? 0.7 : 0.73);
      hT = hR + hCc;
      rA = 1.0 / (fACl * hT);
      tOp = (hR * tr + hCc * tdb) / hT;
      const next = (rA * tSkin + rClo * tOp) / (rA + rClo);
      const converged = Math.abs(next - tCl) <= 0.01;
      tCl = next;
      if (converged) break;
      if (i >= 150) throw new Error('Max iterations exceeded');
    }
    qSensible = (tSkin - tOp) / (rA + rClo);
    const hfCs = (tCore - tSkin) * (5.28 + 1.163 * mBl);
    const sCore = m - hfCs - qRes - cRes - wme;
    const sSkin = hfCs - qSensible - eSkin;
    const tcSk = 0.97 * alfa * bodyWeight, tcCr = 0.97 * (1 - alfa) * bodyWeight;
    tSkin += (sSkin * bodySurfaceArea) / (tcSk * 60.0);
    tCore += (sCore * bodySurfaceArea) / (tcCr * 60.0);
    tBody = alfa * tSkin + (1 - alfa) * tCore;
    const skSig = tSkin - tempSkinNeutral;
    const warmSk = Math.max(skSig, 0), colds = Math.max(-skSig, 0);
    const cRegSig = tCore - tempCoreNeutral;
    const cWarm = Math.max(cRegSig, 0), cCold = Math.max(-cRegSig, 0);
    const warmB = Math.max(tBody - tempBodyNeutral, 0);
    mBl = Math.max(Math.min((skinBloodFlowNeutral + cDil * cWarm) / (1 + cStr * colds), maxSkinBloodFlow), 0.5);
    mRsw = Math.min(cSw * warmB * Math.exp(warmSk / 10.7), maxSweating);
    eRsw = 0.68 * mRsw;
    rEa = 1.0 / (lr * fACl * hCc);
    rEcl = rClo / (lr * iCl);
    eReq = rm - qRes - cRes - qSensible;
    eMax = (Math.exp(18.6686 - 4030.183 / (tSkin + 235.0)) - vaporPressure) / (rEa + rEcl);
    if (eMax === 0) eMax = 0.001;
    let pRsw = eRsw / eMax;
    w = 0.06 + 0.94 * pRsw;
    eDiff = w * eMax - eRsw;
    if (w > wMax) {
      w = wMax;
      pRsw = (wMax - 0.06) / 0.94;
      eRsw = pRsw * eMax;
      eDiff = 0.06 * (1.0 - pRsw) * eMax;
    }
    if (eMax < 0) { eDiff = 0; eRsw = 0; w = wMax; }
    eSkin = eRsw + eDiff;
    mRsw = eRsw / 0.68;
    m = rm + 19.4 * colds * cCold;
    alfa = 0.0417737 + 0.7451833 / (mBl + 0.585417);
  }

  const qSkin = qSensible + eSkin;
  const pSSk = Math.exp(18.6686 - 4030.183 / (tSkin + 235.0));
  const hRS = hR;
  let hCS = 3.0 * pressureAtm ** 0.53;
  if (met > 0.85) hCS = Math.max(hCS, 5.66 * (met - 0.85) ** 0.39);
  hCS = Math.max(hCS, 3.0);
  const hTS = hCS + hRS;
  const rCloS = 1.52 / (met - wme / metFactor + 0.6944) - 0.1835;
  const rClS = 0.155 * rCloS;
  const fAClS = 1.0 + kClo * rCloS;
  const fClS = 1.0 / (1.0 + 0.155 * fAClS * hTS * rCloS);
  const iMS = 0.45;
  const iClS = (iMS * hCS / hTS * (1 - fClS)) / (hCS / hTS - fClS * iMS);
  const rAS = 1.0 / (fAClS * hTS), rEaS = 1.0 / (lr * fAClS * hCS), rEclS = rClS / (lr * iClS);
  const hDS = 1.0 / (rAS + rClS), hES = 1.0 / (rEaS + rEclS);
  const solve = (start: number, hD: number, hE: number) => {
    const delta = 0.0001;
    let old = start, dx = 100, value = start;
    while (Math.abs(dx) > 0.01) {
      const err1 = qSkin - hD * (tSkin - old) - w * hE * (pSSk - 0.5 * Math.exp(18.6686 - 4030.183 / (old + 235.0)));
      const err2 = qSkin - hD * (tSkin - (old + delta)) - w * hE * (pSSk - 0.5 * Math.exp(18.6686 - 4030.183 / (old + delta + 235.0)));
      value = old - (delta * err1) / (err2 - err1);
      dx = value - old;
      old = value;
    }
    return value;
  };
  const set = solve(Math.round((tSkin - qSkin / hDS) * 100) / 100, hDS, hES);

  const metToWm2 = 58.15;
  const tbmL = (0.194 / metToWm2) * rm + 36.301;
  const tbmH = (0.347 / metToWm2) * rm + 36.669;
  let tSens = 0.4685 * (tBody - tbmL);
  if (tBody >= tbmL && tBody < tbmH) tSens = (wMax * 4.7 * (tBody - tbmL)) / (tbmH - tbmL);
  else if (tBody >= tbmH) tSens = wMax * 4.7 + 0.4685 * (tBody - tbmH);
  let disc = tSens > 0 && 0 > eMax * wMax - eComfort - eDiff ? 6.0 : (4.7 * (eRsw - eComfort)) / (eMax * wMax - eComfort - eDiff);
  if (disc <= 0) disc = tSens;
  if (disc > 6) disc = 6.0;
  const pmvGagge = (0.303 * Math.exp(-0.036 * m) + 0.028) * (eReq - eComfort - eDiff);
  const drySet = hDS * (tSkin - set);
  const eReqSet = rm - cRes - qRes - drySet;
  const pmvSet = (0.303 * Math.exp(-0.036 * m) + 0.028) * (eReqSet - eComfort - eDiff);
  return { set, tSens, disc, pmvSet, pmvGagge, tCore, tSkin, eSkin, eRsw, mRsw, w };
}

// ---- ASHRAE 55 SolarCal -------------------------------------------------------------------

const ALT_RANGE = [0, 15, 30, 45, 60, 75, 90];
const AZ_RANGE = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
const FP_STANDING = [
  [0.35, 0.35, 0.314, 0.258, 0.206, 0.144, 0.082], [0.342, 0.342, 0.31, 0.252, 0.2, 0.14, 0.082],
  [0.33, 0.33, 0.3, 0.244, 0.19, 0.132, 0.082], [0.31, 0.31, 0.275, 0.228, 0.175, 0.124, 0.082],
  [0.283, 0.283, 0.251, 0.208, 0.16, 0.114, 0.082], [0.252, 0.252, 0.228, 0.188, 0.15, 0.108, 0.082],
  [0.23, 0.23, 0.214, 0.18, 0.148, 0.108, 0.082], [0.242, 0.242, 0.222, 0.18, 0.153, 0.112, 0.082],
  [0.274, 0.274, 0.245, 0.203, 0.165, 0.116, 0.082], [0.304, 0.304, 0.27, 0.22, 0.174, 0.121, 0.082],
  [0.328, 0.328, 0.29, 0.234, 0.183, 0.125, 0.082], [0.344, 0.344, 0.304, 0.244, 0.19, 0.128, 0.082],
  [0.347, 0.347, 0.308, 0.246, 0.191, 0.128, 0.082],
];
const FP_SITTING = [
  [0.29, 0.324, 0.305, 0.303, 0.262, 0.224, 0.177], [0.292, 0.328, 0.294, 0.288, 0.268, 0.227, 0.177],
  [0.288, 0.332, 0.298, 0.29, 0.264, 0.222, 0.177], [0.274, 0.326, 0.294, 0.289, 0.252, 0.214, 0.177],
  [0.254, 0.308, 0.28, 0.276, 0.241, 0.202, 0.177], [0.23, 0.282, 0.262, 0.26, 0.233, 0.193, 0.177],
  [0.216, 0.26, 0.248, 0.244, 0.22, 0.186, 0.177], [0.234, 0.258, 0.236, 0.227, 0.208, 0.18, 0.177],
  [0.262, 0.26, 0.224, 0.208, 0.196, 0.176, 0.177], [0.28, 0.26, 0.21, 0.192, 0.184, 0.17, 0.177],
  [0.298, 0.256, 0.194, 0.174, 0.168, 0.168, 0.177], [0.306, 0.25, 0.18, 0.156, 0.156, 0.166, 0.177],
  [0.3, 0.24, 0.168, 0.152, 0.152, 0.164, 0.177],
];
const span = (range: number[], x: number) => { for (let i = 0; i < range.length - 1; i++) if (range[i + 1] >= x && x >= range[i]) return i; return -1; };

function projectedAreaFactor(altitude: number, sharp: number, sitting: boolean): number {
  const table = sitting ? FP_SITTING : FP_STANDING;
  const a = span(ALT_RANGE, altitude), z = span(AZ_RANGE, sharp);
  if (a === -1 || z === -1) return NaN;
  const [alt1, alt2, az1, az2] = [ALT_RANGE[a], ALT_RANGE[a + 1], AZ_RANGE[z], AZ_RANGE[z + 1]];
  return (table[z][a] * (az2 - sharp) * (alt2 - altitude) + table[z + 1][a] * (sharp - az1) * (alt2 - altitude)
    + table[z][a + 1] * (az2 - sharp) * (altitude - alt1) + table[z + 1][a + 1] * (sharp - az1) * (altitude - alt1))
    / ((az2 - az1) * (alt2 - alt1));
}

export type SolarGainInput = {
  /** solar altitude 0–90° */ altitude: number; /** sun azimuth relative to the person's front, 0–180° */ sharp: number;
  /** direct-beam (normal) radiation, W/m² */ directRadiation: number; transmittance: number;
  /** sky vault view fraction */ fSvv: number; /** fraction of the body exposed to direct sun */ fBes: number;
  /** short-wave absorptivity of skin/clothing */ asw?: number; floorReflectance?: number; position?: 'standing' | 'sitting';
};

/** ASHRAE 55 Appendix C; diffuse radiation is taken as 0.2 × direct, as in the standard's method. NaN outside the table. */
export function solarGain(input: SolarGainInput): { erf: number; deltaMrt: number } {
  const sitting = input.position === 'sitting';
  const fp = projectedAreaFactor(input.altitude, input.sharp, sitting);
  if (Number.isNaN(fp)) return { erf: NaN, deltaMrt: NaN };
  const asw = input.asw ?? 0.7, floorReflectance = input.floorReflectance ?? 0.6, hr = 6;
  const fEff = sitting ? 0.696 : 0.725;
  const iDiff = 0.2 * input.directRadiation;
  const eDiff = fEff * input.fSvv * 0.5 * input.transmittance * iDiff;
  const eDirect = fEff * fp * input.transmittance * input.fBes * input.directRadiation;
  const eReflected = fEff * input.fSvv * 0.5 * input.transmittance
    * (input.directRadiation * Math.sin(input.altitude * 0.0174532925) + iDiff) * floorReflectance;
  const erf = (eDiff + eDirect + eReflected) * (asw / 0.95);
  return { erf, deltaMrt: erf / (hr * fEff) };
}
