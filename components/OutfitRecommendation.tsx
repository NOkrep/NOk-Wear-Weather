'use client';

import React, { useState, useMemo, memo } from 'react';
import {
  WeatherConsensus,
  BudgetSegment,
  OutfitApproach,
  ClothingItem,
  ThermalProfile,
} from '@/lib/types';
import {
  generateLayerTimeline,
  generateDirectOutfit,
  getColorThermalAdvice,
  ANCHOR_ITEMS,
  matchAnchorItem,
} from '@/lib/clothing-engine';
import { getMarketProfileForCountry } from '@/lib/clothing-catalog';
import { matchFromUserWardrobe } from '@/lib/wardrobe-storage';
import {
  Layers,
  Briefcase,
  Sparkles,
  Pin,
  Plus,
  Clock,
  Sliders,
  X,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface GarmentIconProps {
  item: Pick<ClothingItem, 'name' | 'category' | 'colorHex'>;
  className?: string;
}

// Multi-layered technical garment SVG sketch engine (Orbyte HMI Quality)
const GarmentIcon = memo(function GarmentIcon({
  item,
  className = 'w-12 h-12',
}: GarmentIconProps) {
  const lower = item.name.toLowerCase();
  const fill = item.colorHex || '#38bdf8';
  const stroke = '#64748b';

  if (item.category === 'footwear') {
    const isBoot = lower.includes('bot');
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none">
        {isBoot ? (
          <path
            d="M16 12h16v22c0 4 4 6 12 8 6 1.5 8 5 8 9v3H12V16c0-2.2 1.8-4 4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M14 28h16l6 8c6 1.5 16 3 16 10v4H10V32c0-2.2 1.8-4 4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        <rect x="10" y="49" width="44" height="5" rx="2" fill="#334155" />
        <line x1="20" y1="20" x2="28" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (item.category === 'bottom') {
    const isShorts = lower.includes('şort');
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none">
        {isShorts ? (
          <path
            d="M16 12h32l3 24H35l-3-8-3 8H13l3-24z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M18 10h28l4 46H36l-4-28-4 28H14l4-46z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        <line x1="32" y1="10" x2="32" y2="22" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  if (item.category === 'accessory') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none">
        <path
          d="M32 14c-14 0-22 10-22 20h44c0-10-8-20-22-20z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        <path d="M32 34v16c0 3-2.5 5-5 5s-4-2-4-4" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (item.category === 'outer') {
    const isLong = lower.includes('trençkot') || lower.includes('kaban') || lower.includes('parka');
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none">
        <path
          d={
            isLong
              ? 'M22 10l10 6 10-6 14 8-6 16-6-3v25H20V31l-6 3-6-16 14-8z'
              : 'M22 12l10 5 10-5 14 8-5 16-7-3v17H20V33l-7 3-5-16 14-8z'
          }
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="32" y1="16" x2="32" y2={isLong ? '56' : '48'} stroke={stroke} strokeWidth="2" />
        <circle cx="28" cy="24" r="1.5" fill={stroke} />
        <circle cx="36" cy="24" r="1.5" fill={stroke} />
      </svg>
    );
  }

  if (item.category === 'mid') {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none">
        <path
          d="M22 12c3 3 7 4 10 4s7-1 10-4l14 8-5 18-7-4v18H20V34l-7 4-5-18 14-8z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M26 16c3 3 9 3 12 0" stroke={stroke} strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path
        d="M22 14c3 3 7 4 10 4s7-1 10-4l12 7-5 12-7-3v20H20V30l-7 3-5-12 14-7z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
});

interface OutfitRecommendationProps {
  weather: WeatherConsensus;
  districtName: string;
  countryName?: string;
  stopCount?: number;
  accentHex?: string;
  thermalProfile?: ThermalProfile;
  wardrobe?: ClothingItem[];
  onOpenFeedback?: () => void;
  onOpenWardrobe?: () => void;
}

function inferIconItemFromName(name: string, idx: number): Pick<ClothingItem, 'name' | 'category' | 'colorHex'> {
  const lower = name.toLowerCase();
  if (lower.includes('bot') || lower.includes('sneaker') || lower.includes('ayakkabı') || lower.includes('loafer')) {
    return { name, category: 'footwear', colorHex: '#334155' };
  }
  if (lower.includes('pantolon') || lower.includes('kot') || lower.includes('chino') || lower.includes('şort')) {
    return { name, category: 'bottom', colorHex: '#1e293b' };
  }
  if (lower.includes('şemsiye') || lower.includes('gözlük')) {
    return { name, category: 'accessory', colorHex: '#0284c7' };
  }
  if (lower.includes('ceket') || lower.includes('trençkot') || lower.includes('mont') || lower.includes('kaban') || lower.includes('parka') || lower.includes('kabuk') || lower.includes('yağmurluk')) {
    return { name, category: 'outer', colorHex: '#d4b996' };
  }
  if (lower.includes('gömlek') || lower.includes('kazak') || lower.includes('triko') || lower.includes('polar') || lower.includes('hoodie') || lower.includes('hırka')) {
    return { name, category: 'mid', colorHex: '#60a5fa' };
  }
  return { name, category: idx === 0 ? 'base' : 'mid', colorHex: '#f8fafc' };
}

export const OutfitRecommendation = memo(function OutfitRecommendation({
  weather,
  countryName = 'Türkiye',
  accentHex = '#0ea5e9',
  thermalProfile = { offsetC: 0, feedbackCount: 0, label: '0°C' },
  wardrobe = [],
  onOpenFeedback,
  onOpenWardrobe,
}: OutfitRecommendationProps) {
  const [segment, setSegment] = useState<BudgetSegment>('essential');
  const [approach, setApproach] = useState<OutfitApproach>('direct');
  const [selectedAnchor, setSelectedAnchor] = useState<ClothingItem>(ANCHOR_ITEMS[0]);
  const [inspectedItem, setInspectedItem] = useState<ClothingItem | null>(null);

  const market = useMemo(() => getMarketProfileForCountry(countryName), [countryName]);
  const colorAdvice = useMemo(() => getColorThermalAdvice(weather), [weather]);
  const layerTimeline = useMemo(
    () => generateLayerTimeline(weather, segment, thermalProfile.offsetC, countryName),
    [weather, segment, thermalProfile.offsetC, countryName]
  );
  const directOutfit = useMemo(
    () => generateDirectOutfit(weather, segment, thermalProfile.offsetC, countryName),
    [weather, segment, thermalProfile.offsetC, countryName]
  );
  const anchorMatch = useMemo(
    () => matchAnchorItem(selectedAnchor, weather, thermalProfile.offsetC),
    [selectedAnchor, weather, thermalProfile.offsetC]
  );
  const wardrobeMatch = useMemo(
    () => matchFromUserWardrobe(wardrobe, weather, thermalProfile.offsetC),
    [wardrobe, weather, thermalProfile.offsetC]
  );

  const activeTierKey =
    segment === 'luxury' || segment === 'premium'
      ? 'luxury'
      : segment === 'smart'
      ? 'smart'
      : 'essential';
  const activeTierInfo = market.tiers[activeTierKey];

  return (
    <div className="p-3.5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 relative">
      {/* Top Bar: Mode Switcher + Purchasing Power */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-0.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-xs font-bold">
          <button
            type="button"
            onClick={() => setApproach('direct')}
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer`}
            style={{
              backgroundColor: approach === 'direct' ? (themeIsDark => accentHex) : undefined,
              color: approach === 'direct' ? '#ffffff' : undefined,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Görsel Kombin</span>
          </button>
          <button
            type="button"
            onClick={() => setApproach('layering')}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Saatlik Katman</span>
          </button>
          <button
            type="button"
            onClick={() => setApproach('wardrobe')}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Dolabım ({wardrobe.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setApproach('anchor')}
            className="px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Eşleştir</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSegment('essential')}
              className={`px-2 py-1 rounded-lg cursor-pointer ${
                segment === 'essential' ? 'text-white' : 'text-slate-500'
              }`}
              style={{ backgroundColor: segment === 'essential' ? accentHex : undefined }}
            >
              Standart
            </button>
            <button
              type="button"
              onClick={() => setSegment('smart')}
              className={`px-2 py-1 rounded-lg cursor-pointer ${
                segment === 'smart' ? 'text-white' : 'text-slate-500'
              }`}
              style={{ backgroundColor: segment === 'smart' ? accentHex : undefined }}
            >
              Orta-Üst
            </button>
            <button
              type="button"
              onClick={() => setSegment('luxury')}
              className={`px-2 py-1 rounded-lg cursor-pointer ${
                segment === 'luxury' || segment === 'premium' ? 'text-white' : 'text-slate-500'
              }`}
              style={{ backgroundColor: segment === 'luxury' || segment === 'premium' ? accentHex : undefined }}
            >
              Lüks
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenFeedback}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:opacity-100 cursor-pointer"
            title={`Kişisel Termal Kalibrasyon (${thermalProfile.label})`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Brands & Color Palette */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-2 truncate">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {market.countryName} ({activeTierInfo.priceBand}):
          </span>
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {activeTierInfo.referenceBrands.slice(0, 4).join(' • ')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0" title={colorAdvice.reason}>
          <span className="text-[10px] text-slate-400 mr-0.5 hidden sm:inline">Renk:</span>
          {colorAdvice.recommendedPalette.map((col, idx) => (
            <span
              key={idx}
              className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700"
              style={{ backgroundColor: col }}
            />
          ))}
        </div>
      </div>

      {/* VIEW 1: VISUAL GARMENT SILHOUETTE CARDS (TAP TO INSPECT) */}
      {approach === 'direct' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {directOutfit.map((item) => (
            <div
              key={item.id}
              onClick={() => setInspectedItem(item)}
              className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center justify-between space-y-2 hover:border-sky-500/50 transition-all cursor-pointer group"
              title="Detaylı kumaş ve teknik bilgi için tıkla"
            >
              <div className="w-full flex items-center justify-between text-[9px] font-bold uppercase text-slate-400">
                <span>
                  {item.category === 'base'
                    ? 'İÇ'
                    : item.category === 'mid'
                    ? 'ORTA'
                    : item.category === 'outer'
                    ? 'DIŞ'
                    : item.category === 'bottom'
                    ? 'ALT'
                    : 'AYAK'}
                </span>
                <span className="text-amber-500">{'●'.repeat(item.warmth)}</span>
              </div>

              <div className="py-1 group-hover:scale-105 transition-transform">
                <GarmentIcon item={item} className="w-14 h-14 drop-shadow-xs" />
              </div>

              <div className="space-y-1 w-full">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-500 transition-colors">
                  {item.name}
                </h4>
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-full">
                  {item.material}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: HOURLY LAYERING MATRIX */}
      {approach === 'layering' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {layerTimeline.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold flex items-center gap-1" style={{ color: accentHex }}>
                  <Clock className="w-3 h-3" />
                  {step.phase === 'morning' ? 'Sabah' : step.phase === 'midday' ? 'Öğle' : 'Akşam'} ({step.timeRange.split(' ')[0]})
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {step.expectedTemp}°C
                </span>
              </div>

              <div className="flex items-center justify-around py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80">
                {step.activeItems.slice(0, 3).map((name, i) => {
                  const iconItem = inferIconItemFromName(name, i);
                  return (
                    <div
                      key={i}
                      onClick={() =>
                        setInspectedItem({
                          id: `layer-${idx}-${i}`,
                          name,
                          category: 'mid',
                          segment,
                          material: step.actionDescription,
                          warmth: 3,
                          waterResistance: 'none',
                          windResistance: 'medium',
                          colorName: 'Nötr',
                          colorHex: accentHex,
                          colorType: 'neutral',
                          description: step.thermalTip,
                        })
                      }
                      className="flex flex-col items-center text-center max-w-[72px] cursor-pointer hover:scale-105 transition-transform"
                      title="İncelemek için tıkla"
                    >
                      <GarmentIcon item={iconItem} className="w-9 h-9" />
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate w-full mt-0.5">
                        {name.split('/')[0].trim()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                className="text-[10px] font-bold text-center py-1 rounded-lg"
                style={{ backgroundColor: accentHex + '15', color: accentHex }}
              >
                {step.actionTitle.split(':')[1] || step.actionTitle}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: WARDROBE ITEMS */}
      {approach === 'wardrobe' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              Dolap Uyum Skoru: %{wardrobeMatch.coverageScore}
            </span>
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="px-2.5 py-1 rounded-xl text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              style={{ backgroundColor: accentHex }}
            >
              <Plus className="w-3 h-3" />
              Katalogdan Ekle
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {wardrobeMatch.selectedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setInspectedItem(item)}
                className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center space-y-1.5 cursor-pointer hover:border-sky-500/50 transition-all"
              >
                <GarmentIcon item={item} className="w-12 h-12" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {item.name}
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                  {item.material}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: ANCHOR MATCHING */}
      {approach === 'anchor' && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {ANCHOR_ITEMS.map((item) => {
              const isSelected = selectedAnchor.id === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedAnchor(item)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap flex items-center gap-1.5 cursor-pointer`}
                  style={{
                    backgroundColor: isSelected ? accentHex : undefined,
                    color: isSelected ? '#ffffff' : undefined,
                    borderColor: isSelected ? accentHex : undefined,
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {anchorMatch.complementaryItems.map((comp) => (
              <div
                key={comp.id}
                onClick={() => setInspectedItem(comp)}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center space-y-1 cursor-pointer hover:border-sky-500/50 transition-all"
              >
                <GarmentIcon item={comp} className="w-10 h-10" />
                <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {comp.name}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: accentHex }}>
                  {comp.material}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAP-TO-INSPECT TECHNICAL GARMENT DRAWER / MODAL */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GarmentIcon item={inspectedItem} className="w-10 h-10" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {inspectedItem.name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Kategori: {inspectedItem.category.toUpperCase()} &bull; Segment: {inspectedItem.segment.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Fabric Science & Weather Fit */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white block">
                  🧪 Kumaş Bilimi & Teknik Değerler
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Lif / Malzeme:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{inspectedItem.material}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Termal Yalıtım (1-5):</span>
                    <strong className="text-amber-500">{'★'.repeat(inspectedItem.warmth)} ({inspectedItem.warmth}/5)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Su Direnci:</span>
                    <strong className="text-sky-500">{inspectedItem.waterResistance.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Rüzgar Kalkanı:</span>
                    <strong className="text-indigo-400">{inspectedItem.windResistance.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1.5">
                <span className="font-extrabold text-sky-700 dark:text-sky-300 block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Neden Bu Parça Önerildi?
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {inspectedItem.description || colorAdvice.reason} (Hissedilen Sıcaklık: {weather.feelsLike}°C, Rüzgar: {weather.windSpeed} km/s).
                </p>
              </div>

              {inspectedItem.brandHint && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-400 block mb-0.5">Bulunulan Ülke Referans Markaları:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{inspectedItem.brandHint}</strong>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});