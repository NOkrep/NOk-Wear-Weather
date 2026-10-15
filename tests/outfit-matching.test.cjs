const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,f);
const {matchSelectedItems,toggleAnchorSelection,uniqueAnchorChoices}=require('../lib/outfit-matching.ts');
const {generateDirectOutfit,ANCHOR_ITEMS}=require('../lib/clothing-engine.ts');
const {itemIdentity}=require('../lib/comfort.ts');
const weather={temp:14,feelsLike:13,condition:'cloudy',windSpeed:10,precipitationProb:0,humidity:50,dewPoint:6,hourly:[]};
const piece=(id,category,patch={})=>({id,category,name:id,segment:'essential',material:'test',warmth:2,waterResistance:'none',windResistance:'low',colorHex:'#505c5c',colorName:'test',colorType:'neutral',description:'test',...patch});

test('selection toggles each piece independently and permits an entirely empty selection',()=>{
 let selected=[];
 selected=toggleAnchorSelection(selected,'shirt');selected=toggleAnchorSelection(selected,'trousers');
 assert.deepEqual(selected,['shirt','trousers']);
 selected=toggleAnchorSelection(selected,'shirt');assert.deepEqual(selected,['trousers']);
 selected=toggleAnchorSelection(selected,'trousers');assert.deepEqual(selected,[]);
 const result=matchSelectedItems([],weather);
 assert.deepEqual(result.lockedItems,[]);
 assert.deepEqual(result.items,generateDirectOutfit(weather,'essential',0,'Türkiye'));
});

test('different selected categories stay locked and only missing categories are completed',()=>{
 const selected=[piece('my-shirt','mid'),piece('my-chinos','bottom'),piece('my-boots','footwear')];
 const before=JSON.stringify(selected);
 const result=matchSelectedItems(selected,weather);
 for(const item of selected)assert.equal(result.items.find(candidate=>candidate.category===item.category),item);
 assert.equal(result.alternatives.length,0);
 assert.ok(result.suggestedItems.some(item=>item.category==='outer'));
 assert.equal(new Set(result.items.map(item=>item.category)).size,result.items.length);
 assert.equal(JSON.stringify(selected),before);
});

test('same-layer choices remain alternatives and deselecting the last choice restores the previous one',()=>{
 const denim=ANCHOR_ITEMS[0],trench=ANCHOR_ITEMS[1];
 const result=matchSelectedItems([denim,trench],weather);
 assert.equal(result.lockedItems.find(item=>item.category==='outer'),trench);
 assert.deepEqual(result.alternatives,[denim]);
 const remaining=toggleAnchorSelection([itemIdentity(denim),itemIdentity(trench)],itemIdentity(trench));
 const restored=matchSelectedItems([denim,trench].filter(item=>remaining.includes(itemIdentity(item))),weather);
 assert.equal(restored.lockedItems.find(item=>item.category==='outer'),denim);
 assert.deepEqual(restored.alternatives,[]);
});

test('rain and personal feedback never silently replace a user-locked piece',()=>{
 const locked=piece('my-denim','outer',{warmth:1});
 const record={id:'cold',clothingResult:'froze',context:{worn:true,liveWeather:true,itemKey:itemIdentity(locked),feelsLike:13}};
 const result=matchSelectedItems([locked],{...weather,precipitationProb:80},{feedbacks:[record]});
 assert.equal(result.items.find(item=>item.category==='outer'),locked);
 assert.equal(result.rainWarning,true);
 assert.ok(result.suggestedItems.every(item=>item.category!=='outer'));
});

test('wet-weather completion favours a suitable waterproof outer layer without duplicating categories',()=>{
 const shirt=piece('shirt','mid');
 const result=matchSelectedItems([shirt],{...weather,precipitationProb:80});
 assert.equal(result.items.find(item=>item.category==='outer').waterResistance,'waterproof');
 assert.equal(result.items.find(item=>item.category==='mid'),shirt);
 assert.equal(result.rainWarning,false);
 const all=['base','mid','outer','bottom','footwear','accessory'].map(category=>piece(category,category));
 const complete=matchSelectedItems(all,weather);
 assert.equal(complete.items.length,6);assert.equal(complete.suggestedItems.length,0);
});

test('barcode and catalogue duplicates preserve the first available wardrobe record',()=>{
 const owned=piece('owned','mid',{barcode:'4006381333931',isUserOwned:true});
 const duplicate=piece('duplicate','mid',{barcode:'04006381333931'});
 const catalog=piece('catalog-own','bottom',{catalogId:'catalog-1'});
 const other=piece('catalog-profile','bottom',{catalogId:'catalog-1'});
 assert.deepEqual(uniqueAnchorChoices([owned,duplicate,catalog,other]),[owned,catalog]);
});
