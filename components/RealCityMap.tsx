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
  Navigation,
} from 'lucide-react';

interface RealCityMapProps {
  stops: ItineraryStop[];
  activeStopId: string;
  accentHex?: string;
  onSelectActiveStop: (id: string) => void;
  onAddStop: (loc: LocationInfo, preferredTime?: string) => void;
  onUpdateStopLocation: (id: string, loc: LocationInfo) => void;
  onUpdateStopTime: (id: string, time: string) => void;
  onRemoveStop: (id: string) => void;
  theme?: 'dark' | 'light';
}

function buildStopMarkerHtml(
  index: number,
  label: string,
  temp: number,
  isActive: boolean,
  accentHex: string,
  timeStr?: string
) {
  const bg = isActive ? accentHex : '#1e293b';
  const border = isActive ? '#ffffff' : '#64748b';
  return `
    <div style="
      background: ${bg};
      color: #ffffff;
      border: 2px solid ${border};
      border-radius: 999px;
      padding: 3px 9px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transform: translate(-50%, -50%);
    ">
      <span style="background: rgba(255,255,255,0.22); width: 16px; height: 16px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px;">
        ${index + 1}
      </span>
      <span>${label}</span>
      ${timeStr ? `<span style="opacity:0.85; font-size:10px;">${timeStr}</span>` : ''}
      <span style="background: #ffffff; color: #0f172a; padding: 0.5px 5px; border-radius: 999px; font-weight: 800;">
        ${temp}°C
      </span>
    </div>
  `;
}

export const RealCityMap = memo(function RealCityMap({
  stops,
  activeStopId,
  accentHex = '#0284c7',
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
  const routePolylineRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const clickAbortRef = useRef<AbortController | null>(null);

  const [clickAction, setClickAction] = useState<'update' | 'add'>('add');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [newStopTime, setNewStopTime] = useState('');
  const [routeSummary, setRouteSummary] = useState<{ distanceKm: number; durationStr: string } | null>(null);

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

  // Initialize Single Unified Leaflet Map
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
        zoomControl: false,
        attributionControl: false,
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
              district: data.district || 'Seçili Nokta',
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

  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getCartoTileUrl(theme));
    }
  }, [theme]);

  // Draw markers and real OSRM road geometry on the SAME unified map whenever stops change!
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const group = layerGroupRef.current;
    if (!map || !L || !group) return;

    group.clearLayers();

    stops.forEach((stop, idx) => {
      const isActive = stop.id === activeStopId;
      const resolved = stop.weather
        ? resolveStopWeatherAtTime(stop.weather, stop.preferredTime)
        : null;
      const tempVal = resolved ? resolved.temp : 18;

      const icon = L.divIcon({
        className: 'hmi-stop-marker',
        html: buildStopMarkerHtml(
          idx,
          stop.location.district || stop.location.city,
          tempVal,
          isActive,
          accentHex,
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

    // If 2 or more stops exist, fetch real OSRM road polyline on the same map!
    if (stops.length >= 2) {
      const first = stops[0].location;
      const last = stops[stops.length - 1].location;
      fetch(
        `/api/route?fromLat=${first.lat}&fromLon=${first.lon}&toLat=${last.lat}&toLon=${last.lon}&fromName=${encodeURIComponent(first.district)}&toName=${encodeURIComponent(last.district)}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!mapInstanceRef.current || !layerGroupRef.current) return;
          if (routePolylineRef.current) {
            layerGroupRef.current.removeLayer(routePolylineRef.current);
          }
          if (data?.polyline && data.polyline.length > 0 && stops.length === 2) {
            setRouteSummary({ distanceKm: data.distanceKm, durationStr: data.durationStr });
            const poly = L.polyline(data.polyline, {
              color: accentHex,
              weight: 4,
              opacity: 0.85,
            }).addTo(layerGroupRef.current);
            routePolylineRef.current = poly;
          } else {
            setRouteSummary(null);
            const coords = stops.map((s) => [s.location.lat, s.location.lon]);
            const poly = L.polyline(coords, {
              color: accentHex,
              weight: 3.5,
              dashArray: '6, 6',
              opacity: 0.85,
            }).addTo(layerGroupRef.current);
            routePolylineRef.current = poly;
          }
        })
        .catch(() => {});

      const bounds = L.latLngBounds(stops.map((s) => [s.location.lat, s.location.lon]));
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 12 });
    } else {
      setRouteSummary(null);
      if (activeStop) {
        map.panTo([activeStop.location.lat, activeStop.location.lon], {
          animate: true,
          duration: 0.5,
        });
      }
    }
  }, [stops, activeStopId, activeStop, accentHex, onSelectActiveStop]);

  // Debounced Global Search
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
    }, 250);

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
    <div className="p-3.5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
      {/* Top Row: Stop Chain Pills + Click Mode */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {stops.map((stop, idx) => {
            const isSelected = stop.id === activeStopId;
            const resolved = stop.weather
              ? resolveStopWeatherAtTime(stop.weather, stop.preferredTime)
              : null;
            return (
              <div
                key={stop.id}
                onClick={() => onSelectActiveStop(stop.id)}
                className={`px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-[10px] opacity-75">{idx + 1}.</span>
                <span className="truncate max-w-[95px]">{stop.location.district}</span>
                <span className="font-extrabold">{resolved ? `${resolved.temp}°` : ''}</span>

                {/* Compact Time Selector */}
                <input
                  type="time"
                  value={stop.preferredTime || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onUpdateStopTime(stop.id, e.target.value)}
                  title="Durak saati seçin (opsiyonel)"
                  className="bg-transparent text-[10px] opacity-80 w-[48px] focus:outline-hidden cursor-pointer"
                />

                {stops.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStop(stop.id);
                    }}
                    className="hover:text-rose-400 transition-colors"
                    title="Durağı Sil"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Map Click Behavior Pill */}
        <button
          type="button"
          onClick={() => setClickAction((prev) => (prev === 'add' ? 'update' : 'add'))}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 cursor-pointer border transition-colors ${
            clickAction === 'add'
              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
          }`}
          title="Haritaya tıkladığınızda yeni durak mı eklensin yoksa seçili durak mı güncellensin?"
        >
          {clickAction === 'add' ? 'Harita Tık: + Durak Ekle' : 'Harita Tık: Durağı Değiştir'}
        </button>
      </div>

      {/* Compact Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Durak ekle: İlçe, şehir veya ülke ara (Kadıköy, Bolu, Ankara, Londra)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            <input
              type="time"
              value={newStopTime}
              onChange={(e) => setNewStopTime(e.target.value)}
              title="Eklenecek durağın saati"
              className="bg-transparent w-[48px] text-slate-600 dark:text-slate-300 focus:outline-hidden"
            />
          </div>
          {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-0.5 max-h-52 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
              >
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  📍 {item.displayName}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePickSearchResult(item, 'update')}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Değiştir
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePickSearchResult(item, 'add')}
                    className="px-2 py-1 rounded-lg bg-sky-500 text-[10px] font-bold text-white flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Durak Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Map Canvas */}
      <div className="relative w-full h-[270px] sm:h-[310px] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {routeSummary && (
          <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-xs">
            <Navigation className="w-3 h-3 text-sky-400" />
            <span>
              OSRM Rota: {routeSummary.distanceKm} km &bull; ~{routeSummary.durationStr}
            </span>
          </div>
        )}

        {isReverseGeocoding && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[10px] font-bold flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
            <span>Konum...</span>
          </div>
        )}
      </div>
    </div>
  );
});
