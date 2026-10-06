'use client';

import React, { useState } from 'react';
import { X, Database, CheckCircle2, Key, Info, ExternalLink } from 'lucide-react';

interface SourceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SourceSettingsModal({ isOpen, onClose }: SourceSettingsModalProps) {
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [openWeatherMapKey, setOpenWeatherMapKey] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('wear_weather_custom_keys', JSON.stringify({ weatherApiKey, openWeatherMapKey }));
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hava Durumu Veri Kaynakları (3+ Model)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Sources List */}
        <div className="space-y-2.5 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
            Şu Anda Aktif Olan Anahtarsız Güvenilir Kaynaklar:
          </span>

          {/* 1. Open-Meteo */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                1. Open-Meteo API
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktif &bull; Anahtarsız
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              ECMWF ve GFS modelleriyle saatlik sıcaklık, bağıl nem, rüzgar hamlesi, UV indeksi ve yağış olasılığı.
            </p>
          </div>

          {/* 2. MET Norway */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                2. MET Norway (Yr.no)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktif &bull; Anahtarsız
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Norveç Meteoroloji Enstitüsü kamu açık API&apos;si. Yüksek çözünürlüklü İskandinav ve Avrupa modelleri.
            </p>
          </div>

          {/* 3. DWD Bright Sky */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                3. Deutscher Wetterdienst (DWD ICON)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktif &bull; Anahtarsız
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Alman Meteoroloji Servisi açık verileri (Bright Sky proxy). Küresel ICON hava modeli.
            </p>
          </div>
        </div>

        {/* Optional Custom Keys Form */}
        <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Key className="w-4 h-4 text-amber-500" />
            <span>İsteğe Bağlı Ek Kaynak Anahtarları Ekleme</span>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block font-medium">
              WeatherAPI.com API Anahtarı:
            </label>
            <input
              type="password"
              placeholder="İsteğe bağlı WeatherAPI anahtarı..."
              value={weatherApiKey}
              onChange={(e) => setWeatherApiKey(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block font-medium">
              OpenWeatherMap API Anahtarı:
            </label>
            <input
              type="password"
              placeholder="İsteğe bağlı OpenWeatherMap anahtarı..."
              value={openWeatherMapKey}
              onChange={(e) => setOpenWeatherMapKey(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-colors shadow-xs"
          >
            {saved ? 'Kaydedildi!' : 'Ayarları Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
