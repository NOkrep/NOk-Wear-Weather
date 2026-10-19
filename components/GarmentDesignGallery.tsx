'use client';

import { useMemo, useState } from 'react';
import { GARMENT_TYPES, type GarmentTypeId } from '@/lib/catalog/taxonomy';
import { garmentDesigns } from '@/lib/garment-designs';
import { GARMENT_PALETTE } from '@/lib/garment-appearance';
import { useLocale } from '@/lib/i18n';
import { GarmentVisual } from './GarmentVisual';

/** Illustration library, deliberately unable to create a sourced product or a thermal claim. */
export function GarmentDesignGallery() {
  const { locale, t } = useLocale();
  const [typeId, setTypeId] = useState<GarmentTypeId | 'all'>('all');
  const [page, setPage] = useState(0);
  const designs = useMemo(() => GARMENT_TYPES.filter(type => typeId === 'all' || type.id === typeId).flatMap(type => garmentDesigns(type.id).map(design => ({ type, design }))), [typeId]);
  const visible = designs.slice(page * 12, (page + 1) * 12);
  return <section className="design-gallery" aria-label={t('Tasarım örnekleri')}>
    <div className="design-gallery-heading">
      <div><span className="eyebrow">{t('Çizim atölyesi')}</span><h3>{t('Aynı tür, farklı silüetler.')}</h3></div>
      <label><span className="sr-only">{t('Tasarım türü')}</span><select aria-label={t('Tasarım türü')} value={typeId} onChange={event => { setTypeId(event.target.value as GarmentTypeId | 'all'); setPage(0); }}>
        <option value="all">{t('Tüm türler')}</option>{GARMENT_TYPES.map(type => <option key={type.id} value={type.id}>{locale === 'tr' ? type.tr : type.en} · 5</option>)}
      </select></label>
    </div>
    <p className="design-gallery-note">{t('Özgün temsili çizimler · mağaza ürünü veya kumaş bilgisi değildir.')}</p>
    <div className="design-gallery-count" role="status">{designs.length} {t('tasarım')} · {typeId === 'all' ? GARMENT_TYPES.length : 1} {locale === 'en' && typeId !== 'all' ? 'type' : t('tür')}</div>
    <div className="design-gallery-grid">{visible.map(({ type, design }) => <article className="design-sample" key={design.id}>
      <div className="design-sample-art"><GarmentVisual item={{
        name: design.tr, category: type.group === 'one_piece' ? 'base' : type.group, garmentTypeId: type.id,
        colorHex: GARMENT_PALETTE[[3, 5, 6, 7, 8][design.variant]],
        personalAppearance: { version: 1, designId: design.id },
      }}/><span className="design-sample-number">{String(design.variant + 1).padStart(2, '0')}</span></div>
      <div className="design-sample-label"><span>{locale === 'tr' ? type.tr : type.en}</span><h4>{locale === 'tr' ? design.tr : design.en}</h4></div>
    </article>)}</div>
    {designs.length > 12 && <div className="catalog-pagination"><button type="button" className="secondary-button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t('Önceki')}</button><span>{page + 1} / {Math.ceil(designs.length / 12)}</span><button type="button" className="secondary-button" disabled={(page + 1) * 12 >= designs.length} onClick={() => setPage(value => value + 1)}>{t('Sonraki')}</button></div>}
    <p className="design-gallery-note">{t('Dolabındaki parçanın görünüm düzenleyicisinden bir silüet seçip renk ve desenini değiştirebilirsin.')}</p>
  </section>;
}

