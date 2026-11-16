import type { ForecastPoint, ForecastSource } from './types';
import { daylightAt, knownTimeZone, localTimeLabel, solarDaysFromProvider } from './weather-time';
import { mapWmoToCondition } from './weather-condition';

interface ForecastResponse {
  timezone?: string;
  hourly?: Record<string, unknown[]>;
  daily?: { time?: number[]; sunrise?: (number | null)[]; sunset?: (number | null)[] };
}
const numberAt = (data: ForecastResponse, name: string, i: number): number | null => {
  const n = data.hourly?.[name]?.[i];
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Missing provider values are not zero, a made-up probability, or current observations. */
export function parseForecastSource(sourceName: string, value: unknown, lat: number, lon: number): ForecastSource {
  const data = value as ForecastResponse | null;
  const unavailable: ForecastSource = { sourceName, status: 'unavailable', points: [] };
  if (!data || !knownTimeZone(data.timezone) || !Array.isArray(data.hourly?.time)) return unavailable;
  const context = { lat, lon, timezone: data.timezone, solarDays: solarDaysFromProvider(data) };
  const points: ForecastPoint[] = [];
  data.hourly.time.forEach((_, i) => {
    const stamp = numberAt(data, 'time', i), temp = numberAt(data, 'temperature_2m', i), feelsLike = numberAt(data, 'apparent_temperature', i);
    const humidity = numberAt(data, 'relative_humidity_2m', i), dewPoint = numberAt(data, 'dew_point_2m', i);
    const windSpeed = numberAt(data, 'wind_speed_10m', i), precipitationProb = numberAt(data, 'precipitation_probability', i), code = numberAt(data, 'weather_code', i);
    if (stamp === null || temp === null || feelsLike === null || humidity === null || dewPoint === null || windSpeed === null || precipitationProb === null || code === null) return;
    if (![0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(code)) return;
    if (!Number.isFinite(new Date(stamp * 1000).getTime()) || humidity < 0 || humidity > 100 || windSpeed < 0 || precipitationProb < 0 || precipitationProb > 100) return;
    const validAt = new Date(stamp * 1000).toISOString(), flag = numberAt(data, 'is_day', i);
    const isDay = daylightAt(context, stamp * 1000, { validAt, isDay: flag === 1 ? true : flag === 0 ? false : null });
    const timeStr = localTimeLabel(stamp * 1000, context.timezone), uv = numberAt(data, 'uv_index', i);
    points.push({ validAt, timezone: context.timezone, timeStr, hourNumber: Number(timeStr.slice(0, 2)), temp, feelsLike, humidity, dewPoint,
      windSpeed, precipitationProb, condition: mapWmoToCondition(code, isDay), isDay,
      ...(uv !== null && uv >= 0 ? { uvIndex: uv } : {}), suggestedAction: '' });
  });
  points.sort((a, b) => Date.parse(a.validAt!) - Date.parse(b.validAt!));
  return { sourceName, ...context, status: points.length ? 'available' : 'unavailable', points };
}
