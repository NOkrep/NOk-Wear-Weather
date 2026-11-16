import type { WeatherCondition, WeatherConsensus } from './types';
import { daylightAt, localTimeLabel, validTimeZone } from './weather-time';

export function conditionForDaylight(condition: WeatherCondition, isDay: boolean | null | undefined): WeatherCondition {
  if (condition !== 'sunny' && condition !== 'clear_night') return condition;
  // Unknown phase must not invent sunshine or a moon.
  return isDay === true ? 'sunny' : isDay === false ? 'clear_night' : 'partly_cloudy';
}

export function mapWmoToCondition(code: number, isDay?: boolean | null): WeatherCondition {
  if (code === 0) return conditionForDaylight('sunny', isDay);
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'foggy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'partly_cloudy';
}

/** Re-evaluate phase on every read, including cache hits and long-lived open pages.
 * Legacy undated hourly samples are discarded rather than assigned to an invented day.
 */
export function normalizeWeather(weather: WeatherConsensus, at = weather.selection ? Date.parse(weather.selection.startAt) : Date.now()): WeatherConsensus {
  const timezone = validTimeZone(weather.timezone);
  const isDay = daylightAt(weather, at, { validAt: weather.observedAt, isDay: weather.isDay });
  return {
    ...weather, timezone, isDay, condition: conditionForDaylight(weather.condition, isDay),
    sources: weather.sources.map(source => ({ ...source, isDay, condition: conditionForDaylight(source.condition, isDay) })),
    hourly: (weather.hourly || []).filter(p => p.validAt && Number.isFinite(Date.parse(p.validAt))).map(p => {
      const instant = Date.parse(p.validAt!);
      const day = daylightAt(weather, instant, p);
      const timeStr = localTimeLabel(instant, timezone);
      return { ...p, timeStr, hourNumber: Number(timeStr.slice(0, 2)), isDay: day, condition: conditionForDaylight(p.condition, day) };
    }),
  };
}
