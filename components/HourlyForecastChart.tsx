'use client';

import React, { useState, memo } from 'react';
import { WeatherConsensus, WeatherCondition } from '@/lib/types';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
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
  const [showSources, setShowSources] = useState(false);
  const hourly = consensus.hourly || [];
  const temps = hourly.map((h) => h.temp);
  const minTemp = temps.length > 0 ? Math.min(...temps) : 10;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 25;
  const tempSpan = Math.max(4, maxTemp - minTemp);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
      {/* Compact Header with Collapsible 3-Sources Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
          <Layers className="w-4 h-4 text-sky-500" />
          <span>Saatlik Akış ({districtName})</span>
        </div>

        <button
          type="button"
          onClick={() => setShowSources(!showSources)}
          className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{consensus.sources.length} Kaynak Ortalaması (%{consensus.confidenceScore} Güven)</span>
          {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Collapsible 3-Source Comparison Drawer */}
      {showSources && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 pb-2 border-b border-slate-100 dark:border-slate-800">
          {consensus.sources.map((src, i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 text-xs flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                  {src.sourceName}
                </span>
                <span className="text-[10px] text-slate-400">
                  His: {src.feelsLike}°C &bull; Rüzgar: {src.windSpeed} km/s
                </span>
              </div>
              <span className="text-base font-black text-slate-900 dark:text-white">
                {src.temp}°C
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Compact Hourly Strip */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex items-stretch gap-2 min-w-[640px]">
          {hourly.slice(0, 12).map((h, idx) => {
            const barPct = Math.round(((h.temp - minTemp) / tempSpan) * 100);
            return (
              <div
                key={idx}
                className="flex-1 min-w-[82px] p-2 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex flex-col items-center justify-between text-center space-y-1.5"
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {h.timeStr}
                </span>
                {getWeatherIcon(h.condition, 'w-4 h-4')}
                <div className="w-full space-y-0.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    {h.temp}°C
                  </span>
                  <div className="w-8 mx-auto h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-amber-400"
                      style={{ width: `${Math.max(20, barPct)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 leading-tight line-clamp-1">
                  {h.suggestedAction}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
