const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const original=Module._resolveFilename;
Module._resolveFilename=function(r,p,...args){return original.call(this,r.startsWith('@/')?path.resolve(__dirname,'..',r.slice(2)):r,p,...args);};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {GarmentStudioVisual,studioReference}=require('../components/GarmentStudioVisual.tsx');
const {GARMENT_TYPES}=require('../lib/catalog/taxonomy.ts'),{garmentDesigns}=require('../lib/garment-designs.ts');
const {english}=require('../lib/translations.ts');
Module._resolveFilename=original;
const supported=new Set(['short-sleeve-tee','shirt','sweatshirt','puffer','jeans','sneakers']);
const itemFor=type=>({id:'SYNTHETIC',name:'Unrelated synthetic name',garmentTypeId:type.id,category:type.group==='one_piece'?'base':type.group,colorHex:'#456789'});
const draw=(item,context='reference')=>renderToStaticMarkup(React.createElement(GarmentStudioVisual,{item,context}),{identifierPrefix:'studio-test'});

test('all thirty model presets select their exact studio ID; other thirty types keep SVG',()=>{
 for(const type of GARMENT_TYPES)for(const design of garmentDesigns(type.id)){
  const item={...itemFor(type),personalAppearance:{version:1,designId:design.id}},a=studioReference(item);
  if(supported.has(type.id)){
   assert.equal(a.designId,design.id);const html=draw(item);
   assert.ok(html.includes('data-studio-design="'+design.id+'"'));assert.match(html,/loading="lazy"/);
   assert.match(html,/gerçek ürün fotoğrafı değildir/);assert.ok(html.includes(a.src));assert.doesNotMatch(html,/https?:\/\//);
  }else{assert.equal(a,undefined);assert.match(draw(item),/<svg/);assert.doesNotMatch(draw(item),/data-studio-design/);}
 }
 assert.equal(studioReference({name:'hoodie',category:'mid',colorHex:'#456789'}),undefined,'Names must not invent type identities');
});

test('owned/user/barcode items and every saved appearance override remain personal SVG without record mutations',()=>{
 for(const type of GARMENT_TYPES.filter(t=>supported.has(t.id))){
  const base=itemFor(type);
  const settings={color:'#eee8dc',accentColor:'#9bb8a7',pattern:'checks',...(type.group!=='footwear'?{fit:'relaxed',length:'cropped'}:{}),...(['base','mid','outer'].includes(type.group)?{neckline:'v',sleeve:'short'}:{})};
  const variations=[{isUserOwned:true},{dataSource:'user'},{dataSource:'barcode'},...Object.entries(settings).map(([field,value])=>({personalAppearance:Object.freeze({version:1,designId:type.id+':0',[field]:value})}))];
  for(const extra of variations){
   const item=Object.freeze({...base,...extra,warmth:4,productId:'SOURCE-SENTINEL'}),before=JSON.stringify(item);
   assert.equal(studioReference(item),undefined);const html=draw(item);assert.match(html,/<svg/);assert.doesNotMatch(html,/data-studio-design/);assert.equal(JSON.stringify(item),before);
  }
  const item=Object.freeze({...base,personalAppearance:Object.freeze({version:1,designId:type.id+':3'})});
  assert.equal(studioReference(item,'personal'),undefined);assert.match(draw(item,'personal'),/<svg/);
 }
});

test('design choices may show fixed model references without replacing the owned piece personal preview',()=>{
 const item={name:'Synthetic owned hoodie',category:'mid',garmentTypeId:'sweatshirt',colorHex:'#eee8dc',isUserOwned:true,personalAppearance:{version:1,designId:'sweatshirt:1'}};
 assert.equal(studioReference(item),undefined);
 assert.equal(studioReference(item,'design').designId,'sweatshirt:1');
 assert.match(draw(item,'design'),/data-studio-design="sweatshirt:1"/);
 assert.doesNotMatch(draw(item,'personal'),/data-studio-design/);
 for(const key of ['Temsili stüdyo','Temsili stüdyo · gerçek ürün fotoğrafı değildir.','Görsel yüklenemedi · çizim','Stüdyo modelleri sabit örneklerdir; kişisel renk, desen ve kesim kişisel önizlemede gösterilir.'])assert.ok(english[key],key);
});
