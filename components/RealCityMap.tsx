'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TURKISH_CITIES, DistrictData, POPULAR_GLOBAL_CITIES } from '@/lib/turkey-data';
import { LocationInfo } from '@/lib/types';
import {
  MapPin,
  Search,
  ShieldCheck,
  Shirt,
  Layers,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface RealCityMapProps {
  currentLocation: LocationInfo;
  onSelectDistrict: (district: LocationInfo) => void;
  tempSnapshot: number;
}

export function RealCityMap({
  currentLocation,
  onSelectDistrict,
  tempSnapshot,
}: RealCityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [selectedCityName, setSelectedCityName] = useState<string>(
    TURKISH_CITIES[currentLocation.city] ? currentLocation.city : 'İstanbul'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);

  const cityData = TURKISH_CITIES[selectedCityName] || TURKISH_CITIES['İstanbul'];

  // Initialize and update Leaflet map with OpenStreetMap tiles (Organic Maps data base)
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Clean up previous map instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map centered at city coordinates
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lon],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      // Use OpenStreetMap / CartoDB tiles (clean, fast, 100% open source)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, CartoDB',
        maxZoom: 18,
      }).addTo(map);

      // Create LayerGroup for district markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Render markers for all districts of selected city
      cityData.districts.forEach((dist) => {
        const isSelected = dist.name === currentLocation.district;
        const simulatedDistTemp = Math.round((tempSnapshot + (dist.svgX % 3 - 1) * 0.7) * 10) / 10;

        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background: ${isSelected ? '#0284c7' : '#ffffff'};
              color: ${isSelected ? '#ffffff' : '#0f172a'};
              border: 2px solid ${isSelected ? '#38bdf8' : '#94a3b8'};
              border-radius: 12px;
              padding: 4px 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
              font-family: inherit;
              font-size: 11px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 4px;
              cursor: pointer;
              white-space: nowrap;
              transform: translate(-50%, -50%);
            ">
              <span>📍 ${dist.name}</span>
              <span style="font-weight: 800; color: ${isSelected ? '#fef08a' : '#0284c7'};">${simulatedDistTemp}°C</span>
            </div>
          `,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });

        const marker = L.marker([dist.lat, dist.lon], { icon: customIcon });

        marker.on('click', () => {
          onSelectDistrict({
            country: 'Türkiye',
            city: dist.city,
            district: dist.name,
            lat: dist.lat,
            lon: dist.lon,
          });
        });

        marker.addTo(markersLayer);
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedCityName, currentLocation.district, currentLocation.lat, currentLocation.lon, cityData.districts, tempSnapshot, onSelectDistrict]);

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
              {selectedCityName} &bull; Canlı İlçe Haritası (OpenStreetMap / Organic Maps)
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-medium">
              Seçili İlçe: {currentLocation.district}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Gerçek Coğrafi Harita Katmanı &bull; Gizlilik Odaklı İlçe Seviyesi</span>
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

      {/* Real Leaflet Map Container */}
      <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Quick district button pills along bottom */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 overflow-x-auto p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0">
            Hızlı Seçim:
          </span>
          {cityData.districts.map((dist) => {
            const isSelected = dist.name === currentLocation.district;
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
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-all font-semibold text-[11px] ${
                  isSelected
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {dist.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
