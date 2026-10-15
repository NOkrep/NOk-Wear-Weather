import { NextRequest, NextResponse } from 'next/server';
import { WeatherCondition, RouteStop } from '@/lib/types';

function mapWmoToCondition(code: number): WeatherCondition {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'foggy';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rainy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'partly_cloudy';
}

function addMinutesToTimeStr(baseTimeStr: string, elapsedMins: number): string {
  const parts = baseTimeStr.split(':');
  if (parts.length === 2) {
    const baseH = parseInt(parts[0], 10);
    const baseM = parseInt(parts[1], 10);
    if (!isNaN(baseH) && !isNaN(baseM)) {
      const totalMins = (baseH * 60 + baseM + elapsedMins) % (24 * 60);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  const now = new Date();
  now.setMinutes(now.getMinutes() + elapsedMins);
  return now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

async function fetchStopWeatherAndName(
  lat: number,
  lon: number,
  fallbackName: string,
  fetchName: boolean
): Promise<{
  name: string;
  temp: number;
  feelsLike: number;
  precipitationProb: number;
  windSpeed: number;
  condition: WeatherCondition;
}> {
  const weatherPromise = fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`,
    { next: { revalidate: 900 } }
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
          next: { revalidate: 3600 },
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

  if (weatherData?.current) {
    const c = weatherData.current;
    return {
      name: resolvedName,
      temp: Math.round(c.temperature_2m * 10) / 10,
      feelsLike: Math.round(c.apparent_temperature * 10) / 10,
      precipitationProb: c.precipitation > 0 ? 75 : 15,
      windSpeed: Math.round(c.wind_speed_10m || 12),
      condition: mapWmoToCondition(c.weather_code ?? 1),
    };
  }

  return {
    name: resolvedName,
    temp: 16,
    feelsLike: 15,
    precipitationProb: 15,
    windSpeed: 12,
    condition: 'partly_cloudy',
  };
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
  const fromLat = parseFloat(searchParams.get('fromLat') || '41.0082');
  const fromLon = parseFloat(searchParams.get('fromLon') || '28.9784');
  const toLat = parseFloat(searchParams.get('toLat') || '39.9334');
  const toLon = parseFloat(searchParams.get('toLon') || '32.8597');
  const originName = searchParams.get('fromName') || 'Kalkış Noktası';
  const destName = searchParams.get('toName') || 'Varış Noktası';
  const departureTime = searchParams.get('departureTime') || '08:30';
  const transport = searchParams.get('transport') || 'car';

  let coordinates: [number, number][] = [
    [fromLat, fromLon],
    [(fromLat + toLat) / 2, (fromLon + toLon) / 2],
    [toLat, toLon],
  ];
  let distanceKm = 450;
  let durationMinutes = 285;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(osrmUrl, { next: { revalidate: 1800 } });

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
  } catch (err) {
    console.error('OSRM route fetch error, using geodesic fallback:', err);
  }

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

  const originTemp = rawStopDetails[0]?.temp ?? 18;

  const stops: RouteStop[] = sampledIndices.map((idx, stepNum) => {
    const [lat, lon] = coordinates[idx];
    const isOrigin = stepNum === 0;
    const isDest = stepNum === sampledIndices.length - 1;
    const elapsedMins = Math.round((stepNum / (sampledIndices.length - 1)) * durationMinutes);
    const timeStr = addMinutesToTimeStr(departureTime, elapsedMins);
    const info = rawStopDetails[stepNum];
    const delta = Math.round((info.temp - originTemp) * 10) / 10;

    return {
      id: `stop-${stepNum}`,
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
  });
}
