'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
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
      padding: 4px 10px;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
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

export const RealCityMap = memo(function RealCityMap({
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
  const lastCoordsRef = useRef<{ lat: number; lon: number }>({
    lat: currentLocation.lat,
    lon: currentLocation.lon,
  });
  const clickAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelectDistrict;
  }, [onSelectDistrict]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Initialize Leaflet Map ONCE on mount with preferCanvas for 60fps performance
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
        preferCanvas: true,
        wheelPxPerZoomLevel: 110,
      });

      const tileLayer = L.tileLayer(getCartoTileUrl(theme), {
        attribution: MAP_ATTRIBUTION,
        maxZoom: 19,
        subdomains: 'abcd',
        updateWhenIdle: true,
        keepBuffer: 2,
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
        if (clickAbortRef.current) {
          clickAbortRef.current.abort();
        }
        const controller = new AbortController();
        clickAbortRef.current = controller;

        // Immediately move marker for instant visual feedback (0ms latency)
        const roundedLat = Math.round(lat * 1000) / 1000;
        const roundedLon = Math.round(lng * 1000) / 1000;
        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLon]);
        }

        setIsReverseGeocoding(true);
        try {
          const res = await fetch(`/api/geocode?lat=${roundedLat}&lon=${roundedLon}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            onSelectRef.current({
              country: data.country || 'Global',
              city: data.city || 'Bölge',
              district: data.district || 'Seçili Konum',
              lat: roundedLat,
              lon: roundedLon,
            });
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            console.error(err);
          }
        } finally {
          if (clickAbortRef.current === controller) {
            setIsReverseGeocoding(false);
          }
        }
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (clickAbortRef.current) clickAbortRef.current.abort();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch CARTO basemap dynamically when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getCartoTileUrl(theme));
    }
  }, [theme]);

  // Only call flyTo when coordinates actually change (prevents stutter when tempSnapshot updates!)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const dLat = Math.abs(currentLocation.lat - lastCoordsRef.current.lat);
    const dLon = Math.abs(currentLocation.lon - lastCoordsRef.current.lon);

    if (dLat > 0.0001 || dLon > 0.0001) {
      lastCoordsRef.current = { lat: currentLocation.lat, lon: currentLocation.lon };
      map.panTo([currentLocation.lat, currentLocation.lon], {
        animate: true,
        duration: 0.65,
      });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([currentLocation.lat, currentLocation.lon]);
    }
  }, [currentLocation.lat, currentLocation.lon]);

  // Update marker badge label/temperature without triggering map pan/flyTo
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !markerRef.current) return;

    const updatedIcon = L.divIcon({
      className: 'current-location-marker',
      html: buildMarkerHtml(currentLocation.district || currentLocation.city, tempSnapshot),
      iconSize: [140, 32],
      iconAnchor: [70, 16],
    });
    markerRef.current.setIcon(updatedIcon);
  }, [currentLocation.district, currentLocation.city, tempSnapshot]);

  // Debounced Global Search Autocomplete with AbortController
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
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
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
      {/* Header & Status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              Canlı Harita & İlçe Seçimi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Haritada istediğiniz noktaya tıklayın veya global arama yapın
            </p>
          </div>
        </div>

        {isReverseGeocoding ? (
          <div className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1.5 font-semibold bg-sky-500/10 px-2.5 py-1 rounded-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Konum çözümleniyor...</span>
          </div>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80 font-bold">
            📍 {currentLocation.district}, {currentLocation.city}
          </span>
        )}
      </div>

      {/* Global Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs focus-within:ring-2 focus-within:ring-sky-500/50 transition-shadow">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="İlçe, şehir veya ülke ara (Örn: Kadıköy, Kaş, Çankaya, Berlin, Tokyo)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden font-medium"
          />
          {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />}
        </div>

        {/* Global Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.displayName}
                  </span>
                </div>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold shrink-0 ml-2">
                  Seç &rarr;
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Real Map Canvas */}
      <div className="relative w-full h-[340px] sm:h-[380px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Lightweight Footer Strip */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pointer-events-none px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Haritada tıklanan noktanın canlı konsensüsü anında hesaplanır</span>
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400 shrink-0 ml-2">
            {theme === 'dark' ? 'CARTO Dark' : 'CARTO Voyager'}
          </span>
        </div>
      </div>
    </div>
  );
});
