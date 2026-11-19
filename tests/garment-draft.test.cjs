const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const draft = require('../lib/garment-draft.ts');

const choices = patch => ({ name: 'Test parçası', category: 'mid', garmentTypeId: null, material: '', colorHex: null,
  warmth: null, waterResistance: null, windResistance: null, ...patch });

test('garment types are matched on whole words, longest term first', () => {
  assert.equal(draft.matchGarmentType('Lacivert yün kazak'), 'sweater');
  assert.equal(draft.matchGarmentType('Yün kaban'), 'coat-parka');
  assert.equal(draft.matchGarmentType('Siyah şişme mont'), 'puffer');
  assert.equal(draft.matchGarmentType('Kazakistan hatırası'), null);
  assert.equal(draft.matchGarmentType('Bir şey'), null);
});

test('one-piece garments are not offered until they have a wardrobe slot', () => {
  assert.ok(draft.DRAFT_TYPE_IDS.length > 10);
  assert.ok(draft.DRAFT_TYPE_IDS.includes('sweater'));
  const { GARMENT_TYPES } = require('../lib/catalog/taxonomy.ts');
  for (const type of GARMENT_TYPES.filter(item => item.group === 'one_piece')) assert.ok(!draft.DRAFT_TYPE_IDS.includes(type.id));
});

test('invalid or missing AI fields become null, never a default', () => {
  const result = draft.sanitizeAiDraft({ name: '  ', category: 'hat', garmentTypeId: 'spaceship', warmth: 7, material: 3,
    colorHex: 'red', colorName: 'Kırmızı', waterResistance: 'maybe', windResistance: 'high' }, 'Kırmızı bere');
  assert.equal(result.name, 'Kırmızı bere');
  assert.equal(result.category, 'mid');
  assert.equal(result.garmentTypeId, null);
  assert.equal(result.material, null);
  assert.equal(result.colorHex, null);
  assert.equal(result.colorName, null, 'a colour name without a valid colour is dropped');
  assert.deepEqual(result.suggestions, { warmth: null, waterResistance: null, windResistance: 'high' });
  assert.equal(result.source, 'gemini');
  assert.equal(draft.sanitizeAiDraft('not json', '').name, 'Yeni gardırop parçası');
});

test('a known AI garment type decides the category', () => {
  const result = draft.sanitizeAiDraft({ name: 'Kazak', category: 'outer', garmentTypeId: 'sweater', colorHex: '#1E3A8A', colorName: 'Lacivert' }, '');
  assert.equal(result.category, 'mid');
  assert.equal(result.colorHex, '#1e3a8a');
  assert.equal(result.colorName, 'Lacivert');
});

test('local rules use only the user’s words and keep temperature words as suggestions', () => {
  const wool = draft.rulesDraft('Lacivert yün kazak');
  assert.equal(wool.garmentTypeId, 'sweater');
  assert.equal(wool.category, 'mid');
  assert.equal(wool.material, 'Yün');
  assert.equal(wool.colorHex, '#1e3a8a');
  assert.deepEqual(wool.suggestions, { warmth: 4, waterResistance: null, windResistance: null });
  assert.equal(wool.source, 'rules');

  const plain = draft.rulesDraft('Mont');
  assert.equal(plain.category, 'outer');
  assert.equal(plain.material, null);
  assert.equal(plain.colorHex, null);
  assert.deepEqual(plain.suggestions, { warmth: null, waterResistance: null, windResistance: null }, 'nothing is guessed from a bare garment name');

  assert.equal(draft.rulesDraft('Su geçirmez rüzgarlık').suggestions.waterResistance, 'waterproof');
  assert.equal(draft.rulesDraft('Su geçirmez rüzgarlık').suggestions.windResistance, 'high');
  assert.equal(draft.rulesDraft('İnce yün hırka').suggestions.warmth, null, 'conflicting words give no suggestion');
  assert.equal(draft.rulesDraft('Keten gömlek').suggestions.warmth, 1);
});

test('English descriptions get the same honest rules, with the material named in English', () => {
  const wool = draft.rulesDraft('Navy wool sweater');
  assert.equal(wool.garmentTypeId, 'sweater');
  assert.equal(wool.material, 'Wool');
  assert.equal(wool.colorHex, '#1e3a8a');
  assert.deepEqual(wool.suggestions, { warmth: 4, waterResistance: null, windResistance: null });

  const shell = draft.rulesDraft('Black waterproof jacket');
  assert.equal(shell.category, 'outer');
  assert.equal(shell.colorName, 'Siyah');
  assert.equal(shell.material, null);
  assert.deepEqual(shell.suggestions, { warmth: null, waterResistance: 'waterproof', windResistance: null });

  assert.equal(draft.rulesDraft('Merino wool base layer').material, 'Merino wool');
  assert.equal(draft.rulesDraft('Linen summer shirt').suggestions.warmth, 1);
  assert.equal(draft.rulesDraft('Water repellent windbreaker').suggestions.waterResistance, 'light');
  assert.equal(draft.rulesDraft('Water repellent windbreaker').suggestions.windResistance, 'high');
  assert.equal(draft.rulesDraft('Leather boots').category, 'footwear');
  assert.equal(draft.rulesDraft('Grey trousers').category, 'bottom');
});

test('words are matched at word boundaries, so unrelated words do not become facts or suggestions', () => {
  // "since" contains "ince", "tank" is not "tan", "redesigned" is not "red".
  const tee = draft.rulesDraft('Tee I have worn since 2019, redesigned print');
  assert.equal(tee.category, 'base');
  assert.equal(tee.colorHex, null);
  assert.equal(tee.suggestions.warmth, null);
  assert.equal(draft.rulesDraft('Tank top').colorHex, null);
  // Turkish suffixes still count.
  assert.equal(draft.rulesDraft('Yünlü kalın hırka').suggestions.warmth, 4);
  assert.equal(draft.rulesDraft('Yünlü kalın hırka').material, 'Yün');
  assert.equal(draft.rulesDraft('Kot pantolon').category, 'bottom');
});

test('only confirmed values reach the wardrobe; unknowns stay unknown', () => {
  const unknown = draft.draftToWardrobeItem(choices({}), 'w-draft-test');
  assert.equal(unknown.warmth, null);
  assert.equal(unknown.waterResistance, null);
  assert.equal(unknown.windResistance, null);
  assert.equal(unknown.colorType, 'unknown');
  assert.equal(unknown.colorName, 'Renk bilinmiyor');
  assert.equal(unknown.materialConfirmed, false);
  assert.equal(unknown.dataSource, 'user');
  assert.equal('garmentTypeId' in unknown, false);

  const known = draft.draftToWardrobeItem(choices({ garmentTypeId: 'sweater', material: ' Yün ', colorHex: '#1e3a8a', warmth: 4, windResistance: 'medium' }), 'w-draft-test');
  assert.equal(known.garmentTypeId, 'sweater');
  assert.equal(known.material, 'Yün');
  assert.equal(known.materialConfirmed, true);
  assert.equal(known.colorHex, '#1e3a8a');
  assert.equal(known.colorType, 'neutral');
  assert.equal(known.warmth, 4);
  assert.equal(known.waterResistance, null);
  assert.equal(known.windResistance, 'medium');
});
