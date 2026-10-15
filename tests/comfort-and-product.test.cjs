const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { normalizeBarcode } = require('../lib/product-lookup.ts');
const { communityPayload, computeThermalProfile, itemComfortAdjustment, personalizeOutfit } = require('../lib/comfort.ts');
const { validateContribution, summarizeContributions, contribute, deleteContributions, communitySummary } = require('../lib/community-store.ts');

const report = outcome => ({ id: 'fixture', timestamp: '2026-10-16T12:00:00Z', location: 'DO NOT SHARE', notes: 'PRIVATE NOTE', rating: 5, bestSource: 'test', clothingResult: outcome, context: { worn: true, liveWeather: true, items: [{ key: 'gtin:04006381333931', name: 'Private wardrobe item', category: 'outer' }], itemKey: 'gtin:04006381333931', feelsLike: 13, windSpeed: 10, precipitationProb: 45, activity: 'walking' } });

test('EAN/UPC checksum rejects typo, invalid lengths and URL-like input', () => {
  assert.equal(normalizeBarcode('4006381333931'), '4006381333931');
  assert.equal(normalizeBarcode('04006381333931'), '04006381333931');
  for (const invalid of ['4006381333932', '123', '-4006381333931', 'https://4006381333931']) assert.equal(normalizeBarcode(invalid), null);
});
test('the shipped scanner decodes an EAN-13 pixel fixture', () => {
  const z = require('@zxing/library');
  const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  const code = '4006381333931', parity = 'LGLLGG';
  let bits = '00000000000101';
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === 'L' ? L : G)[Number(code[i])];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += L[Number(code[i])].replace(/[01]/g, x => x === '0' ? '1' : '0');
  bits += '10100000000000';
  const width = bits.length * 3, height = 100, pixels = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixels[y * width + x] = bits[Math.floor(x / 3)] === '1' ? 0 : 255;
  const bitmap = new z.BinaryBitmap(new z.HybridBinarizer(new z.RGBLuminanceSource(pixels, width, height)));
  assert.equal(new z.MultiFormatReader().decodeWithState(bitmap).getText(), code);
});
test('personal profile moves toward warmer or cooler recommendations without item-specific double counting', () => {
  const cold = report('froze'); delete cold.context.itemKey;
  assert.ok(computeThermalProfile([cold]).offsetC < 0);
  const hot = report('sweated'); delete hot.context.itemKey;
  assert.ok(computeThermalProfile([hot]).offsetC > 0);
  assert.equal(computeThermalProfile([report('froze')]).offsetC, 0);
  assert.ok(Math.abs(computeThermalProfile(Array.from({ length: 100 }, () => cold)).offsetC) <= 3);
});
test('item ranking responds only to confirmed, comparable personal experience', () => {
  const item = { id: 'one', barcode: '4006381333931' }, weather = { feelsLike: 14, precipitationProb: 60 };
  assert.ok(itemComfortAdjustment(item, weather, [report('froze')]) < 0);
  assert.ok(itemComfortAdjustment(item, weather, [report('perfect')]) > 0);
  assert.equal(itemComfortAdjustment(item, { ...weather, feelsLike: 30 }, [report('froze')]), 0);
  assert.equal(itemComfortAdjustment(item, { ...weather, precipitationProb: 10 }, [report('wet')]), 0);
});
test('community payload excludes identifying context and needs product identity plus real weather', () => {
  const input = communityPayload(report('froze'));
  assert.equal(input.temperatureBand, 10);
  assert.deepEqual(Object.keys(input).sort(), ['version', 'consent', 'product', 'outcome', 'temperatureBand', 'windBand', 'rainBand', 'activity'].sort());
  assert.ok(!JSON.stringify(input).includes('PRIVATE'));
  const noWeather = report('froze'); noWeather.context.liveWeather = false;
  assert.equal(communityPayload(noWeather), null);
  const template = report('froze'); template.context.itemKey = 'item:template';
  assert.equal(communityPayload(template), null);
  assert.equal(validateContribution({ ...input, lat: 41 }), null);
  assert.equal(validateContribution({ ...input, consent: false }), null);
  assert.equal(validateContribution({ ...input, product: 'gtin:04006381333932' }), null);
  assert.ok(validateContribution(input));
});
test('negative piece feedback selects a better alternative while retaining rain protection', () => {
  const base = { id: 'base', barcode: '4006381333931', category: 'outer', warmth: 2, waterResistance: 'waterproof' };
  const warm = { id: 'warm', category: 'outer', warmth: 4, waterResistance: 'waterproof' };
  const unprotected = { id: 'dry-only', category: 'outer', warmth: 4, waterResistance: 'none' };
  const weather = { feelsLike: 10, precipitationProb: 60 };
  assert.equal(personalizeOutfit([base], [warm], weather, [report('froze')])[0].id, 'warm');
  assert.equal(personalizeOutfit([base], [unprotected], weather, [report('froze')])[0].id, 'base');
  assert.equal(personalizeOutfit([base], [warm], weather, [])[0].id, 'base');
});
test('community candidates need enough distinct browsers and remain subject to review', () => {
  const input = communityPayload(report('froze'));
  const rows = Array.from({ length: 30 }, (_, i) => ({ ...input, participant: String(i), day: '2026-10-16' }));
  assert.equal(summarizeContributions(rows.slice(0, 29)).length, 0);
  assert.equal(summarizeContributions(rows.map(row => ({ ...row, participant: 'same-device' }))).length, 0);
  assert.equal(summarizeContributions(rows)[0].state, 'review-required');
  const mixed = rows.map((row, i) => ({ ...row, outcome: i < 15 ? 'froze' : 'perfect' }));
  assert.equal(summarizeContributions(mixed).length, 0);
});
test('file pilot replaces duplicate daily votes and deletes a participant contribution', async () => {
  const path = require('node:path'), os = require('node:os');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'weathrobe-test-'));
  const old = process.env.WEAR_WEATHER_COMMUNITY_DIR;
  process.env.WEAR_WEATHER_COMMUNITY_DIR = directory;
  try {
    const input = communityPayload(report('froze'));
    await contribute(input, 'test-contributor'); await contribute(input, 'test-contributor');
    const file = path.join(directory, 'contributions.json');
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).length, 1);
    assert.deepEqual(await communitySummary(), []);
    await deleteContributions('test-contributor');
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), []);
    fs.unlinkSync(file);
  } finally { if (old === undefined) delete process.env.WEAR_WEATHER_COMMUNITY_DIR; else process.env.WEAR_WEATHER_COMMUNITY_DIR = old; try { for (const name of fs.readdirSync(directory)) if (/^contributions\.json(?:\.[a-f0-9]+\.tmp)?$/.test(name)) fs.unlinkSync(path.join(directory, name)); fs.rmdirSync(directory); } catch (cleanupError) { console.error('Test cleanup:', cleanupError.message); } }
});
