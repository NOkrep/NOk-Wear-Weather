const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const THREE = require('three');
const { avatarGarments, avatarOutfitSignature } = require('../lib/avatar-garments.ts');
const { createGarmentGeometry, createGarmentMaterial, createGarmentDetails } = require('../lib/garment-mesh.ts');
const item = (id, category, garmentTypeId, personalAppearance) => ({ id, category, garmentTypeId, personalAppearance, name: id, colorHex: '#556677' });
const outfit = [item('tee', 'base', 'short-sleeve-tee'), item('hoodie', 'mid', 'sweatshirt', { version: 1, neckline: 'hood' }), item('jacket', 'outer', 'light-jacket'), item('pants', 'bottom', 'woven-trousers'), item('shoes', 'footwear', 'sneakers')];

// Decode installed CC0 glTF buffers directly: the CPU test exercises real geometry for both rigs.
function bodyGeometry(base) {
  const root = path.join(__dirname, '../public/avatars');
  const gltf = JSON.parse(fs.readFileSync(path.join(root, `${base}.gltf`), 'utf8'));
  const primitive = gltf.meshes[2].primitives[0];
  const geometry = new THREE.BufferGeometry();
  const attribute = id => {
    const a = gltf.accessors[id], view = gltf.bufferViews[a.bufferView];
    const raw = fs.readFileSync(path.join(root, gltf.buffers[view.buffer].uri));
    const data = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const [Ctor, read, bytes] = { 5121: [Uint8Array, 'getUint8', 1], 5123: [Uint16Array, 'getUint16', 2], 5125: [Uint32Array, 'getUint32', 4], 5126: [Float32Array, 'getFloat32', 4] }[a.componentType];
    const values = new Ctor(a.count * components), stride = view.byteStride || components * bytes;
    for (let i = 0; i < a.count; i++) for (let j = 0; j < components; j++) values[i * components + j] = data[read]((view.byteOffset || 0) + (a.byteOffset || 0) + i * stride + j * bytes, true);
    return new THREE.BufferAttribute(values, components, a.normalized || false);
  };
  for (const [key, name] of Object.entries({ POSITION: 'position', NORMAL: 'normal', JOINTS_0: 'skinIndex', WEIGHTS_0: 'skinWeight' })) geometry.setAttribute(name, attribute(primitive.attributes[key]));
  geometry.setIndex(attribute(primitive.indices));
  return geometry;
}

test('appearance changes reach 3D descriptors while unknown source colours and unsupported shapes remain honest', () => {
  const original = item('owned', 'base', 'long-sleeve-tee');
  const edited = { ...original, personalAppearance: { version: 1, color: '#aabbcc', pattern: 'checks', fit: 'relaxed' } };
  const before = avatarGarments([original]), after = avatarGarments([edited]);
  assert.notEqual(avatarOutfitSignature(before.garments), avatarOutfitSignature(after.garments));
  assert.equal(after.garments.find(g => g.slot === 'base').appearance.color, '#aabbcc');
  assert.equal(original.colorHex, '#556677');
  assert.ok(after.garments.filter(g => g.slot !== 'base').every(g => g.placeholder));
  assert.equal(avatarGarments([item('skirt', 'bottom', 'skirt')]).unsupported.length, 1);
  assert.ok(avatarGarments([item('hat', 'accessory', 'sun-hat')]).unsupported.length);
});

test('six core templates and supported accessories produce finite, normalized skinned meshes for both real bodies', () => {
  const entries = [...outfit, item('long', 'base', 'long-sleeve-tee'), ...['beanie', 'scarf', 'gloves', 'socks'].map(type => item(type, 'accessory', type))];
  const garments = entries.map(piece => avatarGarments([piece]).garments.find(g => !g.placeholder));
  assert.equal(new Set(garments.map(g => g.template)).size, 10);
  for (const base of ['body-a', 'body-b']) {
    const source = bodyGeometry(base), before = Buffer.from(source.attributes.position.array.buffer).toString('base64');
    const fit = { height: base === 'body-b' ? .976 : 1, armScale: base === 'body-b' ? .9 : 1 };
    for (const entry of garments) {
      const geometry = createGarmentGeometry(source, entry, fit), position = geometry.attributes.position;
      assert.ok(position.count > 15 && position.count < 100000, `${base} ${entry.template}: ${position.count}`);
      for (const name of ['position', 'normal', 'uv', 'skinWeight']) assert.ok([...geometry.attributes[name].array].every(Number.isFinite), `${base} ${entry.template} ${name}`);
      for (let i = 0; i < position.count; i++) {
        const weights = geometry.attributes.skinWeight, joints = geometry.attributes.skinIndex;
        assert.ok(Math.abs([0, 1, 2, 3].reduce((sum, j) => sum + weights.getComponent(i, j), 0) - 1) < 1e-5);
        for (let j = 0; j < 4; j++) assert.ok(joints.getComponent(i, j) < 65);
      }
      const material = createGarmentMaterial(entry), details = createGarmentDetails(entry, fit, material);
      details.forEach(mesh => { assert.ok(mesh.geometry.attributes.position.count > 0); mesh.geometry.dispose(); });
      material.map?.dispose(); material.dispose(); geometry.dispose();
    }
    assert.equal(Buffer.from(source.attributes.position.array.buffer).toString('base64'), before);
    source.dispose();
  }
});

test('short sleeves, cropped hems and loose fit change geometry rather than just metadata', () => {
  const source = bodyGeometry('body-a'), fit = { height: 1, armScale: 1 };
  const make = piece => { const entry = avatarGarments([piece]).garments.find(g => !g.placeholder); const geometry = createGarmentGeometry(source, entry, fit); geometry.computeBoundingBox(); return geometry; };
  const tee = make(item('tee', 'base', 'short-sleeve-tee')), long = make(item('long', 'base', 'long-sleeve-tee'));
  assert.ok(tee.boundingBox.max.x < long.boundingBox.max.x);
  const pants = make(item('pants', 'bottom', 'woven-trousers')), shorts = make(item('shorts', 'bottom', 'shorts'));
  assert.ok(shorts.boundingBox.min.y > pants.boundingBox.min.y);
  const slim = make(item('top', 'base', 'short-sleeve-tee', { version: 1, fit: 'slim' })), loose = make(item('top', 'base', 'short-sleeve-tee', { version: 1, fit: 'oversized' }));
  assert.ok(loose.boundingBox.max.z > slim.boundingBox.max.z);
  [tee, long, pants, shorts, slim, loose, source].forEach(geometry => geometry.dispose());
});

test('all patterned materials use local deterministic texture data with independently disposable resources', () => {
  const hashes = new Set();
  for (const pattern of ['stripes', 'checks', 'dots', 'colour-block']) {
    const entry = avatarGarments([item('top', 'base', 'short-sleeve-tee', { version: 1, color: '#123456', accentColor: '#ffffff', pattern })]).garments.find(g => !g.placeholder);
    const material = createGarmentMaterial(entry);
    assert.equal(material.map.isDataTexture, true);
    assert.equal(material.map.image.data.length, 64 * 64 * 4);
    hashes.add(Buffer.from(material.map.image.data).toString('base64'));
    let disposed = false; material.map.addEventListener('dispose', () => { disposed = true; }); material.map.dispose(); material.dispose(); assert.equal(disposed, true);
  }
  assert.equal(hashes.size, 4);
});
