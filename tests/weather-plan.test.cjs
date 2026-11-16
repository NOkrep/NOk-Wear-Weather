const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {resolveLocalDateTime,addLocalDays}=require('../lib/weather-time.ts');
const {parseForecastSource}=require('../lib/weather-forecast.ts');
const {planWindow,resolvePlannedWeather}=require('../lib/weather-plan.ts');
const {computeCompositeItineraryWeather}=require('../lib/weather-service.ts');
const now=Date.parse('2026-10-24T12:00Z');
function provider(zone='Europe/Istanbul',start=Date.parse('2026-10-24T21:00Z')){
 const time=Array.from({length:96},(_,i)=>(start+i*3600000)/1000);
 return {timezone:zone,hourly:{time,temperature_2m:time.map((_,i)=>i%24),apparent_temperature:time.map((_,i)=>i%24-2),
  relative_humidity_2m:time.map(()=>60),dew_point_2m:time.map(()=>8),wind_speed_10m:time.map((_,i)=>i===25?40:5),
  precipitation_probability:time.map((_,i)=>i===26?90:0),weather_code:time.map(()=>0),is_day:time.map(()=>0),uv_index:time.map(()=>0)}};
}
function weather(data=provider(),date='2026-10-25'){
 const source=parseForecastSource('Fixture',data,41,29);
 return {temp:99,feelsLike:99,humidity:50,dewPoint:5,windSpeed:0,precipitationProb:0,condition:'sunny',uvIndex:0,
  confidenceScore:99,sources:[],hourly:[],timezone:data.timezone,requestedDate:date,fetchedAt:new Date(now).toISOString(),forecastSources:[source]};
}
test('local calendar resolves leap days, year boundaries, hemispheres and distinct location dates',()=>{
 assert.equal(addLocalDays('2028-02-28',1),'2028-02-29');assert.equal(addLocalDays('2026-12-31',1),'2027-01-01');
 assert.equal(resolveLocalDateTime('2026-02-30','12:00','Europe/Istanbul'),null);
 assert.equal(resolveLocalDateTime('2026-10-25','00:30','Europe/Istanbul'),Date.parse('2026-10-24T21:30Z'));
 assert.equal(resolveLocalDateTime('2026-10-25','00:30','America/New_York'),Date.parse('2026-10-25T04:30Z'));
 assert.equal(resolveLocalDateTime('2026-10-25','00:30','Australia/Sydney'),Date.parse('2026-10-24T13:30Z'));
});
test('DST gaps fail; repeated clock chooses the first occurrence and an overnight interval retains UTC duration',()=>{
 assert.equal(resolveLocalDateTime('2026-03-29','02:30','Europe/Berlin'),null);
 assert.equal(resolveLocalDateTime('2026-10-25','02:30','Europe/Berlin'),Date.parse('2026-10-25T00:30Z'));
 const fall=planWindow({date:'2026-10-24',startTime:'23:30',endTime:'03:30'},'Europe/Berlin',Date.parse('2026-10-23T12:00Z'));
 assert.equal(fall.end-fall.start,5*3600000);
 const spring=planWindow({date:'2026-03-28',startTime:'23:30',endTime:'03:30'},'Europe/Berlin',Date.parse('2026-03-27T12:00Z'));
 assert.equal(spring.end-spring.start,3*3600000);
});
test('provider nulls, missing values and invalid zones are not converted into valid zero weather',()=>{
 const data=provider();data.hourly.precipitation_probability[2]=null;
 const parsed=parseForecastSource('Fixture',data,41,29);
 assert.equal(parsed.points.length,95);
 assert.equal(parsed.points.some(p=>Date.parse(p.validAt)===data.hourly.time[2]*1000),false);
 assert.equal(parseForecastSource('Bad',{...data,timezone:'Bad/Zone'},41,29).points.length,0);
});
test('an overnight plan uses only selected hours and includes cold, wind and rain risks from the next day',()=>{
 const w=weather(),snapshot=JSON.stringify(w);
 const result=resolvePlannedWeather(w,{date:'2026-10-25',startTime:'23:30',endTime:'03:00'},now);
 assert.equal(result.status,'available');const plan=result.weather;
 assert.equal(plan.selection.startAt,'2026-10-25T20:30:00.000Z');assert.equal(plan.selection.endAt,'2026-10-26T00:00:00.000Z');
 assert.equal(plan.hourly.length,4);assert.equal(plan.feelsLike,-2);assert.equal(plan.windSpeed,40);assert.equal(plan.precipitationProb,90);
 assert.equal(plan.selection.maxTemp,23);assert.equal(plan.selection.minTemp,0);
 assert.notEqual(plan.temp,99,'never borrow the current observation');assert.equal(JSON.stringify(w),snapshot);
});
test('unknown UV remains flagged unknown; unsupported current-only sources never enter a future consensus',()=>{
 const data=provider();delete data.hourly.uv_index;const w=weather(data);
 w.forecastSources.push({sourceName:'Current-only',status:'current-only',points:[]});
 const result=resolvePlannedWeather(w,{date:'2026-10-25',startTime:'10:00',endTime:'12:00'},now);
 assert.equal(result.weather.uvIndexKnown,false);assert.equal(result.weather.sources.find(s=>s.sourceName==='Current-only').isAvailable,false);
});
test('outside horizon, interior gaps, stale data, date races and invalid local times fail explicitly',()=>{
 const plan={date:'2026-10-25',startTime:'02:00',endTime:'04:00'},w=weather();
 const gap=weather();gap.forecastSources[0].points.splice(2,1);
 assert.equal(resolvePlannedWeather(gap,plan,now).status,'incomplete');
 assert.equal(resolvePlannedWeather(w,{...plan,date:'2026-12-01'},now).status,'loading');
 assert.equal(resolvePlannedWeather({...w,requestedDate:'2026-12-01'},{...plan,date:'2026-12-01'},now).status,'outside-horizon');
 assert.equal(resolvePlannedWeather({...w,fetchedAt:'invalid'},plan,now).status,'stale');
 assert.equal(resolvePlannedWeather(w,plan,now+16*60000).status,'stale');
 assert.equal(resolvePlannedWeather(w,{...plan,endTime:plan.startTime},now).status,'invalid-range');
 assert.equal(resolvePlannedWeather(w,{...plan,date:'2026-02-30'},now).status,'invalid-date');
});
test('a missing planned stop blocks a composite instead of silently producing an incomplete itinerary outfit',()=>{
 const plan={date:'2026-10-25',startTime:'10:00',endTime:'12:00'},w=weather();
 const stops=[{id:'a',plan,weather:w},{id:'b',plan,weather:{...w,forecastSources:[]}}];
 assert.equal(computeCompositeItineraryWeather(stops,null,now),null);
 assert.ok(computeCompositeItineraryWeather(stops.slice(0,1),null,now)?.selection);
});

test('multiple dated stops retain their own local windows and the strongest conditions, including unknown UV',()=>{
 const first=provider(),second=provider('Australia/Sydney');
 for(const data of [first,second]){data.hourly.temperature_2m.fill(99);data.hourly.apparent_temperature.fill(99);}
 const specifications=[{id:'a',data:first,date:'2026-10-25',startTime:'10:00',zone:'Europe/Istanbul',temp:5,feels:3},
  {id:'b',data:second,date:'2026-10-26',startTime:'08:00',zone:'Australia/Sydney',temp:-3,feels:-8}];
 const stops=specifications.map(s=>{
  const start=resolveLocalDateTime(s.date,s.startTime,s.zone);
  s.data.hourly.time.forEach((time,i)=>{if(time*1000>=start&&time*1000<start+2*3600000){s.data.hourly.temperature_2m[i]=s.temp;s.data.hourly.apparent_temperature[i]=s.feels;
   if(s.id==='b'){s.data.hourly.weather_code[i]=71;s.data.hourly.precipitation_probability[i]=90;}}});
  if(s.id==='b')delete s.data.hourly.uv_index;
  return {id:s.id,location:{district:s.id},plan:{date:s.date,startTime:s.startTime,endTime:s.id==='a'?'12:00':'10:00'},weather:weather(s.data,s.date)};
 });
 const result=computeCompositeItineraryWeather(stops,null,now);
 assert.equal(result.temp,-3);assert.equal(result.feelsLike,-8);assert.equal(result.selection.maxTemp,5);
 assert.equal(result.precipitationProb,90);assert.equal(result.condition,'snowy');assert.equal(result.uvIndexKnown,false);
 assert.deepEqual(result.hourly.map(p=>[p.stopId,p.timezone,p.timeStr]),[['a','Europe/Istanbul','10:00'],['a','Europe/Istanbul','11:00'],['b','Australia/Sydney','08:00'],['b','Australia/Sydney','09:00']]);
});
