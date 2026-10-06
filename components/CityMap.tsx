'use client';

import React, { useState } from 'react';
import { TURKISH_CITIES, DistrictData, POPULAR_GLOBAL_CITIES } from '@/lib/turkey-data';
import { LocationInfo, WeatherCondition } from '@/lib/types';
import {
  MapPin,
  Search,
  ShieldCheck,
  Sun,
  Cloud,
  CloudRain,
  Compass,
  Shirt,
  Navigation,
} from 'lucide-react';

interface CityMapProps {
  currentLocation: LocationInfo;
  onSelectDistrict: (district: LocationInfo) => void;
  tempSnapshot: number;
}

export function CityMap({
  currentLocation,
  onSelectDistrict,
  tempSnapshot,
}: CityMapProps) {
  const [selectedCityName, setSelectedCityName] = useState<string>(
    TURKISH_CITIES[currentLocation.city] ? currentLocation.city : 'İstanbul'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);

  const cityData = TURKISH_CITIES[selectedCityName] || TURKISH_CITIES['İstanbul'];

  // Handle City Change
  const handleCitySelect = (cityName: string) => {
    setSelectedCityName(cityName);
    const firstDistrict = TURKISH_CITIES[cityName]?.districts[0];
    if (firstDistrict) {
      onSelectDistrict({
        country: 'Türkiye',
        city: cityName,
        district: firstDistrict.name,
        lat: firstDistrict.lat,
        lon: firstDistrict.lon,
      });
    }
  };

  // Search through districts and global cities
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    const lower = q.toLowerCase();
    const results: LocationInfo[] = [];

    // Search Turkish districts
    for (const city in TURKISH_CITIES) {
      for (const dist of TURKISH_CITIES[city].districts) {
        if (
          dist.name.toLowerCase().includes(lower) ||
          dist.city.toLowerCase().includes(lower)
        ) {
          results.push({
            country: 'Türkiye',
            city: dist.city,
            district: dist.name,
            lat: dist.lat,
            lon: dist.lon,
          });
        }
      }
    }

    // Search global cities
    for (const g of POPULAR_GLOBAL_CITIES) {
      if (
        g.city.toLowerCase().includes(lower) ||
        g.country.toLowerCase().includes(lower) ||
        g.district.toLowerCase().includes(lower)
      ) {
        if (!results.some((r) => r.city === g.city && r.district === g.district)) {
          results.push(g);
        }
      }
    }

    setSearchResults(results.slice(0, 6));
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Privacy Callout & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              {selectedCityName} &bull; İlçeler Haritası
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-medium">
              Seçili İlçe: {currentLocation.district}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Gizlilik Güvencesi: Yalnızca İlçe Seviyesinde Konumlandırma &bull; Noktasal GPS Kaydedilmez</span>
          </p>
        </div>

        {/* City Switcher Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="city-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Şehir:
          </label>
          <select
            id="city-select"
            value={selectedCityName}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            {Object.keys(TURKISH_CITIES).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global & District Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="İlçe veya dünya şehri arayın (Örn: Kadıköy, Çankaya, Londra, Berlin)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-1">
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectDistrict(res);
                  if (TURKISH_CITIES[res.city]) {
                    setSelectedCityName(res.city);
                  }
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {res.district}
                  </span>
                  <span className="text-slate-400">
                    ({res.city}, {res.country})
                  </span>
                </div>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                  Seç &rarr;
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Vector District Map Visualization */}
      <div className="relative w-full h-[290px] sm:h-[320px] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-950 dark:to-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Dynamic District Nodes on Canvas/SVG projection */}
        <div className="absolute inset-4 sm:inset-6">
          {cityData.districts.map((dist) => {
            const isSelected = dist.name === currentLocation.district;
            // Simulated slight micro-climate variation across districts (+/- 1°C)
            const simulatedDistTemp = Math.round((tempSnapshot + (dist.svgX % 3 - 1) * 0.7) * 10) / 10;

            return (
              <button
                key={dist.id}
                onClick={() =>
                  onSelectDistrict({
                    country: 'Türkiye',
                    city: dist.city,
                    district: dist.name,
                    lat: dist.lat,
                    lon: dist.lon,
                  })
                }
                style={{
                  left: `${(dist.svgX / 480) * 85 + 5}%`,
                  top: `${(dist.svgY / 380) * 75 + 10}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all cursor-pointer ${
                  isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
                }`}
              >
                <div
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white border-sky-400 ring-4 ring-sky-500/25'
                      : 'bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-sky-400'
                  }`}
                >
                  <MapPin
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? 'text-white' : 'text-sky-500'
                    }`}
                  />
                  <div className="text-left">
                    <span className="text-[11px] font-bold block leading-none">
                      {dist.name}
                    </span>
                    <span
                      className={`text-[9px] font-semibold mt-0.5 block ${
                        isSelected ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {simulatedDistTemp}°C
                    </span>
                  </div>
                  <Shirt
                    className={`w-3 h-3 ml-0.5 ${
                      isSelected ? 'text-amber-200' : 'text-slate-400'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Map Legend & Instructions */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pointer-events-none px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
          <span>Herhangi bir ilçeye tıklayarak o ilçenin anlık gardırop tavsiyesini görebilirsiniz</span>
          <span className="hidden sm:inline font-mono text-[10px]">İlçe Vektör Koordinat Ağı</span>
        </div>
      </div>
    </div>
  );
}
