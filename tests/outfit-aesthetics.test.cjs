const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const harmony = require('../lib/colour-harmony.ts');
const { FORMALITY, formalitySpread } = require('../lib/formality.ts');
const { GARMENT_TYPES } = require('../lib/catalog/taxonomy.ts');
const thermal = require('../lib/outfit-thermal.ts');

const close = (actual, expected, tolerance, label) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);
const lab = hex => harmony.hexToLab(hex);
const ch = (a, b) => harmony.pairHarmony(lab(a), lab(b)).ch;
const piece = (id, category, garmentTypeId, colorHex, patch = {}) => ({ id, category, garmentTypeId, name: id, segment: 'essential', material: 'test', warmth: 2,
  waterResistance: 'none', windResistance: 'medium', colorHex, colorName: 'test', colorType: 'neutral', description: 'test', dataSource: 'user', isUserOwned: true, ...patch });
const weatherAt = (temp, patch = {}) => ({ temp, feelsLike: temp, condition: 'cloudy', windSpeed: 8, precipitationProb: 0, humidity: 50, dewPoint: 10, uvIndex: 0, hourly: [], ...patch });

test('sRGB to CIELAB matches the standard reference values', () => {
  for (const [hex, L, a, b] of [['#ffffff', 100, 0, 0], ['#000000', 0, 0, 0], ['#ff0000', 53.24, 80.09, 67.2], ['#0000ff', 32.3, 79.19, -107.86], ['#808080', 53.59, 0, 0]]) {
    const value = lab(hex);
    close(value.L, L, 0.05, `${hex} L`); close(value.a, a, 0.05, `${hex} a`); close(value.b, b, 0.05, `${hex} b`);
  }
  assert.equal(harmony.hexToLab('red'), null);
});

test('Ou–Luo terms move in the directions the authors report', () => {
  // Chromatic difference: closer colours are more harmonious.
  assert.ok(harmony.pairHarmony(lab('#3b5ba5'), lab('#4a68b0')).hc > harmony.pairHarmony(lab('#3b5ba5'), lab('#c0392b')).hc);
  // Lightness sum: two light colours are more harmonious than two dark ones.
  assert.ok(harmony.pairHarmony(lab('#dddddd'), lab('#dddddd')).hl > harmony.pairHarmony(lab('#333333'), lab('#333333')).hl);
  // Lightness contrast adds harmony.
  assert.ok(harmony.pairHarmony(lab('#222222'), lab('#eeeeee')).hl > harmony.pairHarmony(lab('#777777'), lab('#888888')).hl);
  // Saturated opposing pairs clash; a classic navy/beige pair is not pushed back.
  assert.ok(ch('#ff0000', '#00a000') < thermal.COLOUR_CLASH_CH);
  assert.ok(ch('#ff6600', '#9900cc') < thermal.COLOUR_CLASH_CH);
  assert.ok(ch('#1f2a44', '#d4b996') >= thermal.COLOUR_CLASH_CH);
  assert.equal(harmony.outfitHarmony(['#1f2a44']), null, 'one colour is not a pair');
  assert.equal(harmony.outfitHarmony(['#1f2a44', '#1F2A44']).pairs, 1, 'a single repeated colour is judged against itself');
});

test('every garment type has a formality level; hidden layers are ignored', () => {
  for (const type of GARMENT_TYPES) assert.ok(type.id in FORMALITY, type.id);
  assert.equal(FORMALITY['thermal-top'], null);
  assert.equal(FORMALITY.socks, null);
  assert.deepEqual(formalitySpread(['shirt', 'joggers', 'socks']), { min: 1, max: 4, spread: 3 });
  assert.equal(formalitySpread(['sweatshirt', 'trench-coat']).spread, 2, 'a hoodie under a trench coat is not a mismatch');
  assert.equal(formalitySpread(['socks', 'thermal-top']), null);
});

test('look only re-orders outfits that are equally fine thermally', () => {
  const mild = thermal.thermalContext(weatherAt(22));
  const redTee = piece('red-tee', 'base', 'short-sleeve-tee', '#ff0000'), whiteTee = piece('white-tee', 'base', 'short-sleeve-tee', '#f4f4f4');
  const greenShorts = piece('green-shorts', 'bottom', 'shorts', '#00a000'), sneakers = piece('sneakers', 'footwear', 'sneakers', '#f4f4f4');
  assert.equal(thermal.assessAesthetics([redTee, greenShorts]).colour, 'clash');
  const chosen = thermal.chooseThermalCombination([], [[redTee, whiteTee], [greenShorts], [sneakers]], mild);
  assert.ok(chosen.includes(whiteTee), chosen.map(item => item.id).join(','));

  const shirt = piece('shirt', 'base', 'shirt', '#f4f4f4'), joggers = piece('joggers', 'bottom', 'joggers', '#555555'), chinos = piece('chinos', 'bottom', 'woven-trousers', '#555555', { warmth: 1 });
  assert.equal(thermal.assessAesthetics([shirt, joggers, sneakers]).formalityClash, true);
  const smart = thermal.chooseThermalCombination([shirt], [[joggers, chinos], [sneakers]], thermal.thermalContext(weatherAt(20)));
  assert.equal(thermal.assessItems(smart, thermal.thermalContext(weatherAt(20))).fit, thermal.assessItems([shirt, joggers, sneakers], thermal.thermalContext(weatherAt(20))).fit);
  assert.ok(smart.includes(chinos), smart.map(item => item.id).join(','));

  // A thermal verdict always wins: in the cold the warm option is kept even if its colour clashes.
  const cold = thermal.thermalContext(weatherAt(6, { windSpeed: 12 }));
  const base = [piece('tee', 'base', 'short-sleeve-tee', '#f4f4f4', { warmth: 1 })];
  const outer = [piece('navy-jacket', 'outer', 'light-jacket', '#1f2a44', { warmth: 1 }), piece('orange-jacket', 'outer', 'light-jacket', '#ff6600', { warmth: 5 })];
  const trousers = [piece('purple-trousers', 'bottom', 'joggers', '#9900cc', { warmth: 4 })];
  const mid = [piece('fleece', 'mid', 'fleece', '#9900cc', { warmth: 4 })];
  const warmPick = thermal.chooseThermalCombination([], [base, mid, outer, trousers], cold);
  const navyFit = thermal.assessItems([base[0], mid[0], outer[0], trousers[0]], cold).fit, orangeFit = thermal.assessItems([base[0], mid[0], outer[1], trousers[0]], cold).fit;
  if (navyFit !== orangeFit) assert.ok(warmPick.includes(orangeFit === 'acceptable' ? outer[1] : outer[0]), 'thermal class decides first');
});

test('the card line names the model and the rule honestly', () => {
  const navy = piece('navy', 'outer', 'light-jacket', '#1f2a44'), beige = piece('beige', 'bottom', 'woven-trousers', '#d4b996');
  assert.match(thermal.aestheticNote(thermal.assessAesthetics([navy, beige]), 'tr'), /^Görünüş: renkler (uyumlu|kabul edilebilir) \(Ou–Luo\) · resmiyet tutarlı \(kural tabanlı\)$/);
  const unknown = thermal.assessAesthetics([piece('a', 'base', 'short-sleeve-tee', '#c7cebf', { colorType: 'unknown' }), piece('b', 'bottom', 'jeans', '#c7cebf', { colorType: 'unknown' })]);
  assert.equal(unknown.harmony, null);
  assert.match(thermal.aestheticNote(unknown, 'en'), /^Look: no colour data · formality consistent \(rule-based\)$/);
});
