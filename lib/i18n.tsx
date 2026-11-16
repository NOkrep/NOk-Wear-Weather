'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { english, translateEnglish } from './translations';
import type { ClothingItem } from './types';

export type Locale = 'tr' | 'en';
export const LOCALE_KEY = 'wear_weather_locale_v1';
export function translate<T>(value: T, locale: Locale): T {
  if (locale !== 'en' || typeof value !== 'string') return value;
  return (english[value.trim()] ?? translateEnglish(value)) as T;
}
type GarmentLabel = Pick<ClothingItem, 'name' | 'nameEn' | 'dataSource' | 'isUserOwned'>;
type Context = { locale: Locale; setLocale: (locale: Locale) => void; t: typeof identity; garment: (item: GarmentLabel) => string };
const identity = <T,>(value: T): T => value;
const LanguageContext = createContext<Context>({ locale: 'tr', setLocale: () => {}, t: identity, garment: item => item.name });
const subscribeToHydration = () => () => {};
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLanguage] = useState<Locale>('tr');
  const browserReady = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [languageLoaded, setLanguageLoaded] = useState(false);
  if (browserReady && !languageLoaded) {
    setLanguageLoaded(true);
    try { if (localStorage.getItem(LOCALE_KEY) === 'en') setLanguage('en'); } catch {}
  }
  useEffect(() => {
    const reset = () => setLanguage('tr');
    window.addEventListener('weathrobe-data-wiped', reset);
    return () => window.removeEventListener('weathrobe-data-wiped', reset);
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const setLocale = useCallback((next: Locale) => {
    setLanguage(next);
    try { localStorage.setItem(LOCALE_KEY, next); } catch {}
  }, []);
  const t = useCallback(<T,>(value: T) => translate(value, locale), [locale]);
  const garment = useCallback((item: GarmentLabel) => item.dataSource === 'catalog' ? locale === 'en' ? item.nameEn ?? item.name : item.name : item.dataSource === 'user' || item.dataSource === 'barcode' ? item.name : translate(item.name, locale), [locale]);
  const context = useMemo(() => ({ locale, setLocale, t, garment }), [locale, setLocale, t, garment]);
  return <LanguageContext.Provider value={context}>{children}</LanguageContext.Provider>;
}
export const useLocale = () => useContext(LanguageContext);
