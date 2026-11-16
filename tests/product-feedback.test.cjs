const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
function registerTS() {
  const fs = require('node:fs'), ts = require('typescript');
  require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText,f);
}
registerTS();
const { prepareProductFeedback, validateProductFeedback } = require('../lib/product-feedback.ts');
const { saveProductFeedback } = require('../lib/product-feedback-store.ts');
const fixture = changes => ({ version:1, submissionId:randomUUID(), category:'bug', description:'A reproducible issue', steps:'Open the dialog\nChoose a category',locale:'en',consent:true,...changes });
const token = 'a'.repeat(64);
async function temporary(t) {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(),'weathrobe-report-test-'));
  t.after(() => fsp.rm(dir,{recursive:true,force:true}));
  return dir;
}
test('only the explicitly reviewed fields are serialized; personal state is never spread', () => {
  const draft = { category:'suggestion', description:'  Better layout please  ',steps:' ', apiKey:'PRIVATE', wardrobe:['PRIVATE'], lat:41.01 };
  const input = prepareProductFeedback(draft,'tr',randomUUID());
  assert.deepEqual(Object.keys(input).sort(),['version','submissionId','category','description','steps','locale','consent'].sort());
  assert.equal(input.description,'Better layout please');
  assert.equal(input.steps,'');
  assert.ok(!JSON.stringify(input).includes('PRIVATE'));
  assert.equal(draft.apiKey,'PRIVATE');
});
test('consent, category, locale, ID, types, lengths, control characters and unknown fields are enforced', () => {
  for (const changes of [{consent:false},{category:'other'},{locale:'fr'},{submissionId:'../../private'},
    {description:'short'},{description:'x'.repeat(2001)},{steps:'x'.repeat(2001)},{description:'hello\u0000 secret'},
    {description:[]},{lat:41},{apiKey:'PRIVATE'},{version:2}]) assert.equal(validateProductFeedback(fixture(changes)),null);
  assert.equal(validateProductFeedback(null),null);
  assert.equal(validateProductFeedback([]),null);
  assert.ok(validateProductFeedback(fixture({description:'x'.repeat(2000),steps:'x'.repeat(2000)})));
});
test('concurrent save and idempotent retry survive a fresh process and read-only operator review', async t => {
  const dir=await temporary(t), at=Date.parse('2026-10-29T12:00Z'), input=fixture();
  const results=await Promise.all([saveProductFeedback(input,token,at,dir),saveProductFeedback(input,token,at,dir)]);
  assert.equal(results.filter(r=>r.duplicate).length,1);
  const file=path.join(dir,'reports.json'), before=await fsp.readFile(file);
  assert.equal(JSON.parse(before).reports.length,1);
  assert.ok(!before.toString().includes(token));
  const script=`(${registerTS.toString()})(); const {saveProductFeedback}=require('./lib/product-feedback-store.ts');saveProductFeedback(JSON.parse(process.argv[1]),process.argv[2],Number(process.argv[3]),process.argv[4]).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1;});`;
  const result=JSON.parse(execFileSync(process.execPath,['-e',script,JSON.stringify(input),token,String(at),dir],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}));
  assert.equal(result.duplicate,true);
  assert.deepEqual(await fsp.readFile(file),before);
  const {reviewReports}=await import('../scripts/feedback/review.mjs');
  assert.equal((await reviewReports([],dir)).total,1);
  assert.equal((await reviewReports(['--id',input.submissionId],dir)).description,input.description);
  assert.ok(!JSON.stringify(await reviewReports([],dir)).includes('limits'));
  await assert.rejects(reviewReports(['--id','../../elsewhere'],dir));
  assert.deepEqual(await fsp.readFile(file),before,'inspection never changes saved bytes');
  if(process.platform!=='win32') assert.equal((await fsp.stat(file)).mode&0o777,0o600);
});
test('changed payload cannot replace an accepted report with the same ID', async t => {
  const dir=await temporary(t), input=fixture(), now=Date.now();
  await saveProductFeedback(input,token,now,dir);
  const before=await fsp.readFile(path.join(dir,'reports.json'));
  await assert.rejects(saveProductFeedback({...input,description:'A different report'},token,now,dir),{code:'CONFLICT'});
  assert.deepEqual(await fsp.readFile(path.join(dir,'reports.json')),before);
});
test('per-browser minute and rolling-day limits persist, and retries consume no additional quota', async t => {
  const dir=await temporary(t), at=Date.now();
  for(let i=0;i<3;i++) await saveProductFeedback(fixture(),token,at,dir);
  await assert.rejects(saveProductFeedback(fixture(),token,at,dir),{code:'RATE_LIMIT'});
  for(let i=3;i<10;i++) await saveProductFeedback(fixture(),token,at+(i-2)*61000,dir);
  await assert.rejects(saveProductFeedback(fixture(),token,at+3600000,dir),{code:'RATE_LIMIT'});
  await saveProductFeedback(fixture(),token,at+86400001,dir);
  const data=JSON.parse(await fsp.readFile(path.join(dir,'reports.json')));
  assert.equal(data.reports.length,11);
  assert.ok(data.limits.every(l=>l.at>at+1));
});
test('global accepted submission limit applies even when cookies change', async t => {
  const dir=await temporary(t),at=Date.now();
  for(let i=0;i<20;i++) await saveProductFeedback(fixture(),i.toString(16).padStart(64,'0'),at,dir);
  await assert.rejects(saveProductFeedback(fixture(),'f'.repeat(64),at,dir),{code:'RATE_LIMIT'});
});
test('the global rolling-day quota and storage capacity fail closed without dropping older reports',async t=>{
 const dir=await temporary(t),file=path.join(dir,'reports.json'),at=Date.now();
 const ledger={version:1,reports:[],limits:Array.from({length:200},(_,i)=>({client:i.toString(16).padStart(64,'0'),at:at-3600000}))};
 await fsp.writeFile(file,JSON.stringify(ledger));const before=await fsp.readFile(file);
 await assert.rejects(saveProductFeedback(fixture(),token,at,dir),{code:'RATE_LIMIT'});
 assert.deepEqual(await fsp.readFile(file),before);
 ledger.limits=[];ledger.reports=Array.from({length:10000},()=>({...fixture(),createdAt:new Date(at).toISOString()}));
 await fsp.writeFile(file,JSON.stringify(ledger));const full=await fsp.readFile(file);
 await assert.rejects(saveProductFeedback(fixture(),token,at,dir),{code:'FULL'});
 assert.deepEqual(await fsp.readFile(file),full);
});
test('corrupt storage is never overwritten and failed writes are not acknowledged', async t => {
  const dir=await temporary(t), file=path.join(dir,'reports.json');
  await fsp.writeFile(file,'INVALID PRIVATE SENTINEL');
  await assert.rejects(saveProductFeedback(fixture(),token,Date.now(),dir));
  assert.equal(await fsp.readFile(file,'utf8'),'INVALID PRIVATE SENTINEL');
  const blocker=path.join(dir,'not-a-directory');await fsp.writeFile(blocker,'KEEP');
  await assert.rejects(saveProductFeedback(fixture(),token,Date.now(),blocker));
  assert.equal(await fsp.readFile(blocker,'utf8'),'KEEP');
});

test('Linux container recreation retains reports; other users and the read-only review mount cannot write',
 {skip:process.env.WW24_DOCKER_TEST!=='1'},async()=>{
  const volume='weathrobe-ww24-test-'+randomUUID().slice(0,8);
  const image='node:24-bookworm-slim',project=path.resolve(__dirname,'..');
  const docker=(args)=>execFileSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:120000});
  docker(['volume','create',volume]);
  try{
   const base=['run','--rm','--network','none','--mount',`type=bind,source=${project},target=/workspace,readonly`,'--workdir','/workspace'];
   const mount=readonly=>['--mount',`type=volume,source=${volume},target=/reports${readonly?',readonly':''}`];
   docker([...base,...mount(false),image,'node','-e',"const fs=require('fs');fs.chownSync('/reports',1001,1001);fs.chmodSync('/reports',0o700);"]);
   const input=fixture(),at=Date.now();
   const writer=`(${registerTS.toString()})(); const {saveProductFeedback}=require('./lib/product-feedback-store.ts');saveProductFeedback(${JSON.stringify(input)},'${token}',${at},'/reports').then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e);process.exitCode=1;});`;
   const first=JSON.parse(docker([...base,...mount(false),'--user','1001:1001',image,'node','-e',writer]));
   assert.equal(first.duplicate,false);
   const second=JSON.parse(docker([...base,...mount(false),'--user','1001:1001',image,'node','-e',writer]));
   assert.equal(second.duplicate,true,'a new container reuses the existing volume and recognizes the accepted ID');
   const denied=docker([...base,...mount(true),'--user','1002:1002',image,'node','-e',"try{require('fs').readFileSync('/reports/reports.json');process.exit(1);}catch(e){require('assert').equal(e.code,'EACCES');console.log('denied');}"]);
   assert.match(denied,/denied/);
   const review=JSON.parse(docker([...base,...mount(true),'-e','WEAR_WEATHER_REPORTS_DIR=/reports',image,'node','scripts/feedback/review.mjs','--id',input.submissionId]));
   assert.equal(review.description,input.description);
   const readOnly=docker([...base,...mount(true),image,'node','-e',"try{require('fs').writeFileSync('/reports/reports.json','REPLACE');process.exit(1);}catch(e){require('assert').equal(e.code,'EROFS');console.log('read-only');}"]);
   assert.match(readOnly,/read-only/);
  }finally{docker(['volume','rm',volume]);}
 });
