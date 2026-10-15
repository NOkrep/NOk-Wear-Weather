'use client';
import { useLocale } from '@/lib/i18n';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LocationSearch } from '@/components/LocationSearch';
import { BrandMark } from '@/components/BrandMark';
import { Navbar } from '@/components/Navbar';
import { RealCityMap } from '@/components/RealCityMap';
import { HourlyForecastChart } from '@/components/HourlyForecastChart';
import { OutfitRecommendation } from '@/components/OutfitRecommendation';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SourceSettingsModal } from '@/components/SourceSettingsModal';
import { WardrobeModal } from '@/components/WardrobeModal';
import type { LocationInfo, WeatherCondition, ThermalProfile, ClothingItem, ItineraryStop } from '@/lib/types';
import { fetchWeatherConsensus, getPersonalThermalProfile, computeCompositeItineraryWeather, resolveStopWeatherAtTime } from '@/lib/weather-service';
import { getStoredWardrobe, DEFAULT_WARDROBE_ITEMS } from '@/lib/wardrobe-storage';
import { getWeatherTheme } from '@/lib/weather-theme';
import { Wind, Droplets, Sun, Moon, Cloud, CloudSun, CloudRain, CloudLightning, CloudSnow, Shirt, MapPin, ArrowUpRight, ChevronDown, Plus, LoaderCircle, Clock3, ShieldCheck, RefreshCw, Navigation, X } from 'lucide-react';
function WeatherIcon({ condition, size = 22 }: {
    condition: WeatherCondition;
    size?: number;
}) {
    const Icon = ({ sunny: Sun, clear_night: Moon, rainy: CloudRain, stormy: CloudLightning, snowy: CloudSnow, cloudy: Cloud, foggy: Cloud, partly_cloudy: CloudSun })[condition];
    return <Icon size={size} strokeWidth={1.5} aria-hidden="true"/>;
}
export default function HomePage() {
    const { t, locale } = useLocale();
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [mobileTab, setMobileTab] = useState<'outfit' | 'map' | 'hourly'>('map');
    const [stops, setStops] = useState<ItineraryStop[]>([{ id: 'stop-initial', location: { country: 'Türkiye', city: 'İstanbul', district: 'Kadıköy', lat: 40.992, lon: 29.027 }, preferredTime: '' }]);
    const [activeStopId, setActiveStopId] = useState('stop-initial');
    const [thermalProfile, setThermalProfile] = useState<ThermalProfile>({ offsetC: 0, feedbackCount: 0, label: '0°C' });
    const [wardrobe, setWardrobe] = useState<ClothingItem[]>(DEFAULT_WARDROBE_ITEMS);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);
    const [workspaceMode, setWorkspaceMode] = useState<'route' | 'outfit'>('route');
    const [feedbackItems, setFeedbackItems] = useState<ClothingItem[]>([]);
    const [showHourly, setShowHourly] = useState(false);
    const [dateLabel, setDateLabel] = useState('Bugün');
    const [pendingWeather, setPendingWeather] = useState(0);
    const stopsRef = useRef(stops);
    const weatherRequests = useRef(new Map<string, symbol>());
    const mounted = useRef(true);
    useEffect(() => { stopsRef.current = stops; }, [stops]);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
    useEffect(() => {
        // Leaflet must measure again after its pane or preview frame becomes visible.
        const frame = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
        return () => cancelAnimationFrame(frame);
    }, [mobileTab, previewDevice, workspaceMode]);
    useEffect(() => {
        setThermalProfile(getPersonalThermalProfile());
        setWardrobe(getStoredWardrobe());
        setDateLabel(new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date()));
        if ('serviceWorker' in navigator)
            navigator.serviceWorker.register('/sw.js').catch(() => { });
    }, []);
    useEffect(() => { setDateLabel(new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date())); }, [locale]);
    const loadStopWeather = useCallback(async (id: string, location: LocationInfo) => {
        const request = Symbol(id);
        weatherRequests.current.set(id, request);
        setPendingWeather(count => count + 1);
        try {
            const weather = await fetchWeatherConsensus(location);
            if (mounted.current && weatherRequests.current.get(id) === request) {
                setStops(current => current.map(stop => stop.id === id ? { ...stop, weather } : stop));
            }
        }
        finally {
            if (mounted.current)
                setPendingWeather(count => Math.max(0, count - 1));
        }
    }, []);
    const refreshAllStopsWeather = useCallback(() => {
        stopsRef.current.forEach(stop => { void loadStopWeather(stop.id, stop.location); });
    }, [loadStopWeather]);
    useEffect(() => { refreshAllStopsWeather(); }, [refreshAllStopsWeather]);
    const activeStop = useMemo(() => stops.find(stop => stop.id === activeStopId) || stops[0], [stops, activeStopId]);
    const compositeWeather = useMemo(() => computeCompositeItineraryWeather(stops, activeStop.weather || null), [stops, activeStop.weather]);
    const resolved = useMemo(() => activeStop.weather ? resolveStopWeatherAtTime(activeStop.weather, activeStop.preferredTime) : null, [activeStop]);
    const condition = resolved?.condition || 'partly_cloudy';
    const palette = useMemo(() => getWeatherTheme(condition, theme), [condition, theme]);
    const availableSources = activeStop.weather?.sources.filter(source => source.isAvailable).length || 0;
    const hasWeather = Boolean(resolved);
    const allStopsReady = stops.every(stop => Boolean(stop.weather));
    const handleAddStop = useCallback((location: LocationInfo, preferredTime = '') => {
        const id = `stop-${crypto.randomUUID()}`;
        setStops(current => [...current, { id, location, preferredTime }]);
        setActiveStopId(id);
        void loadStopWeather(id, location);
    }, [loadStopWeather]);
    const handleUpdateStopLocation = useCallback((id: string, location: LocationInfo) => {
        setStops(current => current.map(stop => stop.id === id ? { ...stop, location, weather: undefined } : stop));
        void loadStopWeather(id, location);
    }, [loadStopWeather]);
    const handleUpdateStopTime = useCallback((id: string, preferredTime: string) => {
        setStops(current => current.map(stop => stop.id === id ? { ...stop, preferredTime } : stop));
    }, []);
    const handleRemoveStop = useCallback((id: string) => {
        const remaining = stops.filter(stop => stop.id !== id);
        if (!remaining.length)
            return;
        weatherRequests.current.delete(id);
        setStops(remaining);
        if (activeStopId === id)
            setActiveStopId(remaining[0].id);
    }, [stops, activeStopId]);
    const handleDetectLocation = useCallback(() => {
        setLocationError('');
        if (!navigator.geolocation) {
            setLocationError('Bu cihazda konum kullanılamıyor. Haritadan yer seçebilirsin.');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = Math.round(position.coords.latitude * 100) / 100;
            const lon = Math.round(position.coords.longitude * 100) / 100;
            try {
                const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
                if (!response.ok)
                    throw new Error('Geocoding failed');
                const data = await response.json();
                handleUpdateStopLocation(activeStop.id, { country: data.country || 'Global', city: data.city || 'Mevcut şehir', district: data.district || 'Konumum', lat, lon });
            }
            catch {
                setLocationError('Konum çözümlenemedi. Haritadan yer seçebilirsin.');
            }
            finally {
                setIsLocating(false);
            }
        }, () => { setIsLocating(false); setLocationError('Konuma ulaşılamadı. İznini kontrol edebilir veya haritadan yer seçebilirsin.'); }, { timeout: 8000 });
    }, [activeStop.id, handleUpdateStopLocation]);
    const focusMapSearch = useCallback(() => {
        setMobileTab('map');
        requestAnimationFrame(() => {
            document.querySelector<HTMLInputElement>('.map-search-bar input[type="search"]')?.focus();
            document.getElementById('route-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }, []);
    return <div className={`weather-app ${previewDevice === 'mobile' ? 'is-app-preview' : ''}`} style={palette.style} data-condition={hasWeather ? condition : 'loading'} data-mode={theme}>
      <Navbar theme={theme} onToggleTheme={() => setTheme(current => current === 'light' ? 'dark' : 'light')} onOpenSources={() => setIsSourceModalOpen(true)} onOpenFeedback={() => setIsFeedbackModalOpen(true)} onOpenWardrobe={() => setIsWardrobeModalOpen(true)} wardrobeCount={wardrobe.length} previewDevice={previewDevice} onTogglePreviewDevice={() => setPreviewDevice(current => current === 'desktop' ? 'mobile' : 'desktop')} />
      {previewDevice === 'mobile' && <div className="preview-caption"><span className="preview-indicator" />{t('Canlı uygulama önizlemesi')}<span>390 × 844</span></div>}
      <div className="app-device">
        {previewDevice === 'mobile' && <div className="device-status" aria-hidden="true"><span>Weathrobe</span><span className="device-island" /><BrandMark compact /></div>}
        <main id="main-content" className="app-main">
          <div className="day-heading"><div><span className="eyebrow">{t('Havanı bil. Gününü yaşa.')}</span><h1>{t('Bugün, sana göre')}<span>.</span></h1></div><span className="day-date">{dateLabel}</span></div>
          <LocationSearch onSelect={location => handleUpdateStopLocation(activeStop.id, location)} onLocate={handleDetectLocation} isLocating={isLocating} />
          <section className="weather-overview" aria-label={t('Seçili durağın hava durumu')} aria-busy={pendingWeather > 0}>
            <div className="weather-location"><div className="location-heading"><MapPin size={15}/><span>{activeStop.location.district}, {activeStop.location.city}</span></div><div className="temperature"><span>{resolved ? Math.round(resolved.temp) : '—'}</span><span className="degree">°</span><div><span className="condition-name">{hasWeather ? t(palette.label) : t('Hava yükleniyor')}</span><span className="feels-like">{resolved ? t(`Hissedilen ${Math.round(resolved.feelsLike)}°`) : t('Kaynaklara bağlanılıyor…')}{activeStop.preferredTime && ` · ${activeStop.preferredTime}`}</span></div></div></div>
            <div className="weather-art" aria-hidden="true"><span className="weather-orbit orbit-one"/><span className="weather-orbit orbit-two"/><span className="weather-disc"/><WeatherIcon condition={condition} size={98}/></div>
            <div className="weather-metrics"><div><Droplets size={17}/><span>{t('Yağış')}</span><strong>{resolved ? `${resolved.precipitationProb}%` : '—'}</strong></div><div><Wind size={17}/><span>{t('Rüzgâr')}</span><strong>{resolved?.windSpeed ?? '—'}<small> km/h</small></strong></div><div><Sun size={17}/><span>{t('UV indeksi')}</span><strong>{activeStop.weather?.uvIndex ?? '—'}</strong></div></div>
          </section>
          {locationError && <p className="inline-notice" role="alert">{t(locationError)}</p>}
          {hasWeather && !availableSources && <p className="inline-notice" role="status">{t('Canlı kaynaklara ulaşılamadı. Yedek veriler gösteriliyor; önerileri güncel tahmin olarak değerlendirme.')}<button type="button" className="text-button" onClick={refreshAllStopsWeather} disabled={pendingWeather > 0}><RefreshCw size={14}/>{t('Yenile')}</button></p>}
          {!allStopsReady && stops.length > 1 && <p className="inline-notice" role="status">{t('Yeni durakların havası alınıyor. Kombin, verisi hazır duraklara göre gösteriliyor.')}</p>}
          <div className="workspace-mode" role="group" aria-label={t('Çalışma alanı odağı')}><button type="button" aria-pressed={workspaceMode === 'route'} onClick={() => { setWorkspaceMode('route'); setMobileTab('map'); }}><MapPin size={16}/>{t('Rota planla')}</button><button type="button" aria-pressed={workspaceMode === 'outfit'} onClick={() => { setWorkspaceMode('outfit'); setMobileTab('outfit'); }}><Shirt size={16}/>{t('Kombini incele')}</button><span>{t('Önce günün rotası, sonra sana uygun kombin.')}</span></div>
          <div className={`workspace-grid ${workspaceMode === 'route' ? 'route-focus' : 'outfit-focus'}`}>
            <section id="route-panel" className={`route-region mobile-pane ${mobileTab === 'map' ? 'mobile-pane-active' : ''}`} aria-label={t('Günlük rota planlayıcısı')}>
              <div className="route-heading"><div><span className="eyebrow">{t('01 / Günün rotası')}</span><h2>{t('Gittiğin her yerde.')}</h2></div><span className="stop-count">{t(`${stops.length} durak`)}</span></div>
              <div className="map-panel"><RealCityMap stops={stops} activeStopId={activeStop.id} accentHex={palette.accent} onSelectActiveStop={setActiveStopId} onAddStop={handleAddStop} onUpdateStopLocation={handleUpdateStopLocation} onUpdateStopTime={handleUpdateStopTime} onRemoveStop={handleRemoveStop} theme={theme}/></div>
              <div className="route-stop-list" aria-label={t('Durakların')}>{stops.map((stop,index) => {
                const weather = stop.weather ? resolveStopWeatherAtTime(stop.weather,stop.preferredTime) : null;
                return <div key={stop.id} className={`route-stop ${stop.id === activeStop.id ? 'route-stop-active' : ''}`}><button type="button" className="route-stop-select" onClick={() => setActiveStopId(stop.id)} aria-pressed={stop.id === activeStop.id}><span className="stop-number">{String(index+1).padStart(2,'0')}</span><span><strong>{stop.location.district}</strong><small>{stop.location.city} · {stop.preferredTime || t('Şimdi')}</small></span><span className="stop-weather">{weather ? <><WeatherIcon condition={weather.condition} size={19}/>{Math.round(weather.temp)}°</> : <LoaderCircle size={16} className="loading-spin"/>}</span></button>{stops.length > 1 && <button type="button" className="remove-stop" onClick={() => handleRemoveStop(stop.id)} aria-label={t(`${stop.location.district} durağını sil`)}><X size={14}/></button>}</div>;
              })}</div>
              <button type="button" className="add-stop-button" onClick={focusMapSearch}><Plus size={16}/>{t('Durak ekle')}<span>{t('Şehir, ülke veya haritadan')}<ArrowUpRight size={14}/></span></button>
              <button type="button" className="primary-button show-outfit-button" onClick={() => { setWorkspaceMode('outfit'); setMobileTab('outfit'); }}>{t('Kombinimi göster')}<ArrowUpRight size={15}/></button>
              <div className="map-attribution"><Navigation size={12}/>CARTO · © OpenStreetMap contributors</div>
            </section>
            <div className={`outfit-region mobile-pane ${mobileTab === 'outfit' ? 'mobile-pane-active' : ''}`}>{compositeWeather ? <OutfitRecommendation weather={compositeWeather} districtName={activeStop.location.district} countryName={activeStop.location.country} stopCount={stops.filter(stop=>stop.weather).length} thermalProfile={thermalProfile} wardrobe={wardrobe} onOpenFeedback={()=>setIsFeedbackModalOpen(true)} onItemsChange={setFeedbackItems} onOpenWardrobe={()=>setIsWardrobeModalOpen(true)}/> : <section className="outfit-panel outfit-loading" aria-live="polite"><span className="eyebrow">{t('02 / Ne giymeli?')}</span><h2>{t('Günün kombini hazırlanıyor.')}</h2><div className="loading-garments" aria-hidden="true">{[0,1,2].map(index=><div key={index}><Shirt size={64} strokeWidth={1}/></div>)}</div><p><LoaderCircle size={16} className="loading-spin"/>{t('Hava verileri bekleniyor')}</p></section>}</div>
          </div>
          <section className={`hourly-region mobile-pane ${mobileTab === 'hourly' ? 'mobile-pane-active' : ''}`} aria-label={t('Saatlik hava ve kaynaklar')}>
            <button type="button" className="hourly-toggle" onClick={()=>setShowHourly(current=>!current)} aria-expanded={showHourly} aria-controls="hourly-content"><span><Clock3 size={18}/><strong>{t('Saat saat, günün havası')}</strong><span className="hourly-teaser">{activeStop.weather?.hourly.slice(0,4).map(hour=>`${hour.timeStr}  ${hour.temp}°`).join('   /   ') || t('Tahminler bekleniyor')}</span></span><span className="hourly-toggle-label">{t(showHourly?'Gizle':'İncele')}<ChevronDown size={17} className={showHourly?'rotated':''}/></span></button>
            <div id="hourly-content" className={`hourly-content ${showHourly || mobileTab === 'hourly'?'hourly-content-open':''}`}>{activeStop.weather ? <HourlyForecastChart consensus={activeStop.weather} districtName={activeStop.location.district}/> : <p className="hourly-empty">{t('Saatlik tahminler hava verileriyle birlikte burada görünecek.')}</p>}</div>
          </section>
          <footer className="app-footer"><span className="footer-brand"><BrandMark compact/>{t('Biraz hava, biraz iyi his.')}</span><button type="button" className="source-status" onClick={()=>setIsSourceModalOpen(true)}><ShieldCheck size={14}/>{availableSources>0?t(`${availableSources} canlı kaynak`):t(hasWeather?'Yedek veri':'Kaynaklar')}<span className="footer-updated">{activeStop.weather?` · ${activeStop.weather.lastUpdated}`:''}</span><ArrowUpRight size={12}/></button></footer>
        </main>
        <nav className="mobile-navigation" aria-label={t('Uygulama bölümleri')}>{([{id:'map',label:'Rotam',Icon:MapPin},{id:'outfit',label:'Kombinim',Icon:Shirt},{id:'hourly',label:'Saatlik',Icon:Clock3}] as const).map(({id,label,Icon})=><button type="button" key={id} aria-pressed={mobileTab===id} onClick={()=>{setMobileTab(id); if(id!=='hourly')setWorkspaceMode(id==='map'?'route':'outfit');}}><Icon size={20}/><span>{t(label)}</span></button>)}<button type="button" onClick={()=>setIsWardrobeModalOpen(true)}><Plus size={20}/><span>{t('Dolabım')}</span></button></nav>
      </div>
      <WardrobeModal isOpen={isWardrobeModalOpen} onClose={()=>setIsWardrobeModalOpen(false)} wardrobe={wardrobe} onWardrobeChange={setWardrobe} currentCountry={activeStop.location.country}/>
      <FeedbackModal items={feedbackItems} weather={activeStop.weather && resolved ? {...activeStop.weather,...resolved}:null} isOpen={isFeedbackModalOpen} onClose={()=>setIsFeedbackModalOpen(false)} currentLocationName={`${activeStop.location.district}, ${activeStop.location.city}`} onFeedbackChanged={()=>setThermalProfile(getPersonalThermalProfile())}/>
      <SourceSettingsModal weather={activeStop.weather} isOpen={isSourceModalOpen} onClose={()=>setIsSourceModalOpen(false)} onKeysSaved={refreshAllStopsWeather} onDataWiped={()=>{setWardrobe(DEFAULT_WARDROBE_ITEMS);setThermalProfile({offsetC:0,feedbackCount:0,label:'0°C'});}}/>
    </div>;
}
