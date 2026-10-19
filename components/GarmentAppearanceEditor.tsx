'use client';

import { useState } from 'react';
import { Check, Palette, RotateCcw, X } from 'lucide-react';
import type { ClothingItem } from '@/lib/types';
import { APPEARANCE_OPTIONS, GARMENT_PALETTE, editableGarmentTypes, isUpperGarment, normalizeGarmentAppearance, resolveGarmentAppearance, sleeveOptions, type GarmentAppearance } from '@/lib/garment-appearance';
import { useLocale } from '@/lib/i18n';
import { GarmentVisual } from './GarmentVisual';
import { Modal } from './Modal';
import { garmentDesigns } from '@/lib/garment-designs';

export function GarmentAppearanceEditor({ item, onSave }: { item: ClothingItem; onSave: (appearance: GarmentAppearance) => boolean }) {
  const { t, locale, garment } = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<GarmentAppearance>({ version: 1 });
  const appearance = resolveGarmentAppearance({ ...item, personalAppearance: draft });
  const defaults = resolveGarmentAppearance({ ...item, personalAppearance: { version: 1, garmentTypeId: draft.garmentTypeId, designId: draft.designId } });
  const current = resolveGarmentAppearance(item);
  const types = editableGarmentTypes(item);
  const upper = isUpperGarment(appearance.type, item.category);
  const designs = appearance.type ? garmentDesigns(appearance.type) : [];
  const save = () => {
    if (onSave(normalizeGarmentAppearance(draft, item))) setEditing(false);
  };
  return <div className="appearance-editor">
    <button type="button" className="text-button appearance-toggle" aria-haspopup="dialog" aria-expanded={editing} onClick={() => {
      if (!editing) setDraft(normalizeGarmentAppearance(item.personalAppearance, item));
      setEditing(!editing);
    }}><Palette size={14}/>{t('Görünümü düzenle')}<small>{t(current.personal ? 'Kişisel görünüm' : 'Temsili görünüm')}</small></button>
    {editing && <Modal open={editing} onClose={() => setEditing(false)} title={garment(item)} eyebrow={t('Kişisel görünüm')}><fieldset className="appearance-fields" aria-label={`${garment(item)} · ${t('Görünümü düzenle')}`}>
      <legend className="sr-only">{t('Kişisel görünüm')}</legend>
      <div className="appearance-preview"><GarmentVisual item={{ ...item, personalAppearance: draft }}/><span>{t('Kişisel önizleme · ürün bilgisini değiştirmez.')}</span></div>
      <label className="appearance-type">{t('Kıyafet türü')}<select value={draft.garmentTypeId ?? ''} onChange={e => setDraft(normalizeGarmentAppearance({ ...draft, garmentTypeId: e.target.value || undefined }, item))}>
        <option value="">{t('Kayıtlı tür / temsili çizim')}</option>
        {types.map(type => <option value={type.id} key={type.id}>{locale === 'tr' ? type.tr : type.en}</option>)}
      </select></label>
      {designs.length > 0 && <div className="appearance-design-label"><span>{t('Silüet tasarımı')}</span><div className="appearance-designs" role="group" aria-label={t('Silüet tasarımı')}>
        {designs.map(design => <button type="button" key={design.id} aria-pressed={draft.designId === design.id} onClick={() => setDraft(normalizeGarmentAppearance({ version: 1, garmentTypeId: draft.garmentTypeId, designId: design.id, pattern: draft.pattern, color: draft.color, accentColor: draft.accentColor }, item))}>
          <GarmentVisual item={{ ...item, personalAppearance: { version: 1, garmentTypeId: draft.garmentTypeId, designId: design.id, color: draft.color } }}/><span>{locale === 'tr' ? design.tr : design.en}</span>
        </button>)}
      </div></div>}
      <div className="appearance-select-grid">{(['neckline', 'sleeve', 'fit', 'length', 'pattern'] as const).filter(field => {
        if (field === 'neckline' || field === 'sleeve') return upper;
        if (field === 'fit' || field === 'length') return !['accessory', 'footwear'].includes(item.category);
        return true;
      }).map(field => <label key={field}>{t(({ neckline: 'Yaka', sleeve: 'Kol', fit: 'Kesim', length: 'Boy', pattern: 'Desen' })[field])}<select value={draft[field] ?? ''} onChange={e => setDraft(normalizeGarmentAppearance({ ...draft, [field]: e.target.value || undefined }, item))}>
        <option value="">{t('Temsili')} · {t((APPEARANCE_OPTIONS[field] as Record<string, string>)[defaults[field]])}</option>
        {Object.entries(field === 'sleeve' ? sleeveOptions(appearance.type) : APPEARANCE_OPTIONS[field]).map(([value, label]) => <option value={value} key={value}>{t(label)}</option>)}
      </select></label>)}</div>
      <div className="appearance-colour-heading"><span>{t('Ana renk')}</span><label className="appearance-colour-input">{t('Özel renk')}<input type="color" aria-label={t('Özel ana renk')} value={appearance.color} onChange={e => setDraft({ ...draft, color: e.target.value })}/></label></div>
      <div className="appearance-swatches" role="group" aria-label={t('Ana renk')}>
        {GARMENT_PALETTE.map(color => <button type="button" key={color} style={{ backgroundColor: color }} aria-label={`${t('Ana renk')} ${color}`} aria-pressed={draft.color === color} onClick={() => setDraft({ ...draft, color })}>{draft.color === color && <Check size={13}/>}</button>)}
      </div>
      {appearance.pattern !== 'plain' && <label className="appearance-colour-heading">{t('Desen rengi')}<input type="color" value={appearance.accentColor} onChange={e => setDraft({ ...draft, accentColor: e.target.value })}/></label>}
      <p className="appearance-disclaimer">{t('Renk, desen ve kesim seçimin yalnızca sana ait temsili görünümdür. Bilinmeyen ürün özellikleri bilinmiyor olarak kalır.')}</p>
      <div className="appearance-actions"><button type="button" className="text-button" onClick={() => setDraft({ version: 1 })}><RotateCcw size={12}/>{t('Görünümü sıfırla')}</button><button type="button" className="text-button" onClick={() => setEditing(false)}><X size={12}/>{t('Vazgeç')}</button><button type="button" className="secondary-button" onClick={save}><Check size={12}/>{t('Kaydet')}</button></div>
    </fieldset></Modal>}
  </div>;
}
