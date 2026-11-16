import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { GarmentVisual } from '../../components/GarmentVisual';
import { GARMENT_TYPES } from '../../lib/catalog/taxonomy';
import { garmentDesigns } from '../../lib/garment-designs';
import type { AppearanceItem } from '../../lib/garment-appearance';
import { REFINED_GARMENT_TYPES } from '../../lib/garment-illustrations';

const types = GARMENT_TYPES.filter(type => REFINED_GARMENT_TYPES.some(id => id === type.id));
const script = `
const type=document.querySelector('#type'), variant=document.querySelector('#variant');
function filter(){let count=0;document.querySelectorAll('main.studies .study').forEach(study=>{
 study.hidden=(type.value!=='all'&&study.dataset.type!==type.value)||(variant.value!=='all'&&study.dataset.variant!==variant.value);
 if(!study.hidden)count++;
});document.querySelector('#count').textContent=count+' karşılaştırma gösteriliyor.';}
type.addEventListener('change',filter);variant.addEventListener('change',filter);
document.querySelector('#surface').addEventListener('change',event=>{document.body.dataset.surface=event.target.value==='dark'?'dark':'light';});
document.querySelectorAll('button[data-size]').forEach(button=>button.addEventListener('click',()=>{
 document.body.dataset.size=button.dataset.size;document.querySelectorAll('button[data-size]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
}));filter();`;

function pair(item: AppearanceItem, prefix: string) {
  return <div className="pair">{(['before', 'current'] as const).map(version => <figure key={version}>
    <figcaption>{version === 'before' ? 'Önce' : 'Yeni çizim'}</figcaption>
    <div className="drawing" role="img" aria-label={`${item.name} · ${version === 'before' ? 'önceki çizim' : 'yeni çizim'}`}>
      <GarmentVisual item={item} drawingVersion={version}/>
    </div><span className="sample-id">{prefix}</span>
  </figure>)}</div>;
}

export function renderGarmentReview(): string {
  const studies = types.flatMap(type => garmentDesigns(type.id).map(design => {
    const item: AppearanceItem = { name: `${type.tr} / ${design.tr}`, category: type.group === 'one_piece' ? 'base' : type.group, garmentTypeId: type.id,
      colorHex: '#58758a', personalAppearance: { version: 1, designId: design.id } };
    return <article className="study" key={design.id} data-type={type.id} data-variant={design.variant} hidden={design.variant !== 0}>
      <header><h2>{type.tr}</h2><p>{design.variant + 1} / 5 · {design.tr}</p></header>{pair(item, design.id)}
    </article>;
  }));
  const preferences = types.map((type, i) => {
    const design = garmentDesigns(type.id)[i % 5];
    const item: AppearanceItem = { name: type.tr, category: type.group === 'one_piece' ? 'base' : type.group, garmentTypeId: type.id, colorHex: '#58758a',
      personalAppearance: { version: 1, designId: design.id, color: i % 2 ? '#202b30' : '#eee8dc', accentColor: '#9bb8a7',
        pattern: i % 2 ? 'stripes' : 'checks', ...(type.group !== 'footwear' ? { fit: 'relaxed', length: 'cropped' } : {}) } };
    return <article className="study" key={type.id}><header><h3>{type.tr}</h3><p>Kişisel renk ve desen · {type.group !== 'footwear' ? 'rahat ve kısa kesim' : 'aynı taban rengi'}</p></header>{pair(item, design.id)}</article>;
  });
  const body = renderToStaticMarkup(<>
    <header className="intro"><h1>Kıyafet çizim çalışması</h1><p>Altı tür, otuz mevcut varyant. Aynı parça ve aynı tercihlerle önce / sonra.</p>
      <p className="notice">Görsel kabul bekleniyor. Temsili çizimlerdir; gerçek bir ürünün kalıbını, kumaşını veya teknik performansını doğrulamaz.</p></header>
    <section className="controls" aria-label="Karşılaştırma ayarları">
      <label>Tür<select id="type"><option value="all">Altı tür birlikte</option>{types.map(type => <option key={type.id} value={type.id}>{type.tr}</option>)}</select></label>
      <label>Varyant<select id="variant" defaultValue="0"><option value="all">Beş varyantın tamamı</option>{[0, 1, 2, 3, 4].map(v => <option value={v} key={v}>Varyant {v + 1}</option>)}</select></label>
      <label>Zemin<select id="surface"><option value="light">Açık zemin</option><option value="dark">Koyu zemin</option></select></label>
      <fieldset><legend>Çizim yüksekliği</legend><div className="sizes"><button type="button" data-size="72" aria-pressed="false">72 px</button><button type="button" data-size="144" aria-pressed="true">144 px</button><button type="button" data-size="240" aria-pressed="false">240 px</button></div></fieldset>
    </section>
    <p id="count" role="status">6 karşılaştırma gösteriliyor.</p>
    <main className="studies">{studies}</main>
    <details className="preferences"><summary>Kişisel renk, desen ve kesim örnekleri</summary><p>Bu örnekler sentetiktir. Dolap/avatar kayıtların okunmaz ve değiştirilmez.</p><div className="studies">{preferences}</div></details>
    <footer><h2>İncelerken</h2><p>Küçük boyutta türü ayırt edebiliyor musun? Varyantlar farklı görünüyor mu? Yaka, kol, paça ve kapama okunuyor mu? Açık/koyu zeminde çizgiler dengeli mi?</p><p>Önizleme uygulamanın gerçek SVG bileşeninden üretilmiştir. Onay bir yerel dosyaya otomatik yazılmaz; yorumunu sohbetten iletebilirsin. Bu sayfa ağ isteği, analitik veya kişisel kayıt işlemi yapmaz.</p></footer>
  </>, { identifierPrefix: 'ww21-review' });
  const hash = createHash('sha256').update(script).digest('base64');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; connect-src 'none'"><title>WW-21 · Kıyafet çizimleri karşılaştırması</title><style>
*{box-sizing:border-box}html{color-scheme:light}body{--paper:#f4f3ee;--stage:#fffefa;--ink:#23362f;--muted:#52675c;--line:#c8d1ca;--accent:#245d53;--size:144px;margin:0;padding:40px 28px;background:var(--paper);color:var(--ink);font:15px/1.55 system-ui,sans-serif}
body[data-surface=dark]{color-scheme:dark;--paper:#17251f;--stage:#23382e;--ink:#eff4eb;--muted:#bacdbc;--line:#52695a;--accent:#c8dec9}body[data-size="72"]{--size:72px}body[data-size="240"]{--size:240px}body[data-size="240"] .studies{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:clamp(25px,4vw,36px);line-height:1.15;letter-spacing:-.025em;margin:0 0 12px;font-weight:600}h2,h3{font-size:18px;margin:0;font-weight:600}p{max-width:74ch;margin:8px 0;color:var(--muted)}.intro,.controls,#count,.studies,.preferences,footer{max-width:1160px;margin-inline:auto}.notice{color:var(--ink);font-size:13px}
.controls{display:flex;flex-wrap:wrap;gap:18px;align-items:end;margin-block:28px 14px;border-block:1px solid var(--line);padding-block:18px}.controls label{display:flex;flex-direction:column;gap:6px;font-size:13px}select,button{min-height:44px;border:1px solid var(--line);background:var(--stage);color:var(--ink);padding:9px 12px;border-radius:7px;font:inherit;font-size:16px;max-width:100%;touch-action:manipulation}button{cursor:pointer;user-select:none}button[aria-pressed=true]{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}button:active{opacity:.75}fieldset{margin:0;padding:0;border:0;min-width:0}legend{font-size:13px;margin-bottom:6px}.sizes{display:flex;gap:6px}#count{font-size:13px}.studies{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:28px 26px;margin-block:24px 46px}.study{min-width:0;padding:0 0 20px;border-bottom:1px solid var(--line)}[hidden]{display:none!important}.study header p{font-size:12px;margin-top:4px}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:14px;gap:6px}figure{margin:0;min-width:0;text-align:center;background:var(--stage);padding:12px 4px}figcaption{font-size:12px;color:var(--muted);margin-bottom:10px}.drawing{display:flex;align-items:center;justify-content:center;min-height:calc(var(--size) + 10px);padding:4px}.garment-visual{display:block;flex-shrink:0;width:calc(var(--size)*5/6);height:var(--size);max-width:100%;overflow:visible}.sample-id{display:block;color:var(--muted);font-size:10px;overflow-wrap:anywhere;margin-top:8px}.preferences{border-top:1px solid var(--line);padding-top:18px}summary{cursor:pointer;min-height:44px;padding-block:10px}footer{border-top:1px solid var(--line);padding-top:26px;margin-top:32px}footer h2{font-size:20px}footer p{font-size:13px}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}::selection{background:#c0dbc8;color:#17251f}
@media(hover:hover) and (pointer:fine){button:hover,summary:hover{opacity:.8}}@media(max-width:960px){.studies{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){body{padding:24px 16px}.studies{grid-template-columns:1fr;gap:24px}.controls{gap:12px;align-items:stretch}.controls label{flex:1 1 130px;min-width:0}fieldset{flex-basis:100%}.sizes button{flex:1}.study header{padding-inline:2px}.garment-visual{max-width:none}body[data-size="240"] .studies,body[data-size="240"] .pair{grid-template-columns:1fr}}
</style></head><body data-surface="light" data-size="144">${body}<script>${script}</script></body></html>`;
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/garment-review.tsx')) {
  const evidenceRoot = resolve(process.env.NOK_STUDIO_EVIDENCE_ROOT || resolve(__dirname, '../../../NOk_Sites&Extensions/NOk-Weathrobe-Release/evidence/ww21'));
  const target = resolve(evidenceRoot, 'ww21-garment-comparison.html');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderGarmentReview(), 'utf8');
  console.log(`WW-21 review generated: ${target}`);
}
