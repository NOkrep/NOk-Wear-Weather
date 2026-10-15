'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { RealCityMap } from '@/components/RealCityMap';
import { HourlyForecastChart } from '@/components/HourlyForecastChart';
import { OutfitRecommendation } from '@/components/OutfitRecommendation';
import { RoutePlanner } from '@/components/RoutePlanner';
import { GlobeView } from '@/components/GlobeView';
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
  MapPin,
  Compass,
  Plane,
  ShieldCheck,
  Wind,
  Droplets,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  LocateFixed,
  Shirt,
  Smartphone,
} from 'lucide-react';

function getWeatherIcon(cond: WeatherCondition, className = 'w-6 h-6') {
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

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeMode, setActiveMode] = useState<'city' | 'route' | 'globe'>('city');

  // Multi-stop Daily Itinerary (City, Intercity, or International stops with optional preferred times)
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
    label: 'Standart Profil',
  });
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(DEFAULT_WARDROBE_ITEMS);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Register PWA Service Worker & listen for beforeinstallprompt
  useEffect(() => {
    setThermalProfile(getPersonalThermalProfile());
    setWardrobe(getStoredWardrobe());

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setPwaInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Fetch weather for any stop that doesn't have weather loaded yet
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

  // Synthesize composite weather across all daily stops (and their preferred hours)
  const compositeWeather = useMemo(
    () => computeCompositeItineraryWeather(stops, activeStop?.weather || null),
    [stops, activeStop]
  );

  const activeStopResolved = useMemo(() => {
    if (!activeStop?.weather) return null;
    return resolveStopWeatherAtTime(activeStop.weather, activeStop.preferredTime);
  }, [activeStop]);

  // Handlers for adding, updating, and removing daily itinerary stops
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

  // Privacy-first Geolocation Detection
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

  const handleInstallPwa = async () => {
    if (!pwaInstallPrompt) return;
    pwaInstallPrompt.prompt();
    await pwaInstallPrompt.userChoice;
    setPwaInstallPrompt(null);
  };

  return (
    <div className="min-h-screen pb-16 md:pb-0 bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenSources={() => setIsSourceModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenWardrobe={() => setIsWardrobeModalOpen(true)}
        wardrobeCount={wardrobe.length}
        activeMode={activeMode}
        onChangeMode={setActiveMode}
      />

      {/* Main Workspace */}
      <main className="max-w-[1380px] mx-auto px-3 sm:px-5 py-4 w-full space-y-4 relative z-10">
        {/* Ultra-Compact Top Status Strip */}
        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Active Stop & Temperature */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
              {getWeatherIcon(
                activeStopResolved ? activeStopResolved.condition : 'partly_cloudy',
                'w-6 h-6'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {activeStop.location.district}, {activeStop.location.city} ({activeStop.location.country})
                </span>
                {activeStop.preferredTime && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">
                    Saat: {activeStop.preferredTime}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 cursor-pointer"
                >
                  <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Algılanıyor...' : 'GPS'}</span>
                </button>
              </div>

              {activeStopResolved && activeStop.weather ? (
                <div className="flex items-center gap-3 text-xs mt-0.5">
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {activeStopResolved.temp}°C
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    His: <strong>{activeStopResolved.feelsLike}°C</strong>
                  </span>
                  <span className="text-slate-400 hidden sm:inline">&bull;</span>
                  <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Çiy: {activeStop.weather.dewPoint}°C
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Yükleniyor...</span>
              )}
            </div>
          </div>

          {/* Compact Metrics */}
          {compositeWeather && (
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {compositeWeather.windSpeed} km/s
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  %{compositeWeather.humidity}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  UV {compositeWeather.uvIndex}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  %{compositeWeather.confidenceScore}
                </span>
              </div>
            </div>
          )}

          {/* Optional PWA Install Button + Mode Pills */}
          <div className="flex items-center gap-1.5">
            {pwaInstallPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Uygulamayı Yükle</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveMode('city')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                activeMode === 'city'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Günlük Plan & Kombin</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('route')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                activeMode === 'route'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Karayolu OSRM</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('globe')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                activeMode === 'globe'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Uçuş & Küre</span>
            </button>
          </div>
        </div>

        {/* Main View: Compact Side-by-Side Bento Grid */}
        {activeMode === 'city' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* Left (5 cols): Multi-Stop Itinerary Chain & Interactive Map */}
              <div className="xl:col-span-5">
                <RealCityMap
                  stops={stops}
                  activeStopId={activeStop.id}
                  onSelectActiveStop={setActiveStopId}
                  onAddStop={handleAddStop}
                  onUpdateStopLocation={handleUpdateStopLocation}
                  onUpdateStopTime={handleUpdateStopTime}
                  onRemoveStop={handleRemoveStop}
                  theme={theme}
                />
              </div>

              {/* Right (7 cols): Compact Outfit & Wardrobe Recommendation */}
              <div className="xl:col-span-7">
                {compositeWeather && (
                  <OutfitRecommendation
                    weather={compositeWeather}
                    districtName={activeStop.location.district}
                    countryName={activeStop.location.country}
                    stopCount={stops.length}
                    thermalProfile={thermalProfile}
                    wardrobe={wardrobe}
                    onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                    onOpenWardrobe={() => setIsWardrobeModalOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* Bottom Compact Hourly Strip */}
            {activeStop?.weather && (
              <HourlyForecastChart
                consensus={activeStop.weather}
                districtName={activeStop.location.district}
              />
            )}
          </div>
        )}

        {activeMode === 'route' && (
          <RoutePlanner
            currentCity={activeStop.location.city}
            currentCoords={{ lat: activeStop.location.lat, lon: activeStop.location.lon }}
            theme={theme}
          />
        )}

        {activeMode === 'globe' && (
          <GlobeView
            theme={theme}
            currentLocation={activeStop.location}
          />
        )}
      </main>

      {/* Mobile App Bottom Navigation Bar (Visible on Phones/Tablets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-around text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setActiveMode('city')}
          className={`flex flex-col items-center gap-0.5 ${
            activeMode === 'city' ? 'text-sky-500' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Günlük Plan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('route')}
          className={`flex flex-col items-center gap-0.5 ${
            activeMode === 'route' ? 'text-sky-500' : 'text-slate-400'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>OSRM Rota</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('globe')}
          className={`flex flex-col items-center gap-0.5 ${
            activeMode === 'globe' ? 'text-sky-500' : 'text-slate-400'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Uçuş/Küre</span>
        </button>
        <button
          type="button"
          onClick={() => setIsWardrobeModalOpen(true)}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-sky-500"
        >
          <Shirt className="w-4 h-4" />
          <span>Dolap ({wardrobe.length})</span>
        </button>
      </nav>

      {/* Modals */}
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
          setThermalProfile({ offsetC: 0, feedbackCount: 0, label: 'Standart Profil' });
        }}
      />

      {/* Compact Footer */}
      <footer className="hidden md:block mt-8 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1380px] mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">Wear Weather</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500">
              v0.4.0 App
            </span>
            <span>&bull;</span>
            <span>by <strong>NOk</strong> Collective</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Anonim ~1.1km Izgara &bull; Sıfır Takip
            </span>
            <button onClick={() => setIsWardrobeModalOpen(true)} className="text-sky-500 hover:underline">
              Kıyafet Kataloğu ({wardrobe.length})
            </button>
            <button onClick={() => setIsSourceModalOpen(true)} className="text-sky-500 hover:underline">
              Gizlilik & Kaynaklar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
