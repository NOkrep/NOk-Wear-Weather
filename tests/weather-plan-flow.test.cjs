const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {resolvePlannedWeather}=require('../lib/weather-plan.ts');const {fetchWeatherConsensus}=require('../lib/weather-service.ts');
const root=path.resolve(__dirname,'..'),at=Date.parse('2026-10-29T12:00Z');
function provider(hours=120,missing=false){
 const start=Date.parse('2026-10-28T21:00Z')/1000,time=Array.from({length:hours},(_,i)=>start+i*3600);
 return {timezone:'Europe/Istanbul',current:{time:at/1000,temperature_2m:99,apparent_temperature:99,relative_humidity_2m:60,dew_point_2m:5,wind_speed_10m:5,weather_code:0,is_day:1},
  hourly:{time,temperature_2m:time.map(()=>20),apparent_temperature:time.map(()=>18),relative_humidity_2m:time.map(()=>60),dew_point_2m:time.map(()=>5),wind_speed_10m:time.map(()=>15),
   precipitation_probability:time.map((_,i)=>missing&&i===34?null:70),weather_code:time.map(()=>61),is_day:time.map(()=>0),uv_index:time.map(()=>0)}};
}
function load(fetcher,clock={now:at}){
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clock.now]));}static now(){return clock.now;}}
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'app/api/weather/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
  {module,exports:module.exports,URL,Date:ClockDate,console,AbortSignal,fetch:fetcher,require:name=>name==='next/server'?{NextResponse:{json:(body,options)=>({body,options})}}:require(name.startsWith('@/')?path.join(root,name.slice(2)+'.ts'):name)});
 return module.exports;
}
const request=(date,headers={})=>({url:'https://fixture/api/weather?lat=41&lon=29'+(date?'&date='+date:''),headers:new Headers(headers)});
const response=data=>({ok:true,json:async()=>data});
test('future date requests use real forecast sources, not current-only endpoints or paid keys',async()=>{
 const calls=[],api=load(async url=>{calls.push(String(url));return response(provider(String(url).includes('dwd-icon')?72:120));});
 const {body,options}=await api.GET(request('2026-10-30',{'x-weatherapi-key':'SYNTHETIC','x-owm-key':'SYNTHETIC'}));
 assert.equal(calls.length,2);assert.ok(calls.every(url=>url.includes('open-meteo.com')));
 assert.ok(calls.some(url=>url.includes('forecast_days=16')));assert.ok(calls.some(url=>url.includes('forecast_days=10')));
 assert.ok(calls.every(url=>!url.includes('SYNTHETIC')));assert.equal(body.requestedDate,'2026-10-30');assert.equal(body.timezoneKnown,true);
 assert.equal(options.headers['Cache-Control'],'no-store');assert.equal(body.hourly.length,0,'do not expose current hourly samples as the planned series');
 const result=resolvePlannedWeather(body,{date:'2026-10-30',startTime:'09:00',endTime:'12:00'},at);
 assert.equal(result.status,'available');assert.equal(result.weather.temp,20);assert.equal(result.weather.feelsLike,18);assert.equal(result.weather.precipitationProb,70);
 assert.equal(result.weather.sources.filter(s=>s.isAvailable).length,2);assert.ok(result.coverage.some(c=>c.sourceName.includes('MET')&&c.status==='current-only'));
});
test('cache keys separate dates and live requests, then expire rather than reuse old observations',async()=>{
 let calls=0;const clock={now:at},api=load(async()=>{calls++;return response(provider());},clock);
 const first=await api.GET(request('2026-10-30'));assert.equal(first.body.cached,false);const initial=calls;
 assert.equal((await api.GET(request('2026-10-30'))).body.cached,true);assert.equal(calls,initial);
 const second=await api.GET(request('2026-10-31'));assert.equal(second.body.cached,false);assert.equal(second.body.requestedDate,'2026-10-31');assert.ok(calls>initial);
 clock.now+=16*60000;assert.equal((await api.GET(request('2026-10-30'))).body.cached,false);
});
test('actual shorter horizons, missing hours and provider failure are not filled with current weather',async()=>{
 const api=load(async()=>response(provider(48,true)));
 const {body}=await api.GET(request('2026-10-30'));
 assert.equal(resolvePlannedWeather(body,{date:'2026-10-30',startTime:'10:00',endTime:'12:00'},at).status,'incomplete');
 const far={...body,requestedDate:'2026-11-10'};
 assert.equal(resolvePlannedWeather(far,{date:'2026-11-10',startTime:'10:00',endTime:'12:00'},at).status,'outside-horizon');
 const offline=load(async()=>{throw new Error('offline');});
 const failed=(await offline.GET(request('2026-10-30'))).body;
 assert.notEqual(resolvePlannedWeather(failed,{date:'2026-10-30',startTime:'10:00',endTime:'12:00'},at).status,'available');
});
test('an invalid calendar date is rejected before any provider request',async()=>{
 let calls=0;const api=load(async()=>{calls++;return response(provider());});
 const result=await api.GET(request('2026-02-30'));assert.equal(result.options.status,400);assert.equal(calls,0);
});
test('client deduplication includes the date and does not read or send private API keys for plans',async()=>{
 const original={fetch:global.fetch,window:global.window,storage:global.localStorage};
 const calls=[];
 try{
  global.window={};global.localStorage={getItem(){assert.fail('No private key read in a forecast request');},setItem(){assert.fail('No personal write');},clear(){assert.fail('No personal clear');}};
  global.fetch=async(url,options)=>{calls.push({url,options});await new Promise(resolve=>setTimeout(resolve,10));return response({temp:20,condition:'cloudy',sources:[],hourly:[],requestedDate:new URL('https://fixture'+url).searchParams.get('date')});};
  const location={lat:41,lon:29,country:'',city:'',district:''};
  const [a,b,c]=await Promise.all([fetchWeatherConsensus(location,'2026-10-30'),fetchWeatherConsensus(location,'2026-10-30'),fetchWeatherConsensus(location,'2026-10-31')]);
  assert.equal(calls.length,2);assert.equal(a.requestedDate,b.requestedDate);assert.notEqual(a.requestedDate,c.requestedDate);
  assert.ok(calls.every(call=>!call.options.headers['x-weatherapi-key']&&!call.options.headers['x-owm-key']&&call.options.cache==='no-store'));
 }finally{global.fetch=original.fetch;global.window=original.window;global.localStorage=original.storage;}
});
