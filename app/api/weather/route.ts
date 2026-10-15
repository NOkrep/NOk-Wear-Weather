import { NextRequest, NextResponse } from 'next/server';
import { WeatherCondition, WeatherSourceReading, HourlyForecastPoint } from '@/lib/types';

// In-memory Geo-Grid Cache (~1.1km grid resolution, 15 min TTL)
interface CacheEntry {
  timestamp: number;
  payload: any;
}
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 250;
const weatherGeoCache = new Map<string, CacheEntry>();

function mapWmoToCondition(code: number, isNight: boolean = false): WeatherCondition {
  if (code === 0) return isNight ? 'clear_night' : 'sunny';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'foggy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'partly_cloudy';
}

// Magnus approximation for Dew Point (°C) when a source doesn't return it directly
function estimateDewPoint(tempC: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const rh = Math.max(1, Math.min(100, humidity));
  const alpha = (a * tempC) / (b + tempC) + Math.log(rh / 100);
  return Math.round(((b * alpha) / (a - alpha)) * 10) / 10;
}

function buildSuggestedAction(tempVal: number, precipVal: number, windVal: number): string {
  if (precipVal >= 50) {
    return tempVal <= 14 ? 'Su geçirmez ceket + katman' : 'Hafif yağmurluk / şemsiye';
  }
  if (tempVal <= 8) return 'Kaban + Termal orta katman';
  if (tempVal <= 14) return windVal >= 22 ? 'Rüzgarlık + Hırka (3 Katman)' : 'Ceket + Gömlek (3 Katman)';
  if (tempVal <= 20) return 'İnce dış katman / Gömlek';
  if (tempVal <= 25) return 'Ceketi çıkar / Tek katman';
  return 'Nefes alan keten / pamuk tişört';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '41.0082');
  const lon = parseFloat(searchParams.get('lon') || '28.9784');

  const weatherApiKey = req.headers.get('x-weatherapi-key')?.trim() || '';
  const owmKey = req.headers.get('x-owm-key')?.trim() || '';

  // Round to 2 decimal places (~1.1 km) for Geo-Grid caching
  const gridKey = `${lat.toFixed(2)},${lon.toFixed(2)}:${Boolean(weatherApiKey)}:${Boolean(owmKey)}`;
  const now = Date.now();
  const cachedEntry = weatherGeoCache.get(gridKey);
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ ...cachedEntry.payload, cached: true });
  }

  let hourlyData: HourlyForecastPoint[] = [];
  let uvIndex = 3;

  // Task 1: Open-Meteo Best Match (ECMWF / GFS Blend) + Hourly Series
  const fetchOpenMeteo = async (): Promise<WeatherSourceReading | null> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index&timezone=auto&forecast_days=2`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = await res.json();
    const current = data.current;
    const cond = mapWmoToCondition(current.weather_code);

    if (data.hourly && Array.isArray(data.hourly.time)) {
      const currentHour = new Date().getHours();
      const times: string[] = data.hourly.time;
      const temps: number[] = data.hourly.temperature_2m;
      const feels: number[] = data.hourly.apparent_temperature;
      const precips: number[] = data.hourly.precipitation_probability;
      const codes: number[] = data.hourly.weather_code;
      const winds: number[] = data.hourly.wind_speed_10m;
      const uvs: number[] = data.hourly.uv_index;

      if (uvs && uvs.length > currentHour) {
        uvIndex = Math.max(...uvs.slice(currentHour, currentHour + 10));
      }

      hourlyData = times.slice(currentHour, currentHour + 18).map((t, idx) => {
        const globalIdx = currentHour + idx;
        const tempVal = Math.round(temps[globalIdx]);
        const feelVal = Math.round(feels[globalIdx]);
        const precipVal = precips[globalIdx] ?? 0;
        const codeVal = codes[globalIdx] ?? 1;
        const windVal = Math.round(winds[globalIdx] ?? 10);
        const hourNum = new Date(t).getHours();
        const isNightHour = hourNum < 6 || hourNum > 20;

        return {
          timeStr: `${String(hourNum).padStart(2, '0')}:00`,
          hourNumber: hourNum,
          temp: tempVal,
          feelsLike: feelVal,
          precipitationProb: precipVal,
          windSpeed: windVal,
          condition: mapWmoToCondition(codeVal, isNightHour),
          suggestedAction: buildSuggestedAction(feelVal, precipVal, windVal),
        };
      });
    }

    const currentPrecipProb =
      hourlyData.length > 0
        ? hourlyData[0].precipitationProb
        : current.precipitation > 0
        ? 80
        : 15;

    return {
      sourceName: 'Open-Meteo (ECMWF/IFS)',
      temp: Math.round(current.temperature_2m * 10) / 10,
      feelsLike: Math.round(current.apparent_temperature * 10) / 10,
      humidity: Math.round(current.relative_humidity_2m),
      dewPoint:
        typeof current.dew_point_2m === 'number'
          ? Math.round(current.dew_point_2m * 10) / 10
          : estimateDewPoint(current.temperature_2m, current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      precipitationProb: currentPrecipProb,
      condition: cond,
      isAvailable: true,
    };
  };

  // Task 2: MET Norway (api.met.no)
  const fetchMetNorway = async (): Promise<WeatherSourceReading | null> => {
    const metUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    const metRes = await fetch(metUrl, {
      headers: {
        'User-Agent': 'WearWeatherApp/0.2.2 (https://github.com/NOk-Collective; contact@nok-collective.org)',
      },
      next: { revalidate: 600 },
    });
    if (!metRes.ok) throw new Error(`MET Norway HTTP ${metRes.status}`);
    const metData = await metRes.json();
    const currentTimeseries = metData.properties?.timeseries?.[0];
    if (!currentTimeseries) throw new Error('MET Norway empty timeseries');

    const details = currentTimeseries.data?.instant?.details;
    const next1h = currentTimeseries.data?.next_1_hours;
    const symbolCode: string = next1h?.summary?.symbol_code || '';

    let metCond: WeatherCondition = 'partly_cloudy';
    if (symbolCode.includes('thunder')) metCond = 'stormy';
    else if (symbolCode.includes('snow') || symbolCode.includes('sleet')) metCond = 'snowy';
    else if (symbolCode.includes('rain') || symbolCode.includes('drizzle')) metCond = 'rainy';
    else if (symbolCode.includes('fog')) metCond = 'foggy';
    else if (symbolCode.includes('clearsky')) metCond = symbolCode.includes('night') ? 'clear_night' : 'sunny';
    else if (symbolCode.includes('cloudy')) metCond = 'cloudy';

    const tempC = details.air_temperature;
    const windKmh = details.wind_speed * 3.6;
    const rh = details.relative_humidity ?? 60;
    const dew =
      typeof details.dew_point_temperature === 'number'
        ? details.dew_point_temperature
        : estimateDewPoint(tempC, rh);

    return {
      sourceName: 'MET Norway (Yr.no)',
      temp: Math.round(tempC * 10) / 10,
      feelsLike: Math.round((tempC - details.wind_speed * 0.25) * 10) / 10,
      humidity: Math.round(rh),
      dewPoint: Math.round(dew * 10) / 10,
      windSpeed: Math.round(windKmh),
      precipitationProb:
        typeof next1h?.details?.probability_of_precipitation === 'number'
          ? Math.round(next1h.details.probability_of_precipitation)
          : next1h?.details?.precipitation_amount > 0
          ? 75
          : 10,
      condition: metCond,
      isAvailable: true,
    };
  };

  // Task 3: DWD ICON Model (Bright Sky station first, with global DWD ICON API fallback for outside Central Europe)
  const fetchDwdIcon = async (): Promise<WeatherSourceReading | null> => {
    try {
      const dwdUrl = `https://api.brightsky.dev/current_weather?lat=${lat}&lon=${lon}`;
      const dwdRes = await fetch(dwdUrl, { next: { revalidate: 600 } });
      if (dwdRes.ok) {
        const dwdData = await dwdRes.json();
        const weather = dwdData.weather;
        if (weather && typeof weather.temperature === 'number') {
          let dwdCond: WeatherCondition = 'partly_cloudy';
          if (weather.condition === 'thunderstorm') dwdCond = 'stormy';
          else if (weather.condition === 'snow' || weather.condition === 'sleet') dwdCond = 'snowy';
          else if (weather.condition === 'rain') dwdCond = 'rainy';
          else if (weather.condition === 'fog') dwdCond = 'foggy';
          else if (weather.condition === 'dry') dwdCond = 'sunny';

          const rh = weather.relative_humidity ?? 60;
          return {
            sourceName: 'DWD Bright Sky (ICON)',
            temp: Math.round(weather.temperature * 10) / 10,
            feelsLike: Math.round((weather.temperature - (weather.wind_speed_10 || 10) * 0.06) * 10) / 10,
            humidity: Math.round(rh),
            dewPoint:
              typeof weather.dew_point === 'number'
                ? Math.round(weather.dew_point * 10) / 10
                : estimateDewPoint(weather.temperature, rh),
            windSpeed: Math.round(weather.wind_speed_10 || weather.wind_speed || 12),
            precipitationProb: (weather.precipitation_10 || weather.precipitation || 0) > 0 ? 75 : 10,
            condition: dwdCond,
            isAvailable: true,
          };
        }
      }
    } catch {
      // Fall through to global DWD ICON endpoint
    }

    // Real Global DWD ICON Model endpoint via Open-Meteo DWD service (no random simulation)
    const iconUrl = `https://api.open-meteo.com/v1/dwd-icon?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const iconRes = await fetch(iconUrl, { next: { revalidate: 600 } });
    if (!iconRes.ok) throw new Error(`DWD ICON Global HTTP ${iconRes.status}`);
    const iconData = await iconRes.json();
    const cur = iconData.current;
    return {
      sourceName: 'DWD ICON (Küresel Model)',
      temp: Math.round(cur.temperature_2m * 10) / 10,
      feelsLike: Math.round(cur.apparent_temperature * 10) / 10,
      humidity: Math.round(cur.relative_humidity_2m),
      dewPoint:
        typeof cur.dew_point_2m === 'number'
          ? Math.round(cur.dew_point_2m * 10) / 10
          : estimateDewPoint(cur.temperature_2m, cur.relative_humidity_2m),
      windSpeed: Math.round(cur.wind_speed_10m),
      precipitationProb: cur.precipitation > 0 ? 75 : 12,
      condition: mapWmoToCondition(cur.weather_code),
      isAvailable: true,
    };
  };

  // Optional Task 4: User-provided WeatherAPI.com key
  const fetchWeatherApiCustom = async (): Promise<WeatherSourceReading | null> => {
    if (!weatherApiKey) return null;
    const url = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(weatherApiKey)}&q=${lat},${lon}&aqi=no`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const cur = data.current;
    if (!cur) return null;
    const text = (cur.condition?.text || '').toLowerCase();
    let cond: WeatherCondition = 'partly_cloudy';
    if (text.includes('thunder') || text.includes('storm')) cond = 'stormy';
    else if (text.includes('snow') || text.includes('blizzard')) cond = 'snowy';
    else if (text.includes('rain') || text.includes('drizzle') || text.includes('shower')) cond = 'rainy';
    else if (text.includes('fog') || text.includes('mist')) cond = 'foggy';
    else if (text.includes('sunny') || text.includes('clear')) cond = cur.is_day === 0 ? 'clear_night' : 'sunny';
    else if (text.includes('overcast') || text.includes('cloud')) cond = 'cloudy';

    return {
      sourceName: 'WeatherAPI.com (Özel Anahtar)',
      temp: Math.round(cur.temp_c * 10) / 10,
      feelsLike: Math.round(cur.feelslike_c * 10) / 10,
      humidity: Math.round(cur.humidity),
      dewPoint: typeof cur.dewpoint_c === 'number' ? Math.round(cur.dewpoint_c * 10) / 10 : estimateDewPoint(cur.temp_c, cur.humidity),
      windSpeed: Math.round(cur.wind_kph),
      precipitationProb: cur.precip_mm > 0 ? 80 : 15,
      condition: cond,
      isAvailable: true,
    };
  };

  // Optional Task 5: User-provided OpenWeatherMap key
  const fetchOwmCustom = async (): Promise<WeatherSourceReading | null> => {
    if (!owmKey) return null;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(owmKey)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.main) return null;
    const mainWeather = (data.weather?.[0]?.main || '').toLowerCase();
    let cond: WeatherCondition = 'partly_cloudy';
    if (mainWeather.includes('thunder')) cond = 'stormy';
    else if (mainWeather.includes('snow')) cond = 'snowy';
    else if (mainWeather.includes('rain') || mainWeather.includes('drizzle')) cond = 'rainy';
    else if (mainWeather.includes('fog') || mainWeather.includes('mist')) cond = 'foggy';
    else if (mainWeather.includes('clear')) cond = 'sunny';
    else if (mainWeather.includes('cloud')) cond = 'cloudy';

    return {
      sourceName: 'OpenWeatherMap (Özel Anahtar)',
      temp: Math.round(data.main.temp * 10) / 10,
      feelsLike: Math.round(data.main.feels_like * 10) / 10,
      humidity: Math.round(data.main.humidity),
      dewPoint: estimateDewPoint(data.main.temp, data.main.humidity),
      windSpeed: Math.round((data.wind?.speed || 3) * 3.6),
      precipitationProb: data.rain ? 80 : 15,
      condition: cond,
      isAvailable: true,
    };
  };

  // Execute all active meteorological providers in parallel!
  const settled = await Promise.allSettled([
    fetchOpenMeteo(),
    fetchMetNorway(),
    fetchDwdIcon(),
    fetchWeatherApiCustom(),
    fetchOwmCustom(),
  ]);

  const sources: WeatherSourceReading[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      sources.push(result.value);
    }
  }

  // Fallback if all network providers are unreachable
  if (sources.length === 0) {
    sources.push({
      sourceName: 'Open-Meteo (Yedek Mod)',
      temp: 18.5,
      feelsLike: 17.8,
      humidity: 58,
      dewPoint: 10.0,
      windSpeed: 14,
      precipitationProb: 15,
      condition: 'partly_cloudy',
      isAvailable: false,
    });
  }

  // Calculate Multi-Source Consensus
  const temps = sources.map((s) => s.temp);
  const feels = sources.map((s) => s.feelsLike);
  const humidities = sources.map((s) => s.humidity);
  const dews = sources.map((s) => s.dewPoint ?? estimateDewPoint(s.temp, s.humidity));
  const winds = sources.map((s) => s.windSpeed);
  const precips = sources.map((s) => s.precipitationProb);

  const avgTemp = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
  const avgFeels = Math.round((feels.reduce((a, b) => a + b, 0) / feels.length) * 10) / 10;
  const avgHum = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length);
  const avgDew = Math.round((dews.reduce((a, b) => a + b, 0) / dews.length) * 10) / 10;
  const avgWind = Math.round(winds.reduce((a, b) => a + b, 0) / winds.length);
  const avgPrecip = Math.round(precips.reduce((a, b) => a + b, 0) / precips.length);

  // Confidence Score based on inter-model spread
  const maxDiff = temps.length > 1 ? Math.max(...temps) - Math.min(...temps) : 0.8;
  let confidenceScore = 96;
  if (maxDiff > 3.5) confidenceScore = 72;
  else if (maxDiff > 2.5) confidenceScore = 81;
  else if (maxDiff > 1.5) confidenceScore = 89;
  else if (maxDiff > 0.8) confidenceScore = 93;

  // Majority vote for condition
  const conditionCounts: Record<string, number> = {};
  sources.forEach((s) => {
    conditionCounts[s.condition] = (conditionCounts[s.condition] || 0) + 1;
  });
  let primaryCondition: WeatherCondition = sources[0].condition;
  let maxCount = 0;
  for (const cond in conditionCounts) {
    if (conditionCounts[cond] > maxCount) {
      maxCount = conditionCounts[cond];
      primaryCondition = cond as WeatherCondition;
    }
  }

  const responsePayload = {
    temp: avgTemp,
    feelsLike: avgFeels,
    humidity: avgHum,
    dewPoint: avgDew,
    windSpeed: avgWind,
    precipitationProb: avgPrecip,
    uvIndex: Math.round(uvIndex),
    condition: primaryCondition,
    confidenceScore,
    sources,
    hourly: hourlyData,
    lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    cached: false,
  };

  // Store in LRU Geo-Grid cache
  if (weatherGeoCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = weatherGeoCache.keys().next().value;
    if (oldestKey) weatherGeoCache.delete(oldestKey);
  }
  weatherGeoCache.set(gridKey, { timestamp: now, payload: responsePayload });

  return NextResponse.json(responsePayload);
}
