'use client';
import type { ItineraryStop, StopWeatherPlan } from '@/lib/types';
import { useLocale } from '@/lib/i18n';
import { addLocalDays, knownTimeZone, localDateKey, localTimeLabel, validTimeZone } from '@/lib/weather-time';
import { PLAN_MESSAGES, resolvePlannedWeather } from '@/lib/weather-plan';

export function StopPlanControls({ stop, now, onChange }: {
  stop: ItineraryStop; now: number; onChange: (plan?: StopWeatherPlan) => void;
}) {
  const { t, locale } = useLocale();
  const zone = stop.weather?.timezone;
  const known = knownTimeZone(zone) && stop.weather?.timezoneKnown !== false;
  const today = known ? localDateKey(now, zone) : '', tomorrow = today ? addLocalDays(today, 1) : '';
  const plan = stop.plan;
  const result = plan ? resolvePlannedWeather(stop.weather, plan, now) : null;
  function chooseDate(date: string) {
    const startTime = plan?.startTime || stop.preferredTime || localTimeLabel(now, zone);
    const [h, m] = startTime.split(':').map(Number);
    const endTime = plan?.endTime ?? `${String((h + 2) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange({ date, startTime, endTime });
  }
  const format = (at: number) => new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'tr-TR', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: validTimeZone(zone),
  }).format(at);
  const horizon = result?.coverage.filter(c => c.start !== null && c.end !== null) || [];
  return <section className="stop-plan-controls" aria-labelledby="stop-plan-title">
    <div className="stop-plan-heading"><h2 id="stop-plan-title">{stop.location.district} · {t('Durak planı')}</h2><span>{t('Saat dilimi')}: {known ? zone : t('Bekleniyor')}</span></div>
    <div className="stop-plan-presets" role="group" aria-label={t('Plan tarihi')}>
      <button type="button" aria-pressed={!plan} onClick={() => onChange(undefined)}>{t('Şimdi')}</button>
      <button type="button" disabled={!known} aria-pressed={Boolean(plan && plan.date === today)} onClick={() => chooseDate(today)}>{t('Bugün')}</button>
      <button type="button" disabled={!known} aria-pressed={Boolean(plan && plan.date === tomorrow)} onClick={() => chooseDate(tomorrow)}>{t('Yarın')}</button>
      <label>{t('Takvim')}<input type="date" aria-label={t('Plan tarihi')} value={plan?.date || ''} min={today || undefined} disabled={!known} onChange={event => chooseDate(event.target.value)}/></label>
    </div>
    {plan && <div className="stop-plan-times"><label>{t('Başlangıç saati')}<input type="time" value={plan.startTime} onChange={event => onChange({ ...plan, startTime: event.target.value })}/></label>
      <label>{t('Bitiş saati (isteğe bağlı)')}<input type="time" value={plan.endTime || ''} onChange={event => onChange({ ...plan, endTime: event.target.value })}/></label>
      <p>{t(plan.endTime && plan.endTime < plan.startTime ? 'Bitiş ertesi yerel güne taşar.' : 'Bitiş boşsa yalnız başlangıç anı seçilir.')}</p>
    </div>}
    {plan && <p className={`stop-plan-status ${result?.weather ? '' : 'stop-plan-warning'}`} role="status">{t(PLAN_MESSAGES[result?.status || 'loading'])}</p>}
    {result?.weather?.selection && <p className="stop-plan-summary">{t('Plan tahmini')} · {result.weather.selection.minTemp}–{result.weather.selection.maxTemp}° · {t('Hissedilen')} {result.weather.selection.minFeelsLike}–{result.weather.selection.maxFeelsLike}° · {t('En yüksek yağış')} %{result.weather.selection.maxPrecipitation} · {t('En yüksek rüzgâr')} {result.weather.selection.maxWind} km/h</p>}
    {plan && <details className="stop-plan-coverage"><summary>{t('Kaynakların tahmin kapsamı')}{horizon.length > 0 && ` · ${format(Math.max(...horizon.map(c => c.end!)) - 1)}`}</summary>
      <p>{t('Ufuk, gerçekten alınan saatlik verilere aittir. Aradaki boşluklar ayrıca denetlenir; gün sayısı garanti edilmez.')}</p>
      <ul>{result?.coverage.map(c => <li key={c.sourceName}><strong>{t(c.sourceName)}</strong><span>{c.start !== null && c.end !== null ? `${format(c.start)} — ${format(c.end - 1)}` : t(c.status === 'current-only' ? 'Bu uygulamada yalnız Şimdi akışında kullanılır.' : 'Saatlik tahmin alınamadı.')}</span>
        {c.start !== null && <small>{t(result.weather?.sources.find(s => s.sourceName === c.sourceName)?.isAvailable ? 'Bu aralığın tamamını karşılıyor.' : 'Seçilen aralığın tamamı bu kaynakla doğrulanmadı.')}</small>}</li>)}</ul>
    </details>}
    {!known && <p className="stop-plan-status">{t('Tarih seçimi için konumun saat dilimi bekleniyor.')}</p>}
    {plan && <p className="stop-plan-footnote">{t('Saat geri alındığında tekrarlanan saatin ilk oluşumu kullanılır. Saat ileri alınıp atlanan bir saat seçilirse hesaplama yapılmaz.')}</p>}
  </section>;
}
