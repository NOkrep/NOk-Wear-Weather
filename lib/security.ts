// Privacy, Data Security & Request Deduplication Utilities (v0.4.0)

const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Truncates GPS coordinates to ~1.1km grid (2 decimal places) or ~110m (3 decimals)
 * so exact home/workplace coordinates are never exposed to external APIs.
 */
export function obfuscateCoordinates(
  lat: number,
  lon: number,
  precision: 2 | 3 = 2
): { lat: number; lon: number } {
  const factor = Math.pow(10, precision);
  const clampedLat = Math.max(-90, Math.min(90, Number(lat) || 41.01));
  const clampedLon = Math.max(-180, Math.min(180, Number(lon) || 28.98));
  return {
    lat: Math.round(clampedLat * factor) / factor,
    lon: Math.round(clampedLon * factor) / factor,
  };
}

/**
 * Sanitizes user search queries and text inputs against injection or malformed payloads.
 */
export function sanitizeInput(input: string, maxLength = 120): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[<>;"'`\\]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Deduplicates identical concurrent network requests on the client to prevent lag and API spam.
 */
export async function deduplicatedFetchJson<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetcher().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Wipes all locally stored user data (wardrobe, custom keys, feedbacks) in one click.
 */
export function wipeAllLocalUserData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('wear_weather_user_wardrobe_v1');
    localStorage.removeItem('wear_weather_custom_keys');
    localStorage.removeItem('wear_weather_feedbacks');
    localStorage.removeItem('wear_weather_itinerary_v1');
  } catch (e) {
    console.error('Error wiping local data:', e);
  }
}
