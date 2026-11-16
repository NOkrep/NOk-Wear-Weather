import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { GarmentVisual } from '../../components/GarmentVisual';
import { GarmentStudioVisual } from '../../components/GarmentStudioVisual';
import { GARMENT_TYPES } from '../../lib/catalog/taxonomy';
import { findGarmentDesign } from '../../lib/garment-designs';
import type { AppearanceItem } from '../../lib/garment-appearance';

interface StudioAsset {
  type: NonNullable<AppearanceItem['garmentTypeId']>;
  designId: string;
  variant: number;
  label: string;
  file: string;
  width: number;
  height: number;
  sha256: string;
  baseSample: boolean;
  production: { file: string; src: string; width: number; height: number; sha256: string };
  alpha: { opaqueBounds: [number, number, number, number] };
}
interface StudioManifest { assets: StudioAsset[] }
const evidenceRoot = resolve(process.env.NOK_STUDIO_EVIDENCE_ROOT || resolve(__dirname, '../../../NOk_Sites&Extensions/NOk-Weathrobe-Release/evidence/ww21'));
const assetRoot = resolve(evidenceRoot, 'ww21-studio');

// A literal keeps the standalone script independent of TS/tsx bundler helpers.
export const STUDIO_REVIEW_SCRIPT = [
  "const type=document.querySelector('#type'),variant=document.querySelector('#variant'),surface=document.querySelector('#surface'),mode=document.querySelector('#mode');",
  "function filter(){let count=0;document.querySelectorAll('main.studies .study').forEach(study=>{study.hidden=(type.value!=='all'&&study.dataset.type!==type.value)||(variant.value!=='all'&&study.dataset.variant!==variant.value);if(!study.hidden)count++;});document.querySelector('#count').textContent=count+' model gösteriliyor.';}",
  "type.addEventListener('change',filter);variant.addEventListener('change',filter);",
  "surface.addEventListener('change',()=>{document.body.dataset.surface=surface.value==='dark'?'dark':'light';});",
  "mode.addEventListener('change',()=>{document.body.dataset.mode=mode.value==='studio'?'studio':'compare';});",
  "document.querySelectorAll('button[data-size]').forEach(button=>button.addEventListener('click',()=>{document.body.dataset.size=button.dataset.size;document.querySelectorAll('button[data-size]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));}));filter();",
].join('\n');

const css = [
  '*{box-sizing:border-box}html{color-scheme:light}body{--paper:#f4f3ee;--stage:#fffefa;--ink:#23362f;--muted:#52675c;--ww-muted:var(--muted);--line:#c8d1ca;--accent:#245d53;--size:144px;margin:0;padding:40px 28px;background:var(--paper);color:var(--ink);font:15px/1.55 system-ui,sans-serif}',
  'body[data-surface=dark]{color-scheme:dark;--paper:#17251f;--stage:#23382e;--ink:#eff4eb;--muted:#bacdbc;--line:#52695a;--accent:#c8dec9}body[data-size="72"]{--size:72px}body[data-size="240"]{--size:240px}',
  'h1{font-size:clamp(26px,4vw,38px);line-height:1.15;letter-spacing:-.025em;font-weight:600;margin:0 0 16px}h2,h3{font-size:18px;font-weight:600;margin:0}p{max-width:72ch;margin:8px 0;color:var(--muted)}.intro,.controls,#count,.studies,.preferences,footer{max-width:1160px;margin-inline:auto}.notice{color:var(--ink);font-size:13px}.definitions{position:absolute;width:0;height:0;overflow:hidden}',
  '.controls{display:flex;flex-wrap:wrap;gap:18px;align-items:end;margin-block:28px 14px;border-block:1px solid var(--line);padding-block:18px}.controls label{display:flex;flex-direction:column;gap:6px;font-size:13px}select,button{min-height:44px;border:1px solid var(--line);background:var(--stage);color:var(--ink);padding:9px 12px;border-radius:7px;font:inherit;font-size:16px;max-width:100%;touch-action:manipulation}button{cursor:pointer;user-select:none}button[aria-pressed=true]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}button:active{opacity:.75}fieldset{margin:0;padding:0;border:0;min-width:0}legend{font-size:13px;margin-bottom:6px}.sizes{display:flex;gap:6px}#count{font-size:13px}',
  '.studies{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 26px;margin-block:24px 46px}.study{min-width:0;padding:0 0 24px;border-bottom:1px solid var(--line)}[hidden]{display:none!important}.study header p{font-size:12px;margin-top:4px}.pair{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:14px;gap:6px}figure{margin:0;min-width:0;text-align:center;background:var(--stage);padding:12px 6px}figcaption{font-size:12px;color:var(--muted);margin-bottom:10px}.stage{display:flex;align-items:center;justify-content:center;height:calc(var(--size) + 12px);padding:4px}.garment-visual,.studio-visual{display:block;width:calc(var(--size)*5/6);height:var(--size);max-width:100%;flex-shrink:0}.sample-id{font-size:11px;overflow-wrap:anywhere}',
  'body[data-size="240"] main.studies{grid-template-columns:1fr;max-width:940px}body[data-mode=studio] main.studies{grid-template-columns:repeat(3,minmax(0,1fr))}body[data-mode=studio] main .pair{grid-template-columns:1fr}body[data-mode=studio] main figure:not([data-kind=studio]){display:none}',
  '.preferences{border-top:1px solid var(--line);padding-top:18px}summary{cursor:pointer;min-height:44px;padding-block:10px}.preferences .studies{grid-template-columns:repeat(3,minmax(0,1fr))}.preferences .stage{height:180px}.preferences .garment-visual{height:160px;width:134px}.limit{font-size:13px;margin-bottom:18px}footer{border-top:1px solid var(--line);padding-top:24px;margin-top:32px}footer h2{font-size:20px}footer p{font-size:13px}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}::selection{background:#c0dbc8;color:#17251f}',
  '@media(hover:hover) and (pointer:fine){button:hover,summary:hover{opacity:.8}}@media(max-width:900px){main.studies{grid-template-columns:1fr}}@media(max-width:600px){body{padding:24px 16px}.controls{gap:12px;align-items:stretch}.controls label{flex:1 1 130px;min-width:0}fieldset{flex-basis:100%}.sizes button{flex:1}.studies,.preferences .studies{grid-template-columns:1fr;gap:24px}body:not([data-size="72"]) main .pair{grid-template-columns:1fr}body[data-mode=studio] main.studies{grid-template-columns:repeat(2,minmax(0,1fr))}body[data-size="240"][data-mode=studio] main.studies{grid-template-columns:1fr}.study header{padding-inline:2px}}',
].join('\n');

export function renderStudioReview(): string {
  const manifest: StudioManifest = JSON.parse(readFileSync(resolve(assetRoot, 'manifest.json'), 'utf8'));
  const assets = manifest.assets;
  const types = GARMENT_TYPES.filter(type => assets.some(asset => asset.type === type.id));
  const baseAssets = assets.filter(asset => asset.baseSample);
  const pictures = assets.map(asset => {
    if (!/^[a-z0-9-]+\.png$/.test(asset.file) || !findGarmentDesign(asset.type, asset.designId)) throw new Error('Invalid studio asset identity');
    const buffer = readFileSync(resolve(assetRoot, asset.file));
    if (createHash('sha256').update(buffer).digest('hex') !== asset.sha256) throw new Error('Studio asset hash mismatch: ' + asset.file);
    const p = asset.production;
    if (!/^[a-z0-9-]+\.webp$/.test(p.file) || p.src !== '/garments/studio/' + p.file) throw new Error('Invalid production asset path');
    const optimized = readFileSync(resolve(__dirname, '../../public/garments/studio', p.file));
    if (createHash('sha256').update(optimized).digest('hex') !== p.sha256) throw new Error('Production asset hash mismatch');
    return { src: p.src, data: 'data:image/webp;base64,' + optimized.toString('base64') };
  });
  const itemFor = (asset: StudioAsset): AppearanceItem => {
    const type = GARMENT_TYPES.find(type => type.id === asset.type)!;
    return { name: asset.label, garmentTypeId: asset.type, category: type.group === 'one_piece' ? 'base' : type.group,
      colorHex: '#58758a', personalAppearance: { version: 1, designId: asset.designId } };
  };
  let body = renderToStaticMarkup(<>
    <header className="intro"><h1>Stüdyo görünümü</h1><p>Altı tür, beşer tasarım: otuz stüdyo modeli. Mevcut çizimlerle aynı kartta kalite incelemesi.</p>
      <p className="notice">30 model ve yerel entegrasyondaki temsili/kişisel görünüm ayrımı 30 Ekim 2026 tarihinde kullanıcı tarafından kabul edildi. WW-21 tamamlandı; canlı yayın yapılmadı. Stüdyo görselleri yapay üretilmiş temsillerdir, gerçek ürün fotoğrafları değildir.</p>
    </header>
    <section className="controls" aria-label="Karşılaştırma ayarları">
      <label>Tür<select id="type"><option value="all">Altı tür birlikte</option>{types.map(type => <option key={type.id} value={type.id}>{type.tr}</option>)}</select></label>
      <label>Varyant<select id="variant" defaultValue="0"><option value="all">Beş varyant birlikte</option>{[0, 1, 2, 3, 4].map(v => <option key={v} value={v}>{v + 1}. varyant</option>)}</select></label>
      <label>Görünüm<select id="mode"><option value="compare">Önce / SVG / Stüdyo</option><option value="studio">Yalnız stüdyo</option></select></label>
      <label>Zemin<select id="surface"><option value="light">Açık zemin</option><option value="dark">Koyu zemin</option></select></label>
      <fieldset><legend>Görsel alanı yüksekliği</legend><div className="sizes">{['72', '144', '240'].map(size => <button type="button" key={size} data-size={size} aria-pressed={size === '144'}>{size} px</button>)}</div></fieldset>
    </section><p id="count" role="status">6 model gösteriliyor.</p>
    <main className="studies">{assets.map(asset => <article className="study" key={asset.designId} data-type={asset.type} data-design-id={asset.designId} data-variant={asset.variant} hidden={asset.variant !== 0}>
      <header><h2>{types.find(type => type.id === asset.type)!.tr}</h2><p className="sample-id">{asset.variant + 1} / 5 · {findGarmentDesign(asset.type, asset.designId)!.tr} · {asset.designId}</p></header>
      <div className="pair">{(['before', 'current'] as const).map(version => <figure key={version} data-kind={version}>
        <figcaption>{version === 'before' ? 'Önce' : 'SVG çalışma'}</figcaption><div className="stage"><GarmentVisual item={itemFor(asset)} drawingVersion={version}/></div>
      </figure>)}<figure data-kind="studio"><figcaption>B · Stüdyo</figcaption><div className="stage">
        <GarmentStudioVisual context="design" item={itemFor(asset)}/>
      </div></figure></div>
    </article>)}</main>
    <details className="preferences"><summary>Kişisel görünüm seçenekleri nasıl korunuyor?</summary>
      <p className="limit">Aşağıdaki sentetik örnekler mevcut SVG bileşeninden gelir. Kayıtlı tasarım kimliği ve renk/desen/kesim seçenekleri korunur. Stüdyo örneklerinin rengi ve kesimi sabittir; bu tercihlere uyarlanmış gibi gösterilmez. Dolap veya avatar kayıtların okunmaz.</p>
      <div className="studies">{baseAssets.map((asset, i) => {
        const item = itemFor(asset);
        item.personalAppearance = { version: 1, designId: asset.designId, color: i % 2 ? '#202b30' : '#eee8dc', accentColor: '#9bb8a7', pattern: i % 2 ? 'stripes' : 'checks', ...(asset.type !== 'sneakers' ? { fit: 'relaxed', length: 'cropped' } : {}) };
        return <article className="study" key={asset.type}><h3>{asset.label}</h3><p>Sentetik kişisel renk/desen{asset.type !== 'sneakers' ? ' · rahat ve kısa kesim' : ''}</p><figure><figcaption>Mevcut kişisel SVG</figcaption><div className="stage"><GarmentVisual item={item}/></div></figure></article>;
      })}</div>
    </details>
    <footer><h2>İnceleme sınırları</h2><p>Bu çalışma altı türün beşer varyantını karşılaştırır. Diğer otuz tür değişmedi. Kişisel dolap ve özelleştirme SVG ile korunur; sabit stüdyo modeli gerçek ürün fotoğrafı olarak gösterilmez.</p>
      <p>Temsili stüdyo görseli ürünün kumaş bileşimini, kalıbını veya sıcak tutma/su geçirme performansını doğrulamaz; 3D avatar modeli değildir. Bu sayfa ağ isteği, analitik, gönderim veya kişisel kayıt işlemi yapmaz.</p>
      <p>Görseller yerleşik image_gen ile üretildi. Her görselin tam üretim istemi, tasarım eşlemesi ve SHA-256 özeti ww21-studio/manifest.json dosyasındadır. PNG kaynaklar korunur; bu önizleme uygulamada kullanılan optimize WebP dosyalarını ve gerçek stüdyo bileşenini gösterir. Canlı yayın yapılmadı.</p>
    </footer>
  </>, { identifierPrefix: 'ww21-studio-review' });
  for (const picture of pictures) body = body.replaceAll(picture.src, picture.data);
  const studioCss = readFileSync(resolve(__dirname, '../../app/globals.css'), 'utf8').match(/\/\* WW-21: fixed studio[\s\S]*?\/\* End WW-21 studio \*\//)?.[0];
  if (!studioCss) throw new Error('Studio component styles not found');
  const hash = createHash('sha256').update(STUDIO_REVIEW_SCRIPT).digest('base64');
  return '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src \'self\' data:; script-src \'sha256-' + hash + '\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'; connect-src \'none\'"><title>WW-21 · Stüdyo karşılaştırması</title><style>' + css + '\n' + studioCss + '</style></head><body data-surface="light" data-size="144" data-mode="compare">' + body + '<script>' + STUDIO_REVIEW_SCRIPT + '</script></body></html>';
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/garment-studio-review.tsx')) {
  const target = resolve(evidenceRoot, 'ww21-studio-comparison.html');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderStudioReview(), 'utf8');
  console.log('WW-21 studio review generated: ' + target);
}
