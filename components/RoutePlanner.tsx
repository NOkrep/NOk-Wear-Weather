'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getCartoTileUrl, MAP_ATTRIBUTION } from '@/lib/map-config';
import { RouteStop } from '@/lib/types';
import {
  Navigation,
  Car,
  Bus,
  Train,
  Clock,
  ArrowLeftRight,
  Thermometer,
  Wind,
  Droplets,
  MapPin,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface RoutePlannerProps {
  currentCity: string;
  currentCoords?: { lat: number; lon: number };
  theme?: 'dark' | 'light';
}

export function RoutePlanner({
  currentCity,
  currentCoords,
  theme = 'dark',
}: RoutePlannerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const routeLayerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  // Origin & Destination points
  const [originName, setOriginName] = useState(currentCity || 'İstanbul');
  const [originQuery, setOriginQuery] = useState(currentCity || 'İstanbul');
  const [originResults, setOriginResults] = useState<any[]>([]);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number }>(
    currentCoords || { lat: 41.0082, lon: 28.9784 }
  );

  const [destName, setDestName] = useState('Ankara');
  const [destQuery, setDestQuery] = useState('Ankara');
  const [destResults, setDestResults] = useState<any[]>([]);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number }>({
    lat: 39.9334,
    lon: 32.8597,
  });

  const [transport, setTransport] = useState<'car' | 'bus' | 'train'>('car');
  const [departureTime, setDepartureTime] = useState('08:30');

  // Real OSRM route + live stop weather data
  const [routeData, setRouteData] = useState<{
    distanceKm: number;
    durationStr: string;
    polyline: [number, number][];
    stops: RouteStop[];
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Debounced autocomplete for Origin
  useEffect(() => {
    if (!originQuery || originQuery.trim().length < 2 || originQuery === originName) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(originQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setOriginResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [originQuery, originName]);

  // Debounced autocomplete for Destination
  useEffect(() => {
    if (!destQuery || destQuery.trim().length < 2 || destQuery === destName) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(destQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setDestResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [destQuery, destName]);

  // Fetch real road routing and live stop weather
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRoute(true);

    const url = `/api/route?fromLat=${originCoords.lat}&fromLon=${originCoords.lon}&toLat=${destCoords.lat}&toLon=${destCoords.lon}&fromName=${encodeURIComponent(originName)}&toName=${encodeURIComponent(destName)}&departureTime=${encodeURIComponent(departureTime)}&transport=${transport}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setRouteData(data);
          setIsLoadingRoute(false);
        }
      })
      .catch((err) => {
        console.error('Route error:', err);
        if (isMounted) setIsLoadingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon, originName, destName, departureTime, transport]);

  // Initialize Leaflet Map once
  useEffect(() => {
    let isMounted = true;

    async function initRouteMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [(originCoords.lat + destCoords.lat) / 2, (originCoords.lon + destCoords.lon) / 2],
        zoom: 7,
        zoomControl: true,
      });

      const tileLayer = L.tileLayer(getCartoTileUrl(theme), {
        attribution: MAP_ATTRIBUTION,
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      const layerGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    initRouteMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer on theme change
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getCartoTileUrl(theme));
    }
  }, [theme]);

  // Update polyline and stop markers whenever routeData changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const group = routeLayerGroupRef.current;
    if (!map || !L || !group || !routeData) return;

    group.clearLayers();

    if (routeData.polyline && routeData.polyline.length > 0) {
      const polyline = L.polyline(routeData.polyline, {
        color: '#0284c7',
        weight: 4.5,
        opacity: 0.85,
      }).addTo(group);

      (routeData.stops || []).forEach((stop: RouteStop, idx: number) => {
        const isOrigin = idx === 0;
        const isDest = idx === routeData.stops.length - 1;

        const customIcon = L.divIcon({
          className: 'route-stop-marker',
          html: `
            <div style="
              background: ${isOrigin ? '#0284c7' : isDest ? '#10b981' : '#f59e0b'};
              color: #ffffff;
              padding: 4px 9px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              transform: translate(-50%, -50%);
            ">
              ${isOrigin ? '🛫 ' : isDest ? '🎯 ' : '☕ '}${stop.name} (${stop.temp}°C)
            </div>
          `,
        });

        L.marker([stop.lat, stop.lon], { icon: customIcon }).addTo(group);
      });

      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [routeData]);

  const handleSwapLocations = () => {
    const tempName = originName;
    const tempCoords = originCoords;
    setOriginName(destName);
    setOriginQuery(destName);
    setOriginCoords(destCoords);
    setDestName(tempName);
    setDestQuery(tempName);
    setDestCoords(tempCoords);
  };

  return (
    <div className="space-y-6">
      {/* Route Inputs Form */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" />
              Canlı Karayolu Rota & İklim Şoku Motoru (OSRM)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gerçek karayolu güzergahını çizer, mola noktalarının anlık hava durumunu ve sıcaklık farklarını hesaplar.
            </p>
          </div>

          {routeData && (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              <span>Mesafe: {routeData.distanceKm} km</span>
              <span>&bull;</span>
              <span>Tahmini Süre: ~{routeData.durationStr}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Origin Search */}
          <div className="sm:col-span-4 space-y-1 relative">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kalkış Konumu:
            </label>
            <input
              type="text"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              placeholder="Örn: İstanbul, Kadıköy, Bursa..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {originResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-48 overflow-y-auto">
                {originResults.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const label = item.district || item.city;
                      setOriginName(label);
                      setOriginQuery(label);
                      setOriginCoords({ lat: item.lat, lon: item.lon });
                      setOriginResults([]);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="truncate">{item.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="sm:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapLocations}
              title="Kalkış ve Varışı Değiştir"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Search */}
          <div className="sm:col-span-4 space-y-1 relative">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Varış Konumu:
            </label>
            <input
              type="text"
              value={destQuery}
              onChange={(e) => setDestQuery(e.target.value)}
              placeholder="Örn: Ankara, İzmir, Antalya, Kaş..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {destResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-48 overflow-y-auto">
                {destResults.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const label = item.district || item.city;
                      setDestName(label);
                      setDestQuery(label);
                      setDestCoords({ lat: item.lat, lon: item.lon });
                      setDestResults([]);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{item.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transport & Time */}
          <div className="sm:col-span-3 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ulaşım:
              </label>
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setTransport('car')}
                  className={`flex-1 p-1.5 rounded-lg flex justify-center ${
                    transport === 'car'
                      ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs'
                      : 'text-slate-400'
                  }`}
                  title="Özel Araç"
                >
                  <Car className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransport('bus')}
                  className={`flex-1 p-1.5 rounded-lg flex justify-center ${
                    transport === 'bus'
                      ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs'
                      : 'text-slate-400'
                  }`}
                  title="Otobüs"
                >
                  <Bus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTransport('train')}
                  className={`flex-1 p-1.5 rounded-lg flex justify-center ${
                    transport === 'train'
                      ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-xs'
                      : 'text-slate-400'
                  }`}
                  title="Tren"
                >
                  <Train className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kalkış:
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full text-xs font-medium px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real Interactive Route Map Container */}
      <div className="w-full h-[360px] sm:h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {isLoadingRoute && (
          <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1.5 shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Rota ve durak hava durumları hesaplanıyor...</span>
          </div>
        )}
      </div>

      {/* Live Sampled Waypoint Steps */}
      {routeData && routeData.stops && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Güzergah Boyunca Canlı İklim & Giysi Durakları ({routeData.stops.length} Nokta)
            </h4>
            <span className="text-[11px] text-slate-400">
              Open-Meteo + Nominatim Canlı Güzergah Analizi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {routeData.stops.map((stop: RouteStop, idx: number) => {
              const hasTempShock = Math.abs(stop.tempDeltaFromOrigin) >= 3;
              return (
                <div
                  key={stop.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-md ${
                          stop.isOrigin
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : stop.isDest
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {stop.isOrigin
                          ? 'Kalkış'
                          : stop.isDest
                          ? 'Varış'
                          : `${idx}. Ara Geçit / Mola`}
                      </span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {stop.timeStr}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">
                        {stop.name}
                      </h5>
                      <span className="text-lg font-black text-slate-900 dark:text-white shrink-0">
                        {stop.temp}°C
                      </span>
                    </div>

                    {/* Weather details strip */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-sky-500" />
                        His: {stop.feelsLike}°C
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-500" />
                        %{stop.precipitationProb}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wind className="w-3 h-3 text-sky-500" />
                        {stop.windSpeed} km/s
                      </span>
                    </div>

                    {!stop.isOrigin && (
                      <div
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 ${
                          hasTempShock
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {hasTempShock && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                        <span>
                          Kalkışa göre {stop.tempDeltaFromOrigin > 0 ? '+' : ''}
                          {stop.tempDeltaFromOrigin}°C fark
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                    {stop.clothingTip}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
