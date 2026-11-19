'use client';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { ClothingItem } from '@/lib/types';
import { GARMENT_TYPES } from '@/lib/catalog/taxonomy';
import { draftToWardrobeItem, type DraftChoices, type GarmentDraft } from '@/lib/garment-draft';
import { useLocale } from '@/lib/i18n';

const CATEGORIES: [ClothingItem['category'], string, string][] = [
  ['base', 'İç katman', 'Base layer'], ['mid', 'Orta katman', 'Mid layer'], ['outer', 'Dış katman', 'Outer layer'],
  ['bottom', 'Alt giyim', 'Bottoms'], ['footwear', 'Ayakkabı', 'Footwear'], ['accessory', 'Aksesuar', 'Accessory'],
];
const WATER: [NonNullable<ClothingItem['waterResistance']>, string, string][] = [['none', 'Koruma yok', 'No protection'], ['light', 'Su itici', 'Water-repellent'], ['waterproof', 'Su geçirmez', 'Waterproof']];
const WIND: [NonNullable<ClothingItem['windResistance']>, string, string][] = [['low', 'Düşük', 'Low'], ['medium', 'Orta', 'Medium'], ['high', 'Yüksek', 'High']];

/**
 * WW-10 B2: a draft is reviewed before it is stored. Warmth and protection start as "I don't know";
 * suggestions from Gemini or the local rules can be applied with one tap, never silently.
 */
export function GarmentDraftReview({ draft, onConfirm, onCancel }: { draft: GarmentDraft; onConfirm: (item: ClothingItem) => void; onCancel: () => void }) {
  const { locale } = useLocale();
  const L = (tr: string, en: string) => locale === 'en' ? en : tr;
  const [choices, setChoices] = useState<DraftChoices>({
    name: draft.name, category: draft.category, garmentTypeId: draft.garmentTypeId, material: draft.material ?? '',
    colorHex: draft.colorHex, warmth: null, waterResistance: null, windResistance: null,
  });
  const set = (patch: Partial<DraftChoices>) => setChoices(current => ({ ...current, ...patch }));
  const sourceLabel = draft.source === 'gemini' ? L('Yapay zekâ önerisi', 'AI suggestion') : L('Kural önerisi', 'Rule suggestion');
  const suggestion = <K extends 'warmth' | 'waterResistance' | 'windResistance'>(key: K, label: string) => {
    const value = draft.suggestions[key];
    if (value === null || choices[key] === value) return null;
    return <button type="button" className="draft-suggestion" onClick={() => set({ [key]: value } as Partial<DraftChoices>)}>{sourceLabel}: {label} · {L('Uygula', 'Apply')}</button>;
  };
  const types = GARMENT_TYPES.filter(type => type.group === choices.category);
  const label = (rows: [string, string, string][], value: string | null) => { const row = rows.find(([id]) => id === value); return row ? L(row[1], row[2]) : ''; };

  return <form className="draft-review" onSubmit={event => { event.preventDefault(); onConfirm(draftToWardrobeItem(choices, `w-draft-${crypto.randomUUID()}`)); }}>
    <p className="settings-copy">{L('Taslağı kontrol et. Yalnız onayladığın bilgiler kaydedilir; “Bilmiyorum” olarak bırakılanlar bilinmiyor olarak kalır.', 'Check the draft. Only what you confirm is saved; anything left as “I don’t know” stays unknown.')}</p>
    <label className="feedback-field">{L('Ad', 'Name')}<input value={choices.name} maxLength={120} onChange={event => set({ name: event.target.value })}/></label>
    <label className="feedback-field">{L('Kategori', 'Category')}<select value={choices.category} onChange={event => set({ category: event.target.value as ClothingItem['category'], garmentTypeId: null })}>
      {CATEGORIES.map(([id, tr, en]) => <option key={id} value={id}>{L(tr, en)}</option>)}</select></label>
    <label className="feedback-field">{L('Tür', 'Type')}<select value={choices.garmentTypeId ?? ''} onChange={event => set({ garmentTypeId: (event.target.value || null) as DraftChoices['garmentTypeId'] })}>
      <option value="">{L('Bilmiyorum', 'I don’t know')}</option>{types.map(type => <option key={type.id} value={type.id}>{L(type.tr, type.en)}</option>)}</select></label>
    <label className="feedback-field">{L('Malzeme', 'Material')}<input value={choices.material} maxLength={120} placeholder={L('Bilinmiyor', 'Unknown')} onChange={event => set({ material: event.target.value })}/></label>
    <div className="feedback-field">{L('Renk', 'Colour')}<span className="draft-colour">
      <label><input type="checkbox" checked={choices.colorHex !== null} onChange={event => set({ colorHex: event.target.checked ? draft.colorHex ?? '#808080' : null })}/>{L('Rengi biliyorum', 'I know the colour')}</label>
      {choices.colorHex !== null && <input type="color" aria-label={L('Renk', 'Colour')} value={choices.colorHex} onChange={event => set({ colorHex: event.target.value })}/>}</span></div>
    <label className="feedback-field">{L('Isı koruması', 'Warmth')}<select value={choices.warmth ?? ''} onChange={event => set({ warmth: event.target.value ? Number(event.target.value) as DraftChoices['warmth'] : null })}>
      <option value="">{L('Bilmiyorum', 'I don’t know')}</option>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{level} / 5</option>)}</select>
      {suggestion('warmth', `${draft.suggestions.warmth} / 5`)}</label>
    <label className="feedback-field">{L('Su direnci', 'Water resistance')}<select value={choices.waterResistance ?? ''} onChange={event => set({ waterResistance: (event.target.value || null) as DraftChoices['waterResistance'] })}>
      <option value="">{L('Bilmiyorum', 'I don’t know')}</option>{WATER.map(([id, tr, en]) => <option key={id} value={id}>{L(tr, en)}</option>)}</select>
      {suggestion('waterResistance', label(WATER, draft.suggestions.waterResistance))}</label>
    <label className="feedback-field">{L('Rüzgâr direnci', 'Wind resistance')}<select value={choices.windResistance ?? ''} onChange={event => set({ windResistance: (event.target.value || null) as DraftChoices['windResistance'] })}>
      <option value="">{L('Bilmiyorum', 'I don’t know')}</option>{WIND.map(([id, tr, en]) => <option key={id} value={id}>{L(tr, en)}</option>)}</select>
      {suggestion('windResistance', label(WIND, draft.suggestions.windResistance))}</label>
    <div className="draft-actions">
      <button type="button" className="secondary-button" onClick={onCancel}><X size={15}/>{L('Vazgeç', 'Cancel')}</button>
      <button type="submit" className="primary-button" disabled={!choices.name.trim()}><Check size={15}/>{L('Dolabıma ekle', 'Add to my wardrobe')}</button>
    </div>
  </form>;
}
