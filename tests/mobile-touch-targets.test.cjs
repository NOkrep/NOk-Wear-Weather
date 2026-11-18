const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// WW-03 M1–M2: touch screens get 16 px input text (no iOS focus zoom) and 44 px tap heights.
const css = fs.readFileSync(path.join(__dirname, '..', 'app', 'globals.css'), 'utf8');
const start = css.indexOf('@media (pointer: coarse) {');
const end = css.indexOf('/* End WW-03 M1–M2 */');
const block = start >= 0 && end > start ? css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, '') : '';

// Returns the declarations of every rule in the block whose selector list contains `selector`.
const declarationsFor = selector => [...block.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selectors]) => selectors.split(',').map(s => s.trim()).includes(selector))
  .map(([, , body]) => body)
  .join(';');

test('the touch block exists and only applies to coarse pointers', () => {
  assert.ok(block, 'WW-03 coarse-pointer block is present');
  assert.ok(css.lastIndexOf('@media (pointer: coarse)') === start, 'one coarse-pointer block, after the base rules');
});

test('text inputs and the language select use 16 px on touch screens', () => {
  for (const selector of ['.manual-location input', '.map-search-bar > input', '.map-search-bar input[type="time"]', '.map-stop-pill input', '.language-select select']) {
    assert.match(declarationsFor(selector), /font-size:\s*16px/, selector);
  }
});

test('small controls reach a 44 px tap height on touch screens', () => {
  for (const selector of ['.manual-location input', '.locate-text-button', '.location-results button', '.language-select select',
    '.header-actions .icon-button', '.header-actions .preview-toggle', '.map-panel .city-map-studio .map-click-mode',
    '.map-stop-pill > button', '.map-stop-pill input', '.map-search-bar > input', '.map-search-bar input[type="time"]',
    '.map-search-results .primary-button', '.map-search-results .text-button', '.draft-suggestion']) {
    const declarations = declarationsFor(selector);
    assert.match(declarations, /min-height:\s*44px/, selector);
    assert.match(declarations, /touch-action:\s*manipulation/, selector);
  }
  assert.match(declarationsFor('.header-actions .icon-button'), /(^|[;\s])height:\s*44px/);
});
