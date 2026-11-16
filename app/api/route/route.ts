import { NextRequest, NextResponse } from 'next/server';
import { HourlyForecastPoint, RouteStop } from '@/lib/types';
import { conditionForDaylight, mapWmoToCondition } from '@/lib/weather-condition';
import { daylightAt, forecastPointAt, localTimeLabel, resolveWeatherInstant, solarDaysFromProvider, validTimeZone } from '@/lib/weather-time';

const noStore = { 'Cache-Control': 'private, no-store' };

async function fetchStopWeatherAndName(
  lat: number,
  lon: number,
  fallbackName: string,
  fetchName: boolean
) {
  const weatherLat = Number(lat.toFixed(2));
  const weatherLon = Number(lon.toFixed(2));
  const weatherPromise = fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,is_day&daily=sunrise,sunset&forecast_days=2&timeformat=unixtime&timezone=auto`,
    { cache: 'no-store', signal: AbortSignal.timeout(8_000) }
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  const namePromise = fetchName
    ? fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr&zoom=10`,
        {
          headers: {
            'User-Agent': 'WearWeatherApp/0.2.2 (https://github.com/NOk-Collective)',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(8_000),
        }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    : Promise.resolve(null);

  const [weatherData, geoData] = await Promise.all([weatherPromise, namePromise]);

  let resolvedName = fallbackName;
  if (geoData?.address) {
    const a = geoData.address;
    const town = a.town || a.county || a.district || a.suburb || a.city_district || '';
    const city = a.city || a.province || a.state || '';
    if (town && city && town !== city) {
      resolvedName = `${town} / ${city}`;
    } else if (city || town) {
      resolvedName = city || town;
    }
  }

  const context = {
    lat, lon, timezone: validTimeZone(weatherData?.timezone),
    solarDays: solarDaysFromProvider(weatherData || {}),
  };
  const hourly: HourlyForecastPoint[] = (weatherData?.hourly?.time || []).map((time: number, i: number) => {
    const h = weatherData.hourly;
    const validAt = new Date(time * 1000).toISOString();
    const isDay = daylightAt(context, time * 1000, {
      validAt, isDay: h.is_day?.[i] === 1 ? true : h.is_day?.[i] === 0 ? false : null,
    });
    const timeStr = localTimeLabel(time * 1000, context.timezone);
    return {
      validAt, timeStr, isDay, hourNumber: Number(timeStr.slice(0, 2)),
      temp: h.temperature_2m[i], feelsLike: h.apparent_temperature[i],
      windSpeed: h.wind_speed_10m[i], precipitationProb: h.precipitation_probability?.[i] ?? 15,
      condition: mapWmoToCondition(h.weather_code[i], isDay), suggestedAction: '',
    };
  });
  return { name: resolvedName, context, hourly };
}

function generateStopClothingTip(
  isOrigin: boolean,
  isDest: boolean,
  temp: number,
  delta: number,
  precipProb: number,
  windSpeed: number,
  transport: string
): string {
  const vehicleLabel =
    transport === 'bus' ? 'otobüs kabininde' : transport === 'train' ? 'tren vagonunda' : 'araç içinde';

  if (isOrigin) {
    return `${temp}°C ile yola çıkıyorsunuz. ${vehicleLabel.charAt(0).toUpperCase() + vehicleLabel.slice(1)} terlememek için dış katmanı çıkarıp nefes alan üstle seyahat edin.`;
  }

  const parts: string[] = [];
  if (delta <= -3) {
    parts.push(`Kalkışa göre ${Math.abs(delta)}°C sert soğuma var!`);
  } else if (delta >= 3) {
    parts.push(`Kalkışa göre +${delta}°C ısınma hissedilecek.`);
  }

  if (precipProb >= 50) {
    parts.push('Yağış geçişi bekleniyor; su geçirmez dış katmanı ve şemsiyeyi kolay erişilebilir tutun.');
  } else if (windSpeed >= 22) {
    parts.push(`Rüzgarlı açık alan (${windSpeed} km/s); mola/iniş anında rüzgar kesici ceketinizi giyin.`);
  } else if (temp <= 11) {
    parts.push('Serin/soğuk hava hakim; dışarı çıkarken orta ve dış katmanı birleştirin.');
  } else if (temp >= 23) {
    parts.push('Ilık/sıcak hava; dış katmanı çantaya alıp tek katmana geçebilirsiniz.');
  } else {
    parts.push(isDest ? 'Varış noktası ılıman; hafif üst katmanla konforlu geçiş yapabilirsiniz.' : 'Mola noktasında hafif esintiye karşı hırka/ceket el altında olsun.');
  }

  return parts.join(' ');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromLat = Number(searchParams.get('fromLat') || '41.0082');
  const fromLon = Number(searchParams.get('fromLon') || '28.9784');
  const toLat = Number(searchParams.get('toLat') || '39.9334');
  const toLon = Number(searchParams.get('toLon') || '32.8597');
  const originName = searchParams.get('fromName') || 'Kalkış Noktası';
  const destName = searchParams.get('toName') || 'Varış Noktası';
  const departureTime = searchParams.get('departureTime') || '08:30';
  const transport = searchParams.get('transport') || 'car';
  if (![fromLat, fromLon, toLat, toLon].every(Number.isFinite)
    || Math.abs(fromLat) > 90 || Math.abs(toLat) > 90 || Math.abs(fromLon) > 180 || Math.abs(toLon) > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400, headers: noStore });
  }

  let coordinates: [number, number][] = [
    [fromLat, fromLon],
    [(fromLat + toLat) / 2, (fromLon + toLon) / 2],
    [toLat, toLon],
  ];
  let distanceKm = 450;
  let durationMinutes = 285;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(osrmUrl, { cache: 'no-store', signal: AbortSignal.timeout(8_000) });

    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (route) {
        distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const baseDrivingMins = Math.round(route.duration / 60);
        // Adjust travel duration slightly based on transport mode
        durationMinutes =
          transport === 'bus'
            ? Math.round(baseDrivingMins * 1.18)
            : transport === 'train'
            ? Math.round(baseDrivingMins * 0.85)
            : baseDrivingMins;

        coordinates = route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]);
      }
    }
  } catch { /* Keep the existing fallback geometry on provider failure. */ }

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationStr = `${hours > 0 ? hours + 's ' : ''}${mins}dk`;

  // Sample 4 stops along the actual road polyline (Origin, 33%, 66%, Destination)
  const sampledIndices = [
    0,
    Math.floor(coordinates.length * 0.33),
    Math.floor(coordinates.length * 0.66),
    coordinates.length - 1,
  ];

  // Fetch real weather and reverse-geocoded names for all stops in parallel
  const rawStopDetails = await Promise.all(
    sampledIndices.map((idx, stepNum) => {
      const [lat, lon] = coordinates[idx];
      const isOrigin = stepNum === 0;
      const isDest = stepNum === sampledIndices.length - 1;
      const defaultLabel = isOrigin
        ? originName
        : isDest
        ? destName
        : `Güzergah Geçidi ${stepNum}`;
      return fetchStopWeatherAndName(lat, lon, defaultLabel, !isOrigin && !isDest);
    })
  );

  const departureAt = resolveWeatherInstant(departureTime, rawStopDetails[0].context.timezone, Date.now());
  if (departureAt === null) return NextResponse.json({ error: 'Invalid or nonexistent local departure time' }, { status: 400, headers: noStore });
  const originTemp = forecastPointAt(rawStopDetails[0].hourly, departureAt)?.temp ?? 16;

  const stops: RouteStop[] = sampledIndices.map((idx, stepNum) => {
    const [lat, lon] = coordinates[idx];
    const isOrigin = stepNum === 0;
    const isDest = stepNum === sampledIndices.length - 1;
    const elapsedMins = Math.round((stepNum / (sampledIndices.length - 1)) * durationMinutes);
    const details = rawStopDetails[stepNum];
    const at = departureAt + elapsedMins * 60000;
    const timeStr = localTimeLabel(at, details.context.timezone);
    const point = forecastPointAt(details.hourly, at);
    const isDay = daylightAt(details.context, at, point);
    const info = {
      name: details.name, temp: point?.temp ?? 16, feelsLike: point?.feelsLike ?? 15,
      precipitationProb: point?.precipitationProb ?? 15, windSpeed: point?.windSpeed ?? 12,
      condition: point ? conditionForDaylight(point.condition, isDay) : 'partly_cloudy' as const,
    };
    const delta = Math.round((info.temp - originTemp) * 10) / 10;

    return {
      id: `stop-${stepNum}`,
      validAt: new Date(at).toISOString(), timezone: details.context.timezone, isDay,
      forecastAvailable: Boolean(point),
      lat,
      lon,
      name: info.name,
      timeStr,
      isOrigin,
      isDest,
      temp: info.temp,
      feelsLike: info.feelsLike,
      precipitationProb: info.precipitationProb,
      windSpeed: info.windSpeed,
      condition: info.condition,
      tempDeltaFromOrigin: delta,
      clothingTip: generateStopClothingTip(
        isOrigin,
        isDest,
        info.temp,
        delta,
        info.precipitationProb,
        info.windSpeed,
        transport
      ),
    };
  });

  return NextResponse.json({
    distanceKm,
    durationStr,
    polyline: coordinates,
    stops,
  }, { headers: noStore });
}
