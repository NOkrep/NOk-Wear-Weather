'use client';
import {useEffect,useState} from 'react';
import {Check,Database,KeyRound,LoaderCircle,ShieldCheck,Trash2} from 'lucide-react';
import {getStoredCustomKeys} from '@/lib/weather-service';
import {wipeAllLocalUserData} from '@/lib/security';
import type {WeatherConsensus} from '@/lib/types';
import {useLocale} from '@/lib/i18n';
import {Modal} from './Modal';
interface Props{isOpen:boolean;onClose:()=>void;onKeysSaved?:()=>void;onDataWiped?:()=>void;weather?:WeatherConsensus}
export function SourceSettingsModal({isOpen,onClose,onKeysSaved,onDataWiped,weather}:Props){
 const {t}=useLocale();
 const [weatherApiKey,setWeatherApiKey]=useState(''),[openWeatherMapKey,setOpenWeatherMapKey]=useState(''),[geminiApiKey,setGeminiApiKey]=useState('');
 const [saved,setSaved]=useState(false),[wiped,setWiped]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(isOpen){const keys=getStoredCustomKeys();setWeatherApiKey(keys.weatherApiKey||'');setOpenWeatherMapKey(keys.openWeatherMapKey||'');setGeminiApiKey(keys.geminiApiKey||'');setWiped(false);setSaved(false);setError('');}},[isOpen]);
 const save=(e:React.FormEvent)=>{e.preventDefault();try{localStorage.setItem('wear_weather_custom_keys',JSON.stringify({weatherApiKey:weatherApiKey.trim(),openWeatherMapKey:openWeatherMapKey.trim(),geminiApiKey:geminiApiKey.trim()}));setSaved(true);onKeysSaved?.();}catch{setError('Ayarlar kaydedilemedi. Tarayıcı depolamasını kontrol et.');}};
 const wipe=async()=>{setBusy(true);setError('');try{const r=await fetch('/api/community',{method:'DELETE'});if(!r.ok)throw Error();wipeAllLocalUserData();setWeatherApiKey('');setOpenWeatherMapKey('');setGeminiApiKey('');setWiped(true);onDataWiped?.();}catch{setError('Topluluk katkıları silinemedi. Bağlantını kontrol edip yeniden dene; silme işlemi tamamlanmadı.');}finally{setBusy(false);}};
 if(!isOpen)return null;
 return <Modal open onClose={onClose} title={t('Kaynaklar & gizlilik')} eyebrow="WEATHROBE / DATA">
  <div className="settings-section"><div className="settings-section-title"><Database size={17}/><h3>{t('Havanın arkasındaki veriler')}</h3></div>
   <div className="source-list">{weather?.sources?.length?weather.sources.map(s=><div className="source-row" key={t(s.sourceName)}><div><strong>{t(s.sourceName)}</strong><small>{t(s.isAvailable?'Canlı veri alındı':'Şu an kullanılamıyor')}</small></div><span className={`source-pill ${s.isAvailable?'source-live':''}`}>{s.isAvailable?`${s.temp}°`:t('Bağlantı yok')}</span></div>):<p className="settings-copy">{t('Veriler henüz hazır değil.')}</p>}</div>
   <p className="settings-copy">{t('Kaynaklar birlikte değerlendirilir. Ulaşılamayan kaynaklar canlı kabul edilmez.')}</p>
  </div>
  <div className="settings-section"><div className="settings-section-title"><ShieldCheck size={17}/><h3>{t('Kontrol sende')}</h3></div>
   <div className="privacy-points"><div><span>01</span><p><strong>{t('Konum tercihi')}</strong>{t('GPS kullanımı isteğe bağlıdır. GPS koordinatları dış servislere gönderilmeden önce yaklaşık 1 km ızgaraya yuvarlanır.')}</p></div><div><span>02</span><p><strong>{t('Kişisel kayıtlar')}</strong>{t('Dolabın, mankenin ve kişisel geri bildirimlerin bu tarayıcıda saklanır. Topluluk paylaşımı ayrıca izin ister.')}</p></div></div>
  </div>
  <details className="settings-section settings-keys"><summary><KeyRound size={16}/>{t('İsteğe bağlı API anahtarları')}</summary><p className="settings-copy">{t('Anahtarlar bu tarayıcıda saklanır ve ilgili özelliği kullanırken sunucuya iletilir. Ortak cihazlarda kendi anahtarını kaydetme.')}</p>
   <form onSubmit={save}><label className="feedback-field">Google Gemini<input type="password" autoComplete="off" value={geminiApiKey} onChange={e=>setGeminiApiKey(e.target.value)} placeholder={t('İsteğe bağlı anahtar')}/></label><label className="feedback-field">WeatherAPI.com<input type="password" autoComplete="off" value={weatherApiKey} onChange={e=>setWeatherApiKey(e.target.value)} placeholder={t('İsteğe bağlı anahtar')}/></label><label className="feedback-field">OpenWeatherMap<input type="password" autoComplete="off" value={openWeatherMapKey} onChange={e=>setOpenWeatherMapKey(e.target.value)} placeholder={t('İsteğe bağlı anahtar')}/></label><button type="submit" className="primary-button"><Check size={16}/>{t(saved?'Kaydedildi':'Ayarları kaydet')}</button></form>
  </details>
  <div className="settings-data-control"><div><strong>{t('Verilerini temizle')}</strong><p>{t('Bu tarayıcının topluluk katkılarını ve yerel kişisel kayıtlarını siler. Dil tercihi de sıfırlanır.')}</p></div><button type="button" className="danger-button" disabled={busy||wiped} onClick={wipe}>{busy?<LoaderCircle size={15} className="loading-spin"/>:<Trash2 size={15}/>} {t(wiped?'Temizlendi':'Verilerimi temizle')}</button></div>
  {error&&<p role="alert" className="form-message">{t(error)}</p>}
 </Modal>;
}
