const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
require.extensions['.tsx']=require.extensions['.ts'];
const {translate}=require('../lib/i18n.tsx'),{english}=require('../lib/translations.ts');
const {resolvePlannedWeather,PLAN_MESSAGES}=require('../lib/weather-plan.ts');
const {parseForecastSource}=require('../lib/weather-forecast.ts');
const {generateLayerTimeline,generateDirectOutfit,getColorThermalAdvice}=require('../lib/clothing-engine.ts');
const root=path.resolve(__dirname,'..'),now=Date.parse('2026-10-29T00:30Z');
const jsx=(type,props)=>({type,props});
function all(tree,predicate){if(!tree||typeof tree!=='object')return [];const children=[tree.props?.children].flat(Infinity).flatMap(child=>all(child,predicate));return predicate(tree)?[tree,...children]:children;}
function text(tree){if(tree===null||tree===undefined||typeof tree==='boolean')return '';if(typeof tree!=='object')return String(tree);return [tree.props?.children].flat(Infinity).map(text).join(' ');}
function load(file,overrides={}){
 const module={exports:{}};
 const context={module,exports:module.exports,console,URL,Intl,Date,crypto:require('node:crypto'),Event,
  document:{activeElement:null,documentElement:{classList:{toggle(){}}}},navigator:{},
  window:{setInterval:()=>1,clearInterval(){},addEventListener(){},removeEventListener(){},dispatchEvent(){}},requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){},
  require:name=>Object.hasOwn(overrides,name)?overrides[name]:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='@/lib/i18n'?{useLocale:()=>({locale:'tr',t:value=>value})}:name.startsWith('@/components/')?{[name.split('/').at(-1)]:Object.assign(()=>null,{displayName:name.split('/').at(-1)})}:require(name.startsWith('@/')?path.join(root,name.slice(2)+'.ts'):name)};
 Object.assign(context,overrides.__context||{});
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,context);
 return module.exports;
}
function bundle(date='2026-10-30',temp=20,lat=41,lon=29){
 const time=Array.from({length:96},(_,i)=>Date.parse('2026-10-28T21:00Z')/1000+i*3600);
 const data={timezone:'Europe/Istanbul',hourly:{time,temperature_2m:time.map(()=>temp),apparent_temperature:time.map(()=>temp-2),relative_humidity_2m:time.map(()=>60),dew_point_2m:time.map(()=>8),wind_speed_10m:time.map(()=>30),precipitation_probability:time.map(()=>70),weather_code:time.map(()=>61),is_day:time.map(()=>0)}};
 return {temp:99,feelsLike:99,humidity:60,dewPoint:8,windSpeed:0,precipitationProb:0,uvIndex:0,condition:'sunny',confidenceScore:99,sources:[],hourly:[],timezone:'Europe/Istanbul',timezoneKnown:true,requestedDate:date,fetchedAt:new Date(now).toISOString(),forecastSources:[parseForecastSource('Fixture',data,lat,lon)]};
}
test('Today/Tomorrow/calendar and times use the stop zone, not the host date; Now resets the plan',()=>{
 for(const locale of ['tr','en']){
  const {StopPlanControls}=load('components/StopPlanControls.tsx',{'@/lib/i18n':{useLocale:()=>({locale,t:value=>translate(value,locale)})}});
  let next;const stop={id:'a',location:{district:'NYC'},weather:{timezone:'America/New_York',timezoneKnown:true}};
  const tree=StopPlanControls({stop,now,onChange:plan=>{next=plan;}});
  all(tree,n=>n.type==='button'&&text(n)===(locale==='en'?'Tomorrow':'Yarın'))[0].props.onClick();
  assert.equal(next.date,'2026-10-29','UTC Oct 29 is still Oct 28 in New York');assert.equal(next.startTime,'20:30');
  all(tree,n=>n.type==='button'&&text(n)===(locale==='en'?'Now':'Şimdi'))[0].props.onClick();assert.equal(next,undefined);
 }
});
test('date and time controls and all plan statuses have complete English equivalents',()=>{
 const source=fs.readFileSync(path.join(root,'components/StopPlanControls.tsx'),'utf8');
 for(const value of [...source.matchAll(/\bt\('([^']+)'\)/g)].map(m=>m[1]).concat(Object.values(PLAN_MESSAGES)))assert.ok(english[value],`Missing English: ${value}`);
 const {StopPlanControls}=load('components/StopPlanControls.tsx');
 const tree=StopPlanControls({stop:{id:'a',location:{district:'Test'},weather:{timezone:'UTC',timezoneKnown:false}},now,onChange(){}});
 assert.ok(all(tree,n=>n.type==='input'&&n.props.type==='date')[0].props.disabled);
});
test('planned night layers use actual dated intervals; no fake daytime or outside-window phases appear',()=>{
 const result=resolvePlannedWeather(bundle('2026-10-30',8),{date:'2026-10-30',startTime:'23:30',endTime:'02:00'},now).weather;
 const layers=generateLayerTimeline(result,'essential');
 assert.equal(layers.length,2);assert.ok(layers.every(step=>step.phase==='night'));
 assert.match(layers[0].timeRange,/2026-10-30 23:30/);assert.match(layers[1].timeRange,/2026-10-31 00:00–02:00/);
 assert.ok(layers.every(step=>step.expectedTemp===8&&step.feelsLikeTemp===6&&step.precipitationProb===70));
});
test('warm planned rain/wind gets a protective outer layer and unknown UV is never described as UV zero',()=>{
 const result=resolvePlannedWeather(bundle('2026-10-30',28),{date:'2026-10-30',startTime:'12:00',endTime:'14:00'},now).weather;
 const outfit=generateDirectOutfit(result,'essential');
 assert.ok(outfit.some(item=>item.category==='outer'&&item.waterResistance==='waterproof'&&['medium','high'].includes(item.windResistance)));
 assert.equal(result.uvIndexKnown,false);assert.doesNotMatch(getColorThermalAdvice(result).reason,/UV: 0/);
});
test('planned chart includes every selected dated hour, even beyond twelve hours',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const {HourlyForecastChart}=load('components/HourlyForecastChart.tsx',{
  'react/jsx-runtime':require('react/jsx-runtime'),
  './WeatherIcon':load('components/WeatherIcon.tsx',{'react/jsx-runtime':require('react/jsx-runtime')}),
  '@/lib/i18n':{useLocale:()=>({locale:'en',t:value=>translate(value,'en')})},
 });
 const result=resolvePlannedWeather(bundle('2026-10-30'),{date:'2026-10-30',startTime:'06:30',endTime:'23:00'},now).weather;
 const html=renderToStaticMarkup(React.createElement(HourlyForecastChart,{consensus:result,districtName:'Test',now}));
 assert.equal((html.match(/<article class="hourly-cell/g)||[]).length,17);assert.match(html,/Hours in the selected plan/);assert.match(html,/30 Oct/);
});
test('fresh arrivals update the UI clock, date/location races discard late responses, and personal storage is unchanged',async()=>{
 const values=[],effects=[],requests=[];let cursor=0,rendering=false,renderChanged=false,hydrating=true;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,i)=>Object.is(value,b[i]));
 const hooks={
  useState(initial){const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return[values[i],value=>{const next=typeof value==='function'?value(values[i]):value;if(!Object.is(next,values[i])){values[i]=next;if(rendering)renderChanged=true;}}];},
  useRef(initial){const i=cursor++;return values[i]??(values[i]={current:initial});},
  useMemo(fn,deps){const i=cursor++;if(!values[i]||!same(values[i].deps,deps))values[i]={deps,value:fn()};return values[i].value;},
  useCallback(fn,deps){return hooks.useMemo(()=>fn,deps);},
  useEffect(fn,deps){const i=cursor++;if(!values[i]||!same(values[i].deps,deps))effects.push({fn,deps,i});},
  useSyncExternalStore(_subscribe,getSnapshot,getServerSnapshot){cursor++;return hydrating?getServerSnapshot():getSnapshot();},
 };
 const services=require('../lib/weather-service.ts'),wardrobe=Object.freeze([{id:'PERSONAL-SENTINEL'},{id:'PERSONAL-SECOND'}]);
 const defaults=Object.freeze([{id:'DEFAULT-SENTINEL'}]);let wardrobeReads=0,profileReads=0;
 let clockNow=now;
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[clockNow]));}static now(){return clockNow;}}
 const {default:Home}=load('app/page.tsx',{
  react:hooks,'@/lib/wardrobe-storage':{DEFAULT_WARDROBE_ITEMS:defaults,getStoredWardrobe:()=>{wardrobeReads++;return wardrobe;}},
  '@/lib/weather-service':{...services,getPersonalThermalProfile:()=>{profileReads++;return {offsetC:1,feedbackCount:3,label:'PERSONAL-PROFILE'};},fetchWeatherConsensus:(location,date)=>new Promise(resolve=>requests.push({location,date,resolve}))},
  __context:{Date:ClockDate,localStorage:new Proxy({},{get(){assert.fail('No personal storage access during date selection');}})},
 });
 const render=(commit=true)=>{let tree,attempts=0;do{assert.ok(++attempts<25,'render-phase initialization must settle');cursor=0;effects.length=0;renderChanged=false;rendering=true;tree=Home();rendering=false;}while(renderChanged);const queued=effects.splice(0);if(commit)queued.forEach(({fn,deps,i})=>{values[i]={deps};fn();});return tree;};
 const control=tree=>all(tree,n=>n.type?.displayName==='StopPlanControls')[0];
 let tree=render(false);assert.equal(wardrobeReads,0);assert.equal(profileReads,0);assert.equal(requests.length,0,'SSR does not request weather or read personal data');
 tree=render();assert.equal(wardrobeReads,0,'the hydration snapshot still matches SSR');
 hydrating=false;tree=render();render();assert.equal(requests.length,1);
 assert.equal(wardrobeReads,1);assert.equal(profileReads,1);
 assert.equal(all(tree,n=>n.type?.displayName==='Navbar')[0].props.wardrobeCount,2,'hydrate the saved wardrobe, not default records');
 control(tree).props.onChange({date:'2026-10-30',startTime:'09:00',endTime:'12:00'});tree=render();assert.equal(requests.at(-1).date,'2026-10-30');
 const map=all(tree,n=>n.type?.displayName==='RealCityMap')[0];
 map.props.onUpdateStopLocation('stop-initial',{lat:40,lon:30,country:'TR',city:'Other',district:'Other'});
 control(tree).props.onChange({date:'2026-10-31',startTime:'10:00',endTime:'12:00'});tree=render();
 const latest=requests.at(-1);assert.equal(latest.location.lat,40);assert.equal(latest.date,'2026-10-31');
 clockNow+=5000;
 latest.resolve({...bundle('2026-10-31',22,40,30),fetchedAt:new Date(clockNow).toISOString()});await new Promise(resolve=>setImmediate(resolve));tree=render();
 const arrived=control(tree).props;
 assert.equal(resolvePlannedWeather(arrived.stop.weather,arrived.stop.plan,arrived.now).status,'available','A new response must be usable immediately, before the next 30-second clock tick');
 requests[1].resolve(bundle('2026-10-30',88));requests[0].resolve(bundle(undefined,99));await new Promise(resolve=>setImmediate(resolve));tree=render();
 assert.equal(control(tree).props.stop.weather.requestedDate,'2026-10-31');assert.equal(control(tree).props.stop.location.lat,40);
 assert.equal(wardrobeReads,1,'date/location changes do not reinitialize personal data');assert.equal(profileReads,1);
 assert.deepEqual(wardrobe,[{id:'PERSONAL-SENTINEL'},{id:'PERSONAL-SECOND'}]);
});
