'use client';

import React, { useEffect, useRef, useState } from 'react';
import { LocationInfo } from '@/lib/types';
import { getCartoTileUrl, MAP_ATTRIBUTION } from '@/lib/map-config';
import {
  MapPin,
  Search,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface RealCityMapProps {
  currentLocation: LocationInfo;
  onSelectDistrict: (district: LocationInfo) => void;
  tempSnapshot: number;
  theme?: 'dark' | 'light';
}

function buildMarkerHtml(label: string, temp: number) {
  return `
    <div style="
      background: #0284c7;
      color: #ffffff;
      border: 2px solid #38bdf8;
      border-radius: 12px;
      padding: 5px 10px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45);
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    ">
      <span>📍 ${label}</span>
      <span style="background: #ffffff; color: #0284c7; padding: 1px 5px; border-radius: 6px; font-weight: 800;">
        ${temp}°C
      </span>
    </div>
  `;
}

export function RealCityMap({
  currentLocation,
  onSelectDistrict,
  tempSnapshot,
  theme = 'dark',
}: RealCityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const onSelectRef = useRef(onSelectDistrict);

  useEffect(() => {
    onSelectRef.current = onSelectDistrict;
  }, [onSelectDistrict]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lon],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      const tileLayer = L.tileLayer(getCartoTileUrl(theme), {
        attribution: MAP_ATTRIBUTION,
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const markerIcon = L.divIcon({
        className: 'current-location-marker',
        html: buildMarkerHtml(currentLocation.district || currentLocation.city, tempSnapshot),
        iconSize: [140, 32],
        iconAnchor: [70, 16],
      });

      const mainMarker = L.marker([currentLocation.lat, currentLocation.lon], {
        icon: markerIcon,
      }).addTo(map);
      markerRef.current = mainMarker;

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        setIsReverseGeocoding(true);

        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            onSelectRef.current({
              country: data.country || 'Global',
              city: data.city || 'Bölge',
              district: data.district || 'Seçili Konum',
              lat: Math.round(lat * 1000) / 1000,
              lon: Math.round(lng * 1000) / 1000,
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsReverseGeocoding(false);
        }
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch CARTO basemap dynamically when theme changes (Dark Matter vs Voyager)
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getCartoTileUrl(theme));
    }
  }, [theme]);

  // Smoothly flyTo and update marker icon when location or temperature updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    map.flyTo([currentLocation.lat, currentLocation.lon], Math.max(map.getZoom(), 11), {
      duration: 1.1,
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([currentLocation.lat, currentLocation.lon]);
      const updatedIcon = L.divIcon({
        className: 'current-location-marker',
        html: buildMarkerHtml(currentLocation.district || currentLocation.city, tempSnapshot),
        iconSize: [140, 32],
        iconAnchor: [70, 16],
      });
      markerRef.current.setIcon(updatedIcon);
    }
  }, [currentLocation.lat, currentLocation.lon, currentLocation.district, currentLocation.city, tempSnapshot]);

  // Debounced Global Search Autocomplete (300ms)
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (item: any) => {
    onSelectDistrict({
      country: item.country || 'Global',
      city: item.city || item.district,
      district: item.district,
      lat: item.lat,
      lon: item.lon,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-sky-500" />
              Canlı Harita & İlçe Keşfi ({theme === 'dark' ? 'CARTO Dark Matter' : 'CARTO Voyager'})
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 font-semibold">
              {currentLocation.district}, {currentLocation.city}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Haritada herhangi bir noktaya tıklayarak o bölgenin hava ve giysi durumunu anında inceleyebilirsiniz.</span>
          </p>
        </div>

        {isReverseGeocoding && (
          <div className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1.5 self-start sm:self-auto font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Tıklanan konum çözümleniyor...</span>
          </div>
        )}
      </div>

      {/* Global Search Bar (Worldwide Autocomplete) */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Dünya genelinde herhangi bir ilçe, şehir veya ülke arayın (Örn: Kadıköy, Kaş, Çankaya, Berlin, Paris, Tokyo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
        </div>

        {/* Global Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-1 max-h-64 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.displayName}
                  </span>
                </div>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold shrink-0 ml-2">
                  Haritayı Konumla &rarr;
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Real Map Canvas */}
      <div className="relative w-full h-[380px] sm:h-[430px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Quick Hint */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pointer-events-none px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <span className="font-medium">
            💡 İpucu: Haritada herhangi bir yere tıklayarak istediğiniz ilçeyi/bölgeyi anında seçebilirsiniz.
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
            {theme === 'dark' ? 'CARTO Dark Matter' : 'CARTO Voyager'} &bull; 5M Kotası
          </span>
        </div>
      </div>
    </div>
  );
}
