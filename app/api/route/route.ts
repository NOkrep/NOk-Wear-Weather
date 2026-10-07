import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromLat = parseFloat(searchParams.get('fromLat') || '41.0082');
  const fromLon = parseFloat(searchParams.get('fromLon') || '28.9784');
  const toLat = parseFloat(searchParams.get('toLat') || '39.9334');
  const toLon = parseFloat(searchParams.get('toLon') || '32.8597');

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(osrmUrl, { next: { revalidate: 1800 } });

    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];

      if (route) {
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.round(route.duration / 60);
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        const durationStr = `${hours > 0 ? hours + 's ' : ''}${mins}dk`;

        const coordinates: [number, number][] = route.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon]
        );

        // Sample 3-4 intermediate stops along the actual road polyline
        const waypointsCount = 3;
        const sampledIndices = [
          0,
          Math.floor(coordinates.length * 0.33),
          Math.floor(coordinates.length * 0.66),
          coordinates.length - 1,
        ];

        const sampledStops = sampledIndices.map((idx, stepNum) => {
          const [lat, lon] = coordinates[idx];
          const isOrigin = stepNum === 0;
          const isDest = stepNum === sampledIndices.length - 1;

          // Estimate arrival time
          const elapsedMins = Math.round((stepNum / (sampledIndices.length - 1)) * durationMinutes);
          const now = new Date();
          now.setMinutes(now.getMinutes() + elapsedMins);
          const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

          return {
            id: `stop-${stepNum}`,
            lat,
            lon,
            name: isOrigin ? 'Kalkış Noktası' : isDest ? 'Varış Noktası' : `Güzergah Ara Mola ${stepNum}`,
            timeStr,
            isOrigin,
            isDest,
          };
        });

        return NextResponse.json({
          distanceKm,
          durationStr,
          polyline: coordinates,
          stops: sampledStops,
        });
      }
    }
  } catch (err) {
    console.error('OSRM route fetch error, using fallback:', err);
  }

  // Graceful fallback line if OSRM is unreachable
  return NextResponse.json({
    distanceKm: 450,
    durationStr: '4s 45dk',
    polyline: [
      [fromLat, fromLon],
      [(fromLat + toLat) / 2, (fromLon + toLon) / 2],
      [toLat, toLon],
    ],
    stops: [
      { id: 'stop-0', lat: fromLat, lon: fromLon, name: 'Kalkış', timeStr: '08:30', isOrigin: true, isDest: false },
      { id: 'stop-1', lat: (fromLat + toLat) / 2, lon: (fromLon + toLon) / 2, name: 'Güzergah Geçidi', timeStr: '11:00', isOrigin: false, isDest: false },
      { id: 'stop-2', lat: toLat, lon: toLon, name: 'Varış', timeStr: '13:15', isOrigin: false, isDest: true },
    ],
  });
}
