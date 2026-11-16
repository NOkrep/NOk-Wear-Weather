import { computeThermalProfile, readFeedback } from './comfort';
import {
  LocationInfo,
  WeatherConsensus,
  ThermalProfile,
  CustomApiKeys,
  ItineraryStop,
  StopWeatherPlan,
} from './types';
import { deduplicatedFetchJson } from './security';
import { conditionForDaylight, normalizeWeather } from './weather-condition';
import { daylightAt, forecastPointAt, localDateKey, localTimeLabel, resolveWeatherInstant } from './weather-time';
import { resolvePlannedWeather } from './weather-plan';

export function getStoredCustomKeys(): CustomApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('wear_weather_custom_keys');
    if (!raw) return {};
    return JSON.parse(raw) as CustomApiKeys;
  } catch {
    return {};
  }
}

export function getPersonalThermalProfile(): ThermalProfile {
  return computeThermalProfile(readFeedback());
}

export async function fetchWeatherConsensus(location: LocationInfo, date?: string): Promise<WeatherConsensus> {
  // Privacy obfuscation: round coordinates to ~1.1km grid before querying
  const safeCoords = {
    lat: Number(Math.max(-90, Math.min(90, location.lat)).toFixed(2)),
    lon: Number(Math.max(-180, Math.min(180, location.lon)).toFixed(2)),
  };
  const cacheKey = `weather:${safeCoords.lat}:${safeCoords.lon}:${date || 'live'}`;

  return deduplicatedFetchJson(cacheKey, async () => {
    try {
      const customKeys = date ? {} : getStoredCustomKeys();
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (customKeys.weatherApiKey?.trim()) {
        headers['x-weatherapi-key'] = customKeys.weatherApiKey.trim();
      }
      if (customKeys.openWeatherMapKey?.trim()) {
        headers['x-owm-key'] = customKeys.openWeatherMapKey.trim();
      }

      const res = await fetch(`/api/weather?lat=${safeCoords.lat}&lon=${safeCoords.lon}${date ? `&date=${encodeURIComponent(date)}` : ''}`, {
        headers, cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      return normalizeWeather({ ...await res.json(), ...safeCoords });
    } catch (err) {
      console.error('Error fetching weather consensus, using offline fallback:', err);
      return {
        temp: 18.0,
        feelsLike: 17.2,
        humidity: 60,
        dewPoint: 10.1,
        windSpeed: 12,
        precipitationProb: 20,
        uvIndex: 0,
        condition: 'partly_cloudy',
        confidenceScore: 0,
        sources: [
          {
            sourceName: 'Open-Meteo (Çevrimdışı Önbellek)',
            temp: 18.0,
            feelsLike: 17.2,
            humidity: 60,
            dewPoint: 10.1,
            windSpeed: 12,
            precipitationProb: 20,
            condition: 'partly_cloudy',
            isAvailable: false,
          },
        ],
        ...safeCoords, timezone: 'UTC', timezoneKnown: false, fetchedAt: new Date().toISOString(),
        ...(date ? { requestedDate: date, forecastSources: [] } : {}),
        forecastAvailable: false, hourly: [],
        lastUpdated: localTimeLabel(Date.now(), 'UTC'),
      };
    }
  });
}

/** Resolve a location's local clock against dated forecast points. No nearest-hour borrowing. */
export function resolveStopWeatherAtTime(
  weather: WeatherConsensus,
  preferredTime?: string,
  now = Date.now(),
  plan?: StopWeatherPlan
) {
  if (plan) {
    const result = resolvePlannedWeather(weather, plan, now);
    const reading = result.weather || weather;
    return { temp: reading.temp, feelsLike: reading.feelsLike, precipitationProb: reading.precipitationProb,
      windSpeed: reading.windSpeed, condition: reading.condition, isDay: result.weather?.isDay,
      validAt: result.weather?.selection?.startAt, forecastAvailable: Boolean(result.weather),
      planStatus: result.status, consensus: result.weather };
  }
  const at = resolveWeatherInstant(preferredTime, weather.timezone, now);
  const live = !preferredTime;
  const point = at === null ? undefined : forecastPointAt(weather.hourly || [], at);
  const fresh = weather.fetchedAt && now - Date.parse(weather.fetchedAt) >= 0
    && now - Date.parse(weather.fetchedAt) < 15 * 60000;
  const usePoint = !live || !fresh;
  const reading = usePoint && point ? point : weather;
  const isDay = at === null ? null : daylightAt(weather, at, point && usePoint ? point : {
    validAt: weather.observedAt, isDay: weather.isDay,
  });
  const available = at !== null && (live
    ? weather.forecastAvailable !== false && (Boolean(fresh) || Boolean(point))
    : Boolean(point));
  return {
    temp: reading.temp,
    feelsLike: reading.feelsLike,
    precipitationProb: reading.precipitationProb,
    windSpeed: reading.windSpeed,
    condition: conditionForDaylight(reading.condition, isDay),
    isDay, validAt: at === null ? undefined : new Date(at).toISOString(),
    forecastAvailable: available,
    planStatus: undefined, consensus: undefined,
  };
}

/**
 * Synthesizes a composite WeatherConsensus across all stops in the user's daily itinerary
 * so the clothing engine accounts for temperature drops, rain, and wind at any stop during the day.
 */
function hourlyForResolvedDay(weather: WeatherConsensus, validAt?: string) {
  if (!validAt) return [];
  const date = localDateKey(Date.parse(validAt), weather.timezone);
  return weather.hourly.filter(p => p.validAt && localDateKey(Date.parse(p.validAt), weather.timezone) === date);
}

export function computeCompositeItineraryWeather(
  stops: ItineraryStop[],
  fallbackConsensus: WeatherConsensus | null,
  now = Date.now()
): WeatherConsensus | null {
  // A multi-stop planned outfit must not silently omit an uncovered stop.
  if (stops.some(s => s.plan && resolvePlannedWeather(s.weather, s.plan, now).status !== 'available')) return null;
  if (stops.some(s => s.plan) && stops.some(s => !s.weather || !resolveStopWeatherAtTime(s.weather, s.preferredTime, now, s.plan).forecastAvailable)) return null;
  const readyStops = stops.filter((s) => s.weather && resolveStopWeatherAtTime(s.weather, s.preferredTime, now, s.plan).forecastAvailable);
  if (readyStops.length === 0) return stops.some(s => s.weather) ? null : fallbackConsensus;
  if (readyStops.length === 1) {
    const s = readyStops[0];
    const w = s.weather!;
    if (s.plan) return resolvePlannedWeather(w, s.plan, now).weather;
    const resolved = resolveStopWeatherAtTime(w, s.preferredTime, now);
    return {
      ...w,
      ...resolved,
      hourly: hourlyForResolvedDay(w, resolved.validAt),
      temp: resolved.temp,
      feelsLike: resolved.feelsLike,
      precipitationProb: resolved.precipitationProb,
      windSpeed: resolved.windSpeed,
      condition: resolved.condition,
    };
  }

  const resolvedList = readyStops.map((s) => resolveStopWeatherAtTime(s.weather!, s.preferredTime, now, s.plan));
  const avgTemp =
    Math.round((resolvedList.reduce((acc, r) => acc + r.temp, 0) / resolvedList.length) * 10) / 10;
  // Weight feelsLike slightly toward the cooler stop so the user doesn't freeze during evening/mountain stops
  const minFeels = Math.min(...resolvedList.map((r) => r.feelsLike));
  const meanFeels = resolvedList.reduce((acc, r) => acc + r.feelsLike, 0) / resolvedList.length;
  const compositeFeels = Math.round((meanFeels * 0.65 + minFeels * 0.35) * 10) / 10;
  const maxPrecip = Math.max(...resolvedList.map((r) => r.precipitationProb));
  const maxWind = Math.max(...resolvedList.map((r) => r.windSpeed));

  const primaryW = readyStops[0].weather!;
  const planned = readyStops.flatMap(s => s.plan ? [resolvePlannedWeather(s.weather, s.plan, now).weather!] : []);
  if (planned.length) {
    const samples = readyStops.flatMap(s => (s.plan ? resolvePlannedWeather(s.weather, s.plan, now).weather!.hourly :
      [forecastPointAt(s.weather!.hourly, Date.parse(resolveStopWeatherAtTime(s.weather!, s.preferredTime, now).validAt || ''))].filter(p => p !== undefined))
      .map(p => ({ ...p, stopId: s.id, stopLabel: s.location?.district || s.location?.city || s.id, timezone: s.weather!.timezone })));
    const base = planned[0];
    const selectedWeather = readyStops.map((stop, index) => resolvedList[index].consensus || stop.weather!);
    const severity = { sunny: 0, clear_night: 0, partly_cloudy: 1, cloudy: 2, foggy: 3, rainy: 4, snowy: 5, stormy: 6 };
    const strongest = resolvedList.reduce((condition, result) => severity[result.condition] > severity[condition] ? result.condition : condition, resolvedList[0].condition);
    return { ...base, hourly: samples, temp: Math.min(...resolvedList.map(r => r.temp)),
      feelsLike: Math.min(...resolvedList.map(r => r.feelsLike)), precipitationProb: maxPrecip, windSpeed: maxWind,
      condition: strongest,
      uvIndex: Math.max(...selectedWeather.map(weather => weather.uvIndex)),
      uvIndexKnown: selectedWeather.every(weather => weather.uvIndexKnown !== false),
      selection: { ...base.selection!, minTemp: Math.min(...resolvedList.map(r => r.temp)),
        maxTemp: Math.max(...planned.map(w => w.selection!.maxTemp), ...resolvedList.map(r => r.temp)),
        minFeelsLike: Math.min(...resolvedList.map(r => r.feelsLike)),
        maxFeelsLike: Math.max(...planned.map(w => w.selection!.maxFeelsLike), ...resolvedList.map(r => r.feelsLike)),
        maxWind, maxPrecipitation: maxPrecip } };
  }
  return {
    ...primaryW,
    ...resolvedList[0],
    hourly: hourlyForResolvedDay(primaryW, resolvedList[0].validAt),
    temp: avgTemp,
    feelsLike: compositeFeels,
    precipitationProb: maxPrecip,
    windSpeed: maxWind,
    condition: maxPrecip >= 50 ? 'rainy' : resolvedList[0].condition,
  };
}
