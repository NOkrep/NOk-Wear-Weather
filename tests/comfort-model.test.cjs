const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const model = require('../lib/comfort-model.ts');
const { solarElevation } = require('../lib/weather-time.ts');
// Validation tables from FedericoTartarini/validation-data-comfort-models v1.1.0 (MIT), used by pythermalcomfort.
const twoNodes = require('./fixtures/comfort-validation/ts_two_nodes_gagge.json');
const solar = require('./fixtures/comfort-validation/ts_solar_gain.json');

const camel = { t_core: 'tCore', t_skin: 'tSkin', e_skin: 'eSkin', e_rsw: 'eRsw', m_rsw: 'mRsw', pmv_set: 'pmvSet', pmv_gagge: 'pmvGagge', w: 'w', disc: 'disc' };

test('Gagge two-node model matches the shared validation table', () => {
  assert.ok(twoNodes.data.length >= 10);
  for (const [index, { inputs, outputs }] of twoNodes.data.entries()) {
    const result = model.twoNodeGagge({ tdb: inputs.tdb, tr: inputs.tr, v: inputs.v, rh: inputs.rh, met: inputs.met, clo: inputs.clo,
      wMax: inputs.w_max, maxSweating: inputs.max_sweating, maxSkinBloodFlow: inputs.max_skin_blood_flow });
    for (const [key, expected] of Object.entries(outputs)) {
      const tolerance = twoNodes.tolerance[key];
      assert.ok(Math.abs(result[camel[key]] - expected) <= tolerance + 1e-9, `case ${index} ${key}: ${result[camel[key]]} vs ${expected}`);
    }
  }
});

test('SolarCal matches the ASHRAE 55 validation table and pinned reference cases', () => {
  for (const [index, { inputs, outputs }] of solar.data.entries()) {
    const result = model.solarGain({ altitude: inputs.sol_altitude, sharp: inputs.sharp, directRadiation: inputs.sol_radiation_dir,
      transmittance: inputs.sol_transmittance, fSvv: inputs.f_svv, fBes: inputs.f_bes, asw: inputs.asw, position: inputs.posture });
    assert.ok(Math.abs(result.erf - outputs.erf) <= solar.tolerance.erf + 0.05, `case ${index} erf ${result.erf} vs ${outputs.erf}`);
    assert.ok(Math.abs(result.deltaMrt - outputs.delta_mrt) <= solar.tolerance.delta_mrt + 0.05, `case ${index} dMRT ${result.deltaMrt} vs ${outputs.delta_mrt}`);
  }
  // pythermalcomfort tests/test_solar_gain.py, pinned to 1e-3
  for (const [altitude, sharp, directRadiation, transmittance, fSvv, fBes, position, erf, deltaMrt] of [
    [0, 120, 800, 0.5, 0.5, 0.5, 'sitting', 43.2839, 10.3649],
    [30, 60, 600, 0.6, 0.4, 0.6, 'standing', 52.8099, 12.1402],
    [90, 0, 1000, 1.0, 1.0, 1.0, 'sitting', 326.6804, 78.2281],
    [15, 165, 250, 0.2, 0.1, 0.9, 'standing', 8.9043, 2.047],
  ]) {
    const result = model.solarGain({ altitude, sharp, directRadiation, transmittance, fSvv, fBes, position });
    assert.ok(Math.abs(result.erf - erf) <= 1e-3, `erf ${result.erf} vs ${erf}`);
    assert.ok(Math.abs(result.deltaMrt - deltaMrt) <= 1e-3, `dMRT ${result.deltaMrt} vs ${deltaMrt}`);
  }
  assert.ok(Number.isNaN(model.solarGain({ altitude: -5, sharp: 90, directRadiation: 500, transmittance: 1, fSvv: 0.5, fBes: 0.5 }).erf));
});

test('more clothing feels warmer and sun adds warmth, in the physical direction', () => {
  const at = (clo, tr = 24) => model.twoNodeGagge({ tdb: 24, tr, v: 1.5, rh: 50, met: 2, clo }).tSens;
  assert.ok(at(1.0) > at(0.5));
  assert.ok(at(0.5, 34) > at(0.5, 24));
});

test('solar elevation follows the sun (NOAA equations)', () => {
  const istanbul = [41.0, 29.0];
  const noon = solarElevation(Date.parse('2026-06-21T10:00:00Z'), ...istanbul);
  const midnight = solarElevation(Date.parse('2026-06-21T22:00:00Z'), ...istanbul);
  assert.ok(noon > 70 && noon < 73, `June noon ${noon}`);
  assert.ok(midnight < 0);
  const winter = solarElevation(Date.parse('2026-12-21T10:00:00Z'), ...istanbul);
  assert.ok(winter > 24 && winter < 27, `December noon ${winter}`);
});
