'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getCartoTileUrl, MAP_ATTRIBUTION } from '@/lib/map-config';
import { LocationInfo, WeatherConsensus } from '@/lib/types';
import { fetchWeatherConsensus } from '@/lib/weather-service';
import {
  Plane,
  AlertTriangle,
  ArrowRight,
  Map,
  Globe2,
  MapPin,
  Wind,
  Droplets,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';

interface FlightRoutePreset {
  id: string;
  fromName: string;
  toName: string;
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
}

const POPULAR_FLIGHT_ROUTES: FlightRoutePreset[] = [
  {
    id: 'ist-lon',
    fromName: 'İstanbul',
    toName: 'Londra',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 51.5074,
    toLon: -0.1278,
  },
  {
    id: 'ist-nyc',
    fromName: 'İstanbul',
    toName: 'New York',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 40.7128,
    toLon: -74.006,
  },
  {
    id: 'ist-tyo',
    fromName: 'İstanbul',
    toName: 'Tokyo',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 35.6762,
    toLon: 139.6503,
  },
  {
    id: 'ist-par',
    fromName: 'İstanbul',
    toName: 'Paris',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 48.8566,
    toLon: 2.3522,
  },
  {
    id: 'ist-ber',
    fromName: 'İstanbul',
    toName: 'Berlin',
    fromLat: 41.0082,
    fromLon: 28.9784,
    toLat: 52.52,
    toLon: 13.405,
  },
];

// Great-circle distance (Haversine) in km & estimated flight duration
function calculateFlightMetrics(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c);
  // Commercial jet average block speed ~780 km/h + 35 mins taxi/climb
  const totalMinutes = Math.max(45, Math.round((distanceKm / 780) * 60 + 35));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return {
    distanceKm,
    flightHours: `${h}s ${m}dk`,
  };
}

function buildLiveShockWarning(
  fromName: string,
  toName: string,
  fromW: WeatherConsensus | null,
  toW: WeatherConsensus | null
): string {
  if (!fromW || !toW) {
    return 'Kalkış ve varış noktalarının canlı atmosfer verileri analiz ediliyor...';
  }
  const delta = Math.round((toW.temp - fromW.temp) * 10) / 10;
  const parts: string[] = [];

  if (delta <= -6) {
    parts.push(
      `${toName} inişinde ${Math.abs(delta)}°C sert sıcaklık düşüşü (${fromW.temp}°C → ${toW.temp}°C) yaşanacak.`
    );
    parts.push(
      'Uçak kabininde terlememek için nefes alan pamuklu/merinos iç katmanla uçun; ancak iniş kapısından çıkmadan önce giymek üzere kabin bagajınızda mutlaka rüzgar kesici dış ceket veya kaban bulundurun.'
    );
  } else if (delta >= 6) {
    parts.push(
      `${toName} varışında +${delta}°C belirgin sıcaklık artışı (${fromW.temp}°C → ${toW.temp}°C) sizi bekliyor.`
    );
    parts.push(
      `${fromName} kalkışında giydiğiniz kalın dış katmanı uçuş sonunda kolayca çıkarabileceğiniz fermuarlı/düğmeli modüler parçalarla kombinleyin; içte hafif tişört veya keten gömlek tercih edin.`
    );
  } else {
    parts.push(
      `${fromName} (${fromW.temp}°C) ve ${toName} (${toW.temp}°C) arasında ılımlı bir sıcaklık geçişi (${delta > 0 ? '+' : ''}${delta}°C) var.`
    );
    parts.push(
      'Kabin içi düşük nem ve klima serinliğine karşı ince bir hırka veya gömlek katmanı konforlu bir uçuş sağlayacaktır.'
    );
  }

  if (toW.precipitationProb >= 45 || toW.condition === 'rainy') {
    parts.push(
      `Ayrıca ${toName} genelinde %${toW.precipitationProb} yağış olasılığı mevcut; su itici dış kabuk veya katlanır şemsiyeyi valize değil el bagajına alın.`
    );
  } else if (toW.windSpeed >= 24) {
    parts.push(
      `${toName} havalimanı çevresinde ${toW.windSpeed} km/s sert rüzgar ölçüldü; boyun koruyucu şal veya rüzgarlık önerilir.`
    );
  }

  return parts.join(' ');
}

interface GlobeViewProps {
  theme?: 'dark' | 'light';
  currentLocation?: LocationInfo;
}

export function GlobeView({ theme = 'dark' }: GlobeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leafletMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>('ist-lon');
  const [fromCity, setFromCity] = useState({ name: 'İstanbul', lat: 41.0082, lon: 28.9784 });
  const [toCity, setToCity] = useState({ name: 'Londra', lat: 51.5074, lon: -0.1278 });

  const [fromQuery, setFromQuery] = useState('İstanbul');
  const [toQuery, setToQuery] = useState('Londra');
  const [fromResults, setFromResults] = useState<any[]>([]);
  const [toResults, setToResults] = useState<any[]>([]);

  const [fromWeather, setFromWeather] = useState<WeatherConsensus | null>(null);
  const [toWeather, setToWeather] = useState<WeatherConsensus | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [viewStyle, setViewStyle] = useState<'map' | '3d'>('map');
  const rotationRef = useRef<number>(0);

  // Fetch live weather for both Origin and Destination cities in parallel
  useEffect(() => {
    let isMounted = true;
    setIsLoadingWeather(true);

    Promise.all([
      fetchWeatherConsensus({
        country: 'Global',
        city: fromCity.name,
        district: fromCity.name,
        lat: fromCity.lat,
        lon: fromCity.lon,
      }),
      fetchWeatherConsensus({
        country: 'Global',
        city: toCity.name,
        district: toCity.name,
        lat: toCity.lat,
        lon: toCity.lon,
      }),
    ])
      .then(([wFrom, wTo]) => {
        if (isMounted) {
          setFromWeather(wFrom);
          setToWeather(wTo);
          setIsLoadingWeather(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setIsLoadingWeather(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fromCity.lat, fromCity.lon, fromCity.name, toCity.lat, toCity.lon, toCity.name]);

  // Debounced search for custom Origin city
  useEffect(() => {
    if (!fromQuery || fromQuery.trim().length < 2 || fromQuery === fromCity.name) {
      setFromResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(fromQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setFromResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [fromQuery, fromCity.name]);

  // Debounced search for custom Destination city
  useEffect(() => {
    if (!toQuery || toQuery.trim().length < 2 || toQuery === toCity.name) {
      setToResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(toQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setToResults(data.results || []);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [toQuery, toCity.name]);

  // Initialize or update 2D Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function updateLeaflet() {
      if (viewStyle !== 'map' || typeof window === 'undefined' || !leafletMapRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !leafletMapRef.current) return;
      leafletRef.current = L;

      if (!mapInstanceRef.current) {
        const map = L.map(leafletMapRef.current, {
          center: [(fromCity.lat + toCity.lat) / 2, (fromCity.lon + toCity.lon) / 2],
          zoom: 3,
          zoomControl: true,
        });

        const tileLayer = L.tileLayer(getCartoTileUrl(theme), {
          attribution: MAP_ATTRIBUTION,
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        const group = L.layerGroup().addTo(map);
        layerGroupRef.current = group;
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      const group = layerGroupRef.current;
      if (!map || !group) return;

      group.clearLayers();

      const fromTempVal = fromWeather ? `${fromWeather.temp}°C` : '...';
      const toTempVal = toWeather ? `${toWeather.temp}°C` : '...';

      const originIcon = L.divIcon({
        className: 'origin-marker',
        html: `<div style="background:#0284c7; color:#fff; padding:4px 9px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.35); transform:translate(-50%,-50%);">🛫 ${fromCity.name} (${fromTempVal})</div>`,
      });
      L.marker([fromCity.lat, fromCity.lon], { icon: originIcon }).addTo(group);

      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `<div style="background:#ef4444; color:#fff; padding:4px 9px; border-radius:10px; font-size:11px; font-weight:bold; white-space:nowrap; border:2px solid #fff; box-shadow:0 3px 8px rgba(0,0,0,0.35); transform:translate(-50%,-50%);">🛬 ${toCity.name} (${toTempVal})</div>`,
      });
      L.marker([toCity.lat, toCity.lon], { icon: destIcon }).addTo(group);

      const latlngs = [
        [fromCity.lat, fromCity.lon],
        [toCity.lat, toCity.lon],
      ];
      const poly = L.polyline(latlngs as any, {
        color: '#f59e0b',
        weight: 3.5,
        dashArray: '8, 8',
      }).addTo(group);

      map.fitBounds(poly.getBounds(), { padding: [55, 55], maxZoom: 6 });
    }

    updateLeaflet();

    return () => {
      isMounted = false;
    };
  }, [viewStyle, fromCity, toCity, fromWeather, toWeather, theme]);

  // Cleanup map when switching to 3D canvas view or unmounting
  useEffect(() => {
    if (viewStyle === '3d' && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      layerGroupRef.current = null;
    }
  }, [viewStyle]);

  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getCartoTileUrl(theme));
    }
  }, [theme]);

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

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = centerY + Math.sin((lat * Math.PI) / 180) * radius;
        const rLat = Math.cos((lat * Math.PI) / 180) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX, y, rLat, rLat * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let lon = 0; lon < 360; lon += 45) {
        const angle = ((lon * Math.PI) / 180 + rot) % (Math.PI * 2);
        const xOffset = Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX + xOffset * 0.5, centerY, Math.abs(xOffset) * 0.5, radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

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

      const fromRad = (fromCity.lon * Math.PI) / 180 + rot;
      const toRad = (toCity.lon * Math.PI) / 180 + rot;

      const fromX = centerX + Math.sin(fromRad) * Math.cos((fromCity.lat * Math.PI) / 180) * radius;
      const fromY = centerY - Math.sin((fromCity.lat * Math.PI) / 180) * radius;

      const toX = centerX + Math.sin(toRad) * Math.cos((toCity.lat * Math.PI) / 180) * radius;
      const toY = centerY - Math.sin((toCity.lat * Math.PI) / 180) * radius;

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
  }, [viewStyle, fromCity, toCity]);

  const flightMetrics = calculateFlightMetrics(
    fromCity.lat,
    fromCity.lon,
    toCity.lat,
    toCity.lon
  );
  const fromTemp = fromWeather ? fromWeather.temp : 18;
  const toTemp = toWeather ? toWeather.temp : 14;
  const tempDelta = Math.round((toTemp - fromTemp) * 10) / 10;
  const liveWarning = buildLiveShockWarning(
    fromCity.name,
    toCity.name,
    fromWeather,
    toWeather
  );

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-500" />
              Uluslararası Uçuş & Canlı İklim Şoku Analizi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dünya üzerindeki herhangi iki şehir arasındaki canlı meteorolojik konsensüsü kıyaslar ve kabin gardırobunu planlar.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                Gerçek Harita (CARTO)
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

        {/* Custom Worldwide Flight Search Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-end">
          <div className="sm:col-span-5 space-y-1 relative">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Kalkış Şehri / Havalimanı:
            </label>
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => setFromQuery(e.target.value)}
              placeholder="Örn: İstanbul, Ankara, Berlin..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {fromResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-48 overflow-y-auto">
                {fromResults.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const label = item.city || item.district;
                      setFromCity({ name: label, lat: item.lat, lon: item.lon });
                      setFromQuery(label);
                      setSelectedPresetId('custom');
                      setFromResults([]);
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

          <div className="sm:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                const temp = fromCity;
                setFromCity(toCity);
                setFromQuery(toCity.name);
                setToCity(temp);
                setToQuery(temp.name);
                setSelectedPresetId('custom');
              }}
              title="Uçuş Yönünü Çevir"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="sm:col-span-5 space-y-1 relative">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Varış Şehri / Ülke:
            </label>
            <input
              type="text"
              value={toQuery}
              onChange={(e) => setToQuery(e.target.value)}
              placeholder="Örn: Londra, Tokyo, New York, Oslo..."
              className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {toResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-48 overflow-y-auto">
                {toResults.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const label = item.city || item.district;
                      setToCity({ name: label, lat: item.lat, lon: item.lon });
                      setToQuery(label);
                      setSelectedPresetId('custom');
                      setToResults([]);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{item.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Popular Flight Route Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold pb-1">
          <span className="text-[11px] text-slate-400 mr-1 shrink-0">Hızlı Rotalar:</span>
          {POPULAR_FLIGHT_ROUTES.map((route) => (
            <button
              key={route.id}
              onClick={() => {
                setSelectedPresetId(route.id);
                setFromCity({ name: route.fromName, lat: route.fromLat, lon: route.fromLon });
                setFromQuery(route.fromName);
                setToCity({ name: route.toName, lat: route.toLat, lon: route.toLon });
                setToQuery(route.toName);
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                selectedPresetId === route.id
                  ? 'bg-sky-500 text-white border-sky-400 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {route.fromName} &rarr; {route.toName}
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

            {isLoadingWeather && (
              <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-xs text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1.5 shadow-md">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Canlı atmosfer verileri çekiliyor...</span>
              </div>
            )}
          </div>

          {/* Flight Details & Climate Shock Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  🛫 {fromCity.name}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <span>{flightMetrics.distanceKm} km &bull; ~{flightMetrics.flightHours}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  🛬 {toCity.name}
                </span>
              </div>

              {/* Temperature Delta */}
              <div className="flex items-center justify-around p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Kalkış (Canlı)</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white block">
                    {fromTemp}°C
                  </span>
                  {fromWeather && (
                    <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <Droplets className="w-2.5 h-2.5 text-sky-500" /> %{fromWeather.humidity} &bull;{' '}
                      <Wind className="w-2.5 h-2.5 text-sky-500" /> {fromWeather.windSpeed}km/s
                    </span>
                  )}
                </div>

                <div className="text-center font-bold text-xs text-amber-500 px-2">
                  <span className="block text-sm">
                    {tempDelta > 0 ? '+' : ''}
                    {tempDelta}°C
                  </span>
                  <span className="text-[10px] text-slate-400">İklim Farkı</span>
                </div>

                <div className="text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 block">Varış (Canlı)</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white block">
                    {toTemp}°C
                  </span>
                  {toWeather && (
                    <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                      <Droplets className="w-2.5 h-2.5 text-sky-500" /> %{toWeather.humidity} &bull;{' '}
                      <Wind className="w-2.5 h-2.5 text-sky-500" /> {toWeather.windSpeed}km/s
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Climate Shock Advisory */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Canlı İklim Şoku & Kabin Gardırobu Reçetesi</span>
              </div>
              <p className="text-xs leading-relaxed">
                {liveWarning}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
