'use client';

import React from 'react';
import {
  CloudSun,
  Sun,
  Moon,
  Database,
  MessageSquare,
  Shirt,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSources: () => void;
  onOpenFeedback: () => void;
  onOpenWardrobe: () => void;
  wardrobeCount: number;
  previewDevice: 'desktop' | 'mobile';
  onTogglePreviewDevice: () => void;
  weatherLabel?: string;
  accentBadgeClass?: string;
  accentHex?: string;
}

export function Navbar({
  theme,
  onToggleTheme,
  onOpenSources,
  onOpenFeedback,
  onOpenWardrobe,
  wardrobeCount,
  previewDevice,
  onTogglePreviewDevice,
  weatherLabel = 'Dinamik İklim Modu',
  accentBadgeClass = 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  accentHex = '#0ea5e9',
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-[1380px] mx-auto px-3 sm:px-5 h-13 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl p-0.5 flex items-center justify-center shadow-xs"
            style={{
              background: `linear-gradient(to top right, ${accentHex}, #f59e0b)`,
            }}
          >
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[9px] flex items-center justify-center">
              <CloudSun className="w-4 h-4" style={{ color: accentHex }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm">
              Wear Weather
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accentBadgeClass}`}>
              {weatherLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePreviewDevice}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              previewDevice === 'mobile'
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {previewDevice === 'mobile' ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Masaüstü Görünüm</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                <span>📱 App Preview</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenWardrobe}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            style={{ color: accentHex }}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog & Dolap</span>
            <span className="px-1.5 rounded-full text-white text-[10px]" style={{ backgroundColor: accentHex }}>
              {wardrobeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenSources}
            title="Gizlilik & Kaynaklar"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" style={{ color: accentHex }} />
          </button>

          <button
            type="button"
            onClick={onOpenFeedback}
            title="Termal Kalibrasyon"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            title="Tema Değiştir"
            className="p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer"
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