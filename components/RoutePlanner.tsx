'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CARTO_VOYAGER_TILE_URL, MAP_ATTRIBUTION } from '@/lib/map-config';
import {
  Navigation,
  Car,
  Bus,
  Train,
  Clock,
  ArrowRight,
  ShieldAlert,
  Thermometer,
  Layers,
  MapPin,
  CheckCircle2,
  Search,
  Loader2,
} from 'lucide-react';

interface RoutePlannerProps {
  currentCity: string;
}

export function RoutePlanner({ currentCity }: RoutePlannerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  // Origin & Destination points
  const [originText, setOriginText] = useState(currentCity || 'İstanbul');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number }>({
    lat: 41.0082,
    lon: 28.9784,
  });

  const [destText, setDestText] = useState('Ankara');
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number }>({
    lat: 39.9334,
    lon: 32.8597,
  });

  const [transport, setTransport] = useState<'car' | 'bus' | 'train'>('car');
  const [departureTime, setDepartureTime] = useState('08:30');

  // Real OSRM route data
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Fetch real road routing between coordinates
  useEffect(() => {
    let isMounted = true;

    fetch(
      `/api/route?fromLat=${originCoords.lat}&fromLon=${originCoords.lon}&toLat=${destCoords.lat}&toLon=${destCoords.lon}`
    )
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
  }, [originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon]);

  // Render Real Leaflet Map with CARTO Voyager Basemap
  useEffect(() => {
    let isMounted = true;

    async function initRouteMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [(originCoords.lat + destCoords.lat) / 2, (originCoords.lon + destCoords.lon) / 2],
        zoom: 7,
        zoomControl: true,
      });

      // CARTO Voyager Tile layer
      L.tileLayer(CARTO_VOYAGER_TILE_URL, {
        attribution: MAP_ATTRIBUTION,
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Render polyline and stops if routeData is available
      if (routeData && routeData.polyline && routeData.polyline.length > 0) {
        const polyline = L.polyline(routeData.polyline, {
          color: '#0284c7',
          weight: 4.5,
          opacity: 0.85,
        }).addTo(map);

        // Add markers for origin, intermediate stops, and destination
        (routeData.stops || []).forEach((stop: any, idx: number) => {
          const isOrigin = idx === 0;
          const isDest = idx === routeData.stops.length - 1;

          const customIcon = L.divIcon({
            className: 'route-stop-marker',
            html: `
              <div style="
                background: ${isOrigin ? '#0284c7' : isDest ? '#10b981' : '#f59e0b'};
                color: #ffffff;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
                white-space: nowrap;
                border: 2px solid #ffffff;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              ">
                ${isOrigin ? '🛫 ' : isDest ? '🎯 ' : '☕ '}${stop.name}
              </div>
            `,
          });

          L.marker([stop.lat, stop.lon], { icon: customIcon }).addTo(map);
        });

        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      }

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
  }, [routeData, originCoords, destCoords]);

  // Handle Geocoding for custom origin/destination input
  const handleCitySearch = async (query: string, type: 'origin' | 'dest') => {
    if (type === 'origin') setOriginText(query);
    else setDestText(query);

    if (query.trim().length >= 3) {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const first = data.results?.[0];
          if (first) {
            if (type === 'origin') {
              setOriginCoords({ lat: first.lat, lon: first.lon });
            } else {
              setDestCoords({ lat: first.lat, lon: first.lon });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Route Inputs Form */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" />
              Canlı Karayolu Rota Motoru (CARTO Voyager & OSRM)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              İstediğiniz iki şehir veya ilçe arasındaki gerçek karayolu rotasını çizer ve duraklardaki hava değişimlerini hesaplar.
            </p>
          </div>

          {routeData && (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              <span>Mesafe: {routeData.distanceKm} km</span>
              <span>&bull;</span>
              <span>Süre: ~{routeData.durationStr}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Origin Search */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kalkış Konumu (Herhangi bir yer):
            </label>
            <input
              type="text"
              value={originText}
              onChange={(e) => handleCitySearch(e.target.value, 'origin')}
              placeholder="Örn: İstanbul, Kadıköy, Bursa..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Destination Search */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Varış Konumu (Herhangi bir yer):
            </label>
            <input
              type="text"
              value={destText}
              onChange={(e) => handleCitySearch(e.target.value, 'dest')}
              placeholder="Örn: Ankara, İzmir, Antalya, Kaş..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Transport mode */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ulaşım Aracı:
            </label>
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
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

          {/* Departure Time */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kalkış Saati:
            </label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Real Interactive Route Map Container */}
      <div className="w-full h-[360px] sm:h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {isLoadingRoute && (
          <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1.5 shadow-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Gerçek karayolu hesaplanıyor...</span>
          </div>
        )}
      </div>

      {/* Live Sampled Waypoint Steps */}
      {routeData && routeData.stops && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Gerçek Yol Üzeri Mola & İklim Noktaları
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {routeData.stops.map((stop: any, idx: number) => (
              <div
                key={stop.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-600 dark:text-sky-400 uppercase">
                    {idx === 0 ? 'Başlangıç' : idx === routeData.stops.length - 1 ? 'Varış' : `Ara Durak ${idx}`}
                  </span>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {stop.timeStr}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                  {idx === 0 ? originText : idx === routeData.stops.length - 1 ? destText : `${originText} - ${destText} Güzergahı`}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                  {idx === 0
                    ? 'Kalkış hazırlığı: Araç içine girerken rahat katman.'
                    : idx === routeData.stops.length - 1
                    ? 'Varış iklimine adapte olun; ceketi omzunuza alabilirsiniz.'
                    : 'Yol üstü mola: Açık alanda esinti durumuna göre hırkanızı araç içinde hazır tutun.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
