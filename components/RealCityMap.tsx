'use client';

import { useLocale } from '@/lib/i18n';
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
  temp: number | null,
  isActive: boolean,
  accentHex: string,
  timeStr?: string
) {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  const bg = isActive ? accentHex : '#1e293b';
  const border = isActive ? '#ffffff' : '#64748b';
  return `
    <div style="
      background: ${bg};
      color: var(--ww-accent-ink, #ffffff);
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
      <span>${escapeHtml(label)}</span>
      ${timeStr ? `<span style="opacity:0.85; font-size:10px;">${escapeHtml(timeStr)}</span>` : ''}
      <span style="background: #ffffff; color: #0f172a; padding: 0.5px 5px; border-radius: 999px; font-weight: 800;">
        ${temp === null ? '—' : `${temp}°C`}
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
  const { t, locale } = useLocale();
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
    let observer: ResizeObserver | undefined;
    let resizeFrame = 0;

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
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (mapContainerRef.current?.clientWidth && mapContainerRef.current.clientHeight) {
            const center = map.getCenter();
            map.invalidateSize({ pan: false, debounceMoveend: true });
            map.setView(center, map.getZoom(), { animate: false });
          }
        });
      });
      observer.observe(mapContainerRef.current);
    }

    initMap();

    return () => {
      isMounted = false;
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
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
      const tempVal = resolved ? resolved.temp : null;

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

  return <div className="city-map-studio">
    <div className="map-control-row"><div className="map-stop-pills" aria-label={t('Durak saatleri')}>{stops.map((stop,index)=><div key={stop.id} className={`map-stop-pill ${stop.id===activeStopId?'map-stop-selected':''}`}><button type="button" onClick={()=>onSelectActiveStop(stop.id)} aria-pressed={stop.id===activeStopId}><span>{String(index+1).padStart(2,'0')}</span><strong>{stop.location.district}</strong></button><input type="time" value={stop.preferredTime||''} onChange={e=>onUpdateStopTime(stop.id,e.target.value)} aria-label={`${stop.location.district} · ${t('Durak saati')}`}/>{stops.length>1&&<button type="button" className="map-pill-remove" onClick={()=>onRemoveStop(stop.id)} aria-label={t(`${stop.location.district} durağını sil`)}><X size={12}/></button>}</div>)}</div><button type="button" className="map-click-mode" aria-pressed={clickAction==='add'} onClick={()=>setClickAction(v=>v==='add'?'update':'add')} title={t('Haritaya tıklama davranışı')}><MapPin size={13}/>{t(clickAction==='add'?'Tıkla: durak ekle':'Tıkla: konumu değiştir')}</button></div>
    <div className="map-search-wrapper"><div className="map-search-bar"><Search size={15}/><input type="search" aria-label={t('Rotaya durak ara')} placeholder={t('Şehir, ilçe veya ülke ekle…')} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/><label><Clock size={13}/><span className="sr-only">{t('Yeni durak saati')}</span><input type="time" value={newStopTime} onChange={e=>setNewStopTime(e.target.value)} aria-label={t('Yeni durak saati')}/></label>{isSearching&&<Loader2 size={14} className="loading-spin"/>}</div>
      {searchResults.length>0&&<div className="map-search-results">{searchResults.map((item,index)=><div key={index}><span>{item.displayName}</span><div><button type="button" className="text-button" onClick={()=>handlePickSearchResult(item,'update')}>{t('Değiştir')}</button><button type="button" className="primary-button" onClick={()=>handlePickSearchResult(item,'add')}><Plus size={13}/>{t('Ekle')}</button></div></div>)}</div>}
    </div>
    <div className="map-canvas"><div ref={mapContainerRef} className="map-leaflet"/>
      {routeSummary&&<div className="map-status-badge"><Navigation size={13}/>{routeSummary.distanceKm} km · ~{locale==='en'?routeSummary.durationStr.replace(/sa/g,'h').replace(/dk/g,'min'):routeSummary.durationStr}</div>}
      {isReverseGeocoding&&<div className="map-status-badge map-status-right"><Loader2 size={13} className="loading-spin"/>{t('Konum alınıyor…')}</div>}
    </div>
  </div>;
});
