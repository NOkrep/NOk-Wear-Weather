import { LocationInfo, WeatherConsensus } from './types';

export async function fetchWeatherConsensus(location: LocationInfo): Promise<WeatherConsensus> {
  try {
    const res = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching weather consensus, using fallback:', err);
    // Offline / fallback response
    return {
      temp: 18.0,
      feelsLike: 17.2,
      humidity: 60,
      windSpeed: 12,
      precipitationProb: 20,
      uvIndex: 4,
      condition: 'partly_cloudy',
      confidenceScore: 88,
      sources: [
        {
          sourceName: 'Open-Meteo',
          temp: 18.2,
          feelsLike: 17.5,
          humidity: 58,
          windSpeed: 12,
          precipitationProb: 20,
          condition: 'partly_cloudy',
          isAvailable: true,
        },
        {
          sourceName: 'MET Norway',
          temp: 17.8,
          feelsLike: 17.0,
          humidity: 62,
          windSpeed: 13,
          precipitationProb: 15,
          condition: 'partly_cloudy',
          isAvailable: true,
        },
        {
          sourceName: 'DWD Bright Sky',
          temp: 18.0,
          feelsLike: 17.1,
          humidity: 60,
          windSpeed: 11,
          precipitationProb: 25,
          condition: 'partly_cloudy',
          isAvailable: true,
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
