import { computeThermalProfile, readFeedback } from './comfort';
import {
  LocationInfo,
  WeatherConsensus,
  FeedbackRecord,
  ThermalProfile,
  CustomApiKeys,
  ItineraryStop,
} from './types';
import { obfuscateCoordinates, deduplicatedFetchJson } from './security';

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

export async function fetchWeatherConsensus(location: LocationInfo): Promise<WeatherConsensus> {
  // Privacy obfuscation: round coordinates to ~1.1km grid before querying
  const safeCoords = obfuscateCoordinates(location.lat, location.lon, 2);
  const cacheKey = `weather:${safeCoords.lat}:${safeCoords.lon}`;

  return deduplicatedFetchJson(cacheKey, async () => {
    try {
      const customKeys = getStoredCustomKeys();
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (customKeys.weatherApiKey?.trim()) {
        headers['x-weatherapi-key'] = customKeys.weatherApiKey.trim();
      }
      if (customKeys.openWeatherMapKey?.trim()) {
        headers['x-owm-key'] = customKeys.openWeatherMapKey.trim();
      }

      const res = await fetch(`/api/weather?lat=${safeCoords.lat}&lon=${safeCoords.lon}`, {
        headers,
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error('Error fetching weather consensus, using offline fallback:', err);
      return {
        temp: 18.0,
        feelsLike: 17.2,
        humidity: 60,
        dewPoint: 10.1,
        windSpeed: 12,
        precipitationProb: 20,
        uvIndex: 4,
        condition: 'partly_cloudy',
        confidenceScore: 88,
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
        hourly: [
          { timeStr: '08:00', hourNumber: 8, temp: 14, feelsLike: 13, precipitationProb: 10, windSpeed: 9, condition: 'partly_cloudy', suggestedAction: 'Ceket + Gömlek (3 Katman)' },
          { timeStr: '11:00', hourNumber: 11, temp: 18, feelsLike: 17, precipitationProb: 15, windSpeed: 11, condition: 'sunny', suggestedAction: 'Ceketi çıkar / Kollar açık' },
          { timeStr: '14:00', hourNumber: 14, temp: 22, feelsLike: 21, precipitationProb: 10, windSpeed: 14, condition: 'sunny', suggestedAction: 'Tişört / Rahat katman' },
          { timeStr: '17:00', hourNumber: 17, temp: 19, feelsLike: 18, precipitationProb: 20, windSpeed: 15, condition: 'partly_cloudy', suggestedAction: 'Gömleği ilikle' },
          { timeStr: '20:00', hourNumber: 20, temp: 15, feelsLike: 14, precipitationProb: 25, windSpeed: 12, condition: 'cloudy', suggestedAction: 'Ceketi tekrar giy' },
        ],
        lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
    }
  });
}

/**
 * Extracts the weather at a user's preferred time (e.g. "14:30" -> hour 14) from a stop's hourly forecast
 */
export function resolveStopWeatherAtTime(
  weather: WeatherConsensus,
  preferredTime?: string
): {
  temp: number;
  feelsLike: number;
  precipitationProb: number;
  windSpeed: number;
  condition: WeatherConsensus['condition'];
} {
  if (preferredTime && weather.hourly && weather.hourly.length > 0) {
    const hourNum = parseInt(preferredTime.split(':')[0], 10);
    if (!isNaN(hourNum)) {
      const match =
        weather.hourly.find((h) => h.hourNumber === hourNum) ||
        weather.hourly.reduce((prev, curr) =>
          Math.abs(curr.hourNumber - hourNum) < Math.abs(prev.hourNumber - hourNum) ? curr : prev
        );
      if (match) {
        return {
          temp: match.temp,
          feelsLike: match.feelsLike,
          precipitationProb: match.precipitationProb,
          windSpeed: match.windSpeed,
          condition: match.condition,
        };
      }
    }
  }
  return {
    temp: weather.temp,
    feelsLike: weather.feelsLike,
    precipitationProb: weather.precipitationProb,
    windSpeed: weather.windSpeed,
    condition: weather.condition,
  };
}

/**
 * Synthesizes a composite WeatherConsensus across all stops in the user's daily itinerary
 * so the clothing engine accounts for temperature drops, rain, and wind at any stop during the day.
 */
export function computeCompositeItineraryWeather(
  stops: ItineraryStop[],
  fallbackConsensus: WeatherConsensus | null
): WeatherConsensus | null {
  const readyStops = stops.filter((s) => s.weather);
  if (readyStops.length === 0) return fallbackConsensus;
  if (readyStops.length === 1) {
    const s = readyStops[0];
    const w = s.weather!;
    const resolved = resolveStopWeatherAtTime(w, s.preferredTime);
    return {
      ...w,
      temp: resolved.temp,
      feelsLike: resolved.feelsLike,
      precipitationProb: resolved.precipitationProb,
      windSpeed: resolved.windSpeed,
      condition: resolved.condition,
    };
  }

  const resolvedList = readyStops.map((s) => resolveStopWeatherAtTime(s.weather!, s.preferredTime));
  const avgTemp =
    Math.round((resolvedList.reduce((acc, r) => acc + r.temp, 0) / resolvedList.length) * 10) / 10;
  // Weight feelsLike slightly toward the cooler stop so the user doesn't freeze during evening/mountain stops
  const minFeels = Math.min(...resolvedList.map((r) => r.feelsLike));
  const meanFeels = resolvedList.reduce((acc, r) => acc + r.feelsLike, 0) / resolvedList.length;
  const compositeFeels = Math.round((meanFeels * 0.65 + minFeels * 0.35) * 10) / 10;
  const maxPrecip = Math.max(...resolvedList.map((r) => r.precipitationProb));
  const maxWind = Math.max(...resolvedList.map((r) => r.windSpeed));

  const primaryW = readyStops[0].weather!;
  return {
    ...primaryW,
    temp: avgTemp,
    feelsLike: compositeFeels,
    precipitationProb: maxPrecip,
    windSpeed: maxWind,
    condition: maxPrecip >= 50 ? 'rainy' : resolvedList[0].condition,
  };
}
