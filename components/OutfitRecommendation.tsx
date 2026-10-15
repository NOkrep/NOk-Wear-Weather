'use client';
import {useState,useMemo,useEffect,memo} from 'react';
import {ArrowUpRight,Plus,X,SlidersHorizontal,Droplets,Wind,Layers,Check,Shirt} from 'lucide-react';
import type {WeatherConsensus,BudgetSegment,OutfitApproach,ClothingItem,ThermalProfile} from '@/lib/types';
import {generateLayerTimeline,generateDirectOutfit,getColorThermalAdvice,ANCHOR_ITEMS,matchAnchorItem} from '@/lib/clothing-engine';
import {getMarketProfileForCountry,VERIFIED_GARMENT_CATALOG} from '@/lib/clothing-catalog';
import {matchFromUserWardrobe} from '@/lib/wardrobe-storage';
import {personalizeOutfit,readFeedback,itemIdentity} from '@/lib/comfort';
import {matchSelectedItems,toggleAnchorSelection,uniqueAnchorChoices} from '@/lib/outfit-matching';
import {useLocale} from '@/lib/i18n';
import {GarmentVisual} from './GarmentVisual';
import {OutfitBoard} from './OutfitBoard';
import {Modal} from './Modal';
interface Props {weather:WeatherConsensus;districtName:string;countryName?:string;stopCount?:number;accentHex?:string;thermalProfile?:ThermalProfile;wardrobe?:ClothingItem[];onOpenFeedback?:()=>void;onItemsChange?:(items:ClothingItem[])=>void;onOpenWardrobe?:()=>void}
const categories={base:'İç katman',mid:'Üst giyim',outer:'Dış katman',bottom:'Alt giyim',footwear:'Ayakkabı',accessory:'Aksesuar'};
const modes:{id:OutfitApproach;label:string}[]=[{id:'direct',label:'Günün kombini'},{id:'layering',label:'Katmanlar'},{id:'wardrobe',label:'Dolabımdan'},{id:'anchor',label:'Eşleştir'}];
function inferGarment(name:string):Pick<ClothingItem,'name'|'category'|'colorHex'>{
 const s=name.toLocaleLowerCase('tr');
 return {name,category:/bot|sneaker|ayakkabı|loafer/.test(s)?'footwear':/pantolon|chino|şort/.test(s)?'bottom':/şemsiye|gözlük|şapka|atkı|bere/.test(s)?'accessory':/ceket|trençkot|mont|kaban|parka|kabuk|yağmurluk/.test(s)?'outer':/tişört|taban|içlik/.test(s)?'base':'mid',colorHex:'#a4ae99'};
}
function ItemDetails({item,weather,onClose}:{item:ClothingItem;weather:WeatherConsensus;onClose:()=>void}){
 const {t,garment}=useLocale();
 return <Modal open onClose={onClose} title={garment(item)} eyebrow={t('Parçayı yakından tanı')}>
   <div className="detail-visual"><GarmentVisual item={item}/></div><span className="eyebrow">{t(categories[item.category])}</span>
   <p className="detail-material">{(item.dataSource==='user'||item.dataSource==='barcode') && item.material!=='Kumaş içeriği bilinmiyor'?item.material:t(item.material)}</p>
   <p className="detail-material">{t(item.dataSource==='barcode'?`Barkodla eşleşen ürün · ${item.materialConfirmed?'kumaş etiketi kullanıcı onaylı':'kumaş içeriği bilinmiyor'}`:item.dataSource==='user'?'Kullanıcı kaydı · teknik değerler doğrulanmadı':'Öneri için giysi profili · belirli bir mağaza ürününü temsil etmez')}</p>
   <dl className="detail-specs"><div><dt><Layers size={16}/>{t('Isı koruması')}</dt><dd>{item.warmth} / 5</dd></div><div><dt><Droplets size={16}/>{t('Su direnci')}</dt><dd>{t(({none:'Koruma yok',light:'Su itici',waterproof:'Su geçirmez'})[item.waterResistance])}</dd></div><div><dt><Wind size={16}/>{t('Rüzgâr direnci')}</dt><dd>{t(({low:'Düşük',medium:'Orta',high:'Yüksek'})[item.windResistance])}</dd></div></dl>
   <p className="detail-reason">{t(item.description)}<span>{t(`Hissedilen ${weather.feelsLike}°`)} · {t('Rüzgâr')} {weather.windSpeed} km/h</span></p>
   {item.brandHint&&<p className="detail-brands"><span>{t('Referans markalar')}</span>{item.brandHint}</p>}
   <button type="button" className="primary-button detail-done" onClick={onClose}><Check size={16}/>{t('Tamam')}</button>
 </Modal>;
}
export const OutfitRecommendation=memo(function OutfitRecommendation({weather,countryName='Türkiye',stopCount=1,thermalProfile={offsetC:0,feedbackCount:0,label:'0°C'},wardrobe=[],onOpenFeedback,onOpenWardrobe,onItemsChange}:Props){
 const {t,locale,garment}=useLocale();
 const [segment,setSegment]=useState<BudgetSegment>('essential'),[approach,setApproach]=useState<OutfitApproach>('direct'),[inspectedItem,setInspectedItem]=useState<ClothingItem|null>(null);
 const [selectedAnchorKeys,setSelectedAnchorKeys]=useState<string[]>([]);
 const [showAnchorPicker,setShowAnchorPicker]=useState(true);
 const [anchorCategory,setAnchorCategory]=useState('all');
 const [anchorSource,setAnchorSource]=useState('all');
 const anchorChoices=useMemo(()=>uniqueAnchorChoices([...wardrobe,...ANCHOR_ITEMS,...VERIFIED_GARMENT_CATALOG.map(item=>({...item,catalogId:item.id,dataSource:'template' as const,isUserOwned:false}))]),[wardrobe]);
 const selectedAnchors=useMemo(()=>selectedAnchorKeys.flatMap(key=>{const item=anchorChoices.find(choice=>itemIdentity(choice)===key);return item?[item]:[];}),[selectedAnchorKeys,anchorChoices]);
 const visibleAnchorChoices=useMemo(()=>anchorChoices.filter(item=>(anchorCategory==='all'||item.category===anchorCategory)&&(anchorSource==='all'||(anchorSource==='wardrobe'?item.isUserOwned:!item.isUserOwned))),[anchorChoices,anchorCategory,anchorSource]);
 useEffect(()=>{setSelectedAnchorKeys(current=>{const valid=current.filter(key=>anchorChoices.some(item=>itemIdentity(item)===key));return valid.length===current.length?current:valid;});},[anchorChoices]);
 const market=useMemo(()=>getMarketProfileForCountry(countryName),[countryName]);
 const colorAdvice=useMemo(()=>getColorThermalAdvice(weather),[weather]);
 const layerTimeline=useMemo(()=>generateLayerTimeline(weather,segment,thermalProfile.offsetC,countryName),[weather,segment,thermalProfile.offsetC,countryName]);
 const directOutfit=useMemo(()=>{const base=generateDirectOutfit(weather,segment,thermalProfile.offsetC,countryName);const alts=[...wardrobe,...generateDirectOutfit(weather,segment,thermalProfile.offsetC-3,countryName),...generateDirectOutfit(weather,segment,thermalProfile.offsetC+3,countryName)];return personalizeOutfit(base,alts,weather,readFeedback());},[weather,segment,thermalProfile.offsetC,thermalProfile.feedbackCount,countryName,wardrobe]);
 const anchorMatch=useMemo(()=>matchSelectedItems(selectedAnchors,weather,{segment,country:countryName,thermalOffsetC:thermalProfile.offsetC,wardrobe,feedbacks:readFeedback()}),[selectedAnchors,weather,segment,countryName,thermalProfile.offsetC,thermalProfile.feedbackCount,wardrobe]);
 const wardrobeMatch=useMemo(()=>matchFromUserWardrobe(wardrobe,weather,thermalProfile.offsetC),[wardrobe,weather,thermalProfile.offsetC,thermalProfile.feedbackCount]);
 const tier=market.tiers[segment==='premium'?'luxury':segment];
 const items=useMemo(()=>approach==='wardrobe'?wardrobeMatch.selectedItems:approach==='anchor'?anchorMatch.items:directOutfit,[approach,wardrobeMatch,anchorMatch,directOutfit]);
 useEffect(()=>{onItemsChange?.(items);},[items,onItemsChange]);
 const headline=weather.precipitationProb>=40?'Yağmura hazırlıklı.':weather.feelsLike<=12?'Sıcak kal, rahat et.':weather.feelsLike>=23?'Hafiflik iyi gelir.':'Hafif bir katman al.';
 return <section className="outfit-panel" aria-label={t('Kıyafet önerileri')}>
   <div className="outfit-heading"><div><span className="eyebrow">{t('02 / Ne giymeli?')}</span><h2>{t(headline)}</h2></div><button type="button" className="icon-button" onClick={onOpenFeedback} aria-label={t(`Kişisel ısı ayarı: ${thermalProfile.label}`)} title={t(`Kişisel ısı ayarı: ${thermalProfile.label}`)}><SlidersHorizontal size={18}/></button></div>
   <div className="outfit-toolbar"><div className="outfit-tabs" role="group" aria-label={t('Kombin yaklaşımı')}>{modes.map(mode=><button type="button" key={mode.id} aria-pressed={approach===mode.id} onClick={()=>setApproach(mode.id)}>{t(mode.label)}</button>)}</div><label className="tier-select"><span className="sr-only">{t('Bütçe segmenti')}</span><select value={segment} onChange={e=>setSegment(e.target.value as BudgetSegment)}><option value="essential">{t('Standart')}</option><option value="smart">{t('Orta-Üst')}</option><option value="luxury">{t('Lüks / Teknik')}</option></select></label></div>
   {approach==='anchor'&&<div className="multi-anchor-section">
     <div className="anchor-selection-heading"><span>{t('Seçili parçalar')}<b>{selectedAnchors.length}</b></span><div><button type="button" className="text-button" disabled={!selectedAnchors.length} onClick={()=>setSelectedAnchorKeys([])}>{t('Seçimi temizle')}</button><button type="button" className="secondary-button" onClick={()=>setShowAnchorPicker(value=>!value)} aria-expanded={showAnchorPicker} aria-controls="multi-anchor-picker">{showAnchorPicker?<Check size={14}/>:<Plus size={14}/>} {t(showAnchorPicker?'Kombini göster':'Parça seç')}</button></div></div>
     {selectedAnchors.length>0?<div className="anchor-selected-chips" role="group" aria-label={t('Seçili parçalar')}>{selectedAnchors.map(item=>{const key=itemIdentity(item);const alternative=anchorMatch.alternatives.some(other=>itemIdentity(other)===key);return <button type="button" key={key} onClick={()=>setSelectedAnchorKeys(current=>toggleAnchorSelection(current,key))} aria-label={`${garment(item)} — ${t('seçimi kaldır')}`} className={alternative?'anchor-chip-alternative':''}><i style={{background:item.colorHex}}/><span>{garment(item)}</span><small>{t(alternative?'Alternatif':'Kombinde')}</small><X size={12}/></button>;})}</div>:<p className="anchor-selection-help">{t('Bir veya daha fazla parça seç. Kalanını havaya göre tamamlayalım.')}</p>}
     {showAnchorPicker&&<div id="multi-anchor-picker" className="multi-anchor-picker"><div className="anchor-picker-filters"><label><span className="sr-only">{t('Parça kaynağı')}</span><select aria-label={t('Parça kaynağı')} value={anchorSource} onChange={event=>setAnchorSource(event.target.value)}><option value="all">{t('Tüm parçalar')}</option><option value="wardrobe">{t('Dolabımdan')}</option><option value="profiles">{t('Hazır profiller')}</option></select></label><label><span className="sr-only">{t('Kategori')}</span><select aria-label={t('Kategori')} value={anchorCategory} onChange={event=>setAnchorCategory(event.target.value)}><option value="all">{t('Tüm kategoriler')}</option>{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}</select></label><span>{t('Seçmek veya bırakmak için dokun.')}</span></div>
       <div className="anchor-choice-gallery" role="group" aria-label={t('Eşleştirilecek parçalar')}>{visibleAnchorChoices.map(item=>{const key=itemIdentity(item);const selected=selectedAnchorKeys.includes(key);return <button type="button" key={key} className="anchor-choice" aria-pressed={selected} aria-label={`${garment(item)} — ${t(item.isUserOwned?'Dolabımdan':'Hazır profil')}`} onClick={()=>setSelectedAnchorKeys(current=>toggleAnchorSelection(current,key))}><span className="anchor-choice-top"><small>{t(categories[item.category])}</small><span className="anchor-choice-check">{selected?<Check size={13}/>:<Plus size={13}/>}</span></span><GarmentVisual item={item}/><strong>{garment(item)}</strong><span className="anchor-choice-source">{t(item.isUserOwned?'Dolabımdan':'Hazır profil')}</span></button>;})}</div>
       {!visibleAnchorChoices.length&&<p className="anchor-selection-help">{t('Bu filtrede parça yok. Kategoriyi değiştir veya dolabına parça ekle.')}</p>}
     </div>}
     {anchorMatch.alternatives.length>0&&<p className="anchor-alternatives-note">{t('Aynı katmanda son seçtiğin kombinde kullanılır. Diğer seçimlerin alternatif olarak kalır.')}</p>}
     {anchorMatch.rainWarning&&<p className="anchor-weather-note"><Droplets size={14}/>{t('Yağmur için seçtiğin dış katmanın korumasını kontrol et.')}</p>}
   </div>}
   {approach==='wardrobe'&&<div className="wardrobe-status"><span><Shirt size={15}/>{t(`Dolap uyumu %${wardrobeMatch.coverageScore}`)}</span><button type="button" className="text-button" onClick={onOpenWardrobe}><Plus size={15}/>{t('Parça ekle')}</button></div>}
   {approach==='layering'?<div className="layer-timeline">{layerTimeline.map(step=><article className="layer-phase" key={step.phase}><div className="layer-phase-heading"><span>{t(({morning:'Sabah',midday:'Öğle',evening:'Akşam'})[step.phase])}<small>{step.timeRange}</small></span><strong>{step.expectedTemp}°</strong></div><div className="layer-garments">{step.activeItems.map((name,i)=><div key={`${name}-${i}`}><GarmentVisual item={inferGarment(name)}/><span>{t(name).split('/')[0]}</span></div>)}</div><p>{locale==='en'?(step.expectedTemp<=12?'Keep your warm layers on.':step.expectedTemp>=23?'Choose light, breathable layers.':'Keep a removable layer nearby.'):step.actionTitle.split(':').slice(1).join(':').trim()||step.actionTitle}</p><details className="layer-details"><summary>{t('Katman ayrıntısı')}</summary><p>{locale==='en'?t('Katmanlarını hava ve hareketine göre çıkarıp ekle.'):step.actionDescription}</p><p>{locale==='en'?t('Rüzgâr ve yağış için dış katmanını yanında tut.'):step.thermalTip}</p></details></article>)}</div>:<div className="outfit-board-container">{items.length>0?<OutfitBoard items={items} onInspect={setInspectedItem}/>:<div className="wardrobe-empty"><Shirt size={32}/><p>{t('Havaya uygun parçaların burada görünsün.')}</p><button type="button" className="primary-button" onClick={onOpenWardrobe}><Plus size={16}/>{t('Dolabına parça ekle')}</button></div>}</div>}
   <button type="button" className="visible-feedback-button" onClick={onOpenFeedback}>{t('Nasıl hissettin?')}<span>{t('Üşüdüm · Rahattım · Terledim · Islandım')}</span><ArrowUpRight size={15}/></button>
   <div className="outfit-footnote"><span><span className="status-dot"/>{t(stopCount>1?`${stopCount} durağın havasına göre`:'Günün havasına göre')}</span><div className="outfit-swatches" aria-label={t('Önerilen renkler')} title={locale==='en'?'Suggested colours for these weather conditions':colorAdvice.reason}>{colorAdvice.recommendedPalette.map((color,i)=><span key={`${color}-${i}`} style={{background:color}}/>)}</div><span>{t('Detaylar için parçaya dokun')}<ArrowUpRight size={13}/></span></div>
   {approach==='wardrobe'&&wardrobeMatch.missingCategories.length>0&&<p className="missing-items">{t('Eksik kategoriler')}: {wardrobeMatch.missingCategories.map(c=>t(categories[c as ClothingItem['category']]||c)).join(', ')}</p>}
   <details className="market-details"><summary>{countryName==='Türkiye'&&locale==='en'?'Türkiye':market.countryName} · {t(tier.title)}<Plus size={14}/></summary><div><p>{locale==='en'?t('Bu segmentte kumaş özelliklerini ve ürün etiketini karşılaştır. Fiyatlar mağazaya göre değişir.'):tier.description}</p><p>{tier.referenceBrands.join(' · ')}</p></div></details>
   {approach==='anchor'&&<details className="market-details"><summary>{t('Renk ve hava uyumu')}<Plus size={14}/></summary><div><p>{t(selectedAnchors.length?'Seçtiğin parçalar korunur. Eksik katmanlar hava, renk ve kişisel geri bildirimlerine göre tamamlanır.':'Seçim yokken günün havasına göre öneri gösterilir.')}</p><p>{t(`Hissedilen ${weather.feelsLike}°`)} · {t('Rüzgâr')} {weather.windSpeed} km/h</p></div></details>}
   {inspectedItem&&<ItemDetails key={inspectedItem.id} item={inspectedItem} weather={weather} onClose={()=>setInspectedItem(null)}/>}
 </section>;
});
