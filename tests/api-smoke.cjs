const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:3000';
(async () => {
  let response = await fetch(base + '/api/product?barcode=4006381333932');
  assert.equal(response.status, 400);
  response = await fetch(base + '/api/community', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 403);
  response = await fetch(base + '/api/community', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  const payload = { version: 1, consent: true, product: 'gtin:04006381333931', outcome: 'froze', temperatureBand: 10, windBand: 'calm', rainBand: 'dry', activity: 'walking' };
  response = await fetch(base + '/api/community', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, lat: 41 }) });
  assert.equal(response.status, 400);
  let cookie;
  try {
    response = await fetch(base + '/api/community', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(response.status, 200);
    cookie = response.headers.get('set-cookie').split(';')[0];
  } finally {
    if (cookie) {
      response = await fetch(base + '/api/community', { method: 'DELETE', headers: { Origin: base, Cookie: cookie } });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).deleted, true);
    }
  }
  console.log('6 HTTP checks passed: invalid barcode, origin, malformed JSON, privacy allowlist, consented save, participant deletion.');
})().catch(error => { console.error(error); process.exitCode = 1; });
