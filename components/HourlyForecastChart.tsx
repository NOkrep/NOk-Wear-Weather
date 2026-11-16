'use client';
import {useState,memo} from 'react';
import {ChevronDown} from 'lucide-react';
import type {WeatherConsensus} from '@/lib/types';
import {WeatherIcon} from './WeatherIcon';
import {normalizeWeather} from '@/lib/weather-condition';
import {validTimeZone} from '@/lib/weather-time';
import {useLocale} from '@/lib/i18n';
export const HourlyForecastChart=memo(function HourlyForecastChart({consensus,districtName,now=Date.now()}:{consensus:WeatherConsensus;districtName:string;now?:number}){
 const {t,locale}=useLocale();const [sources,setSources]=useState(false);
 const hours=normalizeWeather(consensus,consensus.selection?Date.parse(consensus.selection.startAt):now).hourly.filter(h=>consensus.selection||Date.parse(h.validAt!)+3600000>now).slice(0,consensus.selection?undefined:12),temps=hours.map(h=>h.temp),min=Math.min(...temps),span=Math.max(4,Math.max(...temps)-min);
 return <div className="hourly-studio"><div className="hourly-studio-heading"><span className="eyebrow">{districtName} / {t(consensus.selection?'Seçilen planın saatleri':'Önümüzdeki saatler')}</span><button type="button" className="text-button" aria-expanded={sources} onClick={()=>setSources(v=>!v)}>{t('Kaynakları karşılaştır')}<ChevronDown size={14} className={sources?'rotated':''}/></button></div>
  {consensus.selection&&<p className="settings-copy">{t('Saatlik tahmin gösterilir; aradaki dakikalar için yeni ölçüm üretilmez. Kaynak karşılaştırması aralığın en düşük sıcaklığını ve en yüksek risklerini kullanır.')}</p>}
  {sources&&<div className="hourly-source-grid">{consensus.sources.map(s=><article key={t(s.sourceName)}><div><strong>{t(s.sourceName)}</strong><span className={`status-dot ${!s.isAvailable?'source-offline':''}`}/></div><span>{s.isAvailable?`${s.temp}°`:'—'}</span><small>{s.isAvailable?`${t('Hissedilen')} ${s.feelsLike}° · ${s.windSpeed} km/h`:t('Şu an kullanılamıyor')}</small></article>)}</div>}
  <div className="hourly-strip">{hours.map((h,i)=><article className={`hourly-cell ${i===0?'hourly-cell-current':''}`} key={h.validAt}><time className="hourly-time" dateTime={h.validAt} title={new Intl.DateTimeFormat(locale==='en'?'en-GB':'tr-TR',{dateStyle:'medium',timeStyle:'short',timeZone:validTimeZone(consensus.timezone)}).format(Date.parse(h.validAt!))}>{consensus.selection&&<small>{new Intl.DateTimeFormat(locale==='en'?'en-GB':'tr-TR',{day:'numeric',month:'short',timeZone:validTimeZone(consensus.timezone)}).format(Date.parse(h.validAt!))}<br/></small>}{h.timeStr}</time><WeatherIcon condition={h.condition} isDay={h.isDay} size={24}/><strong>{h.temp}°</strong><span className="hourly-temperature-track"><i style={{height:`${20+65*(h.temp-min)/span}%`}}/></span><small>{locale==='en'?(h.temp<=12?'Warm layers':h.temp>=23?'Keep it light':'Light layer'):h.suggestedAction||t(h.temp<=12?'Sıcak katmanlar':h.temp>=23?'Hafif katmanlar':'İnce dış katman')}</small></article>)}</div>
  {!hours.length&&<p className="settings-copy">{t('Saatlik veri henüz hazır değil.')}</p>}
 </div>;
});
