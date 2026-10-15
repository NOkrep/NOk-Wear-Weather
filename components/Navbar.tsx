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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-[1380px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
        {/* Brand & NOk Collective Signature */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-amber-400 p-0.5 flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[9px] flex items-center justify-center">
              <CloudSun className="w-4 h-4 text-sky-500 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">
                Wear Weather
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                v0.4.0
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Mode Switcher */}
        <nav
          aria-label="Görünüm Seçenekleri"
          className="hidden md:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-medium"
        >
          <button
            onClick={() => onChangeMode('city')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeMode === 'city'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Günlük Duraklar & Kombin
          </button>
          <button
            onClick={() => onChangeMode('route')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeMode === 'route'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Karayolu OSRM Rota
          </button>
          <button
            onClick={() => onChangeMode('globe')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeMode === 'globe'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            3D Küre & Uçuş
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenWardrobe}
            title="Kıyafet Kataloğu & Gardırobum"
            className="px-2.5 py-1.5 rounded-xl text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog & Dolap</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px]">
              {wardrobeCount}
            </span>
          </button>

          <button
            onClick={onOpenSources}
            title="Gizlilik Kalkanı & Veri Kaynakları"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-sky-500" />
            <span className="hidden lg:inline font-medium">Gizlilik & Kaynaklar</span>
          </button>

          <button
            onClick={onOpenFeedback}
            title="Termal Kalibrasyon"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline font-medium">Kalibrasyon</span>
          </button>

          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Açık Temaya Geç' : 'Karanlık Temaya Geç'}
            aria-label="Tema Değiştir"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
