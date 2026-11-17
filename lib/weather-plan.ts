import type { ForecastPoint, ForecastSource, StopWeatherPlan, WeatherConsensus } from './types';
import { addLocalDays, daylightAt, forecastPointAt, knownTimeZone, localDateKey, localTimeLabel, resolveLocalDateTime, validLocalDate } from './weather-time';
import { conditionForDaylight } from './weather-condition';

export type PlanStatus = 'available' | 'loading' | 'no-data' | 'stale' | 'no-timezone' | 'invalid-date' | 'invalid-time' | 'invalid-range' | 'past-date' | 'outside-horizon' | 'incomplete';
export const PLAN_MESSAGES: Record<PlanStatus, string> = {
  available: 'Seçilen aralık için saatlik tahmin hazır.', loading: 'Seçilen tarihin tahmini alınıyor.',
  'no-data': 'Bu plan için kullanılabilir tahmin yok. Güncel hava yerine gösterilmez.',
  stale: 'Tahmin güncel değil. Yenileyerek tekrar dene.', 'no-timezone': 'Konumun saat dilimi doğrulanamadı; tarihli plan hesaplanmadı.',
  'invalid-date': 'Geçerli bir takvim tarihi seç.', 'invalid-time': 'Seçilen yerel saat bu tarihte geçerli değil. Saat dilimi veya yaz saati geçişini kontrol et.',
  'invalid-range': 'Bitiş saati başlangıçtan farklı olmalı.', 'past-date': 'Geçmiş gün için ileri tarihli tahmin kullanılamaz.',
  'outside-horizon': 'Seçilen aralık kaynakların kullanılabilir tahmin ufkunun dışında.',
  incomplete: 'Seçilen aralığın bazı saatlerinde veri eksik. Eksik saatler uydurulmadı; öneri hesaplanmadı.',
};

export function planWindow(plan: StopWeatherPlan, timezone?: string, now = Date.now()):
  { status: PlanStatus; start?: number; end?: number; point?: boolean } {
  if (!validLocalDate(plan.date)) return { status: 'invalid-date' };
  if (!knownTimeZone(timezone)) return { status: 'no-timezone' };
  if (plan.date < localDateKey(now, timezone)) return { status: 'past-date' };
  const start = resolveLocalDateTime(plan.date, plan.startTime, timezone);
  if (start === null) return { status: 'invalid-time' };
  if (!plan.endTime) return { status: 'available', start, end: start + 1, point: true };
  if (plan.endTime === plan.startTime) return { status: 'invalid-range' };
  const endDate = plan.endTime < plan.startTime ? addLocalDays(plan.date, 1) : plan.date;
  const end = resolveLocalDateTime(endDate, plan.endTime, timezone);
  if (end === null || end <= start) return { status: 'invalid-time' };
  return { status: 'available', start, end, point: false };
}

export function sourceCoverage(source: ForecastSource) {
  const times = source.points.map(p => Date.parse(p.validAt || '')).filter(Number.isFinite);
  return { sourceName: source.sourceName, status: source.status,
    start: times.length ? Math.min(...times) : null, end: times.length ? Math.max(...times) + 3600000 : null };
}

function coveredPoints(source: ForecastSource, start: number, end: number): ForecastPoint[] | null {
  if (source.status !== 'available') return null;
  const result: ForecastPoint[] = [];
  for (let cursor = start; cursor < end;) {
    const point = forecastPointAt(source.points, cursor) as ForecastPoint | undefined;
    if (!point) return null;
    result.push(point);
    cursor = Date.parse(point.validAt!) + 3600000;
  }
  return result;
}
const mean = (values: number[]) => Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10;
const severity = { sunny: 0, clear_night: 0, partly_cloudy: 1, cloudy: 2, foggy: 3, rainy: 4, snowy: 5, stormy: 6 };

export function resolvePlannedWeather(weather: WeatherConsensus | undefined, plan: StopWeatherPlan, now = Date.now()):
  { status: PlanStatus; weather: WeatherConsensus | null; coverage: ReturnType<typeof sourceCoverage>[] } {
  const coverage = (weather?.forecastSources || []).map(sourceCoverage);
  const result = (status: PlanStatus, resolved: WeatherConsensus | null = null) => ({ status, weather: resolved, coverage });
  if (!weather) return result('loading');
  if (weather.timezoneKnown === false) return result('no-timezone');
  const window = planWindow(plan, weather.timezone, now);
  if (window.status !== 'available') return result(window.status);
  if (weather.requestedDate !== plan.date) return result('loading');
  const fetchedAt = Date.parse(weather.fetchedAt || '');
  if (!Number.isFinite(fetchedAt) || now - fetchedAt < 0 || now - fetchedAt >= 15 * 60000) return result('stale');
  const start = window.start!, end = window.end!;
  const allSources = weather.forecastSources || [];
  const complete = allSources.flatMap(source => {
    const points = coveredPoints(source, start, end);
    return points?.length ? [{ source, points }] : [];
  });
  if (!complete.length) {
    const available = coverage.filter(c => c.start !== null && c.end !== null);
    if (!available.length) return result('no-data');
    const within = available.some(c => start >= c.start! && end <= c.end!);
    return result(within ? 'incomplete' : 'outside-horizon');
  }
  // Only models covering the whole requested interval take part in this consensus.
  const grouped = new Map<string, ForecastPoint[]>();
  complete.forEach(({ points }) => points.forEach(p => grouped.set(p.validAt!, [...(grouped.get(p.validAt!) || []), p])));
  const context = complete[0].source;
  const hourly: ForecastPoint[] = [...grouped].sort(([a], [b]) => Date.parse(a) - Date.parse(b)).map(([validAt, readings]) => {
    const at = Date.parse(validAt), timeStr = localTimeLabel(at, weather.timezone), isDay = daylightAt(context, at, readings[0]);
    const condition = readings.reduce((a, b) => severity[b.condition] > severity[a] ? b.condition : a, readings[0].condition);
    const uv = readings.flatMap(p => p.uvIndex === undefined ? [] : [p.uvIndex]);
    const dni = readings.flatMap(p => p.directNormalIrradiance === undefined ? [] : [p.directNormalIrradiance]);
    return { validAt, timezone: weather.timezone, timeStr, hourNumber: Number(timeStr.slice(0, 2)), isDay,
      coveredStartAt: new Date(Math.max(start, at)).toISOString(), coveredEndAt: new Date(Math.min(end, at + 3600000)).toISOString(),
      temp: mean(readings.map(p => p.temp)), feelsLike: mean(readings.map(p => p.feelsLike)),
      humidity: mean(readings.map(p => p.humidity)), dewPoint: Math.max(...readings.map(p => p.dewPoint)),
      precipitationProb: Math.max(...readings.map(p => p.precipitationProb)), windSpeed: Math.max(...readings.map(p => p.windSpeed)),
      condition: conditionForDaylight(condition, isDay), suggestedAction: '', ...(uv.length ? { uvIndex: Math.max(...uv) } : {}),
      ...(dni.length ? { directNormalIrradiance: Math.max(...dni) } : {}) };
  });
  const selection = { date: plan.date, startAt: new Date(start).toISOString(), endAt: new Date(window.point ? start : end).toISOString(), point: window.point!,
    minTemp: Math.min(...hourly.map(p => p.temp)), maxTemp: Math.max(...hourly.map(p => p.temp)),
    minFeelsLike: Math.min(...hourly.map(p => p.feelsLike)), maxFeelsLike: Math.max(...hourly.map(p => p.feelsLike)),
    maxWind: Math.max(...hourly.map(p => p.windSpeed)), maxPrecipitation: Math.max(...hourly.map(p => p.precipitationProb)) };
  const isDay = daylightAt(context, start);
  const condition = hourly.reduce((a, b) => severity[b.condition] > severity[a] ? b.condition : a, hourly[0].condition);
  const sources = allSources.map(source => {
    const match = complete.find(entry => entry.source === source);
    const baseline = weather.sources.find(s => s.sourceName === source.sourceName) || weather;
    if (!match) return { sourceName: source.sourceName, isAvailable: false, temp: baseline.temp, feelsLike: baseline.feelsLike,
      humidity: baseline.humidity, windSpeed: baseline.windSpeed, precipitationProb: baseline.precipitationProb, condition: baseline.condition };
    const points = match.points;
    return { sourceName: source.sourceName, isAvailable: true, temp: Math.min(...points.map(p => p.temp)),
      feelsLike: Math.min(...points.map(p => p.feelsLike)), humidity: mean(points.map(p => p.humidity)), dewPoint: Math.max(...points.map(p => p.dewPoint)),
      windSpeed: Math.max(...points.map(p => p.windSpeed)), precipitationProb: Math.max(...points.map(p => p.precipitationProb)),
      condition: conditionForDaylight(points[0].condition, isDay), isDay };
  });
  return result('available', { ...weather, directNormalIrradiance: undefined, selection, hourly, sources, isDay, condition: conditionForDaylight(condition, isDay),
    forecastAvailable: true, temp: selection.minTemp, feelsLike: selection.minFeelsLike,
    precipitationProb: selection.maxPrecipitation, windSpeed: selection.maxWind,
    humidity: mean(hourly.map(p => p.humidity)), dewPoint: Math.max(...hourly.map(p => p.dewPoint)),
    uvIndex: Math.max(0, ...hourly.flatMap(p => p.uvIndex === undefined ? [] : [p.uvIndex])),
    // No calibrated confidence percentage is claimed for a selected forecast interval.
    uvIndexKnown: hourly.every(p => p.uvIndex !== undefined), confidenceScore: 0,
  });
}
