'use client';
import { useLocale } from '@/lib/i18n';
import { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { LocationSearch } from '@/components/LocationSearch';
import { BrandMark } from '@/components/BrandMark';
import { Navbar } from '@/components/Navbar';
import { RealCityMap } from '@/components/RealCityMap';
import { HourlyForecastChart } from '@/components/HourlyForecastChart';
import { OutfitRecommendation } from '@/components/OutfitRecommendation';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ProductFeedbackModal } from '@/components/ProductFeedbackModal';
import { StopPlanControls } from '@/components/StopPlanControls';
import { SourceSettingsModal } from '@/components/SourceSettingsModal';
import { WardrobeModal } from '@/components/WardrobeModal';
import type { LocationInfo, ThermalProfile, ClothingItem, ItineraryStop, StopWeatherPlan } from '@/lib/types';
import { fetchWeatherConsensus, getPersonalThermalProfile, computeCompositeItineraryWeather, resolveStopWeatherAtTime } from '@/lib/weather-service';
import { getStoredWardrobe, DEFAULT_WARDROBE_ITEMS } from '@/lib/wardrobe-storage';
import { getWeatherTheme } from '@/lib/weather-theme';
import { Wind, Droplets, Sun, Shirt, MapPin, ArrowUpRight, ChevronDown, Plus, LoaderCircle, Clock3, ShieldCheck, RefreshCw, Navigation, X } from 'lucide-react';
import { WeatherIcon } from '@/components/WeatherIcon';
import { resolveLocalDateTime, validLocalDate, validTimeZone } from '@/lib/weather-time';
const subscribeToHydration = () => () => {};
export default function HomePage() {
    const { t, locale } = useLocale();
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [mobileTab, setMobileTab] = useState<'outfit' | 'map' | 'hourly'>('map');
    const [stops, setStops] = useState<ItineraryStop[]>([{ id: 'stop-initial', location: { country: 'Türkiye', city: 'İstanbul', district: 'Kadıköy', lat: 40.992, lon: 29.027 }, preferredTime: '' }]);
    const [activeStopId, setActiveStopId] = useState('stop-initial');
    const [thermalProfile, setThermalProfile] = useState<ThermalProfile>({ offsetC: 0, feedbackCount: 0, label: '0°C' });
    const [wardrobe, setWardrobe] = useState<ClothingItem[]>(DEFAULT_WARDROBE_ITEMS);
    const browserReady = useSyncExternalStore(subscribeToHydration, () => true, () => false);
    const [personalDataLoaded, setPersonalDataLoaded] = useState(false);
    // Keep the server snapshot stable, then initialize personal state once after hydration.
    if (browserReady && !personalDataLoaded) {
        setPersonalDataLoaded(true);
        setThermalProfile(getPersonalThermalProfile());
        setWardrobe(getStoredWardrobe());
    }
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isProductFeedbackOpen, setIsProductFeedbackOpen] = useState(false);
    const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);
    const [workspaceMode, setWorkspaceMode] = useState<'route' | 'outfit'>('route');
    const [feedbackItems, setFeedbackItems] = useState<ClothingItem[]>([]);
    const [showHourly, setShowHourly] = useState(false);
    const [clock, setClock] = useState(() => Date.now());
    const [pendingWeather, setPendingWeather] = useState(0);
    const stopsRef = useRef(stops);
    const weatherRequests = useRef(new Map<string, symbol>());
    const automaticTargets = useRef(new Map<string, string>());
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
        if ('serviceWorker' in navigator)
            navigator.serviceWorker.register('/sw.js').catch(() => { });
    }, []);
    useEffect(() => {
        const tick = () => setClock(Date.now());
        const timer = window.setInterval(tick, 30000);
        window.addEventListener('focus', tick);
        return () => { window.clearInterval(timer); window.removeEventListener('focus', tick); };
    }, []);
    const loadStopWeather = useCallback(async (id: string, location: LocationInfo, date?: string) => {
        const request = Symbol(id);
        weatherRequests.current.set(id, request);
        setPendingWeather(count => count + 1);
        try {
            const weather = await fetchWeatherConsensus(location, date && validLocalDate(date) ? date : undefined);
            if (mounted.current && weatherRequests.current.get(id) === request) {
                // A freshly fetched response must not be compared with the previous 30-second UI tick.
                setClock(Date.now());
                setStops(current => current.map(stop => stop.id === id && stop.plan?.date === date && stop.location.lat === location.lat && stop.location.lon === location.lon ? { ...stop, weather: weather.timezoneKnown === false && stop.weather?.timezoneKnown ? {
                    ...weather, timezone: stop.weather.timezone, timezoneKnown: true,
                } : weather } : stop));
            }
        }
        finally {
            if (mounted.current)
                setPendingWeather(count => Math.max(0, count - 1));
        }
    }, []);
    const refreshAllStopsWeather = useCallback(() => {
        stopsRef.current.forEach(stop => { void loadStopWeather(stop.id, stop.location, stop.plan?.date); });
    }, [loadStopWeather]);
    useEffect(() => {
        const timer = window.setInterval(refreshAllStopsWeather, 15 * 60000);
        return () => window.clearInterval(timer);
    }, [refreshAllStopsWeather]);
    const fetchSignature = stops.map(stop => JSON.stringify([stop.id, stop.location.lat, stop.location.lon, stop.plan?.date])).join(';');
    useEffect(() => {
        const current = stopsRef.current;
        current.forEach(stop => {
            const signature = JSON.stringify([stop.location.lat, stop.location.lon, stop.plan?.date]);
            if (automaticTargets.current.get(stop.id) !== signature) {
                automaticTargets.current.set(stop.id, signature);
                void loadStopWeather(stop.id, stop.location, stop.plan?.date);
            }
        });
        for (const id of automaticTargets.current.keys()) if (!current.some(stop => stop.id === id)) automaticTargets.current.delete(id);
    }, [fetchSignature, loadStopWeather]);
    const activeStop = useMemo(() => stops.find(stop => stop.id === activeStopId) || stops[0], [stops, activeStopId]);
    const compositeWeather = useMemo(() => computeCompositeItineraryWeather(stops, activeStop.weather || null, clock), [stops, activeStop.weather, clock]);
    const resolved = useMemo(() => activeStop.weather ? resolveStopWeatherAtTime(activeStop.weather, activeStop.preferredTime, clock, activeStop.plan) : null, [activeStop, clock]);
    const displayWeather = resolved?.consensus || (!activeStop.plan ? activeStop.weather : undefined);
    const condition = resolved?.forecastAvailable ? resolved.condition : 'partly_cloudy';
    const palette = useMemo(() => getWeatherTheme(condition, theme), [condition, theme]);
    const availableSources = displayWeather?.sources.filter(source => source.isAvailable).length || 0;
    const hasWeather = Boolean(resolved?.forecastAvailable);
    const planDateInstant = activeStop.plan ? resolveLocalDateTime(activeStop.plan.date, '12:00', activeStop.weather?.timezone) : null;
    const dateLabel = activeStop.plan && planDateInstant === null ? activeStop.plan.date : new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'tr-TR', {
        day: 'numeric', month: 'long', weekday: 'long', timeZone: validTimeZone(activeStop.weather?.timezone),
    }).format(resolved?.validAt ? new Date(resolved.validAt) : planDateInstant ?? clock);
    const allStopsReady = stops.every(stop => stop.weather && resolveStopWeatherAtTime(stop.weather, stop.preferredTime, clock, stop.plan).forecastAvailable);
    const handleAddStop = useCallback((location: LocationInfo, preferredTime = '') => {
        const id = `stop-${crypto.randomUUID()}`;
        setStops(current => [...current, { id, location, preferredTime }]);
        setActiveStopId(id);
    }, []);
    const handleUpdateStopLocation = useCallback((id: string, location: LocationInfo) => {
        setStops(current => current.map(stop => stop.id === id ? { ...stop, location, weather: undefined } : stop));
    }, []);
    const handleUpdateStopPlan = useCallback((id: string, plan?: StopWeatherPlan) => {
        setStops(current => current.map(stop => stop.id === id ? { ...stop, plan, preferredTime: plan?.startTime || '' } : stop));
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
      <Navbar theme={theme} onToggleTheme={() => setTheme(current => current === 'light' ? 'dark' : 'light')} onOpenSources={() => setIsSourceModalOpen(true)} onOpenFeedback={() => setIsFeedbackModalOpen(true)} onOpenProductFeedback={() => setIsProductFeedbackOpen(true)} onOpenWardrobe={() => setIsWardrobeModalOpen(true)} wardrobeCount={wardrobe.length} previewDevice={previewDevice} onTogglePreviewDevice={() => setPreviewDevice(current => current === 'desktop' ? 'mobile' : 'desktop')} />
      {previewDevice === 'mobile' && <div className="preview-caption"><span className="preview-indicator" />{t('Canlı uygulama önizlemesi')}<span>390 × 844</span></div>}
      <div className="app-device">
        {previewDevice === 'mobile' && <div className="device-status" aria-hidden="true"><span>Weathrobe</span><span className="device-island" /><BrandMark compact /></div>}
        <main id="main-content" className="app-main">
          <div className="day-heading"><div><span className="eyebrow">{t('Havanı bil. Gününü yaşa.')}</span><h1>{t(activeStop.plan ? 'Planın, sana göre' : 'Bugün, sana göre')}<span>.</span></h1></div><span className="day-date" title={validTimeZone(activeStop.weather?.timezone)}>{dateLabel}</span></div>
          <LocationSearch onSelect={location => handleUpdateStopLocation(activeStop.id, location)} onLocate={handleDetectLocation} isLocating={isLocating} />
          <section className="weather-overview" aria-label={t('Seçili durağın hava durumu')} aria-busy={pendingWeather > 0}>
            <div className="weather-location"><div className="location-heading"><MapPin size={15}/><span>{activeStop.location.district}, {activeStop.location.city}</span></div><div className={`temperature ${displayWeather?.selection ? 'temperature-plan' : ''}`}><span>{hasWeather && resolved ? displayWeather?.selection ? `${displayWeather.selection.minTemp}–${displayWeather.selection.maxTemp}` : Math.round(resolved.temp) : '—'}</span><span className="degree">°</span><div><span className="condition-name">{hasWeather ? t(palette.label) : resolved ? t('Şu an kullanılamıyor') : t('Hava yükleniyor')}</span><span className="feels-like">{hasWeather && resolved ? t(`Hissedilen ${displayWeather?.selection ? `${displayWeather.selection.minFeelsLike}–${displayWeather.selection.maxFeelsLike}` : Math.round(resolved.feelsLike)}°`) : resolved ? t('Şu an kullanılamıyor') : t('Kaynaklara bağlanılıyor…')}{activeStop.plan ? ` · ${activeStop.plan.startTime}${activeStop.plan.endTime ? `–${activeStop.plan.endTime}` : ''}` : activeStop.preferredTime && ` · ${activeStop.preferredTime}`}</span></div></div></div>
            <div className="weather-art" aria-hidden="true"><span className="weather-orbit orbit-one"/><span className="weather-orbit orbit-two"/><span className="weather-disc"/><WeatherIcon condition={condition} isDay={resolved?.isDay} size={98}/></div>
            <div className="weather-metrics"><div><Droplets size={17}/><span>{t('Yağış')}</span><strong>{hasWeather && resolved ? `${resolved.precipitationProb}%` : '—'}</strong></div><div><Wind size={17}/><span>{t('Rüzgâr')}</span><strong>{hasWeather ? resolved?.windSpeed : '—'}<small> km/h</small></strong></div><div><Sun size={17}/><span>{t('UV indeksi')}</span><strong>{displayWeather?.uvIndexKnown === false ? '—' : displayWeather?.uvIndex ?? '—'}</strong></div></div>
          </section>
          {locationError && <p className="inline-notice" role="alert">{t(locationError)}</p>}
          {hasWeather && !availableSources && <p className="inline-notice" role="status">{t('Canlı kaynaklara ulaşılamadı. Yedek veriler gösteriliyor; önerileri güncel tahmin olarak değerlendirme.')}<button type="button" className="text-button" onClick={refreshAllStopsWeather} disabled={pendingWeather > 0}><RefreshCw size={14}/>{t('Yenile')}</button></p>}
          {!allStopsReady && stops.length > 1 && <p className="inline-notice" role="status">{t(stops.some(stop=>stop.plan) ? 'Plan verileri tamamlanmadan kombin hesaplanmaz.' : 'Yeni durakların havası alınıyor. Kombin, verisi hazır duraklara göre gösteriliyor.')}</p>}
          <StopPlanControls stop={activeStop} now={clock} onChange={plan => handleUpdateStopPlan(activeStop.id, plan)}/>
          <div className="workspace-mode" role="group" aria-label={t('Çalışma alanı odağı')}><button type="button" aria-pressed={workspaceMode === 'route'} onClick={() => { setWorkspaceMode('route'); setMobileTab('map'); }}><MapPin size={16}/>{t('Rota planla')}</button><button type="button" aria-pressed={workspaceMode === 'outfit'} onClick={() => { setWorkspaceMode('outfit'); setMobileTab('outfit'); }}><Shirt size={16}/>{t('Kombini incele')}</button><span>{t('Önce günün rotası, sonra sana uygun kombin.')}</span></div>
          <div className={`workspace-grid ${workspaceMode === 'route' ? 'route-focus' : 'outfit-focus'}`}>
            <section id="route-panel" className={`route-region mobile-pane ${mobileTab === 'map' ? 'mobile-pane-active' : ''}`} aria-label={t('Günlük rota planlayıcısı')}>
              <div className="route-heading"><div><span className="eyebrow">{t('01 / Günün rotası')}</span><h2>{t('Gittiğin her yerde.')}</h2></div><span className="stop-count">{t(`${stops.length} durak`)}</span></div>
              <div className="map-panel"><RealCityMap stops={stops} activeStopId={activeStop.id} accentHex={palette.accent} onSelectActiveStop={setActiveStopId} onAddStop={handleAddStop} onUpdateStopLocation={handleUpdateStopLocation} onRemoveStop={handleRemoveStop} theme={theme}/></div>
              <div className="route-stop-list" aria-label={t('Durakların')}>{stops.map((stop,index) => {
                const weather = stop.weather ? resolveStopWeatherAtTime(stop.weather,stop.preferredTime,clock,stop.plan) : null;
                return <div key={stop.id} className={`route-stop ${stop.id === activeStop.id ? 'route-stop-active' : ''}`}><button type="button" className="route-stop-select" onClick={() => setActiveStopId(stop.id)} aria-pressed={stop.id === activeStop.id}><span className="stop-number">{String(index+1).padStart(2,'0')}</span><span><strong>{stop.location.district}</strong><small>{stop.location.city} · {stop.plan ? `${stop.plan.date} · ${stop.plan.startTime}${stop.plan.endTime ? `–${stop.plan.endTime}` : ''}` : stop.preferredTime || t('Şimdi')}</small></span><span className="stop-weather">{weather?.forecastAvailable ? <><WeatherIcon condition={weather.condition} isDay={weather.isDay} size={19}/>{Math.round(weather.temp)}°</> : weather ? '—' : <LoaderCircle size={16} className="loading-spin"/>}</span></button>{stops.length > 1 && <button type="button" className="remove-stop" onClick={() => handleRemoveStop(stop.id)} aria-label={t(`${stop.location.district} durağını sil`)}><X size={14}/></button>}</div>;
              })}</div>
              <button type="button" className="add-stop-button" onClick={focusMapSearch}><Plus size={16}/>{t('Durak ekle')}<span>{t('Şehir, ülke veya haritadan')}<ArrowUpRight size={14}/></span></button>
              <button type="button" className="primary-button show-outfit-button" onClick={() => { setWorkspaceMode('outfit'); setMobileTab('outfit'); }}>{t('Kombinimi göster')}<ArrowUpRight size={15}/></button>
              <div className="map-attribution"><Navigation size={12}/>CARTO · © OpenStreetMap contributors</div>
            </section>
            <div className={`outfit-region mobile-pane ${mobileTab === 'outfit' ? 'mobile-pane-active' : ''}`}>{compositeWeather ? <OutfitRecommendation weather={compositeWeather} districtName={activeStop.location.district} countryName={activeStop.location.country} stopCount={stops.filter(stop=>stop.weather).length} thermalProfile={thermalProfile} wardrobe={wardrobe} onOpenFeedback={compositeWeather.selection ? undefined : ()=>setIsFeedbackModalOpen(true)} onItemsChange={setFeedbackItems} onOpenWardrobe={()=>setIsWardrobeModalOpen(true)}/> : <section className="outfit-panel outfit-loading" aria-live="polite"><span className="eyebrow">{t('02 / Ne giymeli?')}</span><h2>{stops.some(stop=>stop.plan) && !compositeWeather ? t('Plan verileri tamamlanmadan kombin hesaplanmaz.') : activeStop.weather && !hasWeather ? t('Şu an kullanılamıyor') : t('Günün kombini hazırlanıyor.')}</h2><div className="loading-garments" aria-hidden="true">{[0,1,2].map(index=><div key={index}><Shirt size={64} strokeWidth={1}/></div>)}</div><p><LoaderCircle size={16} className="loading-spin"/>{activeStop.weather && !hasWeather ? t('Saatlik veri henüz hazır değil.') : t('Hava verileri bekleniyor')}</p></section>}</div>
          </div>
          <section className={`hourly-region mobile-pane ${mobileTab === 'hourly' ? 'mobile-pane-active' : ''}`} aria-label={t('Saatlik hava ve kaynaklar')}>
            <button type="button" className="hourly-toggle" onClick={()=>setShowHourly(current=>!current)} aria-expanded={showHourly} aria-controls="hourly-content"><span><Clock3 size={18}/><strong>{t('Saat saat, günün havası')}</strong><span className="hourly-teaser">{displayWeather?.hourly.filter(hour=>hour.validAt && (Boolean(activeStop.plan) || Date.parse(hour.validAt)+3600000>clock)).slice(0,4).map(hour=>`${hour.timeStr}  ${hour.temp}°`).join('   /   ') || t('Tahminler bekleniyor')}</span></span><span className="hourly-toggle-label">{t(showHourly?'Gizle':'İncele')}<ChevronDown size={17} className={showHourly?'rotated':''}/></span></button>
            <div id="hourly-content" className={`hourly-content ${showHourly || mobileTab === 'hourly'?'hourly-content-open':''}`}>{displayWeather ? <HourlyForecastChart consensus={displayWeather} districtName={activeStop.location.district} now={clock}/> : <p className="hourly-empty">{t('Saatlik tahminler hava verileriyle birlikte burada görünecek.')}</p>}</div>
          </section>
          <footer className="app-footer"><button type="button" className="text-button product-feedback-entry" onClick={() => setIsProductFeedbackOpen(true)}>{t('Hata bildir / Öneri paylaş')}</button><span className="footer-brand"><BrandMark compact/>{t('Biraz hava, biraz iyi his.')}</span><button type="button" className="source-status" onClick={()=>setIsSourceModalOpen(true)}><ShieldCheck size={14}/>{availableSources>0?activeStop.plan ? `${availableSources} ${t('tahmin kaynağı')}` : t(`${availableSources} canlı kaynak`):t(hasWeather?'Yedek veri':'Kaynaklar')}<span className="footer-updated">{activeStop.weather?` · ${activeStop.weather.lastUpdated}`:''}</span><ArrowUpRight size={12}/></button></footer>
        </main>
        <nav className="mobile-navigation" aria-label={t('Uygulama bölümleri')}>{([{id:'map',label:'Rotam',Icon:MapPin},{id:'outfit',label:'Kombinim',Icon:Shirt},{id:'hourly',label:'Saatlik',Icon:Clock3}] as const).map(({id,label,Icon})=><button type="button" key={id} aria-pressed={mobileTab===id} onClick={()=>{setMobileTab(id); if(id!=='hourly')setWorkspaceMode(id==='map'?'route':'outfit');}}><Icon size={20}/><span>{t(label)}</span></button>)}<button type="button" onClick={()=>setIsWardrobeModalOpen(true)}><Plus size={20}/><span>{t('Dolabım')}</span></button></nav>
      </div>
      {isProductFeedbackOpen && <ProductFeedbackModal onClose={() => setIsProductFeedbackOpen(false)}/>}
      <WardrobeModal isOpen={isWardrobeModalOpen} onClose={()=>setIsWardrobeModalOpen(false)} wardrobe={wardrobe} onWardrobeChange={setWardrobe} currentCountry={activeStop.location.country}/>
      <FeedbackModal items={feedbackItems} weather={!activeStop.plan && activeStop.weather && resolved && hasWeather ? {...activeStop.weather,...resolved}:null} isOpen={isFeedbackModalOpen} onClose={()=>setIsFeedbackModalOpen(false)} currentLocationName={`${activeStop.location.district}, ${activeStop.location.city}`} onFeedbackChanged={()=>setThermalProfile(getPersonalThermalProfile())}/>
      <SourceSettingsModal weather={activeStop.plan ? undefined : activeStop.weather} isOpen={isSourceModalOpen} onClose={()=>setIsSourceModalOpen(false)} onKeysSaved={refreshAllStopsWeather} onDataWiped={()=>{setWardrobe(DEFAULT_WARDROBE_ITEMS);setThermalProfile({offsetC:0,feedbackCount:0,label:'0°C'});}}/>
    </div>;
}
