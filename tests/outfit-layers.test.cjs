const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { outfitSlot, selectOutfitLayers } = require('../lib/outfit-layers.ts');
const { matchSelectedItems } = require('../lib/outfit-matching.ts');
const { matchFromUserWardrobe } = require('../lib/wardrobe-storage.ts');
const { personalizeOutfit, itemIdentity } = require('../lib/comfort.ts');
const weather = { temp: 6, feelsLike: 4, windSpeed: 10, precipitationProb: 0, uvIndex: 0, condition: 'cloudy' };
const piece = (id, type, patch = {}) => ({ id, garmentTypeId: type, name: id, category: 'accessory', segment: 'essential', material: '', warmth: 3, waterResistance: null, windResistance: null, colorHex: '#556677', colorType: 'neutral', colorName: '', description: '', ...patch });

test('head, neck, hands and socks coexist; only a second headwear choice becomes an alternative', () => {
  const hat = piece('hat', 'beanie'), scarf = piece('scarf', 'scarf'), gloves = piece('gloves', 'gloves'), socks = piece('socks', 'socks'), cap = piece('cap', 'sun-hat');
  const result = matchSelectedItems([hat, scarf, gloves, socks, cap], weather);
  assert.deepEqual(result.alternatives, [hat]);
  assert.ok([cap, scarf, gloves, socks].every(item => result.lockedItems.includes(item)));
  assert.ok(!result.items.includes(hat));
  assert.equal(new Set(result.items.map(outfitSlot)).size, result.items.length);
  const restored = matchSelectedItems([hat, scarf, gloves, socks], weather);
  assert.ok(restored.lockedItems.includes(hat));
});

test('wardrobe suggestions select relevant independent accessories without making warm hats a summer recommendation', () => {
  const accessories = [piece('hat', 'beanie'), piece('scarf', 'scarf'), piece('gloves', 'gloves'), piece('socks', 'socks'), piece('cap', 'sun-hat')];
  const before = JSON.stringify(accessories);
  const cold = matchFromUserWardrobe(accessories, weather).selectedItems;
  assert.deepEqual(new Set(cold.map(item => item.garmentTypeId)), new Set(['beanie', 'scarf', 'gloves', 'socks']));
  const hot = matchFromUserWardrobe(accessories, { ...weather, temp: 28, feelsLike: 30, uvIndex: 7 }).selectedItems;
  assert.deepEqual(new Set(hot.map(item => item.garmentTypeId)), new Set(['sun-hat', 'socks']));
  assert.equal(JSON.stringify(accessories), before);
});

test('personal styling cannot reassign recommendation slots and negative hat feedback cannot replace it with gloves', () => {
  const hat = piece('hat', 'beanie'), gloves = piece('gloves', 'gloves');
  assert.equal(outfitSlot({ ...hat, personalAppearance: { version: 1, garmentTypeId: 'scarf' } }), 'accessory:head');
  const reports = [{ id: 'r', clothingResult: 'froze', context: { worn: true, liveWeather: true, itemKey: itemIdentity(hat), feelsLike: 4 } }];
  assert.deepEqual(personalizeOutfit([hat], [gloves], weather, reports), [hat]);
  assert.deepEqual(selectOutfitLayers([hat, gloves]).active, [hat, gloves]);
});
