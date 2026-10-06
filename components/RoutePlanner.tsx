'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RouteStop } from '@/lib/types';
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
  Map,
} from 'lucide-react';

interface RoutePlannerProps {
  currentCity: string;
}

export function RoutePlanner({ currentCity }: RoutePlannerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const [origin, setOrigin] = useState(currentCity || 'İstanbul');
  const [destination, setDestination] = useState('Ankara');
  const [transport, setTransport] = useState<'car' | 'bus' | 'train'>('car');
  const [departureTime, setDepartureTime] = useState('08:30');

  const waypoints = React.useMemo<RouteStop[]>(() => {
    if (destination === 'Ankara') {
      return [
        {
          id: 'w-1',
          name: `${origin} (Kalkış)`,
          lat: 41.0082,
          lon: 28.9784,
          estimatedArrival: departureTime,
          temp: 16,
          condition: 'partly_cloudy',
          clothingTip: 'Araç içine binerken hafif katman (Tişört + Açık Gömlek).',
        },
        {
          id: 'w-2',
          name: 'Bolu Dağı Geçidi (Mola)',
          lat: 40.735,
          lon: 31.58,
          estimatedArrival: '11:15',
          temp: 8,
          condition: 'foggy',
          clothingTip: 'DİKKAT: 900m rakım farkı nedeniyle 8°C düşüş! Bagaj yerine araç içinde mont/hırka bulundurun.',
        },
        {
          id: 'w-3',
          name: 'Ankara (Varış)',
          lat: 39.9334,
          lon: 32.8597,
          estimatedArrival: '13:45',
          temp: 17,
          condition: 'sunny',
          clothingTip: 'Kuru karasal hava esintisi; ceketi tekrar omzunuza alabilirsiniz.',
        },
      ];
    } else if (destination === 'İzmir') {
      return [
        {
          id: 'w-1',
          name: `${origin} (Kalkış)`,
          lat: 41.0082,
          lon: 28.9784,
          estimatedArrival: departureTime,
          temp: 16,
          condition: 'partly_cloudy',
          clothingTip: 'Rahat seyahat alt giyimi (Esnek Chino/Keten).',
        },
        {
          id: 'w-2',
          name: 'Susurluk Dinlenme Tesisi',
          lat: 39.91,
          lon: 28.15,
          estimatedArrival: '11:00',
          temp: 19,
          condition: 'sunny',
          clothingTip: 'Güneşli ve açık esinti; UV korumalı güneş gözlüğü kullanın.',
        },
        {
          id: 'w-3',
          name: 'İzmir (Varış)',
          lat: 38.4237,
          lon: 27.1428,
          estimatedArrival: '13:30',
          temp: 23,
          condition: 'sunny',
          clothingTip: 'Ege sıcaklığı: Ceketi tamamen çıkarın, nefes alan keten/pamuk tabanla devam edin.',
        },
      ];
    } else {
      return [
        {
          id: 'w-1',
          name: `${origin} (Kalkış)`,
          lat: 41.0082,
          lon: 28.9784,
          estimatedArrival: departureTime,
          temp: 15,
          condition: 'partly_cloudy',
          clothingTip: 'Katmanlı çıkış yapınız.',
        },
        {
          id: 'w-2',
          name: 'Afyonkarahisar Geçidi',
          lat: 38.75,
          lon: 30.54,
          estimatedArrival: '12:30',
          temp: 11,
          condition: 'cloudy',
          clothingTip: 'İç Anadolu soğuğu; mola yerinde rüzgarlık giyiniz.',
        },
        {
          id: 'w-3',
          name: `${destination} (Varış)`,
          lat: 36.8969,
          lon: 30.7133,
          estimatedArrival: '16:00',
          temp: 24,
          condition: 'sunny',
          clothingTip: 'Yüksek nem ve ılık hava; açık renkli yazlık parçalara geçiş yapınız.',
        },
      ];
    }
  }, [origin, destination, departureTime]);

  // Render Real Leaflet Map for Route with Waypoints and Polyline
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
        center: [39.9, 31.0],
        zoom: 7,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors, CartoDB',
        maxZoom: 18,
      }).addTo(map);

      const latlngs: [number, number][] = [];

      waypoints.forEach((wp, idx) => {
        latlngs.push([wp.lat, wp.lon]);

        const customIcon = L.divIcon({
          className: 'route-marker',
          html: `
            <div style="
              background: ${idx === 0 ? '#0284c7' : idx === waypoints.length - 1 ? '#10b981' : '#f59e0b'};
              color: #ffffff;
              padding: 4px 8px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              border: 1px solid #ffffff;
              box-shadow: 0 3px 6px rgba(0,0,0,0.25);
            ">
              ${idx + 1}. ${wp.name}: ${wp.temp}°C
            </div>
          `,
        });

        L.marker([wp.lat, wp.lon], { icon: customIcon }).addTo(map);
      });

      // Draw Route Polyline
      L.polyline(latlngs, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      // Fit map bounds to show full route
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });

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
  }, [waypoints]);

  return (
    <div className="space-y-6">
      {/* Route Inputs Form */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-sky-500" />
              Şehirler Arası Rota & Seyahat Gardırobu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              OpenStreetMap (Organic Maps veri tabanı) üzerinde canlı yol haritası ve durak analizi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Origin */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kalkış Şehri:
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Destination */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Varış Şehri:
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="Ankara">Ankara</option>
              <option value="İzmir">İzmir</option>
              <option value="Antalya">Antalya</option>
              <option value="Bursa">Bursa</option>
              <option value="Trabzon">Trabzon</option>
            </select>
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
                title="Yüksek Hızlı Tren"
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

      {/* Real Interactive Route Map */}
      <div className="w-full h-[320px] sm:h-[380px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Waypoint Steps & Clothing Tips */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Güzergah & Mola Noktası Analizi
        </h4>

        <div className="space-y-3">
          {waypoints.map((step, idx) => (
            <div
              key={step.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {step.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {step.estimatedArrival}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {step.clothingTip}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white block">
                    {step.temp}°C
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Beklenen Sıcaklık
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
