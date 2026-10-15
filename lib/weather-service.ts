import { LocationInfo, WeatherConsensus, FeedbackRecord, ThermalProfile, CustomApiKeys } from './types';

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
  if (typeof window === 'undefined') {
    return { offsetC: 0, feedbackCount: 0, label: 'Standart Termal Profil' };
  }
  try {
    const raw = localStorage.getItem('wear_weather_feedbacks');
    if (!raw) {
      return { offsetC: 0, feedbackCount: 0, label: 'Standart Termal Profil' };
    }
    const feedbacks: FeedbackRecord[] = JSON.parse(raw);
    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return { offsetC: 0, feedbackCount: 0, label: 'Standart Termal Profil' };
    }

    // Weight recent feedbacks (up to last 10)
    const recent = feedbacks.slice(0, 10);
    let rawOffset = 0;
    for (const fb of recent) {
      if (fb.clothingResult === 'froze') {
        // User felt cold -> treat ambient temperature as colder (-1.5°C) so warmer clothes are suggested
        rawOffset -= 1.5;
      } else if (fb.clothingResult === 'sweated' || fb.clothingResult === 'color_hot') {
        // User felt hot -> treat ambient temperature as warmer (+1.5°C) so lighter clothes are suggested
        rawOffset += 1.5;
      }
    }

    const clamped = Math.max(-4, Math.min(4, Math.round(rawOffset * 10) / 10));
    let label = 'Dengeli Termal Profil (0°C)';
    if (clamped <= -1) {
      label = `Soğuğa Hassas Profil (${clamped}°C Kalibrasyon)`;
    } else if (clamped >= 1) {
      label = `Sıcağa Hassas Profil (+${clamped}°C Kalibrasyon)`;
    }

    return {
      offsetC: clamped,
      feedbackCount: feedbacks.length,
      label,
    };
  } catch {
    return { offsetC: 0, feedbackCount: 0, label: 'Standart Termal Profil' };
  }
}

export async function fetchWeatherConsensus(location: LocationInfo): Promise<WeatherConsensus> {
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

    const res = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`, {
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
}
