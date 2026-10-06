'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plane, AlertTriangle, ShieldCheck, Thermometer, ArrowRight, Compass } from 'lucide-react';

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
];

export function GlobeView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<FlightRoute>(POPULAR_FLIGHT_ROUTES[0]);
  const rotationRef = useRef<number>(0);

  useEffect(() => {
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

      // Globe Background Sphere
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

      // Draw Latitude / Longitude lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;

      // Latitude lines
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

      // Render simplified land masses (continents)
      ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
      const landPoints = [
        { lat: 40, lon: 30, r: 24 }, // Europe/Anatolia
        { lat: 50, lon: 10, r: 20 }, // Western Europe
        { lat: 35, lon: 100, r: 35 }, // Asia
        { lat: 40, lon: -100, r: 30 }, // N. America
        { lat: -15, lon: -55, r: 25 }, // S. America
        { lat: 5, lon: 20, r: 28 }, // Africa
      ];

      landPoints.forEach((pt) => {
        const lonRad = (pt.lon * Math.PI) / 180 + rot;
        const latRad = (pt.lat * Math.PI) / 180;

        // Check if on visible hemisphere
        const cosLon = Math.cos(lonRad);
        if (cosLon > -0.2) {
          const x = centerX + Math.sin(lonRad) * Math.cos(latRad) * radius;
          const y = centerY - Math.sin(latRad) * radius;
          ctx.beginPath();
          ctx.arc(x, y, pt.r * (cosLon + 0.5) * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Flight Arc
      const fromRad = (selectedRoute.fromLon * Math.PI) / 180 + rot;
      const toRad = (selectedRoute.toLon * Math.PI) / 180 + rot;

      const fromX = centerX + Math.sin(fromRad) * Math.cos((selectedRoute.fromLat * Math.PI) / 180) * radius;
      const fromY = centerY - Math.sin((selectedRoute.fromLat * Math.PI) / 180) * radius;

      const toX = centerX + Math.sin(toRad) * Math.cos((selectedRoute.toLat * Math.PI) / 180) * radius;
      const toY = centerY - Math.sin((selectedRoute.toLat * Math.PI) / 180) * radius;

      // Great-circle arc line
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

      // Nodes
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
  }, [selectedRoute]);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-500" />
              Uluslararası Rota & 3D Dünya Küresi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ülkeler arası uçuşlarda iklim şokunu önleyen katmanlı seyahat gardırobu rehberi
            </p>
          </div>

          {/* Route selector buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
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
        </div>

        {/* 3D Canvas Sphere & Flight Analysis Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* 3D Globe Canvas Container */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-inner">
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="max-w-full drop-shadow-2xl cursor-grab active:cursor-grabbing"
            />
            <span className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" />
              Firefox Donanım İvmeli 3D Vektör Projeksiyonu
            </span>
          </div>

          {/* Flight Details & Climate Shock Panel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedRoute.fromName}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <span>Tahmini Uçuş: {selectedRoute.flightHours}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedRoute.toName}
                </span>
              </div>

              {/* Temperature Delta */}
              <div className="flex items-center justify-around p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Kalkış Noktası</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {selectedRoute.fromTemp}°C
                  </span>
                </div>
                <div className="text-center font-bold text-xs text-amber-500">
                  {selectedRoute.toTemp - selectedRoute.fromTemp > 0 ? '+' : ''}
                  {selectedRoute.toTemp - selectedRoute.fromTemp}°C Fark
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Varış Noktası</span>
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
