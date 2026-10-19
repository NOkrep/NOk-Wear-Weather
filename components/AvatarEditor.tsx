'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Check, Fingerprint, LockKeyhole, PersonStanding, Scissors, Smile, Sparkles, Undo2 } from 'lucide-react';
import { DEFAULT_AVATAR, HAIR_COLOURS, HAIR_STYLES, SKIN_TONES, type AvatarProfile, type AvatarView } from '@/lib/avatar-profile';
import { useLocale } from '@/lib/i18n';
import { Modal } from './Modal';
import type { ClothingItem } from '@/lib/types';

const AvatarViewer = dynamic(() => import('./AvatarViewer'), { ssr: false });
const tabs = [
  { id: 'body', label: 'Vücut', icon: PersonStanding }, { id: 'skin', label: 'Ten', icon: Fingerprint },
  { id: 'hair', label: 'Saç', icon: Scissors }, { id: 'beard', label: 'Sakal', icon: Smile },
] as const;
export function AvatarViews({ view, onChange }: { view: AvatarView; onChange: (view: AvatarView) => void }) {
  const { t } = useLocale();
  return <div className="avatar-views" role="group" aria-label={t('Karakter açısı')}>{([{ id: 'front', label: 'Ön' }, { id: 'side', label: 'Yan' }, { id: 'back', label: 'Arka' }] as const).map(option => <button key={option.id} type="button" aria-pressed={view === option.id} onClick={() => onChange(option.id)}>{t(option.label)}</button>)}</div>;
}
function OptionArt({ name, icon: Icon }: { name: string; icon: typeof PersonStanding }) {
  return <span className="avatar-option-art"><img src={`/avatars/previews/${name}.png`} alt="" onError={event => { event.currentTarget.style.display = 'none'; }}/><Icon size={34} strokeWidth={1}/></span>;
}
export function AvatarEditor({ profile, items, onSave, onClose }: { profile: AvatarProfile; items?: ClothingItem[]; onSave: (profile: AvatarProfile) => void; onClose: () => void }) {
  const { t } = useLocale();
  const [draft, setDraft] = useState<AvatarProfile>(() => ({ ...profile }));
  const [tab, setTab] = useState<typeof tabs[number]['id']>('body');
  const [view, setView] = useState<AvatarView>('front');
  const patch = (value: Partial<AvatarProfile>) => setDraft(current => ({ ...current, ...value }));
  const portrait = tab === 'hair' || tab === 'beard';
  return <Modal open wide onClose={onClose} title={t('Kendin gibi.')} eyebrow="WEATHROBE CHARACTER STUDIO">
    <div className="character-studio">
      <div className="character-stage">
        <span className="character-stage-tag"><Sparkles size={12}/>{t('Senin karakterin')}</span>
        <AvatarViewer profile={draft} items={items} view={view} portrait={portrait} onRotate={() => setView('free')}/>
        <AvatarViews view={view} onChange={setView}/>
        <span className="character-stage-hint">{t('Çevirmek için sürükle')}</span>
      </div>
      <div className="character-controls">
        <div className="character-tabs" role="group" aria-label={t('Karakter özellikleri')}>{tabs.map(option => <button key={option.id} type="button" aria-pressed={tab === option.id} onClick={() => { setTab(option.id); setView('front'); }}><option.icon size={18}/>{t(option.label)}</button>)}</div>
        <div className="character-options">
          <h3>{t(tabs.find(option => option.id === tab)!.label)}</h3>
          {tab === 'body' && <>
            <div className="avatar-model-options" role="group" aria-label={t('Temel karakter')}>{(['body-a', 'body-b'] as const).map((body, index) => <button type="button" key={body} aria-pressed={draft.body === body} onClick={() => patch({ body })}><OptionArt name={body} icon={PersonStanding}/><span>{t(index ? 'Karakter B' : 'Karakter A')}</span>{draft.body === body && <Check size={14}/>}</button>)}</div>
            <span className="avatar-control-label">{t('Vücut yapısı')}</span>
            <div className="avatar-build-options" role="group" aria-label={t('Vücut yapısı')}>{([{ id: 'slim', label: 'İnce' }, { id: 'regular', label: 'Dengeli' }, { id: 'broad', label: 'Geniş' }] as const).map(option => <button type="button" key={option.id} aria-pressed={draft.build === option.id} onClick={() => patch({ build: option.id })}><PersonStanding size={28} strokeWidth={option.id === 'broad' ? 2.2 : 1.2} style={{ transform: `scaleX(${option.id === 'slim' ? .8 : option.id === 'broad' ? 1.2 : 1})` }}/>{t(option.label)}</button>)}</div>
            <p className="avatar-feature-note">{t('Yüz, seçtiğin temel karaktere bağlıdır.')}</p>
          </>}
          {tab === 'skin' && <>
            <div className="avatar-skin-options" role="group" aria-label={t('Ten tonu')}>{SKIN_TONES.map((colour, index) => <button type="button" key={colour} style={{ background: colour }} aria-label={`${t('Ten tonu')} ${index + 1}`} aria-pressed={draft.skinTone === colour && draft.mode === 'character'} onClick={() => patch({ skinTone: colour, mode: 'character' })}>{draft.skinTone === colour && draft.mode === 'character' && <Check size={20}/>}</button>)}</div>
            <button type="button" className="avatar-porcelain-option" aria-pressed={draft.mode === 'porcelain'} onClick={() => patch({ mode: draft.mode === 'porcelain' ? 'character' : 'porcelain' })}><span/>{t('Porselen manken')}{draft.mode === 'porcelain' && <Check size={15}/>}</button>
          </>}
          {tab === 'hair' && <div className="avatar-hair-options" role="group" aria-label={t('Saç modeli')}>{HAIR_STYLES.map(style => <button type="button" key={style.id} aria-pressed={draft.hair === style.id} onClick={() => patch({ hair: style.id })}><OptionArt name={style.id} icon={Scissors}/><span>{t(style.label)}</span>{draft.hair === style.id && <Check size={14}/>}</button>)}</div>}
          {tab === 'beard' && <div className="avatar-model-options" role="group" aria-label={t('Sakal seçimi')}>{[false, true].map(beard => <button type="button" key={String(beard)} aria-pressed={draft.beard === beard} onClick={() => patch({ beard })}><OptionArt name={beard ? 'beard' : 'none'} icon={Smile}/><span>{t(beard ? 'Kısa sakal' : 'Sakalsız')}</span>{draft.beard === beard && <Check size={14}/>}</button>)}</div>}
          {(tab === 'hair' || tab === 'beard') && <><span className="avatar-control-label">{t('Saç / sakal rengi')}</span><div className="avatar-colour-options" role="group" aria-label={t('Saç / sakal rengi')}>{HAIR_COLOURS.map((colour, index) => <button key={colour} type="button" style={{ background: colour }} aria-label={`${t('Saç rengi')} ${index + 1}`} aria-pressed={draft.hairColor === colour} onClick={() => patch({ hairColor: colour })}>{draft.hairColor === colour && <Check size={14}/>}</button>)}</div></>}
        </div>
        <div className="character-editor-bottom"><button className="text-button" type="button" onClick={() => { setDraft({ ...DEFAULT_AVATAR }); setView('front'); }}><Undo2 size={13}/>{t('Başlangıç görünümü')}</button><p><LockKeyhole size={12}/>{t('Bu cihazda saklanır. Fotoğraf gerekmez.')}</p><div className="character-save-actions"><button type="button" className="secondary-button" onClick={onClose}>{t('Vazgeç')}</button><button type="button" className="primary-button" onClick={() => onSave(draft)}><Check size={15}/>{t('Kaydet')}</button></div></div>
      </div>
    </div>
  </Modal>;
}
