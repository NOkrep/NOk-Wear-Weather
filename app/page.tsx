'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  WeatherConsensus,
  WeatherCondition,
  ThermalProfile,
  ClothingItem,
} from '@/lib/types';
import { fetchWeatherConsensus, getPersonalThermalProfile } from '@/lib/weather-service';
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

function getConditionLabelTr(cond: WeatherCondition): string {
  switch (cond) {
    case 'sunny':
      return 'Güneşli & Açık';
    case 'clear_night':
      return 'Açık Gece';
    case 'partly_cloudy':
      return 'Parçalı Bulutlu';
    case 'cloudy':
      return 'Çok Bulutlu';
    case 'rainy':
      return 'Yağmurlu';
    case 'stormy':
      return 'Fırtınalı & Sağanak';
    case 'snowy':
      return 'Kar Yağışlı';
    case 'foggy':
      return 'Sisli & Puslu';
    default:
      return 'Parçalı Bulutlu';
  }
}

export default function HomePage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeMode, setActiveMode] = useState<'city' | 'route' | 'globe'>('city');
  const [location, setLocation] = useState<LocationInfo>({
    country: 'Türkiye',
    city: 'İstanbul',
    district: 'Kadıköy',
    lat: 40.992,
    lon: 29.027,
  });

  const [consensus, setConsensus] = useState<WeatherConsensus | null>(null);
  const [thermalProfile, setThermalProfile] = useState<ThermalProfile>({
    offsetC: 0,
    feedbackCount: 0,
    label: 'Standart Termal Profil',
  });
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(DEFAULT_WARDROBE_ITEMS);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);

  // Sync theme with HTML root class (works with @custom-variant dark in globals.css)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load personal thermal profile and user wardrobe on mount
  useEffect(() => {
    setThermalProfile(getPersonalThermalProfile());
    setWardrobe(getStoredWardrobe());
  }, []);

  const loadWeather = useCallback((loc: LocationInfo) => {
    fetchWeatherConsensus(loc)
      .then((data) => {
        setConsensus(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  // Fetch weather consensus when location changes
  useEffect(() => {
    loadWeather(location);
  }, [location, loadWeather]);

  const handleSelectDistrict = useCallback((dist: LocationInfo) => {
    setLocation(dist);
  }, []);

  // Privacy-first Geolocation Detection
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lon = Math.round(pos.coords.longitude * 100) / 100;

        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            setLocation({
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

        setLocation({
          country: 'Türkiye',
          city: 'Mevcut Şehir',
          district: 'Bulunduğunuz İlçe',
          lat,
          lon,
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation permission denied or timed out:', err);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  }, []);

  // Dynamic Weather Ambiance Accent Border (GPU friendly, zero full-screen repaint)
  const getHeroAccentRing = () => {
    if (!consensus) return 'border-slate-200/90 dark:border-slate-800';
    switch (consensus.condition) {
      case 'sunny':
        return 'border-amber-400/40 dark:border-amber-500/30';
      case 'rainy':
        return 'border-sky-400/40 dark:border-sky-500/30';
      case 'stormy':
        return 'border-purple-400/40 dark:border-purple-500/30';
      case 'snowy':
        return 'border-cyan-400/40 dark:border-cyan-500/30';
      default:
        return 'border-slate-200/90 dark:border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col justify-between">
      {/* Navigation Header */}
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

      {/* Main App Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 sm:py-6 w-full space-y-5 relative z-10">
        {/* Compact Unified Hero + Live Weather Overview Strip */}
        <div
          className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border ${getHeroAccentRing()} shadow-xs space-y-4`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Current Location & Weather Snapshot */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80">
                {getWeatherIcon(consensus ? consensus.condition : 'partly_cloudy', 'w-9 h-9')}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {location.district}, {location.city}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    [{location.lat.toFixed(2)}, {location.lon.toFixed(2)}]
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin text-sky-500' : 'text-sky-500'}`} />
                    <span>{isLocating ? 'Algılanıyor...' : 'Konumumu Bul'}</span>
                  </button>
                </div>

                {consensus ? (
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {consensus.temp}°C
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                      Hissedilen: <strong className="text-slate-700 dark:text-slate-200">{consensus.feelsLike}°C</strong>
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {getConditionLabelTr(consensus.condition)}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 mt-1">Hava durumu konsensüsü yükleniyor...</div>
                )}
              </div>
            </div>

            {/* Center: Quick Meteorological Metrics */}
            {consensus && (
              <div className="grid grid-cols-4 gap-3 sm:gap-5 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400">Rüzgar</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{consensus.windSpeed} km/s</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400">Nem / Çiy</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      %{consensus.humidity} ({consensus.dewPoint}°C)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400">UV İndeksi</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{consensus.uvIndex}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-400">Güven</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">%{consensus.confidenceScore}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Travel Intent Mode Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveMode('city')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'city'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Şehir İçi
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('route')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'route'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Karayolu Rota
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('globe')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMode === 'globe'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                Ülke / Uçuş
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Mode Content: Side-by-Side Bento Grid on Desktop so Map & Outfit are visible together! */}
        {activeMode === 'city' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Left Column (5 cols): Interactive Map */}
              <div className="xl:col-span-5">
                <RealCityMap
                  currentLocation={location}
                  onSelectDistrict={handleSelectDistrict}
                  tempSnapshot={consensus ? consensus.temp : 18}
                  theme={theme}
                />
              </div>

              {/* Right Column (7 cols): Immediate Outfit & Wardrobe Recommendation */}
              <div className="xl:col-span-7">
                {consensus && (
                  <OutfitRecommendation
                    weather={consensus}
                    districtName={location.district}
                    thermalProfile={thermalProfile}
                    wardrobe={wardrobe}
                    onOpenFeedback={() => setIsFeedbackModalOpen(true)}
                    onOpenWardrobe={() => setIsWardrobeModalOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* Bottom Row: 18-Hour Timeline & 3+ Model Consensus Breakdown */}
            {consensus && (
              <HourlyForecastChart
                consensus={consensus}
                districtName={location.district}
              />
            )}
          </div>
        )}

        {activeMode === 'route' && (
          <RoutePlanner
            currentCity={location.city}
            currentCoords={{ lat: location.lat, lon: location.lon }}
            theme={theme}
          />
        )}

        {activeMode === 'globe' && (
          <GlobeView
            theme={theme}
            currentLocation={location}
          />
        )}
      </main>

      {/* Modals */}
      <WardrobeModal
        isOpen={isWardrobeModalOpen}
        onClose={() => setIsWardrobeModalOpen(false)}
        wardrobe={wardrobe}
        onWardrobeChange={(updated) => setWardrobe(updated)}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentLocationName={`${location.district}, ${location.city}`}
        onFeedbackChanged={() => setThermalProfile(getPersonalThermalProfile())}
      />

      <SourceSettingsModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onKeysSaved={() => loadWeather(location)}
      />

      {/* Footer & NOk Signature */}
      <footer className="mt-10 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-5 text-xs text-slate-500 dark:text-slate-400 relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">Wear Weather</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              v0.3.1
            </span>
            <span>&bull;</span>
            <span>Developed by <strong className="text-slate-700 dark:text-slate-300">NOk</strong> Collective</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Sıfır GPS Takibi &bull; Anonim İlçe Düzeyi
            </span>
            <span>&bull;</span>
            <button
              onClick={() => setIsWardrobeModalOpen(true)}
              className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
            >
              Dijital Gardırop ({wardrobe.length})
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              Kaynaklar (3+)
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Kalibrasyon
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
