'use client';

import React, { useState } from 'react';
import { FeedbackRecord } from '@/lib/types';
import { getPersonalThermalProfile } from '@/lib/weather-service';
import {
  X,
  Star,
  MessageSquare,
  CheckCircle2,
  Copy,
  RotateCcw,
  Sliders,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationName: string;
  onFeedbackChanged?: () => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  currentLocationName,
  onFeedbackChanged,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [bestSource, setBestSource] = useState('Open-Meteo');
  const [clothingResult, setClothingResult] = useState<FeedbackRecord['clothingResult']>('perfect');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wear_weather_feedbacks');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  if (!isOpen) return null;

  const thermalProfile = getPersonalThermalProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: FeedbackRecord = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      location: currentLocationName,
      rating,
      bestSource,
      clothingResult,
      notes,
    };

    const updated = [newRecord, ...feedbacks];
    setFeedbacks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wear_weather_feedbacks', JSON.stringify(updated));
    }
    setSubmitted(true);
    onFeedbackChanged?.();
  };

  const handleResetProfile = () => {
    setFeedbacks([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wear_weather_feedbacks');
    }
    setSubmitted(false);
    onFeedbackChanged?.();
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(feedbacks, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Geri Bildirim & Kişisel Termal Kalibrasyon
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Personal Thermal Calibration Banner */}
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">
                Aktif Profil: {thermalProfile.label}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Toplam {feedbacks.length} geri bildirim kıyafet motorunu kişiselleştiriyor.
              </span>
            </div>
          </div>
          {feedbacks.length > 0 && (
            <button
              type="button"
              onClick={handleResetProfile}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-500 flex items-center gap-1 shrink-0"
              title="Kalibrasyonu Sıfırla"
            >
              <RotateCcw className="w-3 h-3" />
              Sıfırla
            </button>
          )}
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Location tag */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
              Konum: <span className="font-bold text-slate-900 dark:text-white">{currentLocationName}</span>
            </div>

            {/* Star Rating */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Hava Durumu Tahmin Doğruluğu (1 - 5 Yıldız):
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-bold text-slate-700 dark:text-slate-300 ml-2">
                  {rating} / 5 Yıldız
                </span>
              </div>
            </div>

            {/* Best Source Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Bulunduğunuz Konumda Hangi Kaynak Daha İsabetliydi?
              </label>
              <select
                value={bestSource}
                onChange={(e) => setBestSource(e.target.value)}
                className="w-full font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="Open-Meteo">Open-Meteo (ECMWF & GFS)</option>
                <option value="MET Norway">MET Norway (Yr.no)</option>
                <option value="DWD ICON">DWD ICON Modeli</option>
                <option value="Konsensüs Ortalaması">Konsensüs Ortalaması En İyisiydi</option>
              </select>
            </div>

            {/* Clothing Accuracy */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Kıyafet & Katman Tavsiyesinin İsabeti (Kombin Motorunu Kalibre Eder):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: 'perfect', label: 'Tam İsabet (Konforluydu)' },
                  { key: 'froze', label: 'Üşüttü (-1.5°C Daha Kalın Öner)' },
                  { key: 'sweated', label: 'Terletti (+1.5°C Daha Hafif Öner)' },
                  { key: 'wet', label: 'Islattı (Su geçirmezlik yetersizdi)' },
                  { key: 'color_hot', label: 'Renk Güneşte Fazla Isındı' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    onClick={() => setClothingResult(item.key as any)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      clothingResult === item.key
                        ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Ek Notlar & Detaylı Geri Bildirim:
              </label>
              <textarea
                rows={3}
                placeholder="Örn: Sabah saat 09:00'da rüzgar tahmin edilenden daha sertti, trençkot tam korudu..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-colors shadow-xs"
            >
              Geri Bildirimi Kaydet & Profili Kalibre Et
            </button>
          </form>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Teşekkürler! Termal Profiliniz Güncellendi.
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Yeni termal kalibrasyonunuz ({thermalProfile.label}) anında kıyafet motoruna uygulandı.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleCopyJSON}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Kopyalandı!' : 'Raporu JSON Olarak Kopyala'}
              </button>
              <button
                onClick={() => setSubmitted(false)}
                className="px-3.5 py-2 rounded-xl bg-sky-500 text-white font-semibold text-xs hover:bg-sky-600 transition-colors"
              >
                Yeni Bildirim
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
