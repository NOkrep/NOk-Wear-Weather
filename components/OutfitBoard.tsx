'use client';
import { useEffect, useId, useState } from 'react';
import { ArrowUpRight, UserRoundPen, X } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import type { ClothingItem } from '@/lib/types';
import { GarmentVisual } from './GarmentVisual';
import { Mannequin, type Avatar } from './Mannequin';
const defaults: Avatar = {build:'regular',hair:'none',beard:false,face:false,faceShape:'oval',hairColor:'#38322e'};
const storageKey='wear_weather_avatar_v1';
const labels={base:'İç katman',mid:'Üst giyim',outer:'Dış katman',bottom:'Alt giyim',footwear:'Ayakkabı',accessory:'Aksesuar'};
export function OutfitBoard({items,onInspect}:{items:ClothingItem[];onInspect:(item:ClothingItem)=>void}) {
  const {t,garment}=useLocale();
  const [avatar,setAvatar]=useState<Avatar>(defaults);
  const [editing,setEditing]=useState(false);
  const id=useId();
  useEffect(()=>{
    try { const v=JSON.parse(localStorage.getItem(storageKey)||'null'); if(v && ['slim','regular','broad'].includes(v.build) && ['none','short','long'].includes(v.hair)) setAvatar({...defaults,...v,faceShape:['oval','round','angular'].includes(v.faceShape)?v.faceShape:'oval',hairColor:/^#[0-9a-f]{6}$/i.test(v.hairColor)?v.hairColor:defaults.hairColor}); } catch {}
    const reset=()=>setAvatar(defaults); window.addEventListener('weathrobe-data-wiped',reset);
    return ()=>window.removeEventListener('weathrobe-data-wiped',reset);
  },[]);
  const change=(patch:Partial<Avatar>)=>{const next={...avatar,...patch};setAvatar(next);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}};
  return <div className="outfit-board board-v2">
    <div className="board-caption"><span>{t('Günün görünümü')}<small>WEATHROBE ATELIER</small></span><button type="button" className="text-button" onClick={()=>setEditing(v=>!v)} aria-expanded={editing} aria-controls={id}><UserRoundPen size={14}/>{t('Mankenim')}</button></div>
    <div className="board-scene">
      <span className="atelier-rule" aria-hidden="true"/><span className="atelier-coordinate" aria-hidden="true">01 — DAILY FORM</span>
      <div className="mannequin-stage" aria-label={t('Önerilen parçalarla kişisel mankenin')}><span className="mannequin-orbit"/><Mannequin avatar={avatar} items={items}/><span className="mannequin-note">{t('Kombin görünümü · beden provası değildir')}</span></div>
      <div className="board-pieces">{items.map((item,index)=><button type="button" className={`board-piece board-piece-${index}`} key={item.id} onClick={()=>onInspect(item)} aria-label={t(`${garment(item)} — detayları aç`)}><span className="piece-index">{String(index+1).padStart(2,'0')}<ArrowUpRight size={13}/></span><GarmentVisual item={item}/><span className="piece-name">{garment(item).split('/')[0].replace(/^(Klasik |Rahat Kesim |Esnek )/,'')}</span><span className="piece-label">{t(labels[item.category])}<i style={{background:item.colorHex}}/></span></button>)}</div>
    </div>
    {editing && <div className="avatar-editor" id={id}><div><strong>{t('Mankenini kişiselleştir')}</strong><button type="button" className="icon-button" onClick={()=>setEditing(false)} aria-label={t('Manken ayarlarını kapat')}><X size={16}/></button></div>
      <label>{t('Vücut')}<select value={avatar.build} onChange={e=>change({build:e.target.value as Avatar['build']})}><option value="slim">{t('İnce')}</option><option value="regular">{t('Dengeli')}</option><option value="broad">{t('Geniş')}</option></select></label>
      <label>{t('Saç')}<select value={avatar.hair} onChange={e=>change({hair:e.target.value as Avatar['hair']})}><option value="none">{t('Sade manken')}</option><option value="short">{t('Kısa saç')}</option><option value="long">{t('Uzun saç')}</option></select></label>
      <label>{t('Saç / sakal rengi')}<input type="color" value={avatar.hairColor} onChange={e=>change({hairColor:e.target.value})}/></label>
      <label>{t('Yüz yapısı')}<select value={avatar.faceShape} onChange={e=>change({faceShape:e.target.value as Avatar['faceShape']})}><option value="oval">Oval</option><option value="round">{t('Yuvarlak')}</option><option value="angular">{t('Köşeli')}</option></select></label>
      <label className="check-label"><input type="checkbox" checked={avatar.beard} onChange={e=>change({beard:e.target.checked})}/>{t('Sakal')}</label><label className="check-label"><input type="checkbox" checked={avatar.face} onChange={e=>change({face:e.target.checked})}/>{t('Yüz çizgileri')}</label>
      <p>{t('Tercihlerin bu cihazda saklanır.')}</p>
    </div>}
  </div>;
}
