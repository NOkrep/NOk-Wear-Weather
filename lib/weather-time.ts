import type { HourlyForecastPoint, WeatherTimeContext } from './types';

export function validTimeZone(zone?: string): string {
  try { if (zone) return new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone; } catch { /* UTC when a provider cannot resolve the zone. */ }
  return 'UTC';
}

function localParts(at: number, zone?: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: validTimeZone(zone), year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}
export const localDateKey = (at: number, zone?: string) => localParts(at, zone).date;
export const localTimeLabel = (at: number, zone?: string) => localParts(at, zone).time;

export function knownTimeZone(zone?: string): boolean {
  if (!zone) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(0); return true; } catch { return false; }
}
export function validLocalDate(date: string): boolean {
  if (!/^\d{4}-\d\d-\d\d$/.test(date)) return false;
  const at = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === date;
}
export function addLocalDays(date: string, days: number): string {
  if (!validLocalDate(date)) return '';
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

/** Round-trip an explicit local date through IANA offsets, including both DST sides. */
export function resolveLocalDateTime(date: string, clock: string, zone?: string): number | null {
  if (!validLocalDate(date) || !knownTimeZone(zone) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) return null;
  const wall = Date.parse(`${date}T${clock}:00Z`);
  const offsets = new Set<number>();
  for (const shift of [-36, -12, 0, 12, 36]) {
    const probe = wall + shift * 3600000, p = localParts(probe, zone);
    offsets.add(Date.parse(`${p.date}T${p.time}:00Z`) - probe);
  }
  const candidates = [...offsets].map(offset => wall - offset).filter(at => {
    const p = localParts(at, zone);
    return p.date === date && p.time === clock;
  });
  return candidates.length ? Math.min(...candidates) : null;
}

/** A clock-only selection means TODAY at the location, never the server's date.
 * Missing DST times return null; repeated times choose the first occurrence.
 * Explicit instants must include their offset; a future calendar can pass these without ambiguity.
 */
export function resolveWeatherInstant(selection: string | undefined, zone: string | undefined, now: number): number | null {
  if (!selection) return now;
  if (/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(selection)) {
    const parsed = Date.parse(selection);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selection)) return null;
  return resolveLocalDateTime(localDateKey(now, zone), selection, validTimeZone(zone));
}

/** NOAA fractional-year solar position estimate, used only when daily boundaries are absent.
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF (90.833 degree sunrise zenith).
 * This is an astronomical fallback, not an observed sunrise; it handles polar seasons.
 */
function estimatedDaylight(at: number, lat: number, lon: number): boolean {
  const d = new Date(at), year = d.getUTCFullYear();
  const day = (Date.UTC(year, d.getUTCMonth(), d.getUTCDate()) - Date.UTC(year, 0, 0)) / 86400000;
  const days = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  const gamma = 2 * Math.PI / days * (day - 1 + (hour - 12) / 24);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const rad = Math.PI / 180;
  const angle = (hour * 60 + eq + 4 * lon) / 4 - 180;
  const cosZenith = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(angle * rad);
  return cosZenith > Math.cos(90.833 * rad);
}

export function daylightAt(context: WeatherTimeContext, at: number, hint?: { validAt?: string; isDay?: boolean | null }): boolean | null {
  if (!Number.isFinite(at)) return null;
  const day = context.solarDays?.find(d => d.date === localDateKey(at, context.timezone));
  if (day?.sunrise && day.sunset) {
    const rise = Date.parse(day.sunrise), set = Date.parse(day.sunset);
    if (Number.isFinite(rise) && Number.isFinite(set) && rise < set) return at >= rise && at < set;
  }
  if (hint?.validAt && Date.parse(hint.validAt) === at && typeof hint.isDay === 'boolean') return hint.isDay;
  if (typeof context.lat === 'number' && typeof context.lon === 'number'
    && Number.isFinite(context.lat) && Number.isFinite(context.lon) && Math.abs(context.lat) <= 90 && Math.abs(context.lon) <= 180) {
    return estimatedDaylight(at, context.lat, context.lon);
  }
  return null;
}

export function forecastPointAt(points: HourlyForecastPoint[], at: number): HourlyForecastPoint | undefined {
  // A point represents its following hour. Never borrow another day's equal clock hour.
  return points.filter(p => p.validAt && Date.parse(p.validAt) <= at && at - Date.parse(p.validAt) < 3600000)
    .sort((a, b) => Date.parse(b.validAt!) - Date.parse(a.validAt!))[0];
}

export function solarDaysFromProvider(data: { daily?: { time?: number[]; sunrise?: (number | null)[]; sunset?: (number | null)[] }; timezone?: string }): WeatherTimeContext['solarDays'] {
  return (data.daily?.time || []).map((time, i) => ({
    date: localDateKey(time * 1000, data.timezone),
    sunrise: typeof data.daily?.sunrise?.[i] === 'number' ? new Date(data.daily.sunrise[i]! * 1000).toISOString() : null,
    sunset: typeof data.daily?.sunset?.[i] === 'number' ? new Date(data.daily.sunset[i]! * 1000).toISOString() : null,
  }));
}
