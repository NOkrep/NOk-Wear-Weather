'use client';
import {useState,memo} from 'react';
import {Sun,Moon,Cloud,CloudSun,CloudRain,CloudLightning,CloudSnow,Wind,Droplets,ArrowUpRight,ChevronDown} from 'lucide-react';
import type {WeatherConsensus,WeatherCondition} from '@/lib/types';
import {useLocale} from '@/lib/i18n';
function Icon({condition}:{condition:WeatherCondition}){const C=({sunny:Sun,clear_night:Moon,cloudy:Cloud,partly_cloudy:CloudSun,rainy:CloudRain,stormy:CloudLightning,snowy:CloudSnow,foggy:Cloud})[condition];return <C size={24} strokeWidth={1.4}/>;}
export const HourlyForecastChart=memo(function HourlyForecastChart({consensus,districtName}:{consensus:WeatherConsensus;districtName:string}){
 const {t,locale}=useLocale();const [sources,setSources]=useState(false);
 const hours=(consensus.hourly||[]).slice(0,12),temps=hours.map(h=>h.temp),min=Math.min(...temps),span=Math.max(4,Math.max(...temps)-min);
 return <div className="hourly-studio"><div className="hourly-studio-heading"><span className="eyebrow">{districtName} / {t('Önümüzdeki saatler')}</span><button type="button" className="text-button" aria-expanded={sources} onClick={()=>setSources(v=>!v)}>{t('Kaynakları karşılaştır')}<ChevronDown size={14} className={sources?'rotated':''}/></button></div>
  {sources&&<div className="hourly-source-grid">{consensus.sources.map(s=><article key={t(s.sourceName)}><div><strong>{t(s.sourceName)}</strong><span className={`status-dot ${!s.isAvailable?'source-offline':''}`}/></div><span>{s.isAvailable?`${s.temp}°`:'—'}</span><small>{s.isAvailable?`${t('Hissedilen')} ${s.feelsLike}° · ${s.windSpeed} km/h`:t('Şu an kullanılamıyor')}</small></article>)}</div>}
  <div className="hourly-strip">{hours.map((h,i)=><article className={`hourly-cell ${i===0?'hourly-cell-current':''}`} key={`${h.timeStr}-${i}`}><span className="hourly-time">{h.timeStr}</span><Icon condition={h.condition}/><strong>{h.temp}°</strong><span className="hourly-temperature-track"><i style={{height:`${20+65*(h.temp-min)/span}%`}}/></span><small>{locale==='en'?(h.temp<=12?'Warm layers':h.temp>=23?'Keep it light':'Light layer'):h.suggestedAction}</small></article>)}</div>
  {!hours.length&&<p className="settings-copy">{t('Saatlik veri henüz hazır değil.')}</p>}
 </div>;
});
