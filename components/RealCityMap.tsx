'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { LocationInfo, ItineraryStop } from '@/lib/types';
import { getCartoTileUrl, MAP_ATTRIBUTION } from '@/lib/map-config';
import { resolveStopWeatherAtTime } from '@/lib/weather-service';
import {
  MapPin,
  Search,
  Loader2,
  Plus,
  X,
  Clock,
  Route,
} from 'lucide-react';

interface RealCityMapProps {
  stops: ItineraryStop[];
  activeStopId: string;
  onSelectActiveStop: (id: string) => void;
  onAddStop: (loc: LocationInfo, preferredTime?: string) => void;
  onUpdateStopLocation: (id: string, loc: LocationInfo) => void;
  onUpdateStopTime: (id: string, time: string) => void;
  onRemoveStop: (id: string) => void;
  theme?: 'dark' | 'light';
}

function buildStopMarkerHtml(index: number, label: string, temp: number, isActive: boolean, timeStr?: string) {
  const bg = isActive ? '#0284c7' : '#334155';
  const border = isActive ? '#38bdf8' : '#94a3b8';
  return `
    <div style="
      background: ${bg};
      color: #ffffff;
      border: 2px solid ${border};
      border-radius: 10px;
      padding: 3px 8px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    ">
      <span style="background: rgba(255,255,255,0.2); padding: 0px 4px; border-radius: 4px; font-size: 10px;">
        ${index + 1}
      </span>
      <span>${label}</span>
      ${timeStr ? `<span style="opacity:0.85; font-size:10px;">(${timeStr})</span>` : ''}
      <span style="background: #ffffff; color: ${bg}; padding: 0.5px 4px; border-radius: 5px; font-weight: 800;">
        ${temp}°C
      </span>
    </div>
  `;
}

export const RealCityMap = memo(function RealCityMap({
  stops,
  activeStopId,
  onSelectActiveStop,
  onAddStop,
  onUpdateStopLocation,
  onUpdateStopTime,
  onRemoveStop,
  theme = 'dark',
}: RealCityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const clickAbortRef = useRef<AbortController | null>(null);

  const [clickAction, setClickAction] = useState<'update' | 'add'>('update');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [newStopTime, setNewStopTime] = useState('');

  // Keep latest callbacks in refs for map click handler
  const stateRef = useRef({
    clickAction,
    activeStopId,
    onAddStop,
    onUpdateStopLocation,
    newStopTime,
  });
  useEffect(() => {
    stateRef.current = {
      clickAction,
      activeStopId,
      onAddStop,
      onUpdateStopLocation,
      newStopTime,
    };
  }, [clickAction, activeStopId, onAddStop, onUpdateStopLocation, newStopTime]);

  const activeStop = stops.find((s) => s.id === activeStopId) || stops[0];

  // Initialize Leaflet Map once on mount
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L;

      const initialLoc = activeStop?.location || { lat: 40.992, lon: 29.027 };
      const map = L.map(mapContainerRef.current, {
        center: [initialLoc.lat, initialLoc.lon],
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

      const group = L.layerGroup().addTo(map);
      layerGroupRef.current = group;

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        if (clickAbortRef.current) clickAbortRef.current.abort();
        const controller = new AbortController();
        clickAbortRef.current = controller;

        const roundedLat = Math.round(lat * 1000) / 1000;
        const roundedLon = Math.round(lng * 1000) / 1000;

        setIsReverseGeocoding(true);
        try {
          const res = await fetch(`/api/geocode?lat=${roundedLat}&lon=${roundedLon}`, {
            signal: controller.signal,
          });
          if (res.ok) {
            const data = await res.json();
            const loc: LocationInfo = {
              country: data.country || 'Global',
              city: data.city || 'Bölge',
              district: data.district || 'Seçili Konum',
              lat: roundedLat,
              lon: roundedLon,
            };
            const cur = stateRef.current;
            if (cur.clickAction === 'add') {
              cur.onAddStop(loc, cur.newStopTime || undefined);
            } else {
              cur.onUpdateStopLocation(cur.activeStopId, loc);
            }
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') console.error(err);
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

  // Switch tile theme
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getCartoTileUrl(theme));
    }
  }, [theme]);

  // Render markers and connecting line for all stops in the user's daily itinerary
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const group = layerGroupRef.current;
    if (!map || !L || !group) return;

    group.clearLayers();

    if (stops.length > 1) {
      const coords = stops.map((s) => [s.location.lat, s.location.lon]);
      L.polyline(coords, {
        color: '#0284c7',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(group);
    }

    stops.forEach((stop, idx) => {
      const isActive = stop.id === activeStopId;
      const resolved = stop.weather
        ? resolveStopWeatherAtTime(stop.weather, stop.preferredTime)
        : null;
      const tempVal = resolved ? resolved.temp : 18;

      const icon = L.divIcon({
        className: 'itinerary-stop-marker',
        html: buildStopMarkerHtml(
          idx,
          stop.location.district || stop.location.city,
          tempVal,
          isActive,
          stop.preferredTime
        ),
        iconSize: [140, 28],
        iconAnchor: [70, 14],
      });

      const marker = L.marker([stop.location.lat, stop.location.lon], { icon }).addTo(group);
      marker.on('click', () => {
        onSelectActiveStop(stop.id);
      });
    });

    if (stops.length > 1) {
      const bounds = L.latLngBounds(stops.map((s) => [s.location.lat, s.location.lon]));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 12 });
    } else if (activeStop) {
      map.panTo([activeStop.location.lat, activeStop.location.lon], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [stops, activeStopId, activeStop, onSelectActiveStop]);

  // Debounced search autocomplete
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
    }, 260);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handlePickSearchResult = (item: any, mode: 'update' | 'add') => {
    const loc: LocationInfo = {
      country: item.country || 'Global',
      city: item.city || item.district,
      district: item.district,
      lat: item.lat,
      lon: item.lon,
    };
    if (mode === 'add') {
      onAddStop(loc, newStopTime || undefined);
    } else {
      onUpdateStopLocation(activeStopId, loc);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
      {/* Compact Multi-Stop Itinerary Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Route className="w-4 h-4 text-sky-500" />
            <span>Günlük Durak & Saat Zinciri ({stops.length} Nokta)</span>
          </div>

          {/* Click behavior toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => setClickAction('update')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                clickAction === 'update'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs'
                  : 'text-slate-500'
              }`}
              title="Haritaya tıkladığınızda seçili durağı değiştirir"
            >
              Tıkla: Durağı Güncelle
            </button>
            <button
              type="button"
              onClick={() => setClickAction('add')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                clickAction === 'add'
                  ? 'bg-sky-500 text-white shadow-2xs'
                  : 'text-slate-500'
              }`}
              title="Haritaya tıkladığınızda yeni bir durak olarak ekler"
            >
              + Tıkla: Yeni Durak Ekle
            </button>
          </div>
        </div>

        {/* Horizontal scrollable stop pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {stops.map((stop, idx) => {
            const isSelected = stop.id === activeStopId;
            const resolved = stop.weather
              ? resolveStopWeatherAtTime(stop.weather, stop.preferredTime)
              : null;
            return (
              <div
                key={stop.id}
                onClick={() => onSelectActiveStop(stop.id)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 shrink-0 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="leading-tight">
                  <span className="font-bold block truncate max-w-[110px]">
                    {stop.location.district}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {stop.location.city} &bull; {resolved ? `${resolved.temp}°C` : '...'}
                  </span>
                </div>

                {/* Optional Time Input for this Stop */}
                <div
                  className="flex items-center gap-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                  title="İsteğe bağlı saat tercihi (Örn: 09:00, 14:30)"
                >
                  <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                  <input
                    type="time"
                    value={stop.preferredTime || ''}
                    onChange={(e) => onUpdateStopTime(stop.id, e.target.value)}
                    className="bg-transparent text-[10px] font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden w-[54px]"
                  />
                </div>

                {stops.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStop(stop.id);
                    }}
                    className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Durağı Kaldır"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified Search & Add Stop Input */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Şehir içi ilçe, başka şehir veya ülke arayın (Örn: Beşiktaş, Bolu, Ankara, Londra)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <input
            type="time"
            value={newStopTime}
            onChange={(e) => setNewStopTime(e.target.value)}
            title="Yeni eklenecek durak için saat tercihi (opsiyonel)"
            className="text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
          />
          {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />}
        </div>

        {/* Search Results Dropdown with "Seç" and "+ Durak Ekle" buttons */}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1 max-h-56 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePickSearchResult(item, 'update')}
                    className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Durağı Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePickSearchResult(item, 'add')}
                    className="px-2 py-1 rounded-md bg-sky-500 hover:bg-sky-600 text-[10px] font-bold text-white flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Yeni Durak Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compact Interactive Map Canvas */}
      <div className="relative w-full h-[290px] sm:h-[330px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {isReverseGeocoding && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-sky-500 flex items-center gap-1.5 shadow-sm">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Konum alınıyor...</span>
          </div>
        )}
      </div>
    </div>
  );
});
