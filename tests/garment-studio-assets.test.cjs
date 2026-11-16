const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {STUDIO_ASSETS}=require('../lib/garment-studio-assets.ts');
const {findGarmentDesign}=require('../lib/garment-designs.ts');
const folder=path.resolve(__dirname,'../public/garments/studio');
const types=['short-sleeve-tee','shirt','sweatshirt','puffer','jeans','sneakers'];
const expected=types.flatMap(type=>Array.from({length:5},(_,v)=>type+':'+v));

test('thirty runtime design IDs map only to bounded local WebP files, without private review inputs',()=>{
 assert.deepEqual(Object.keys(STUDIO_ASSETS),expected);
 const files=[];
 for(const[id,a]of Object.entries(STUDIO_ASSETS)){
  const[type,variant]=id.split(':');
  assert.equal(a.designId,id);assert.equal(findGarmentDesign(type,id).variant,Number(variant));
  assert.match(a.src,new RegExp('^/garments/studio/'+type+'-'+variant+'-[a-f0-9]{12}\\.webp$'));
  assert.match(a.sha256,/^[a-f0-9]{64}$/);assert.equal(a.width,640);assert.equal(a.height,640);
  assert.deepEqual(Object.keys(a).sort(),['designId','height','sha256','src','width']);files.push(path.basename(a.src));
 }
 assert.equal(new Set(files).size,30);
 assert.deepEqual(fs.readdirSync(folder).filter(f=>f.endsWith('.webp')).sort(),files.sort());
});

test('every runtime WebP matches its declared hash, decodes with uncut alpha and stays under 3 MB total',async()=>{
 let bytes=0;
 for(const a of Object.values(STUDIO_ASSETS)){
  const buffer=fs.readFileSync(path.join(folder,path.basename(a.src)));bytes+=buffer.length;
  assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),a.sha256);
  assert.ok(a.src.endsWith('-'+a.sha256.slice(0,12)+'.webp'));
  const m=await sharp(buffer).metadata();assert.equal(m.format,'webp');assert.equal(m.hasAlpha,true);assert.equal(m.width,a.width);assert.equal(m.height,a.height);
  const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});let clear=0,solid=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const alpha=data[(y*info.width+x)*4+3];if(alpha===0)clear++;if(alpha>200){solid++;assert.ok(x>0&&y>0&&x<info.width-1&&y<info.height-1,a.designId+' touches canvas edge');}
  }
  assert.ok(clear>info.width*info.height*.1);assert.ok(solid>info.width*info.height*.1);
 }
 assert.ok(bytes<3_000_000);
});
