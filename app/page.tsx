'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { RealCityMap } from '@/components/RealCityMap';
import { HourlyForecastChart } from '@/components/HourlyForecastChart';
import { OutfitRecommendation } from '@/components/OutfitRecommendation';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SourceSettingsModal } from '@/components/SourceSettingsModal';
import { WardrobeModal } from '@/components/WardrobeModal';
import {
  LocationInfo,
  WeatherCondition,
  ThermalProfile,
  ClothingItem,
  ItineraryStop,
} from '@/lib/types';
import {
  fetchWeatherConsensus,
  getPersonalThermalProfile,
  computeCompositeItineraryWeather,
  resolveStopWeatherAtTime,
} from '@/lib/weather-service';
import { getStoredWardrobe, DEFAULT_WARDROBE_ITEMS } from '@/lib/wardrobe-storage';
import {
  ShieldCheck,
  Wind,
  Droplets,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  LocateFixed,
  Shirt,
  Database,
} from 'lucide-react';

// Dynamic Weather Design Palette (Orbyte + Atmospheric Weather Reactive)
function getWeatherThemePalette(cond: WeatherCondition) {
  switch (cond) {
    case 'sunny':
      return {
        label: '☀️ Güneşli & Sıcak Ambiyans',
        accentHex: '#f59e0b',
        pageTint: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.03]',
        cardBorder: 'border-amber-500/35 dark:border-amber-500/30',
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        heroGradient: 'from-amber-500/20 via-orange-500/5 to-transparent',
      };
    case 'rainy':
      return {
        label: '🌧️ Yağışlı Okyanus Ambiyansı',
        accentHex: '#0284c7',
        pageTint: 'bg-sky-500/[0.05] dark:bg-sky-500/[0.04]',
        cardBorder: 'border-sky-500/40 dark:border-sky-500/30',
        badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        heroGradient: 'from-sky-500/20 via-blue-600/5 to-transparent',
      };
    case 'stormy':
      return {
        label: '⚡ Fırtına & Sağanak Ambiyansı',
        accentHex: '#8b5cf6',
        pageTint: 'bg-purple-500/[0.05] dark:bg-purple-500/[0.04]',
        cardBorder: 'border-purple-500/40 dark:border-purple-500/30',
        badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        heroGradient: 'from-purple-500/20 via-indigo-600/5 to-transparent',
      };
    case 'snowy':
      return {
        label: '❄️ Kristal Kar & Ayaz Ambiyansı',
        accentHex: '#06b6d4',
        pageTint: 'bg-cyan-500/[0.05] dark:bg-cyan-500/[0.04]',
        cardBorder: 'border-cyan-400/45 dark:border-cyan-400/30',
        badgeClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
        heroGradient: 'from-cyan-400/20 via-sky-300/5 to-transparent',
      };
    case 'clear_night':
      return {
        label: '🌙 Açık Gece Ambiyansı',
        accentHex: '#6366f1',
        pageTint: 'bg-indigo-500/[0.05] dark:bg-indigo-500/[0.04]',
        cardBorder: 'border-indigo-500/35 dark:border-indigo-500/30',
        badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        heroGradient: 'from-indigo-500/20 via-slate-800/5 to-transparent',
      };
    default:
      return {
        label: '⛅ Dengeli Kuzey Ambiyansı',
        accentHex: '#0ea5e9',
        pageTint: 'bg-slate-100 dark:bg-slate-950',
        cardBorder: 'border-slate-200/90 dark:border-slate-800',
        badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        heroGradient: 'from-sky-500/15 via-teal-500/5 to-transparent',
      };
  }
}

function getWeatherIcon(cond: WeatherCondition, className = 'w-6 h-6') {
  switch (cond) {
    case 'sunny':
      return <Sun className={`${className} text-amber-500`} />;
    case 'clear_night':
      return <Moon className={`${className} text-indigo-400`} />;
    case 'rainy':
      return <CloudRain className={`${className} text-sky-500`} />;
    case 'stormy':
      return <CloudLightning className={`${className} text-purple-500`} />;
    case 'snowy':
      return <CloudSnow className={`${className} text-cyan-400`} />;
    default:
      return <Cloud className={`${className} text-slate-400`} />;
  }
}

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'outfit' | 'map' | 'hourly'>('outfit');

  const [stops, setStops] = useState<ItineraryStop[]>([
    {
      id: 'stop-initial',
      location: {
        country: 'Türkiye',
        city: 'İstanbul',
        district: 'Kadıköy',
        lat: 40.992,
        lon: 29.027,
      },
      preferredTime: '',
    },
  ]);
  const [activeStopId, setActiveStopId] = useState<string>('stop-initial');

  const [thermalProfile, setThermalProfile] = useState<ThermalProfile>({
    offsetC: 0,
    feedbackCount: 0,
    label: '0°C',
  });
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(DEFAULT_WARDROBE_ITEMS);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    setThermalProfile(getPersonalThermalProfile());
    setWardrobe(getStoredWardrobe());
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const refreshAllStopsWeather = useCallback(() => {
    setStops((prev) => {
      prev.forEach((st) => {
        fetchWeatherConsensus(st.location).then((w) => {
          setStops((current) =>
            current.map((item) => (item.id === st.id ? { ...item, weather: w } : item))
          );
        });
      });
      return prev;
    });
  }, []);

  useEffect(() => {
    refreshAllStopsWeather();
  }, [refreshAllStopsWeather]);

  const activeStop = useMemo(
    () => stops.find((s) => s.id === activeStopId) || stops[0],
    [stops, activeStopId]
  );

  const compositeWeather = useMemo(
    () => computeCompositeItineraryWeather(stops, activeStop?.weather || null),
    [stops, activeStop]
  );

  const activeStopResolved = useMemo(() => {
    if (!activeStop?.weather) return null;
    return resolveStopWeatherAtTime(activeStop.weather, activeStop.preferredTime);
  }, [activeStop]);

  const currentCondition: WeatherCondition = activeStopResolved
    ? activeStopResolved.condition
    : compositeWeather?.condition || 'partly_cloudy';

  const palette = useMemo(() => getWeatherThemePalette(currentCondition), [currentCondition]);

  const handleAddStop = useCallback((loc: LocationInfo, preferredTime?: string) => {
    const newId = `stop-${Date.now()}`;
    const newStop: ItineraryStop = {
      id: newId,
      location: loc,
      preferredTime: preferredTime || '',
    };
    setStops((prev) => [...prev, newStop]);
    setActiveStopId(newId);

    fetchWeatherConsensus(loc).then((w) => {
      setStops((current) =>
        current.map((item) => (item.id === newId ? { ...item, weather: w } : item))
      );
    });
  }, []);

  const handleUpdateStopLocation = useCallback((id: string, loc: LocationInfo) => {
    setStops((prev) =>
      prev.map((item) => (item.id === id ? { ...item, location: loc } : item))
    );
    fetchWeatherConsensus(loc).then((w) => {
      setStops((current) =>
        current.map((item) => (item.id === id ? { ...item, weather: w } : item))
      );
    });
  }, []);

  const handleUpdateStopTime = useCallback((id: string, time: string) => {
    setStops((prev) =>
      prev.map((item) => (item.id === id ? { ...item, preferredTime: time } : item))
    );
  }, []);

  const handleRemoveStop = useCallback(
    (id: string) => {
      setStops((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((item) => item.id !== id);
        if (activeStopId === id && filtered.length > 0) {
          setActiveStopId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeStopId]
  );

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lon = Math.round(pos.coords.longitude * 100) / 100;
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            handleUpdateStopLocation(activeStop.id, {
              country: data.country || 'Türkiye',
              city: data.city || 'Mevcut Şehir',
              district: data.district || 'Bulunduğunuz İlçe',
              lat,
              lon,
            });
            setIsLocating(false);
            return;
          }
        } catch (e) {
          console.error(e);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 8000 }
    );
  }, [activeStop.id, handleUpdateStopLocation]);

  return (
    <div
      className={`min-h-screen ${palette.pageTint} text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col justify-between`}
    >
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenSources={() => setIsSourceModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenWardrobe={() => setIsWardrobeModalOpen(true)}
        wardrobeCount={wardrobe.length}
        previewDevice={previewDevice}
        onTogglePreviewDevice={() =>
          setPreviewDevice((prev) => (prev === 'desktop' ? 'mobile' : 'desktop'))
        }
        weatherLabel={palette.label}
        accentBadgeClass={palette.badgeClass}
        accentHex={palette.accentHex}
      />

      {previewDevice === 'mobile' ? (
        <div className="py-6 px-3 flex justify-center items-center flex-1">
          <div className="w-full max-w-[412px] h-[760px] rounded-[42px] bg-slate-50 dark:bg-slate-950 border-[6px] border-slate-800 dark:border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden relative">
            <div
              className="px-5 pt-3 pb-2.5 bg-gradient-to-b border-b flex items-center justify-between"
              style={{
                backgroundImage: `linear-gradient(to bottom, ${palette.accentHex}20, transparent)`,
                borderColor: palette.accentHex + '40',
              }}
            >
              <div className="flex items-center gap-2">
                {getWeatherIcon(currentCondition, 'w-6 h-6')}
                <div>
                  <span className="text-xs font-extrabold block leading-none">
                    {activeStop.location.district}, {activeStop.location.city}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {stops.length} Durak Aktif &bull; His {activeStopResolved?.feelsLike ?? 17}°C
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black leading-none" style={{ color: palette.accentHex }}>
                  {activeStopResolved?.temp ?? 18}°C
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {mobileTab === 'outfit' && compositeWeather && (
                <OutfitRecommendation
                  weather={compositeWeather}
                  districtName={activeStop.location.district}
                  countryName={activeStop.location.country}
                  stopCount={stops.length}
                  accentHex={palette.accentHex}
                  thermalProfile={thermalProfile}
                  wardrobe={wardrobe}
                  onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                  onOpenWardrobe={() => setIsWardrobeModalOpen(true)}
                />
              )}

              {mobileTab === 'map' && (
                <RealCityMap
                  stops={stops}
                  activeStopId={activeStop.id}
                  accentHex={palette.accentHex}
                  onSelectActiveStop={setActiveStopId}
                  onAddStop={handleAddStop}
                  onUpdateStopLocation={handleUpdateStopLocation}
                  onUpdateStopTime={handleUpdateStopTime}
                  onRemoveStop={handleRemoveStop}
                  theme={theme}
                />
              )}

              {mobileTab === 'hourly' && activeStop?.weather && (
                <HourlyForecastChart
                  consensus={activeStop.weather}
                  districtName={activeStop.location.district}
                />
              )}
            </div>

            <div className="h-15 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-3 flex items-center justify-around text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setMobileTab('outfit')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer`}
                style={{ color: mobileTab === 'outfit' ? palette.accentHex : undefined }}
              >
                <Shirt className="w-4 h-4" />
                <span>Ne Giymeli?</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('map')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer`}
                style={{ color: mobileTab === 'map' ? palette.accentHex : undefined }}
              >
                <LocateFixed className="w-4 h-4" />
                <span>Duraklar ({stops.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('hourly')}
                className={`flex flex-col items-center gap-0.5 cursor-pointer`}
                style={{ color: mobileTab === 'hourly' ? palette.accentHex : undefined }}
              >
                <Sun className="w-4 h-4" />
                <span>Saatlik</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWardrobeModalOpen(true)}
                className="flex flex-col items-center gap-0.5 text-slate-400 hover:opacity-100 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Katalog</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="max-w-[1380px] mx-auto px-3 sm:px-5 py-3.5 w-full space-y-3.5 relative z-10 flex-1">
          {/* Weather-Reactive HMI Top HUD Bar */}
          <div
            className={`px-4 py-2.5 rounded-3xl bg-white dark:bg-slate-900 border ${palette.cardBorder} shadow-xs flex flex-wrap items-center justify-between gap-3`}
            style={{
              backgroundImage: `linear-gradient(to right, ${palette.accentHex}15, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-2xl bg-white/80 dark:bg-slate-800/90 border"
                style={{ borderColor: palette.accentHex + '40' }}
              >
                {getWeatherIcon(currentCondition, 'w-7 h-7')}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: palette.accentHex }}
                >
                  {activeStopResolved ? `${activeStopResolved.temp}°C` : '18°C'}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {activeStop.location.district}, {activeStop.location.city}
                    </span>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="px-2 py-0.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LocateFixed className="w-3 h-3" style={{ color: palette.accentHex }} />
                      <span>{isLocating ? '...' : 'GPS'}</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    His: <strong>{activeStopResolved?.feelsLike ?? 17}°C</strong> &bull; Çiy:{' '}
                    {activeStop.weather?.dewPoint ?? 10}°C
                  </span>
                </div>
              </div>
            </div>

            {compositeWeather && (
              <div className="flex items-center gap-3 sm:gap-5 text-xs">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4" style={{ color: palette.accentHex }} />
                  <span className="font-extrabold">{compositeWeather.windSpeed} km/s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4" style={{ color: palette.accentHex }} />
                  <span className="font-extrabold">%{compositeWeather.humidity}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-extrabold">UV {compositeWeather.uvIndex}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    %{compositeWeather.confidenceScore}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">
            <div className="xl:col-span-5">
              <RealCityMap
                stops={stops}
                activeStopId={activeStop.id}
                accentHex={palette.accentHex}
                onSelectActiveStop={setActiveStopId}
                onAddStop={handleAddStop}
                onUpdateStopLocation={handleUpdateStopLocation}
                onUpdateStopTime={handleUpdateStopTime}
                onRemoveStop={handleRemoveStop}
                theme={theme}
              />
            </div>

            <div className="xl:col-span-7 space-y-3.5">
              {compositeWeather && (
                <OutfitRecommendation
                  weather={compositeWeather}
                  districtName={activeStop.location.district}
                  countryName={activeStop.location.country}
                  stopCount={stops.length}
                  accentHex={palette.accentHex}
                  thermalProfile={thermalProfile}
                  wardrobe={wardrobe}
                  onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                  onOpenWardrobe={() => setIsWardrobeModalOpen(true)}
                />
              )}

              {activeStop?.weather && (
                <HourlyForecastChart
                  consensus={activeStop.weather}
                  districtName={activeStop.location.district}
                />
              )}
            </div>
          </div>
        </main>
      )}

      <WardrobeModal
        isOpen={isWardrobeModalOpen}
        onClose={() => setIsWardrobeModalOpen(false)}
        wardrobe={wardrobe}
        onWardrobeChange={(updated) => setWardrobe(updated)}
        currentCountry={activeStop.location.country}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentLocationName={`${activeStop.location.district}, ${activeStop.location.city}`}
        onFeedbackChanged={() => setThermalProfile(getPersonalThermalProfile())}
      />

      <SourceSettingsModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onKeysSaved={refreshAllStopsWeather}
        onDataWiped={() => {
          setWardrobe(DEFAULT_WARDROBE_ITEMS);
          setThermalProfile({ offsetC: 0, feedbackCount: 0, label: '0°C' });
        }}
      />
    </div>
  );
}