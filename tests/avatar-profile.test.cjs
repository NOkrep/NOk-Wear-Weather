const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const {AVATAR_STORAGE_KEY,LEGACY_AVATAR_STORAGE_KEY,DEFAULT_AVATAR,normalizeAvatarProfile,readAvatarProfile,saveAvatarProfile}=require('../lib/avatar-profile.ts');
const memory=(records={})=>({records,getItem:key=>records[key]??null,setItem:(key,value)=>{records[key]=value;}});

test('legacy appearance migrates without writing or deleting the old user record',()=>{
 const legacy={build:'broad',hair:'long',hairColor:'#A12233',beard:true,faceShape:'round',face:true};
 const storage=memory({[LEGACY_AVATAR_STORAGE_KEY]:JSON.stringify(legacy)});
 const result=readAvatarProfile(storage);
 assert.equal(result.version,2);assert.equal(result.build,'broad');assert.equal(result.hair,'long');assert.equal(result.hairColor,'#a12233');assert.equal(result.beard,true);
 assert.equal(storage.records[AVATAR_STORAGE_KEY],undefined);assert.deepEqual(JSON.parse(storage.records[LEGACY_AVATAR_STORAGE_KEY]),legacy);
 assert.equal(result.faceShape,undefined);
});
test('untrusted profile data cannot choose arbitrary assets, colours or truthy booleans',()=>{
 const result=normalizeAvatarProfile({body:'https://example.com/model.glb',hair:'unknown',skinTone:'url(https://example.com)',hairColor:'red; background:url(x)',beard:'yes',build:'giant',mode:'evil',token:'secret'});
 assert.deepEqual(result,DEFAULT_AVATAR);assert.equal('token' in result,false);
});
test('draft changes are independent; explicit save roundtrips allowed preferences only',()=>{
 const storage=memory();const original=readAvatarProfile(storage),draft={...original,body:'body-b',hair:'buns',beard:true};
 assert.deepEqual(readAvatarProfile(storage),DEFAULT_AVATAR);
 assert.equal(saveAvatarProfile(draft,storage),true);assert.deepEqual(readAvatarProfile(storage),draft);assert.deepEqual(original,DEFAULT_AVATAR);
});
test('corrupt records and storage denial recover without losing the session or throwing',()=>{
 assert.deepEqual(readAvatarProfile(memory({[AVATAR_STORAGE_KEY]:'{not-json'})),DEFAULT_AVATAR);
 const denied={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};
 assert.deepEqual(readAvatarProfile(denied),DEFAULT_AVATAR);assert.equal(saveAvatarProfile(DEFAULT_AVATAR,denied),false);
 const unsupported=memory({[AVATAR_STORAGE_KEY]:JSON.stringify({version:99,body:'body-b'})});
 assert.deepEqual(readAvatarProfile(unsupported),DEFAULT_AVATAR);
});

test('licensed avatar exports resolve every local buffer and texture without broken or remote dependencies',()=>{
 const path=require('node:path');const root=path.resolve(__dirname,'../public/avatars');
 assert.match(fs.readFileSync(path.join(root,'LICENSE-Quaternius.txt'),'utf8'),/CC0 1.0 Universal/);
 for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.gltf'))){
  const asset=JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));assert.equal(asset.asset.version,'2.0');
  for(const reference of [...asset.buffers,...asset.images]){
   assert.ok(!reference.uri.includes('/')&&!reference.uri.includes(':'),`${name}: local resource only`);
   assert.ok(fs.statSync(path.join(root,reference.uri)).size>0,`${name}: ${reference.uri}`);
  }
  for(const view of asset.bufferViews)assert.ok((view.byteOffset||0)+view.byteLength<=asset.buffers[view.buffer].byteLength,`${name}: buffer bounds`);
 }
});
