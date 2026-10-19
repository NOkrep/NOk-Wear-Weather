'use client';

import { ArrowUpRight, FileCheck2, Ruler, Plus, Check } from 'lucide-react';
import type { CatalogProduct, CatalogSource } from '@/lib/catalog/model';
import { useLocale } from '@/lib/i18n';
import { GarmentVisual } from './GarmentVisual';
import { GARMENT_TYPES } from '@/lib/catalog/taxonomy';
import { catalogMaterial } from '@/lib/catalog-wardrobe';

export function CatalogProductCard({ product, sources, isAdded, onAdd }: { product: CatalogProduct; sources: CatalogSource[]; isAdded: boolean; onAdd: () => void }) {
  const { locale, t } = useLocale();
  const name = product.name[locale];
  const type = GARMENT_TYPES.find(type => type.id === product.garmentTypeId);
  const composition = product.facts.composition?.find(component => component.part === 'shell');
  const material = catalogMaterial(product, locale);
  const evidence = product.evidence.find(evidence => evidence.field === 'composition');
  const source = sources.find(source => source.id === evidence?.sourceId);
  const category = type && type.group !== 'one_piece' ? type.group : 'base';

  return <article className="catalog-piece real-product-card" data-product-id={product.id}>
    <div className="catalog-piece-art">
      <span className="catalog-category">{type ? (locale === 'tr' ? type.tr : type.en) : ''}</span>
      <GarmentVisual item={{ name: product.name.tr, category, garmentTypeId: product.garmentTypeId, colorHex: '#c7cebf' }}/>
      <span className="product-illustration-label">{t('Temsili çizim')}</span>
    </div>
    <div className="catalog-piece-info">
      <span className="catalog-tier">{product.brand} <span aria-hidden="true">/</span> {product.model}</span>
      <h3>{name}</h3>
      <p className="product-composition">{material || t('Kumaş içeriği bilinmiyor')}</p>
      <div className="product-fact-chips">
        {composition && source && <span><FileCheck2 size={12}/>{t('Kaynaklı kumaş bilgisi')}</span>}
        <span><Ruler size={12}/>{product.facts.gsm === null ? t('Gramaj bilinmiyor') : `${product.facts.gsm} g/m²`}</span>
        {product.facts.warmth === null && <span>{t('Isı bilgisi yok')}</span>}
      </div>
      <p className="product-appearance-unknown">{t('Renk, desen ve kesim bilinmiyor.')}</p>
      <details className="product-evidence">
        <summary>{t('Kaynak ve ayrıntılar')}</summary>
        <p>{t('Üretici / satıcı beyanı · bağımsız ölçüm değildir.')}</p>
        <dl>
          <div><dt>{t('Isı seviyesi')}</dt><dd>{product.facts.warmth === null ? t('Bilinmiyor') : `${product.facts.warmth}/5`}</dd></div>
          <div><dt>{t('Su koruması')}</dt><dd>{product.facts.waterResistance === null ? t('Bilinmiyor') : t(product.facts.waterResistance === 'waterproof' ? 'Su geçirmez' : product.facts.waterResistance === 'repellent' ? 'Su itici' : 'Koruma yok')}</dd></div>
          <div><dt>{t('Rüzgâr koruması')}</dt><dd>{product.facts.windResistance === null ? t('Bilinmiyor') : t(product.facts.windResistance === 'high' ? 'Yüksek' : product.facts.windResistance === 'medium' ? 'Orta' : 'Düşük')}</dd></div>
          <div><dt>{t('Nefes alabilirlik')}</dt><dd>{product.facts.breathability === null ? t('Bilinmiyor') : t(product.facts.breathability === 'high' ? 'Yüksek' : product.facts.breathability === 'medium' ? 'Orta' : 'Düşük')}</dd></div>
          <div><dt>{t('Renk / desen / kesim')}</dt><dd>{t('Bilinmiyor')}</dd></div>
          <div><dt>{t('Beden / barkod')}</dt><dd>{t('Henüz eşleştirilmedi')}</dd></div>
        </dl>
        {source && <p>{t('Kaynak kontrolü')}: {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', { dateStyle: 'medium', timeZone: 'Europe/Istanbul' }).format(new Date(source.accessedAt))}</p>}
        <p>{t('Renk ve kesim çizimi temsilidir. Fiyat ve stok bilgisi henüz eklenmedi.')}</p>
      </details>
      <div className="catalog-piece-bottom"><span>{t('Ana kumaş')}</span><a className="text-button" href={product.productUrl} target="_blank" rel="noopener noreferrer">{t('Ürün sayfası')}<ArrowUpRight size={14}/></a></div>
      <button type="button" className="secondary-button catalog-add-product" disabled={isAdded || !type || type.group === 'one_piece'} onClick={onAdd}>{isAdded ? <Check size={14}/> : <Plus size={14}/>} {t(isAdded ? 'Dolabında' : 'Dolabıma ekle')}</button>
      {type?.group === 'one_piece' && <small>{t('Tek parça giyim desteği hazırlanıyor.')}</small>}
    </div>
  </article>;
}
