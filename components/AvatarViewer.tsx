'use client';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { useLocale } from '@/lib/i18n';
import type { ClothingItem } from '@/lib/types';
import type { AvatarProfile, AvatarView } from '@/lib/avatar-profile';
import { avatarGarments, avatarOutfitSignature, type AvatarGarment } from '@/lib/avatar-garments';
import { createGarmentGeometry, createGarmentMaterial, createGarmentDetails } from '@/lib/garment-mesh';

interface Props { profile: AvatarProfile; items?: ClothingItem[]; view?: AvatarView; portrait?: boolean; onRotate?: () => void }

function poseArm(bone: THREE.Object3D, angle: number) {
  const world = bone.getWorldQuaternion(new THREE.Quaternion());
  const parent = bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert();
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
  bone.quaternion.copy(parent.multiply(rotation.multiply(world))); bone.updateMatrixWorld(true);
}

function Actor({ profile, garments, onReady }: { profile: AvatarProfile; garments: AvatarGarment[]; onReady: () => void }) {
  const body = useGLTF(`/avatars/${profile.body}.gltf`);
  const hair = useGLTF(`/avatars/${profile.hair === 'none' ? 'parted' : profile.hair}.gltf`);
  const beard = useGLTF('/avatars/beard.gltf');
  const actor = useMemo(() => {
    const root = clone(body.scene), ownedGeometry: THREE.BufferGeometry[] = [], ownedMaterial: THREE.Material[] = [];
    const ownedTextures: THREE.Texture[] = [];
    const materials = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.frustumCulled = false;
      const copyMaterial = (source: THREE.Material) => {
        if (materials.has(source)) return materials.get(source)!;
        const material = (source as THREE.MeshStandardMaterial).clone();
        material.vertexColors = false; material.metalness = 0; material.roughness = .75;
        if (/hair/i.test(material.name)) material.color.set(profile.hairColor);
        if (/superhero/i.test(material.name)) {
          material.color.set(profile.mode === 'porcelain' ? '#e8e9e3' : profile.skinTone);
          if (profile.mode === 'porcelain') material.map = null;
        }
        materials.set(source, material); ownedMaterial.push(material); return material;
      };
      object.material = Array.isArray(object.material) ? object.material.map(copyMaterial) : copyMaterial(object.material);
    });
    const bodyMeshes: THREE.SkinnedMesh[] = [];
    root.traverse(object => { if (object instanceof THREE.SkinnedMesh && /superhero/i.test(object.name)) bodyMeshes.push(object); });
    const fit = { height: profile.body === 'body-b' ? .976 : 1, armScale: profile.body === 'body-b' ? .9 : 1 };
    for (const mesh of bodyMeshes) {
      for (const entry of garments) {
        const geometry = createGarmentGeometry(mesh.geometry, entry, fit);
        const material = createGarmentMaterial(entry);
        if (material.map) ownedTextures.push(material.map);
        ownedGeometry.push(geometry); ownedMaterial.push(material);
        const garment = new THREE.SkinnedMesh(geometry, material);
        garment.name = `Weathrobe ${entry.template} · ${entry.slot}`;
        garment.userData.garmentTemplate = entry.template;
        garment.bind(mesh.skeleton, mesh.bindMatrix); garment.frustumCulled = false;
        mesh.parent!.add(garment);
        for (const detail of createGarmentDetails(entry, fit, material)) { ownedGeometry.push(detail.geometry); mesh.parent!.add(detail); }
      }
    }
    root.updateMatrixWorld(true);
    const left = root.getObjectByName('upperarm_l'), right = root.getObjectByName('upperarm_r');
    if (left) poseArm(left, -1.25); if (right) poseArm(right, 1.25);
    const width = profile.build === 'slim' ? .92 : profile.build === 'broad' ? 1.08 : 1;
    root.scale.set(width, 1, width);
    const addHair = (scene: THREE.Group, nativeBody: 'body-a' | 'body-b') => {
      const part = scene.clone(true);
      part.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const source = object.material as THREE.MeshStandardMaterial;
        const material = source.clone(); material.color.set(profile.hairColor); material.vertexColors = false; material.roughness = .82;
        if (garments.some(entry => entry.template === 'beanie')) material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.735 * fit.height)];
        object.material = material; ownedMaterial.push(material);
      });
      const heightRatio = nativeBody === profile.body ? 1 : profile.body === 'body-b' ? .976 : 1 / .976;
      const sideFit = nativeBody === profile.body ? 1 : profile.body === 'body-b' ? .96 : 1 / .96;
      part.scale.set(width * sideFit, heightRatio, width * sideFit);
      return part;
    };
    const group = new THREE.Group(); group.add(root);
    if (profile.hair !== 'none') group.add(addHair(hair.scene, ['pixie', 'long', 'buns'].includes(profile.hair) ? 'body-b' : 'body-a'));
    if (profile.beard) group.add(addHair(beard.scene, 'body-a'));
    return { group, dispose: () => {
      ownedGeometry.forEach(geometry => geometry.dispose()); ownedMaterial.forEach(material => material.dispose());
      ownedTextures.forEach(texture => texture.dispose());
      const skeletons = new Set<THREE.Skeleton>(); root.traverse(object => { if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton); });
      skeletons.forEach(skeleton => skeleton.dispose());
    } };
  }, [body.scene, hair.scene, beard.scene, profile.body, profile.build, profile.mode, profile.skinTone, profile.hair, profile.hairColor, profile.beard, garments]);
  const reported = useRef(false), reportFrame = useRef(0), invalidate = useThree(state => state.invalidate);
  useEffect(() => { reported.current = false; invalidate(); return () => { cancelAnimationFrame(reportFrame.current); actor.dispose(); }; }, [actor, onReady, invalidate]);
  useFrame(() => { if (!reported.current) { reported.current = true; reportFrame.current = requestAnimationFrame(onReady); } });
  return <primitive object={actor.group} dispose={null} />;
}

function Camera({ portrait, view, onRotate }: Pick<Props, 'portrait' | 'view' | 'onRotate'>) {
  const { camera, invalidate } = useThree();
  const angle = view === 'side' ? Math.PI / 2 : view === 'back' ? Math.PI : 0;
  const distance = portrait ? .72 : 3.05, targetY = portrait ? 1.66 : .94;
  useEffect(() => {
    if (view === 'free') return;
    camera.position.set(Math.sin(angle) * distance, targetY + .04, Math.cos(angle) * distance);
    camera.lookAt(0, targetY, 0); camera.updateProjectionMatrix(); invalidate();
  }, [view, angle, distance, targetY, camera, invalidate]);
  return <OrbitControls makeDefault target={[0, targetY, 0]} enablePan={false} enableZoom={false} enableDamping={false} minPolarAngle={Math.PI * .36} maxPolarAngle={Math.PI * .58} onStart={onRotate} />;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function AvatarViewer({ profile, items, view = 'front', portrait = false, onRotate }: Props) {
  const { t } = useLocale();
  const outfit = useMemo(() => avatarGarments(items ?? []), [items]);
  const signature = [profile.body, profile.build, profile.mode, profile.skinTone, profile.hair, profile.hairColor, profile.beard, avatarOutfitSignature(outfit.garments)].join('|');
  const [readySignature, setReady] = useState('');
  const ready = readySignature === signature;
  const reportReady = useMemo(() => () => setReady(signature), [signature]);
  const fallback = <div className="avatar-render-fallback"><img src="/avatars/previews/default.png" alt={t('Karakterin sabit önizlemesi')} /><p>{t('Bu cihazda 3D açılamadı. Parçalarını incelemeye devam edebilirsin.')}</p></div>;
  return <div className={`avatar-canvas ${portrait ? 'avatar-portrait' : ''}`} role="img" aria-label={t('Döndürülebilen kişisel 3D karakter')} data-avatar-ready={ready} data-avatar-body={profile.body} data-avatar-hair={profile.hair} data-avatar-outfit={avatarOutfitSignature(outfit.garments)}>
    <SceneBoundary fallback={fallback}>
      {!ready && <span className="avatar-loading" role="status">{t('Karakter hazırlanıyor…')}</span>}
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1, 3.05], fov: 36, near: .05, far: 20 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} onCreated={({ gl }) => { gl.localClippingEnabled = true; }} fallback={fallback}>
        <ambientLight intensity={1.5} />
        <hemisphereLight args={['#fff5e5', '#a6b1b5', 1.8]} />
        <directionalLight position={[2, 3, 4]} intensity={2.5} color="#fff4e7" />
        <directionalLight position={[-3, 2, -2]} intensity={2} color="#c4e0ec" />
        <Suspense fallback={null}><Actor profile={profile} garments={outfit.garments} onReady={reportReady}/></Suspense>
        <Camera view={view} portrait={portrait} onRotate={onRotate} />
      </Canvas>
    </SceneBoundary>
  </div>;
}

