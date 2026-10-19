import * as THREE from 'three';
import type { AvatarGarment } from './avatar-garments';

type Vertex = { p: THREE.Vector3; n: THREE.Vector3; weights: Map<number, number> };
export interface GarmentFit { height: number; armScale: number }

function dimensions(garment: AvatarGarment, fit: GarmentFit) {
  const { appearance: a, template, slot } = garment;
  const offset = slot === 'outer' ? .062 : slot === 'mid' ? .038 : .019;
  const ease = a.fit === 'slim' ? 0 : a.fit === 'relaxed' ? .018 : a.fit === 'oversized' ? .035 : .008;
  const sleeve = a.sleeve === 'none' ? .195 : a.sleeve === 'short' ? .395 : a.sleeve === 'three-quarter' ? .59 : .755;
  const hem = a.length === 'cropped' ? 1.15 : a.length === 'long' || a.type === 'coat-parka' ? .89 : 1.015;
  const legHem = a.type === 'shorts' ? a.length === 'cropped' ? .67 : a.length === 'long' ? .44 : .55 : a.length === 'cropped' ? .27 : .11;
  const bootTop = a.type === 'rain-boots' ? .38 : a.type === 'winter-boots' ? .23 : .112;
  return { offset, ease, sleeve: sleeve * fit.armScale, hem: hem * fit.height, legHem: legHem * fit.height, bootTop: bootTop * fit.height, upper: ['tee', 'long-top', 'sweatshirt', 'jacket'].includes(template) };
}

/** Construct actual skinned garment surfaces in the licensed body's bind space. No browser/canvas needed. */
export function createGarmentGeometry(source: THREE.BufferGeometry, garment: AvatarGarment, fit: GarmentFit) {
  const position = source.getAttribute('position'), normal = source.getAttribute('normal');
  const joint = source.getAttribute('skinIndex'), weight = source.getAttribute('skinWeight'), index = source.getIndex();
  if (!position || !normal || !joint || !weight) throw new Error('Garment template requires a skinned body');
  const { appearance: a, template } = garment, d = dimensions(garment, fit), h = fit.height;
  const boundaries: ((p: THREE.Vector3) => number)[] = d.upper ? [
    p => p.y - d.hem,
    p => d.sleeve - Math.abs(p.x),
    p => {
      const side = Math.min(Math.abs(p.x) / .12, 1);
      const neck = a.neckline === 'v' ? 1.45 + side * .15 : a.neckline === 'turtle' ? 1.615 : 1.535 + side * .065;
      return neck * h - p.y;
    },
    // Keep the upper jacket open enough to show a genuinely separate inner layer.
    p => template !== 'jacket' || p.z < .01 ? 1 : Math.abs(p.x) - .042,
  ] : template === 'trousers' ? [p => p.y - d.legHem, p => 1.035 * h - p.y]
    : template === 'shoes' ? [p => d.bootTop - p.y]
    : template === 'socks' ? [p => p.y - .06, p => .27 * h - p.y]
    : template === 'beanie' ? [p => p.y - 1.73 * h]
    : template === 'scarf' ? [p => p.y - 1.47 * h, p => 1.615 * h - p.y, p => .145 - Math.abs(p.x)]
    : [p => Math.abs(p.x) - .756 * fit.armScale];
  const read = (i: number): Vertex => {
    const weights = new Map<number, number>();
    for (let j = 0; j < 4; j++) { const bone = joint.getComponent(i, j), w = weight.getComponent(i, j); if (w > 0) weights.set(bone, (weights.get(bone) || 0) + w); }
    return { p: new THREE.Vector3().fromBufferAttribute(position, i), n: new THREE.Vector3().fromBufferAttribute(normal, i), weights };
  };
  const mix = (a: Vertex, b: Vertex, t: number): Vertex => {
    const weights = new Map<number, number>();
    a.weights.forEach((w, bone) => weights.set(bone, w * (1 - t)));
    b.weights.forEach((w, bone) => weights.set(bone, (weights.get(bone) || 0) + w * t));
    return { p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize(), weights };
  };
  const positions: number[] = [], normals: number[] = [], joints: number[] = [], weights: number[] = [], uv: number[] = [];
  const append = (vertex: Vertex) => {
    const p = vertex.p, point = p.clone();
    const surfaceNormal = vertex.n.clone();
    const offset = template === 'beanie' ? .045 : template === 'scarf' ? .04 : template === 'shoes' ? .027 : template === 'socks' ? .006 : d.offset;
    point.addScaledVector(vertex.n, offset + d.ease); point.y = p.y;
    if (d.upper && Math.abs(p.x) < .205 && p.y < 1.47 * h) {
      // Relax the waist/chest into a cloth envelope instead of copying the rig's muscles.
      const angle = Math.atan2(p.z + .018, p.x), t = THREE.MathUtils.clamp((p.y / h - 1.0) / .45, 0, 1);
      const rx = .17 + .025 * t + offset + d.ease, rz = .10 + .018 * t + offset + d.ease;
      point.x = Math.cos(angle) * Math.max(rx, Math.abs(point.x));
      point.z = -.018 + Math.sin(angle) * Math.max(rz, Math.abs(point.z + .018));
      surfaceNormal.set(Math.cos(angle) / rx, .08, Math.sin(angle) / rz).normalize();
    }
    if (a.type === 'puffer' && d.upper) point.addScaledVector(vertex.n, .008 * (1 + Math.cos(p.y * 76)));
    positions.push(...point.toArray()); normals.push(...surfaceNormal.toArray()); uv.push(p.x * 10 + .5, p.y * 5);
    const strongest = [...vertex.weights].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = strongest.reduce((total, entry) => total + entry[1], 0) || 1;
    for (let i = 0; i < 4; i++) { joints.push(strongest[i]?.[0] || 0); weights.push((strongest[i]?.[1] || 0) / sum); }
  };
  for (let i = 0, count = index?.count || position.count; i < count; i += 3) {
    let polygon = [0, 1, 2].map(j => read(index ? index.getX(i + j) : i + j));
    for (const boundary of boundaries) {
      const next: Vertex[] = [];
      for (let j = 0; j < polygon.length; j++) {
        const a = polygon[j], b = polygon[(j + 1) % polygon.length], da = boundary(a.p), db = boundary(b.p);
        if (da >= 0) next.push(a);
        if ((da >= 0) !== (db >= 0)) next.push(mix(a, b, da / (da - db)));
      }
      polygon = next; if (!polygon.length) break;
    }
    for (let j = 1; j + 1 < polygon.length; j++) [polygon[0], polygon[j], polygon[j + 1]].forEach(append);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(joints, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeBoundingSphere();
  return geometry;
}

export function createGarmentMaterial(garment: AvatarGarment) {
  const { appearance: a } = garment;
  if (a.pattern === 'plain') return new THREE.MeshStandardMaterial({ color: a.color, roughness: .92, side: THREE.DoubleSide });
  const size = 64, bytes = new Uint8Array(size * size * 4);
  const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const base = rgb(a.color), accent = rgb(a.accentColor);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const marked = a.pattern === 'stripes' ? y % 16 < 5 : a.pattern === 'checks' ? (x % 32 < 9) !== (y % 32 < 9) : a.pattern === 'dots' ? (x % 16 - 8) ** 2 + (y % 16 - 8) ** 2 < 8 : y < 24;
    const color = marked ? accent : base, i = (y * size + x) * 4;
    bytes.set([...color, 255], i);
  }
  const texture = new THREE.DataTexture(bytes, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter; texture.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: .92, side: THREE.DoubleSide });
}

/** Small template-specific parts; the viewer owns and disposes each returned geometry. */
export function createGarmentDetails(garment: AvatarGarment, fit: GarmentFit, material: THREE.MeshStandardMaterial) {
  const { appearance: a, template } = garment, parts: THREE.Mesh[] = [], h = fit.height;
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y * h, z); parts.push(mesh); return mesh;
  };
  if (['tee', 'long-top', 'sweatshirt', 'jacket'].includes(template)) {
    if (a.neckline === 'hood') {
      const hood = add(new THREE.SphereGeometry(1, 20, 12, Math.PI, Math.PI), 0, 1.54, -.02);
      hood.scale.set(.125, .13 * h, .12);
    } else if (a.neckline === 'turtle') {
      const collar = add(new THREE.TorusGeometry(.075, .025, 8, 24), 0, 1.57, 0); collar.rotation.x = Math.PI / 2;
    } else if (a.neckline === 'collar' || a.neckline === 'polo') {
      for (const sign of [-1, 1]) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([sign * .06, 1.55 * h, .065, sign * .13, 1.49 * h, .12, sign * .075, 1.42 * h, .17], 3));
        geometry.computeVertexNormals(); parts.push(new THREE.Mesh(geometry, material));
      }
    }
  }
  if (template === 'shoes') for (const sign of [-1, 1]) add(new THREE.BoxGeometry(.112, .032, .23), sign * .114, .012, .012);
  if (template === 'scarf') add(new THREE.BoxGeometry(.075, .24 * h, .025), .055, 1.355, .17);
  if (template === 'beanie') {
    const crown = add(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0, 1.73, -.012); crown.scale.set(.113, .13 * h, .105);
    const band = add(new THREE.TorusGeometry(.092, .017, 8, 28), 0, 1.735, -.012); band.rotation.x = Math.PI / 2;
  }
  return parts;
}
