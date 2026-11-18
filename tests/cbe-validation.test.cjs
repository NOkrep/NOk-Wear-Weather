const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const model = require('../lib/thermal-model.ts');
// Measured whole-body insulation: Lee, Zhang & Arens 2013 (CBE, UC Berkeley), numbers only, with attribution.
const cbe = require('./fixtures/cbe-2013-ensembles.json');

test('ISO 9920 summation with our garment table tracks measured manikin ensembles', () => {
  const errors = cbe.validation.map(ensemble => {
    const estimate = model.estimateEnsemble(ensemble.types);
    assert.deepEqual(estimate.unknownTypes, [], ensemble.description);
    return estimate.icl.mid - ensemble.measured;
  });
  const mae = errors.reduce((sum, error) => sum + Math.abs(error), 0) / errors.length;
  const bias = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  const worst = Math.max(...errors.map(Math.abs));
  // 17 Nov 2026 baseline: MAE 0.089 clo, bias −0.042 clo, worst 0.21 clo over 14 ensembles (0.31–1.07 clo).
  assert.ok(errors.length >= 14);
  assert.ok(mae <= 0.10, `mean absolute error ${mae.toFixed(3)} clo`);
  assert.ok(Math.abs(bias) <= 0.06, `bias ${bias.toFixed(3)} clo`);
  assert.ok(worst <= 0.25, `worst error ${worst.toFixed(3)} clo`);
});

test('the puffer floor is the lowest measured winter jacket, derived by difference', () => {
  const { base, withJacket } = cbe.winterJacket;
  const garments = withJacket.map(entry => (entry.measured - base.measured) / 0.835);
  const floor = Math.min(...garments);
  assert.ok(Math.abs(model.GARMENT_CLO.puffer.clo.min - floor) < 0.005, `floor ${floor.toFixed(3)}`);
  assert.ok(Math.max(...garments) > model.GARMENT_CLO.puffer.clo.min, 'other measured jackets are warmer: the upper end is open');
  assert.match(model.CBE_2013_SOURCE, /escholarship\.org\/uc\/item\/18f0r375$/);
});
