const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const ts=require('typescript');
const {NextRequest}=require('next/server');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true},
}).outputText,f);
const root=path.resolve(__dirname,'..');
const fixture=changes=>({version:1,submissionId:randomUUID(),category:'bug',description:'Synthetic report for testing',steps:'',locale:'tr',consent:true,...changes});
function api(){
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'app/api/feedback/route.ts'),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
 }).outputText,{module,exports:module.exports,URL,Date,Buffer,console,require:name=>require(name.startsWith('@/')?path.join(root,name.slice(2)+'.ts'):name)});
 return module.exports;
}
function request(body,headers={},url='https://fixture.test/api/feedback'){
 return new NextRequest(url,{method:'POST',headers:{Origin:'https://fixture.test',Host:'fixture.test','Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
}
async function isolated(t){
 const directory=await fsp.mkdtemp(path.join(os.tmpdir(),'weathrobe-report-http-'));
 const old=process.env.WEAR_WEATHER_REPORTS_DIR;process.env.WEAR_WEATHER_REPORTS_DIR=directory;
 t.after(async()=>{if(old===undefined)delete process.env.WEAR_WEATHER_REPORTS_DIR;else process.env.WEAR_WEATHER_REPORTS_DIR=old;await fsp.rm(directory,{recursive:true,force:true});});
 return directory;
}
test('POST checks origin, media type, valid JSON, explicit consent and the privacy allowlist before saving',async t=>{
 const dir=await isolated(t),route=api();
 for(const [req,status] of [
  [request(fixture(),{Origin:'https://elsewhere.test'}),403],
  [request(fixture(),{'Sec-Fetch-Site':'cross-site'}),403],
  [request(fixture(),{'Content-Type':'text/plain'}),415],
  [request('{'),400],[request(fixture({consent:false})),400],
  [request(fixture({apiKey:'DO-NOT-SAVE',wardrobe:['PRIVATE'],lat:41.01})),400],
 ]){const response=await route.POST(req);assert.equal(response.status,status);assert.equal(response.headers.get('Cache-Control'),'no-store');}
 assert.deepEqual(await fsp.readdir(dir),[]);
});
test('actual byte limit holds without Content-Length, including chunked Unicode and early cancellation',async t=>{
 await isolated(t);const route=api();
 assert.equal((await route.POST(request('x'.repeat(21000)))).status,413);
 assert.equal((await route.POST(request(fixture(),{'Content-Length':'30000'}))).status,413);
 let cancelled=false;
 const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(21000));},cancel(){cancelled=true;}});
 const req=new NextRequest('https://fixture.test/api/feedback',{method:'POST',headers:{Origin:'https://fixture.test',Host:'fixture.test','Content-Type':'application/json'},body,duplex:'half'});
 assert.equal((await route.POST(req)).status,413);
 assert.equal(cancelled,true);
});
test('save and retry issue only a narrow cookie and receipt; report contents cannot be read over HTTP',async t=>{
 const dir=await isolated(t),route=api(),input=fixture({description:'Only this intentionally typed text'});
 const response=await route.POST(request(input,{'X-Forwarded-For':'192.0.2.123','User-Agent':'PRIVATE-DEVICE'}));
 assert.equal(response.status,201);
 const cookie=response.headers.get('set-cookie');
 assert.match(cookie,/HttpOnly/i);assert.match(cookie,/Secure/i);assert.match(cookie,/SameSite=strict/i);assert.match(cookie,/Path=\/api\/feedback/i);
 const receipt=await response.json();assert.equal(receipt.saved,true);assert.equal(receipt.id,input.submissionId);
 assert.deepEqual(Object.keys(receipt).sort(),['saved','id','createdAt'].sort());
 const retry=await route.POST(request(input,{Cookie:cookie.split(';')[0]}));assert.equal(retry.status,200);
 const bytes=await fsp.readFile(path.join(dir,'reports.json'),'utf8');
 assert.equal(JSON.parse(bytes).reports.length,1);
 for(const secret of ['192.0.2.123','PRIVATE-DEVICE',cookie.split(';')[0].split('=')[1]])assert.ok(!bytes.includes(secret));
 const denied=await route.GET(request('',{Cookie:cookie}));assert.equal(denied.status,405);
 assert.ok(!JSON.stringify(await denied.json()).includes(input.description));
});
test('disk failure gives no false success, sets no tracking cookie, and reveals no filesystem path',async t=>{
 const dir=await isolated(t),blocker=path.join(dir,'blocked');await fsp.writeFile(blocker,'KEEP');process.env.WEAR_WEATHER_REPORTS_DIR=blocker;
 const response=await api().POST(request(fixture()));
 assert.equal(response.status,503);assert.equal(response.headers.get('set-cookie'),null);
 assert.deepEqual(await response.json(),{error:'STORAGE_UNAVAILABLE'});
 assert.equal(await fsp.readFile(blocker,'utf8'),'KEEP');
});
test('corrupt stored JSON is a storage failure, not a user form validation failure',async t=>{
 const dir=await isolated(t),file=path.join(dir,'reports.json');await fsp.writeFile(file,'CORRUPT TEST SENTINEL');
 const response=await api().POST(request(fixture()));
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'STORAGE_UNAVAILABLE'});
 assert.equal(await fsp.readFile(file,'utf8'),'CORRUPT TEST SENTINEL');
});
test('rate limiting returns 429 and Retry-After without accepting a fourth minute submission',async t=>{
 const dir=await isolated(t),route=api();let cookie;
 for(let i=0;i<3;i++){const response=await route.POST(request(fixture(),cookie?{Cookie:cookie}:{}));assert.equal(response.status,201);cookie=response.headers.get('set-cookie').split(';')[0];}
 const response=await route.POST(request(fixture(),{Cookie:cookie}));
 assert.equal(response.status,429);assert.equal(response.headers.get('Retry-After'),'60');
 assert.equal(JSON.parse(await fsp.readFile(path.join(dir,'reports.json'))).reports.length,3);
});
test('request-attempt ceiling also bounds malformed submissions with no cookie or stored IP',async t=>{
 const dir=await isolated(t),route=api();
 for(let i=0;i<60;i++)assert.equal((await route.POST(request('{'))).status,400);
 assert.equal((await route.POST(request('{'))).status,429);
 assert.deepEqual(await fsp.readdir(dir),[]);
});
