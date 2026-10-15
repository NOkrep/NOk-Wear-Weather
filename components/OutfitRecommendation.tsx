'use client';

import React, { useState, useMemo, memo } from 'react';
import {
  WeatherConsensus,
  BudgetSegment,
  OutfitApproach,
  ClothingItem,
  ThermalProfile,
  AiStylistResponse,
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
import { getStoredCustomKeys } from '@/lib/weather-service';
import {
  Shirt,
  Sparkles,
  Layers,
  Palette,
  Clock,
  CheckCircle2,
  Pin,
  Sliders,
  Briefcase,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

interface OutfitRecommendationProps {
  weather: WeatherConsensus;
  districtName: string;
  countryName?: string;
  stopCount?: number;
  thermalProfile?: ThermalProfile;
  wardrobe?: ClothingItem[];
  onOpenFeedback?: () => void;
  onOpenWardrobe?: () => void;
}

export const OutfitRecommendation = memo(function OutfitRecommendation({
  weather,
  districtName,
  countryName = 'Türkiye',
  stopCount = 1,
  thermalProfile = { offsetC: 0, feedbackCount: 0, label: 'Standart Profil' },
  wardrobe = [],
  onOpenFeedback,
  onOpenWardrobe,
}: OutfitRecommendationProps) {
  const [segment, setSegment] = useState<BudgetSegment>('essential');
  const [approach, setApproach] = useState<OutfitApproach>('layering');
  const [selectedAnchor, setSelectedAnchor] = useState<ClothingItem>(ANCHOR_ITEMS[0]);
  const [showColorDrawer, setShowColorDrawer] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);

  // AI Stylist state (only rendered when AI drawer is opened)
  const [userActivity, setUserActivity] = useState('');
  const [aiAdvice, setAiAdvice] = useState<AiStylistResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

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

  const handleAskGeminiStylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiLoading(true);
    try {
      const customKeys = getStoredCustomKeys();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customKeys.geminiApiKey?.trim()) {
        headers['x-gemini-key'] = customKeys.geminiApiKey.trim();
      }
      const res = await fetch('/api/ai-stylist', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'stylist_advice',
          weather,
          districtName,
          wardrobe,
          thermalProfile,
          userActivity: userActivity.trim() || 'Günlük şehir temposu',
        }),
      });
      if (res.ok) {
        setAiAdvice(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
      {/* Compact Header + 3-Tier Country Purchasing Power Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Shirt className="w-4 h-4 text-sky-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {stopCount > 1 ? `${stopCount} Duraklı Günlük Kombin` : `${districtName} Giysi Reçetesi`}
          </h2>
          {thermalProfile.feedbackCount > 0 && (
            <button
              type="button"
              onClick={onOpenFeedback}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-2.5 h-2.5" />
              <span>{thermalProfile.label}</span>
            </button>
          )}
        </div>

        {/* 3-Tier Country Purchasing Power Selector */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setSegment('essential')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              segment === 'essential'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={`${market.countryName}: ${market.tiers.essential.referenceBrands.join(', ')}`}
          >
            Standart
          </button>
          <button
            type="button"
            onClick={() => setSegment('smart')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              segment === 'smart'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={`${market.countryName}: ${market.tiers.smart.referenceBrands.join(', ')}`}
          >
            Orta-Üst
          </button>
          <button
            type="button"
            onClick={() => setSegment('luxury')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              segment === 'luxury' || segment === 'premium'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={`${market.countryName}: ${market.tiers.luxury.referenceBrands.join(', ')}`}
          >
            Lüks & Teknik
          </button>
        </div>
      </div>

      {/* Country Market Reference Strip (1-line compact info) */}
      <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-slate-600 dark:text-slate-300 truncate">
          <strong>{market.countryName} ({activeTierInfo.priceBand}):</strong>{' '}
          {activeTierInfo.referenceBrands.join(' • ')}
        </span>
        <button
          type="button"
          onClick={onOpenWardrobe}
          className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Search className="w-3 h-3" />
          <span>Katalogdan Ara/Ekle</span>
        </button>
      </div>

      {/* 4 Compact Mode Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold pb-1">
        <button
          type="button"
          onClick={() => setApproach('layering')}
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap cursor-pointer ${
            approach === 'layering'
              ? 'bg-sky-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Saatlik Katman
        </button>
        <button
          type="button"
          onClick={() => setApproach('wardrobe')}
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap cursor-pointer ${
            approach === 'wardrobe'
              ? 'bg-sky-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Dolabımdan ({wardrobe.length})
        </button>
        <button
          type="button"
          onClick={() => setApproach('direct')}
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap cursor-pointer ${
            approach === 'direct'
              ? 'bg-sky-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Tekli Kombin
        </button>
        <button
          type="button"
          onClick={() => setApproach('anchor')}
          className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap cursor-pointer ${
            approach === 'anchor'
              ? 'bg-sky-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Pin className="w-3.5 h-3.5" />
          Parça Eşle
        </button>
      </div>

      {/* MODE 1: LAYERING TIMELINE (Compact 3-Col Grid) */}
      {approach === 'layering' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {layerTimeline.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/90 flex flex-col justify-between space-y-2"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {step.timeRange}
                  </span>
                  <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                    {step.expectedTemp}°C
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                  {step.actionTitle}
                </h4>
              </div>

              <ul className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/70">
                {step.activeItems.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="text-[11px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* MODE 2: USER WARDROBE MATCH */}
      {approach === 'wardrobe' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 truncate">
              Dolap Uyum Skoru: <strong>%{wardrobeMatch.coverageScore}</strong> ({wardrobeMatch.selectedItems.length} Parça)
            </span>
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="px-2.5 py-1 rounded-lg bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Katalogdan Ekle
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {wardrobeMatch.selectedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-sky-500 block">
                    {item.category.toUpperCase()} &bull; {item.material}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                </div>
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                  title={item.colorName}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE 3: DIRECT OUTFIT */}
      {approach === 'direct' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {directOutfit.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block truncate">
                  {item.material} {item.brandHint ? `• ${item.brandHint}` : ''}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {item.description}
                </p>
              </div>
              <span
                className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0"
                style={{ backgroundColor: item.colorHex }}
                title={item.colorName}
              />
            </div>
          ))}
        </div>
      )}

      {/* MODE 4: ANCHOR ITEM MATCHING */}
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
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-slate-400"
                    style={{ backgroundColor: item.colorHex }}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {anchorMatch.complementaryItems.map((comp) => (
              <div
                key={comp.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <span className="text-[10px] text-sky-500 font-bold block">{comp.material}</span>
                <span className="font-bold text-slate-900 dark:text-white">{comp.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Collapsible Drawers for Color Science & AI Stylist (Eliminates Visual Clutter!) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowColorDrawer(!showColorDrawer)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Termal Renk Rehberi</span>
            <span className="flex items-center gap-0.5">
              {colorAdvice.recommendedPalette.slice(0, 3).map((c, i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full border border-slate-400"
                  style={{ backgroundColor: c }}
                />
              ))}
            </span>
            {showColorDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setShowAiDrawer(!showAiDrawer)}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Stil & Aktivite Danışmanı</span>
            {showAiDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {showColorDrawer && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
          <p className="text-slate-700 dark:text-slate-300">{colorAdvice.reason}</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{colorAdvice.caution}</p>
        </div>
      )}

      {showAiDrawer && (
        <form onSubmit={handleAskGeminiStylist} className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-2 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              value={userActivity}
              onChange={(e) => setUserActivity(e.target.value)}
              placeholder="Bugünkü planınız? (Örn: Vapurla işe gidip akşam açık havada oturacağım)..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Sentezle</span>
            </button>
          </div>
          {aiAdvice && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">{aiAdvice.headline}</div>
              <p className="text-slate-600 dark:text-slate-300">{aiAdvice.outfitAdvice}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{aiAdvice.fabricAndColorTip}</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
});
