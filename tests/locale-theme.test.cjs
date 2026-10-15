const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {english,translateEnglish}=require('../lib/translations.ts');
const {getWeatherTheme}=require('../lib/weather-theme.ts');
const {VERIFIED_GARMENT_CATALOG}=require('../lib/clothing-catalog.ts');
const {DEFAULT_WARDROBE_ITEMS}=require('../lib/wardrobe-storage.ts');
const {ANCHOR_ITEMS,generateDirectOutfit}=require('../lib/clothing-engine.ts');
const translate=text=>english[text.trim()]??translateEnglish(text);
function luminance(hex){const values=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return values.reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const [l,h]=[luminance(a),luminance(b)].sort((a,b)=>a-b);return(h+.05)/(l+.05);}
test('all weather states have distinct day and night canvases with readable text and controls',()=>{
 const conditions=['sunny','partly_cloudy','cloudy','rainy','stormy','snowy','foggy','clear_night'];
 for(const mode of ['light','dark']){
  const canvases=new Set();
  for(const condition of conditions){
   const s=getWeatherTheme(condition,mode).style;canvases.add(s['--ww-canvas']);
   for(const background of ['--ww-canvas','--ww-surface','--ww-wash','--ww-stage'])for(const text of ['--ww-ink','--ww-muted'])assert.ok(contrast(s[text],s[background])>=4.5,`${condition}/${mode} ${text} on ${background}`);
   assert.ok(contrast(s['--ww-accent'],s['--ww-accent-ink'])>=4.5,`${condition}/${mode} control`);
  }
  assert.equal(canvases.size,conditions.length);
 }
});
test('catalogue, default wardrobe, anchor and all generated outfit names/materials have English equivalents',()=>{
 const weather={feelsLike:14,temp:14,windSpeed:10,precipitationProb:0,dewPoint:6,humidity:50};
 const items=[...VERIFIED_GARMENT_CATALOG,...DEFAULT_WARDROBE_ITEMS,...ANCHOR_ITEMS];
 for(const segment of ['essential','smart','luxury'])for(const feelsLike of [0,15,30])for(const precipitationProb of [0,80])items.push(...generateDirectOutfit({...weather,feelsLike,precipitationProb},segment,0,'Türkiye'));
 for(const item of items)for(const field of ['name','material']){
  const source=item[field];
  if(source==='GORE-TEX® ePE Membran')continue;
  assert.notEqual(translate(source),source,`${item.id}: ${field} ${source}`);
 }
});
test('dynamic English labels preserve counts and unknown personal text remains intact',()=>{
 assert.equal(translate('Dolabım (17 parça)'),'My wardrobe (17 pieces)');
 assert.equal(translate('3 durak'),'3 stops');
 assert.equal(translate('Hissedilen -2°'),'Feels like -2°');
 assert.equal(translate('Kişisel ısı ayarı: Soğuğa hassas (-0.7°)'),'Personal warmth: Sensitive to cold (-0.7°)');
 assert.equal(translate('My friend’s custom jacket 2026'),'My friend’s custom jacket 2026');
});
