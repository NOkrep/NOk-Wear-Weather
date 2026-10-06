'use client';

import React from 'react';
import { WeatherConsensus, WeatherCondition } from '@/lib/types';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  ShieldCheck,
  Thermometer,
  Layers,
} from 'lucide-react';

interface HourlyForecastChartProps {
  consensus: WeatherConsensus;
  districtName: string;
}

function getWeatherIcon(cond: WeatherCondition, className = 'w-4 h-4') {
  switch (cond) {
    case 'sunny':
      return <Sun className={`${className} text-amber-500`} />;
    case 'clear_night':
      return <Sun className={`${className} text-indigo-400`} />;
    case 'rainy':
      return <CloudRain className={`${className} text-sky-500`} />;
    case 'stormy':
      return <CloudLightning className={`${className} text-purple-500`} />;
    case 'snowy':
      return <CloudSnow className={`${className} text-blue-300`} />;
    case 'cloudy':
    case 'partly_cloudy':
    default:
      return <Cloud className={`${className} text-slate-400`} />;
  }
}

export function HourlyForecastChart({ consensus, districtName }: HourlyForecastChartProps) {
  const hourly = consensus.hourly || [];

  return (
    <div className="space-y-4">
      {/* Top Banner: Confidence & Sources breakdown */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                3+ Kaynaklı Tahmin Konsensüsü
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                ({districtName} için güncellendi: {consensus.lastUpdated})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <span>Model Uyum Güveni:</span>
            <span>%{consensus.confidenceScore}</span>
          </div>
        </div>

        {/* 3 Sources Mini-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {consensus.sources.map((src, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {src.sourceName}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Aktif ve Doğrulandı" />
              </div>
              <div className="flex items-baseline justify-between text-slate-900 dark:text-white">
                <span className="text-lg font-bold">{src.temp}°C</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hissedilen: {src.feelsLike}°C
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Rüzgar: {src.windSpeed} km/s</span>
                <span>Yağış: %{src.precipitationProb}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Timeline with Layer Action Advice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Layers className="w-4 h-4 text-sky-500" />
            <span>Saatlik Sıcaklık & Katman Hareketleri</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Yana kaydırarak inceleyebilirsiniz &rarr;
          </span>
        </div>

        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex items-stretch gap-2.5 min-w-[700px]">
            {hourly.map((h, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-[95px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/70 dark:border-slate-800/70 flex flex-col items-center justify-between text-center space-y-2 hover:border-sky-400/50 transition-colors"
              >
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {h.timeStr}
                </span>

                <div className="my-0.5">
                  {getWeatherIcon(h.condition, 'w-6 h-6')}
                </div>

                <div className="space-y-0.5">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white block">
                    {h.temp}°C
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    % {h.precipitationProb} yağış
                  </span>
                </div>

                {/* Katman Uyarısı */}
                <div className="w-full pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[10px] font-medium text-sky-600 dark:text-sky-400 leading-tight">
                  {h.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
