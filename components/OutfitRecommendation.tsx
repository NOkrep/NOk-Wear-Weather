'use client';

import React, { useState } from 'react';
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
import {
  Shirt,
  Sparkles,
  Layers,
  Palette,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pin,
  Sliders,
} from 'lucide-react';

interface OutfitRecommendationProps {
  weather: WeatherConsensus;
  districtName: string;
  thermalProfile?: ThermalProfile;
  onOpenFeedback?: () => void;
}

export function OutfitRecommendation({
  weather,
  districtName,
  thermalProfile = { offsetC: 0, feedbackCount: 0, label: 'Standart Termal Profil' },
  onOpenFeedback,
}: OutfitRecommendationProps) {
  const [segment, setSegment] = useState<BudgetSegment>('essential');
  const [approach, setApproach] = useState<OutfitApproach | 'anchor'>('layering');
  const [selectedAnchor, setSelectedAnchor] = useState<ClothingItem>(ANCHOR_ITEMS[0]);

  const colorAdvice = getColorThermalAdvice(weather);
  const layerTimeline = generateLayerTimeline(weather, segment, thermalProfile.offsetC);
  const directOutfit = generateDirectOutfit(weather, segment, thermalProfile.offsetC);
  const anchorMatch = matchAnchorItem(selectedAnchor, weather, thermalProfile.offsetC);

  return (
    <div className="space-y-6">
      {/* Segment & Mode Controls Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shirt className="w-5 h-5 text-sky-500" />
                {districtName} için Giysi & Stil Reçetesi
              </h2>
              {thermalProfile.feedbackCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1 hover:bg-emerald-500/20 transition-colors"
                  title="Geri bildirimlerinize göre otomatik kalibre edildi"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{thermalProfile.label}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sıcaklık: {weather.temp}°C &bull; Hissedilen: {weather.feelsLike}°C &bull; Çiy Noktası: {weather.dewPoint}°C &bull; UV: {weather.uvIndex}
            </p>
          </div>

          {/* Budget Segment Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setSegment('essential')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                segment === 'essential'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Erişilebilir & Bütçe Dostu
            </button>
            <button
              onClick={() => setSegment('premium')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                segment === 'premium'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Premium & İleri Kumaşlar
            </button>
          </div>
        </div>

        {/* Approach Selector (Tabs) */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setApproach('layering')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              approach === 'layering'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Modüler Katmanlama (Canlı Saatlik Çizelge)
          </button>
          <button
            onClick={() => setApproach('direct')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              approach === 'direct'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Doğrudan Tekli Kombin
          </button>
          <button
            onClick={() => setApproach('anchor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              approach === 'anchor'
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold border border-sky-200 dark:border-sky-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Pin className="w-4 h-4" />
            Bu Parçayla Kombinle (Anchor Parça)
          </button>
        </div>

        {/* Color Dynamics & Thermal Reflection Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              Günün Termal & Optik Renk Rehberi
            </span>
            <div className="flex items-center gap-1.5">
              {colorAdvice.recommendedPalette.map((col, idx) => (
                <span
                  key={idx}
                  className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs"
                  style={{ backgroundColor: col }}
                  title={col}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {colorAdvice.reason}
          </p>
          <div className="text-[11px] text-amber-700 dark:text-amber-300/90 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{colorAdvice.caution}</span>
          </div>
        </div>
      </div>

      {/* Main Mode Content */}
      {approach === 'layering' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              Günün Saatlerine Göre Katman Hareketleri
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {segment === 'essential' ? 'Temel & Bütçe Dostu Parçalar' : 'Premium & Teknik Kumaşlar'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {layerTimeline.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 tracking-wide uppercase">
                      {step.timeRange}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {step.expectedTemp}°C (His: {step.feelsLikeTemp}°C)
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {step.actionTitle}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.actionDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Kombin Parçaları:
                  </span>
                  <ul className="space-y-1">
                    {step.activeItems.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg">
                    {step.thermalTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approach === 'direct' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              Doğrudan & Tekli Kombin Parçaları
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Katman karmaşası olmadan hazır set
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {directOutfit.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.category === 'base'
                        ? 'İç Katman'
                        : item.category === 'mid'
                        ? 'Orta Katman'
                        : item.category === 'outer'
                        ? 'Dış Katman'
                        : item.category === 'bottom'
                        ? 'Alt Giyim'
                        : 'Ayakkabı'}
                    </span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700"
                      style={{ backgroundColor: item.colorHex }}
                      title={item.colorName}
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Malzeme:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {item.material}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Renk:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {item.colorName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approach === 'anchor' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pin className="w-4 h-4 text-sky-500" />
                  Dolabınızdaki Ana Parçayı Seçin
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bugün kesinlikle giymek istediğiniz parçayı sabitleyin; sistem geri kalanını tamamlasın.
                </p>
              </div>
            </div>

            {/* Anchor Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {ANCHOR_ITEMS.map((item) => {
                const isSelected = selectedAnchor.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAnchor(item)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
                        : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block line-clamp-2">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {item.material}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anchor Matching Result */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                  Seçilen Parça Eşleşmesi
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {anchorMatch.anchorItem.name} ile Bugünün Kombini
                </h4>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {anchorMatch.weatherFitNotes}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">Renk Uyumu: </span>
              {anchorMatch.colorHarmonyNotes}
            </div>

            {/* Complementary Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {anchorMatch.complementaryItems.map((comp) => (
                <div
                  key={comp.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Tamamlayıcı Parça
                    </span>
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700"
                      style={{ backgroundColor: comp.colorHex }}
                      title={comp.colorName}
                    />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {comp.name}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {comp.description}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1">
                    Malzeme: {comp.material}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
