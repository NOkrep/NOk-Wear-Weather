'use client';

import React, { memo } from 'react';
import { WeatherConsensus, WeatherCondition } from '@/lib/types';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  ShieldCheck,
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

export const HourlyForecastChart = memo(function HourlyForecastChart({
  consensus,
  districtName,
}: HourlyForecastChartProps) {
  const hourly = consensus.hourly || [];
  const temps = hourly.map((h) => h.temp);
  const minTemp = temps.length > 0 ? Math.min(...temps) : 10;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 25;
  const tempSpan = Math.max(4, maxTemp - minTemp);

  return (
    <div className="space-y-4">
      {/* Hourly Timeline with Layer Action Advice */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span>Saatlik Sıcaklık Eğrisi & Katman Hareketleri ({districtName})</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Sağa kaydırarak 18 saati inceleyin &rarr;
          </span>
        </div>

        <div className="overflow-x-auto pb-1.5 -mx-1 px-1">
          <div className="flex items-stretch gap-2 min-w-[680px]">
            {hourly.map((h, idx) => {
              const barPct = Math.round(((h.temp - minTemp) / tempSpan) * 100);
              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[92px] p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-between text-center space-y-2 hover:border-sky-500/40 transition-colors"
                >
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {h.timeStr}
                  </span>

                  <div className="my-0.5">
                    {getWeatherIcon(h.condition, 'w-5 h-5')}
                  </div>

                  <div className="w-full space-y-1">
                    <span className="text-base font-black text-slate-900 dark:text-white block leading-none">
                      {h.temp}°C
                    </span>
                    {/* Subtle relative temperature bar */}
                    <div className="w-10 mx-auto h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-amber-400"
                        style={{ width: `${Math.max(20, barPct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      %{h.precipitationProb} yağış
                    </span>
                  </div>

                  <div className="w-full pt-1.5 border-t border-slate-200/70 dark:border-slate-800/80 text-[10px] font-semibold text-sky-600 dark:text-sky-400 leading-tight">
                    {h.suggestedAction}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3+ Sources Breakdown Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              Çok Kaynaklı Model Konsensüsü ({consensus.sources.length} Kaynak)
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Model Uyum Güveni: %{consensus.confidenceScore}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {consensus.sources.map((src, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                  {src.sourceName}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    src.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between text-slate-900 dark:text-white">
                <span className="text-lg font-black">{src.temp}°C</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  His: {src.feelsLike}°C
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/50 dark:border-slate-800/60">
                <span>Rüzgar: {src.windSpeed} km/s</span>
                <span>Yağış: %{src.precipitationProb}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
