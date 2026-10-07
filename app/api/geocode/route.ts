import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  // Reverse Geocoding (When clicking on map)
  if (latStr && lonStr) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    try {
      const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=tr&zoom=14`;
      const res = await fetch(revUrl, {
        headers: {
          'User-Agent': 'WearWeatherApp/0.2.0 contact@nok-collective.internal',
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const district =
          addr.suburb ||
          addr.district ||
          addr.neighbourhood ||
          addr.borough ||
          addr.town ||
          addr.county ||
          addr.city_district ||
          'Bölge';
        const city = addr.city || addr.province || addr.state || 'Bölge';
        const country = addr.country || 'Global';

        return NextResponse.json({
          district,
          city,
          country,
          lat,
          lon,
          displayName: data.display_name,
        });
      }
    } catch (e) {
      console.error('Reverse geocode error:', e);
    }

    return NextResponse.json({
      district: 'Seçili Konum',
      city: 'Harita Noktası',
      country: 'Global',
      lat,
      lon,
    });
  }

  // Forward Search Geocoding (Global Autocomplete)
  if (q && q.trim().length > 1) {
    try {
      const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        q.trim()
      )}&count=10&language=tr&format=json`;
      const res = await fetch(searchUrl, { next: { revalidate: 3600 } });

      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map((item: any) => ({
          district: item.admin2 || item.name,
          city: item.admin1 || item.name,
          country: item.country || '',
          lat: item.latitude,
          lon: item.longitude,
          displayName: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}, ${item.country || ''}`,
        }));

        return NextResponse.json({ results });
      }
    } catch (e) {
      console.error('Forward geocode search error:', e);
    }
  }

  return NextResponse.json({ results: [] });
}
