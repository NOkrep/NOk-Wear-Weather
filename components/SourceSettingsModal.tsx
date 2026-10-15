'use client';

import React, { useState, useEffect } from 'react';
import { getStoredCustomKeys } from '@/lib/weather-service';
import { wipeAllLocalUserData } from '@/lib/security';
import {
  X,
  Database,
  CheckCircle2,
  Key,
  Sparkles,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface SourceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysSaved?: () => void;
  onDataWiped?: () => void;
}

export function SourceSettingsModal({
  isOpen,
  onClose,
  onKeysSaved,
  onDataWiped,
}: SourceSettingsModalProps) {
  const [weatherApiKey, setWeatherApiKey] = useState('');
  const [openWeatherMapKey, setOpenWeatherMapKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [wiped, setWiped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = getStoredCustomKeys();
      setWeatherApiKey(existing.weatherApiKey || '');
      setOpenWeatherMapKey(existing.openWeatherMapKey || '');
      setGeminiApiKey(existing.geminiApiKey || '');
      setWiped(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'wear_weather_custom_keys',
        JSON.stringify({
          weatherApiKey: weatherApiKey.trim(),
          openWeatherMapKey: openWeatherMapKey.trim(),
          geminiApiKey: geminiApiKey.trim(),
        })
      );
    }
    setSaved(true);
    onKeysSaved?.();
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const handleZeroTraceWipe = () => {
    wipeAllLocalUserData();
    setWeatherApiKey('');
    setOpenWeatherMapKey('');
    setGeminiApiKey('');
    setWiped(true);
    onDataWiped?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Veri Kaynakları & Gizlilik Kalkanı
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy & Data Security Box */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Aktif Veri Güvenliği & Anonimlik Protokolü
            </span>
          </div>
          <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
            <li>&bull; <strong>Koordinat Bulanıklaştırma:</strong> GPS konumunuz dış servislere gönderilmeden önce ~1.1 km ızgaraya yuvarlanır; ev/iş noktasal konumu asla paylaşılmaz.</li>
            <li>&bull; <strong>Başlık İçi Anahtar İletimi:</strong> API anahtarlarınız URL loglarına girmez, yalnızca cihazınızda saklanır.</li>
          </ul>
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleZeroTraceWipe}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{wiped ? 'Tüm Yerel Veriler Temizlendi!' : 'Tüm Yerel Verilerimi Sıfırla (Zero-Trace)'}</span>
            </button>
          </div>
        </div>

        {/* Active Sources Compact List */}
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block">Open-Meteo</span>
            <span className="text-emerald-500 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> ECMWF/IFS
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block">MET Norway</span>
            <span className="text-emerald-500 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Yr.no Modeli
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white block">DWD ICON</span>
            <span className="text-emerald-500 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Bright Sky
            </span>
          </div>
        </div>

        {/* Optional Custom Keys Form */}
        <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span>İsteğe Bağlı API Anahtarları</span>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 block font-medium">
              Google Gemini API Anahtarı (GEMINI_API_KEY):
            </label>
            <input
              type="password"
              placeholder="AIzaSy... (Boş bırakılırsa yerel kural motoru kullanılır)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-500" />
                <span>WeatherAPI.com:</span>
              </label>
              <input
                type="password"
                placeholder="Opsiyonel anahtar..."
                value={weatherApiKey}
                onChange={(e) => setWeatherApiKey(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 block font-medium flex items-center gap-1">
                <Key className="w-3 h-3 text-amber-500" />
                <span>OpenWeatherMap:</span>
              </label>
              <input
                type="password"
                placeholder="Opsiyonel anahtar..."
                value={openWeatherMapKey}
                onChange={(e) => setOpenWeatherMapKey(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-colors cursor-pointer"
          >
            {saved ? 'Kaydedildi!' : 'Ayarları Kaydet'}
          </button>
        </form>
      </div>
    </div>
  );
}
