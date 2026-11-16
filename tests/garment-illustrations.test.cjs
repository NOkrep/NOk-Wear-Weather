const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),crypto=require('node:crypto');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const original=Module._resolveFilename;
Module._resolveFilename=function(r,p,...args){return original.call(this,r.startsWith('@/')?path.resolve(__dirname,'..',r.slice(2)):r,p,...args);};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {GarmentVisual}=require('../components/GarmentVisual.tsx');
const {renderGarmentReview}=require('../scripts/preview/garment-review.tsx');
Module._resolveFilename=original;
const {GARMENT_TYPES}=require('../lib/catalog/taxonomy.ts'),{garmentDesigns}=require('../lib/garment-designs.ts');
const {resolveGarmentAppearance}=require('../lib/garment-appearance.ts');
const {garmentIllustration,REFINED_GARMENT_TYPES}=require('../lib/garment-illustrations.ts');
const itemFor=type=>({id:'SYNTHETIC',name:'Unrelated name',category:type.group==='one_piece'?'base':type.group,garmentTypeId:type.id,colorHex:'#456789'});
const draw=(item,drawingVersion='current')=>renderToStaticMarkup(React.createElement(GarmentVisual,{item,drawingVersion}),{identifierPrefix:'ww21-test'});

test('only the six reviewed types change; all other thirty retain identical SVG output for defaults and five IDs',()=>{
 assert.deepEqual([...REFINED_GARMENT_TYPES].sort(),['short-sleeve-tee','shirt','sweatshirt','puffer','jeans','sneakers'].sort());
 for(const type of GARMENT_TYPES)for(const design of [undefined,...garmentDesigns(type.id)]){
  const item={...itemFor(type),personalAppearance:{version:1,designId:design?.id}},before=draw(item,'before'),after=draw(item);
  if(REFINED_GARMENT_TYPES.includes(type.id)){assert.notEqual(after,before,type.id);assert.match(after,/data-garment-illustration="ww21"/);}
  else assert.equal(after,before,design?.id||type.id);
 }
});

test('all six silhouettes and each of their five variants have distinct geometry without external assets',()=>{
 const defaults=new Set();
 for(const type of GARMENT_TYPES.filter(t=>REFINED_GARMENT_TYPES.includes(t.id))){
  defaults.add(JSON.stringify(garmentIllustration(resolveGarmentAppearance(itemFor(type))).body));
  const variants=new Set();
  for(const design of garmentDesigns(type.id)){
   const item={...itemFor(type),personalAppearance:{version:1,designId:design.id}},art=garmentIllustration(resolveGarmentAppearance(item));
   variants.add(JSON.stringify(art));
   for(const d of [...art.body,...art.seams,...art.neck,...art.stitches,...art.folds,...art.panels.map(p=>p.d)]){
    assert.ok(!/undefined|NaN|Infinity/.test(d),design.id);
    for(const number of d.match(/-?\d+(?:\.\d+)?/g)||[])assert.ok(Number(number)>=0&&Number(number)<=240,`${design.id}: ${d}`);
   }
   assert.doesNotMatch(draw(item),/https?:|<image|<foreignObject|<script|NaN|undefined/);
  }
  assert.equal(variants.size,5,type.id);
 }
 assert.equal(defaults.size,6);
});

test('saved IDs, source facts and personal colour/pattern/cut settings are not mutated by either renderer',()=>{
 for(const type of GARMENT_TYPES.filter(t=>REFINED_GARMENT_TYPES.includes(t.id))){
  const personalAppearance=Object.freeze({version:1,designId:type.id+':3',color:'#eee8dc',accentColor:'#9bb8a7',pattern:'checks',fit:'relaxed',length:'cropped',neckline:'v'});
  const item=Object.freeze({...itemFor(type),personalAppearance,brand:'SOURCE-SENTINEL',warmth:2}),snapshot=JSON.stringify(item);
  for(const version of ['before','current']){const html=draw(item,version);assert.match(html,/#eee8dc/);assert.match(html,/#9bb8a7/);assert.match(html,/data-garment-pattern="checks"/);assert.match(html,new RegExp(`data-garment-design="${type.id}:3"`));}
  assert.equal(JSON.stringify(item),snapshot);
 }
});

test('SVG definitions remain unique across a full comparison and every fragment reference resolves locally',()=>{
 const items=GARMENT_TYPES.filter(t=>REFINED_GARMENT_TYPES.includes(t.id)).flatMap(type=>garmentDesigns(type.id).map(design=>({...itemFor(type),personalAppearance:{version:1,designId:design.id}})));
 const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...items.flatMap((item,i)=>['before','current'].map(version=>React.createElement(GarmentVisual,{key:i+version,item,drawingVersion:version})))));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),references=[...html.matchAll(/url\(#([^)]+)\)/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);assert.ok(references.length>100);for(const ref of references)assert.ok(ids.includes(ref),ref);
});

test('review uses the real renderer for thirty paired variants and personal fixtures; CSP disallows network and the inline script is authenticated',()=>{
 const html=renderGarmentReview();
 // Saved private comparison equality is checked by NOk-Weathrobe-Release's evidence suite.
 assert.equal((html.match(/data-variant="[0-4]"/g)||[]).length,30);
 assert.equal((html.match(/data-garment-illustration="ww21"/g)||[]).length,36);
 assert.match(html,/Görsel kabul bekleniyor/);assert.match(html,/connect-src 'none'/);
 assert.doesNotMatch(html,/localStorage|sessionStorage|fetch\(|https?:\/\/|<form|<iframe/);
 const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
 assert.ok(html.includes("'sha256-"+crypto.createHash('sha256').update(script).digest('base64')+"'"));
 assert.doesNotThrow(()=>new (require('node:vm').Script)(script));
 for(const size of ['72','144','240'])assert.ok(html.includes(`data-size="${size}"`));
});

test('review filters preserve personal examples and size buttons retain the correct pressed state',()=>{
 const node=dataset=>({dataset,hidden:false,value:'',handlers:{},attributes:{},addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(name,value){this.attributes[name]=value;}});
 const body=node({size:'144'}),buttons=['72','144','240'].map(size=>node({size}));
 const studies=REFINED_GARMENT_TYPES.flatMap(type=>Array.from({length:5},(_,variant)=>node({type,variant:String(variant)}))),personal=node({});
 const controls={'#type':{...node({}),value:'all'},'#variant':{...node({}),value:'0'},'#surface':node({}),'#count':node({})};
 const document={body,querySelector:selector=>controls[selector],querySelectorAll:selector=>selector==='main.studies .study'?studies:selector==='.studies .study'?[...studies,personal]:selector==='button[data-size]'?buttons:[body,...buttons]};
 require('node:vm').runInNewContext(renderGarmentReview().match(/<script>([\s\S]*)<\/script>/)[1],{document});
 assert.equal(studies.filter(s=>!s.hidden).length,6);assert.equal(personal.hidden,false);assert.equal(body.handlers.click,undefined);
 controls['#type'].value='sweatshirt';controls['#variant'].value='all';controls['#type'].handlers.change();
 assert.equal(studies.filter(s=>!s.hidden).length,5);assert.equal(personal.hidden,false);
 buttons[2].handlers.click();assert.equal(body.dataset.size,'240');assert.equal(buttons[2].attributes['aria-pressed'],'true');assert.equal(buttons[0].attributes['aria-pressed'],'false');
 controls['#surface'].handlers.change({target:{value:'dark'}});assert.equal(body.dataset.surface,'dark');
});
