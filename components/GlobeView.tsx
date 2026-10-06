'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plane, AlertTriangle, ShieldCheck, Thermometer, ArrowRight, Compass, Map, Globe2 } from 'lucide-react';

interface FlightRoute {
  id: string;
  fromName: string;
  toName: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  fromTemp: number;
  toTemp: number;
  flightHours: string;
  clothingShockWarning: string;
}

const POPULAR_FLIGHT_ROUTES: FlightRoute[] = [
  {
    id: 'ist-lon',
    fromName: 'İstanbul (IST)',
    toName: 'Londra (LHR)',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 51.5074,
    toLon: -0.1278,
    fromTemp: 18,
    toTemp: 9,
    flightHours: '4s 10dk',
    clothingShockWarning:
      'İnişte 9°C sert sıcaklık düşüşü ve Atlantik nemi bekleniyor. Uçakta rahat pamuklu kıyafetle seyahat edin; iniş için kabin bagajınızda rüzgar kesici trençkot veya yün hırka bulundurun.',
  },
  {
    id: 'ist-nyc',
    fromName: 'İstanbul (IST)',
    toName: 'New York (JFK)',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 40.7128,
    toLon: -74.006,
    fromTemp: 18,
    toTemp: 12,
    flightHours: '10s 45dk',
    clothingShockWarning:
      'Uzun uçuş boyunca kabin içi düşük nem oranı ve klima nedeniyle pamuklu nefes alabilen katman giyiniz. JFK inişinde gökdelen rüzgarlarına karşı ceket hazır olmalıdır.',
  },
  {
    id: 'ist-tyo',
    fromName: 'İstanbul (IST)',
    toName: 'Tokyo (HND)',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 35.6762,
    toLon: 139.6503,
    fromTemp: 18,
    toTemp: 21,
    flightHours: '11s 30dk',
    clothingShockWarning:
      'Tokyo sahil nemi ve 3°C sıcaklık artışı. Uçuş sonrasında hafif pamuklu üst katmana geçiş yapmanız ferah kalmanızı sağlayacaktır.',
  },
  {
    id: 'ist-par',
    fromName: 'İstanbul (IST)',
    toName: 'Paris (CDG)',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 48.8566,
    toLon: 2.3522,
    fromTemp: 18,
    toTemp: 13,
    flightHours: '3s 45dk',
    clothingShockWarning:
      'Ilıman ve hafif rüzgarlı Paris akşamı. Smart-casual trençkot ve ince fular iniş sonrası mükemmel uyum sağlar.',
  },
];

export function GlobeView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leafletMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const [selectedRoute, setSelectedRoute] = useState<FlightRoute>(POPULAR_FLIGHT_ROUTES[0]);
  const [viewStyle, setViewStyle] = useState<'3d' | 'map'>('map');
  const rotationRef = useRef<number>(0);

  // Initialize Real Leaflet World Map when 'map' view is selected
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (viewStyle !== 'map' || typeof window === 'undefined' || !leafletMapRef.current) return;

      const L = (await import('leaflet')).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!isMounted || !leafletMapRef.current) return;

      const map = L.map(leafletMapRef.current, {
        center: [(selectedRoute.fromLat + selectedRoute.toLat) / 2, (selectedRoute.fromLon + selectedRoute.toLon) / 2],
        zoom: 3,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors, CartoDB',
        maxZoom: 18,
      }).addTo(map);

      // Add Origin Marker
      const originIcon = L.divIcon({
        className: 'origin-marker',
        html: `<div style="background:#0284c7; color:#fff; padding:3px 6px; border-radius:8px; font-size:10px; font-weight:bold; white-space:nowrap; border:1px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.2);">🛫 ${selectedRoute.fromName} (${selectedRoute.fromTemp}°C)</div>`,
      });
      L.marker([selectedRoute.fromLat, selectedRoute.fromLon], { icon: originIcon }).addTo(map);

      // Add Destination Marker
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `<div style="background:#ef4444; color:#fff; padding:3px 6px; border-radius:8px; font-size:10px; font-weight:bold; white-space:nowrap; border:1px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.2);">🛬 ${selectedRoute.toName} (${selectedRoute.toTemp}°C)</div>`,
      });
      L.marker([selectedRoute.toLat, selectedRoute.toLon], { icon: destIcon }).addTo(map);

      // Draw Flight Path Polyline
      const latlngs = [
        [selectedRoute.fromLat, selectedRoute.fromLon],
        [selectedRoute.toLat, selectedRoute.toLon],
      ];
      L.polyline(latlngs as any, {
        color: '#f59e0b',
        weight: 3,
        dashArray: '6, 6',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewStyle, selectedRoute]);

  // 3D Canvas Sphere Animation
  useEffect(() => {
    if (viewStyle !== '3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      rotationRef.current += 0.005;
      const rot = rotationRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const radius = Math.min(width, height) * 0.42;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Globe Gradient
      const grad = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.2,
        centerX,
        centerY,
        radius
      );
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.7, '#0369a1');
      grad.addColorStop(1, '#082f49');

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();
      ctx.clip();

      // Latitude lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = centerY + Math.sin((lat * Math.PI) / 180) * radius;
        const rLat = Math.cos((lat * Math.PI) / 180) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX, y, rLat, rLat * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines
      for (let lon = 0; lon < 360; lon += 45) {
        const angle = ((lon * Math.PI) / 180 + rot) % (Math.PI * 2);
        const xOffset = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX + xOffset * 0.5, centerY, Math.abs(xOffset) * 0.5, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Continents
      ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
      const landPoints = [
        { lat: 40, lon: 30, r: 24 },
        { lat: 50, lon: 10, r: 20 },
        { lat: 35, lon: 100, r: 35 },
        { lat: 40, lon: -100, r: 30 },
        { lat: -15, lon: -55, r: 25 },
        { lat: 5, lon: 20, r: 28 },
      ];

      landPoints.forEach((pt) => {
        const lonRad = (pt.lon * Math.PI) / 180 + rot;
        const latRad = (pt.lat * Math.PI) / 180;
        const cosLon = Math.cos(lonRad);
        if (cosLon > -0.2) {
          const x = centerX + Math.sin(lonRad) * Math.cos(latRad) * radius;
          const y = centerY - Math.sin(latRad) * radius;
          ctx.beginPath();
          ctx.arc(x, y, pt.r * (cosLon + 0.5) * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Flight Arc
      const fromRad = (selectedRoute.fromLon * Math.PI) / 180 + rot;
      const toRad = (selectedRoute.toLon * Math.PI) / 180 + rot;

      const fromX = centerX + Math.sin(fromRad) * Math.cos((selectedRoute.fromLat * Math.PI) / 180) * radius;
      const fromY = centerY - Math.sin((selectedRoute.fromLat * Math.PI) / 180) * radius;

      const toX = centerX + Math.sin(toRad) * Math.cos((selectedRoute.toLat * Math.PI) / 180) * radius;
      const toY = centerY - Math.sin((selectedRoute.toLat * Math.PI) / 180) * radius;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      const midX = (fromX + toX) / 2;
      const midY = Math.min(fromY, toY) - 35;
      ctx.quadraticCurveTo(midX, midY, toX, toY);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(fromX, fromY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(toX, toY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [viewStyle, selectedRoute]);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-500" />
              Uluslararası Rota & Dünya Haritası
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Açık kaynaklı OpenStreetMap / Organic Maps tabanlı gerçek küresel harita ve 3D projeksiyon
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Style Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setViewStyle('map')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewStyle === 'map'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Gerçek Harita (OpenStreetMap)
              </button>
              <button
                onClick={() => setViewStyle('3d')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewStyle === '3d'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                3D Küre
              </button>
            </div>
          </div>
        </div>

        {/* Route selector buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold pb-1">
          {POPULAR_FLIGHT_ROUTES.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRoute(route)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                selectedRoute.id === route.id
                  ? 'bg-sky-500 text-white border-sky-400 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {route.fromName.split(' ')[0]} &rarr; {route.toName.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Map / 3D Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-[360px] sm:h-[400px] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative">
            {viewStyle === 'map' ? (
              <div ref={leafletMapRef} className="w-full h-full z-0" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-4">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={340}
                  className="max-w-full drop-shadow-2xl cursor-grab"
                />
              </div>
            )}
          </div>

          {/* Flight Details & Climate Shock Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedRoute.fromName}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <span>{selectedRoute.flightHours}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedRoute.toName}
                </span>
              </div>

              {/* Temperature Delta */}
              <div className="flex items-center justify-around p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Kalkış</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedRoute.fromTemp}°C
                  </span>
                </div>
                <div className="text-center font-bold text-xs text-amber-500">
                  {selectedRoute.toTemp - selectedRoute.fromTemp > 0 ? '+' : ''}
                  {selectedRoute.toTemp - selectedRoute.fromTemp}°C Fark
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Varış</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedRoute.toTemp}°C
                  </span>
                </div>
              </div>
            </div>

            {/* Climate Shock Advisory */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>İklim Şoku & Kabin Gardırobu Uyarısı</span>
              </div>
              <p className="text-xs leading-relaxed">
                {selectedRoute.clothingShockWarning}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
