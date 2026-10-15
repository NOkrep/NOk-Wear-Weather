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
import { LocationInfo, WeatherConsensus, WeatherCondition, ThermalProfile } from '@/lib/types';
import { fetchWeatherConsensus, getPersonalThermalProfile } from '@/lib/weather-service';
import {
  MapPin,
  Compass,
  Plane,
  ShieldCheck,
  Thermometer,
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
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load personal thermal profile on mount
  useEffect(() => {
    setThermalProfile(getPersonalThermalProfile());
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

  // Privacy-first Geolocation Detection (Obfuscated to ~1.1km grid + reverse geocoded district name)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum servisini desteklemiyor.');
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
  };

  // Dynamic Weather Ambiance styling
  const getAmbientStyles = () => {
    if (!consensus) return '';
    switch (consensus.condition) {
      case 'sunny':
        return 'from-amber-500/5 via-sky-500/5 to-transparent';
      case 'rainy':
        return 'from-sky-600/10 via-slate-500/5 to-transparent';
      case 'stormy':
        return 'from-purple-600/10 via-indigo-900/5 to-transparent';
      case 'snowy':
        return 'from-cyan-400/10 via-slate-400/5 to-transparent';
      case 'cloudy':
      case 'partly_cloudy':
      default:
        return 'from-slate-400/5 via-slate-500/5 to-transparent';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col justify-between">
      {/* Background Ambient Gradient */}
      <div
        className={`fixed inset-0 pointer-events-none bg-gradient-to-b ${getAmbientStyles()} transition-all duration-700`}
      />

      {/* Navigation Header */}
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenSources={() => setIsSourceModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        activeMode={activeMode}
        onChangeMode={setActiveMode}
      />

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-6 sm:space-y-8 relative z-10">
        {/* Top Hero & Daily Travel Intent Prompt */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  Kişiselleştirilmiş Günlük Rota & Gardırop Asistanı
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Firefox Uyumlu &bull; Gizlilik Odaklı
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bugün gün içerisinde nerede olacaksınız?
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Şehir içinde kalacaksanız ilçeler haritasından gün boyu hava durumunu ve saatlik kıyafet katmanlarını inceleyebilir; başka bir şehre veya ülkeye seyahat edecekseniz yol güzergahı gardırobunu planlayabilirsiniz.
              </p>
            </div>

            {/* Travel Intent Quick Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveMode('city')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeMode === 'city'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Şehir İçi Kalacağım
              </button>
              <button
                onClick={() => setActiveMode('route')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeMode === 'route'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Compass className="w-4 h-4" />
                Başka Şehre Gideceğim
              </button>
              <button
                onClick={() => setActiveMode('globe')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeMode === 'globe'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Plane className="w-4 h-4" />
                Ülke Değiştireceğim
              </button>
            </div>
          </div>

          {/* Location Bar & Quick Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Mevcut Odak: </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {location.district}, {location.city} ({location.country})
              </span>
              <span className="text-slate-400">
                [{location.lat.toFixed(2)}, {location.lon.toFixed(2)}]
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-500' : ''}`} />
                <span>{isLocating ? 'Konum Çözümleniyor...' : 'Konumumu Algıla'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Weather Overview Strip */}
        {consensus && (
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                {getWeatherIcon(consensus.condition, 'w-8 h-8')}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                    {consensus.temp}°C
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Hissedilen: {consensus.feelsLike}°C
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5 capitalize">
                  {consensus.condition.replace('_', ' ')} &bull; {consensus.sources.length} Bağımsız Kaynak Ortalaması
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-500" />
                <div>
                  <span className="block text-[10px] text-slate-400">Rüzgar</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{consensus.windSpeed} km/s</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-500" />
                <div>
                  <span className="block text-[10px] text-slate-400">Nem / Çiy</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    %{consensus.humidity} ({consensus.dewPoint}°C)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="block text-[10px] text-slate-400">UV İndeksi</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{consensus.uvIndex}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="block text-[10px] text-slate-400">Güven Puanı</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">%{consensus.confidenceScore}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Mode Content */}
        {activeMode === 'city' && (
          <div className="space-y-6 sm:space-y-8">
            {/* 1. City & Districts Interactive Map */}
            <RealCityMap
              currentLocation={location}
              onSelectDistrict={(dist) => setLocation(dist)}
              tempSnapshot={consensus ? consensus.temp : 18}
              theme={theme}
            />

            {/* 2. Hourly Forecast & Multi-source comparison chart */}
            {consensus && (
              <HourlyForecastChart
                consensus={consensus}
                districtName={location.district}
              />
            )}

            {/* 3. Clothing & Wardrobe Recommender */}
            {consensus && (
              <OutfitRecommendation
                weather={consensus}
                districtName={location.district}
                thermalProfile={thermalProfile}
                onOpenFeedback={() => setIsFeedbackModalOpen(true)}
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
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-xs text-slate-500 dark:text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">Wear Weather</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              v0.2.2
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
            <span>Firefox Optimized</span>
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
              Geri Bildirim
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
