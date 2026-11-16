'use client';

import React, { useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { normalizeGarmentAppearance, resolveGarmentAppearance, type AppearanceItem } from '@/lib/garment-appearance';
import { STUDIO_ASSETS } from '@/lib/garment-studio-assets';
import { GarmentVisual } from './GarmentVisual';

export type StudioContext = 'reference' | 'personal' | 'design';
type StudioItem = AppearanceItem & { isUserOwned?: boolean };

/** Fixed studio references must not impersonate a saved personal appearance. */
export function studioReference(item: StudioItem, context: StudioContext = 'reference') {
  if (context === 'personal' || context !== 'design' && (item.isUserOwned || item.dataSource === 'user' || item.dataSource === 'barcode')) return undefined;
  const saved = normalizeGarmentAppearance(item.personalAppearance, item);
  if (['color', 'accentColor', 'pattern', 'fit', 'length', 'neckline', 'sleeve'].some(field => saved[field as keyof typeof saved] !== undefined)) return undefined;
  const a = resolveGarmentAppearance(item);
  const variant = a.design?.variant ?? (a.neckline === 'hood' && a.type === 'sweatshirt' ? 1 : a.neckline === 'hood' && a.type === 'puffer' ? 2 : 0);
  return a.type ? STUDIO_ASSETS[a.type + ':' + variant] : undefined;
}

export function GarmentStudioVisual({ item, className = '', context = 'reference' }: { item: StudioItem; className?: string; context?: StudioContext }) {
  const { t, garment } = useLocale();
  const [failedSrc, setFailedSrc] = useState<string>();
  const asset = studioReference(item, context);
  if (!asset) return <GarmentVisual item={item} className={className}/>;
  if (failedSrc === asset.src) return <span className={'garment-visual garment-studio-fallback ' + className} data-studio-fallback={asset.designId}>
    <GarmentVisual item={item}/><small>{t('Görsel yüklenemedi · çizim')}</small>
  </span>;
  return <span className={'garment-visual garment-studio-visual ' + className} data-studio-design={asset.designId}>
    {/* Local, hashed, pre-sized WebP assets; no remote service receives wardrobe data. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="garment-studio-image" src={asset.src} width={asset.width} height={asset.height} loading="lazy" decoding="async"
      alt={garment(item) + ' · ' + t('Temsili stüdyo · gerçek ürün fotoğrafı değildir.')} onError={() => setFailedSrc(asset.src)}/>
    <small className="garment-studio-caption">{t('Temsili stüdyo')}</small>
  </span>;
}
