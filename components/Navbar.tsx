'use client';

import React from 'react';
import { CloudSun, Sun, Moon, Database, MessageSquare, Shirt } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSources: () => void;
  onOpenFeedback: () => void;
  onOpenWardrobe: () => void;
  wardrobeCount: number;
  activeMode: 'city' | 'route' | 'globe';
  onChangeMode: (mode: 'city' | 'route' | 'globe') => void;
}

export function Navbar({
  theme,
  onToggleTheme,
  onOpenSources,
  onOpenFeedback,
  onOpenWardrobe,
  wardrobeCount,
  activeMode,
  onChangeMode,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & NOk Collective Signature */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-400 p-0.5 flex items-center justify-center shadow-sm">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <CloudSun className="w-5 h-5 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                Wear Weather
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                v0.3.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>by</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">NOk</span>
              <span className="text-slate-400 dark:text-slate-600">&bull;</span>
              <span className="truncate hidden sm:inline">AI Gardırop & Rota Rehberi</span>
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Clean Segmented Tabs) */}
        <nav aria-label="Görünüm Seçenekleri" className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-medium">
          <button
            onClick={() => onChangeMode('city')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'city'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Şehir & İlçe
          </button>
          <button
            onClick={() => onChangeMode('route')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'route'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ülke İçi Rota
          </button>
          <button
            onClick={() => onChangeMode('globe')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMode === 'globe'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            3D Küre & Uçuş
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* My Wardrobe Button (v0.3.0) */}
          <button
            onClick={onOpenWardrobe}
            title="Dijital Gardırobum (Kıyafet Ekle / Yönet)"
            className="p-2 rounded-xl text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Shirt className="w-4 h-4" />
            <span className="hidden lg:inline">Gardırobum</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px]">
              {wardrobeCount}
            </span>
          </button>

          {/* Multi-source Status Button */}
          <button
            onClick={onOpenSources}
            title="Hava Durumu Kaynakları & API Anahtarları"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 text-xs"
          >
            <Database className="w-4 h-4 text-sky-500" />
            <span className="hidden md:inline font-medium">Kaynaklar</span>
          </button>

          {/* Feedback Button */}
          <button
            onClick={onOpenFeedback}
            title="Geri Bildirim & Termal Kalibrasyon"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 text-xs"
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline font-medium">Kalibrasyon</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
            aria-label="Tema Değiştir"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
}
