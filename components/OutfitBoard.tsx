'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ArrowUpRight, UserRoundPen } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import type { ClothingItem } from '@/lib/types';
import { DEFAULT_AVATAR, readAvatarProfile, saveAvatarProfile, type AvatarProfile, type AvatarView } from '@/lib/avatar-profile';
import { GarmentVisual } from './GarmentVisual';
import { AvatarEditor, AvatarViews } from './AvatarEditor';
import { resolveGarmentAppearance } from '@/lib/garment-appearance';
import { selectOutfitLayers } from '@/lib/outfit-layers';
import { avatarGarments } from '@/lib/avatar-garments';

const AvatarViewer = dynamic(() => import('./AvatarViewer'), { ssr: false, loading: () => <span className="avatar-loading">3D…</span> });
const labels = { base: 'İç katman', mid: 'Üst giyim', outer: 'Dış katman', bottom: 'Alt giyim', footwear: 'Ayakkabı', accessory: 'Aksesuar' };
export function OutfitBoard({ items, onInspect }: { items: ClothingItem[]; onInspect: (item: ClothingItem) => void }) {
  const { t, garment } = useLocale();
  // The viewer is client-only; reading its initial profile here adds no server markup mismatch.
  const [avatar, setAvatar] = useState<AvatarProfile>(readAvatarProfile);
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<AvatarView>('front');
  const [sessionOnly, setSessionOnly] = useState(false);
  const active = selectOutfitLayers(items).active;
  const primary = active.filter(item => item.category !== 'accessory');
  const accessories = active.filter(item => item.category === 'accessory');
  const unsupported = avatarGarments(active).unsupported;
  useEffect(() => {
    const reset = () => { setAvatar({ ...DEFAULT_AVATAR }); setEditing(false); setSessionOnly(false); };
    window.addEventListener('weathrobe-data-wiped', reset);
    return () => window.removeEventListener('weathrobe-data-wiped', reset);
  }, []);
  const save = (next: AvatarProfile) => {
    setSessionOnly(!saveAvatarProfile(next)); setAvatar(next); setView('front'); setEditing(false);
  };
  return <div className="outfit-board board-v2 board-3d">
    <div className="board-caption"><span>{t('Günün görünümü')}<small>WEATHROBE ATELIER</small></span><button type="button" className="text-button" onClick={() => setEditing(true)} aria-haspopup="dialog"><UserRoundPen size={14}/>{t('Karakterim')}</button></div>
    <div className="board-scene">
      <div className="avatar-board-stage"><AvatarViewer profile={avatar} items={items} view={view} onRotate={() => setView('free')}/></div>
      <div className="board-pieces">{primary.map((item, index) => <button type="button" className={`board-piece board-piece-${index}`} key={item.id} onClick={() => onInspect(item)} aria-label={t(`${garment(item)} — detayları aç`)}><span className="piece-index">{String(index + 1).padStart(2, '0')}<ArrowUpRight size={13}/></span><GarmentVisual item={item}/><span className="piece-name">{garment(item).split('/')[0].replace(/^(Klasik |Rahat Kesim |Esnek )/, '')}</span><span className="piece-label">{t(labels[item.category])}<i style={{ background: resolveGarmentAppearance(item).color }}/></span></button>)}</div>
    </div>
    {accessories.length > 0 && <div className="outfit-accessory-strip" role="group" aria-label={t('Kombinin aksesuarları')}>{accessories.map(item => <button type="button" key={item.id} onClick={() => onInspect(item)}><GarmentVisual item={item}/><span>{garment(item)}</span><ArrowUpRight size={12}/></button>)}</div>}
    <div className="avatar-board-bottom"><AvatarViews view={view} onChange={setView}/><span>{t('Temsili 3D kombin · ürün kalıbı değildir')}</span></div>
    {unsupported.length > 0 && <p className="avatar-unsupported-note">{t('Bazı parçalar şimdilik yalnızca kartlarda gösterilir.')}</p>}
    {sessionOnly && <p className="avatar-save-warning" role="status">{t('Görünüm bu oturumda uygulandı. Tarayıcıya kaydedilemedi.')}</p>}
    {editing && <AvatarEditor profile={avatar} items={items} onSave={save} onClose={() => setEditing(false)}/>}
  </div>;
}
