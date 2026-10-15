'use client';
import {useEffect,useRef,useState} from 'react';
import {LocateFixed,Search,LoaderCircle} from 'lucide-react';
import {useLocale} from '@/lib/i18n';
import type {LocationInfo} from '@/lib/types';
export function LocationSearch({onSelect,onLocate,isLocating}:{onSelect:(location:LocationInfo)=>void;onLocate:()=>void;isLocating:boolean}) {
 const {t}=useLocale();
 const [query,setQuery]=useState(''),[results,setResults]=useState<(LocationInfo&{displayName:string})[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const wrapper=useRef<HTMLDivElement>(null);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(!wrapper.current?.contains(e.target as Node))setResults([]);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 useEffect(()=>{
  const c=new AbortController();if(query.trim().length<2){setResults([]);setLoading(false);setError('');return;}
  const timer=setTimeout(async()=>{setLoading(true);setError('');try{const r=await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`,{signal:c.signal});if(!r.ok)throw Error();const d=await r.json();if(!c.signal.aborted){setResults(d.results||[]);if(!d.results?.length)setError('Yer bulunamadı. Şehir veya ilçe adını dene.');}}catch{if(!c.signal.aborted)setError('Arama şu an kullanılamıyor. Tekrar deneyebilirsin.');}finally{if(!c.signal.aborted)setLoading(false);}},300);
  return()=>{c.abort();clearTimeout(timer);};
 },[query]);
 return <div className="location-tools" ref={wrapper}><div className="manual-location"><Search size={15}/><input type="search" aria-label={t('Konumu şehir veya ilçe yazarak seç')} placeholder={t('Şehir / ilçe ara…')} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'){setQuery('');setResults([]);}}}/>{loading&&<LoaderCircle size={14} className="loading-spin"/>}</div><button type="button" className="locate-text-button" onClick={onLocate} disabled={isLocating}>{isLocating?<LoaderCircle size={14} className="loading-spin"/>:<LocateFixed size={14}/>} {t('Konumumu kullan')}</button>{(results.length>0||error)&&<div className="location-results">{results.map((l,i)=><button type="button" key={`${l.lat}-${i}`} onClick={()=>{onSelect({...l,lat:Number(l.lat),lon:Number(l.lon)});setQuery('');setResults([]);}}>{l.displayName}</button>)}{error&&<p role="status">{t(error)}</p>}</div>}</div>;
}
