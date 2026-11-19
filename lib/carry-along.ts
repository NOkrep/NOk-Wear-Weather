/**
 * WW-11 "Yanına al": one piece to carry when the coming hours turn colder or wet.
 * - Only without a planned interval: a planned outfit is already chosen for its whole window.
 * - Horizon: the next 8 hours, never past local midnight (user decision).
 * - Colder: the outfit is re-judged at the coldest coming hour with the same models (ISO 11079 / SET*);
 *   the lightest single added mid or outer layer that makes it acceptable is suggested.
 * - Wet: precipitation probability ≥ 40 % (the app's rain threshold) without a waterproof outer layer.
 * Pinned pieces are never replaced; a suggestion only adds. Nothing is suggested from missing data.
 */
import type { ClothingItem, HourlyForecastPoint, WeatherConsensus } from './types';
import { canRankForWeather } from './catalog-wardrobe';
import { itemIdentity } from './comfort';
import { assessItems, itemCloPart, thermalContext } from './outfit-thermal';
import { localDateKey, localTimeLabel } from './weather-time';

export const CARRY_HORIZON_HOURS = 8;
export const RAIN_THRESHOLD = 40;

export type CarrySuggestion = {
  reason: 'colder' | 'rain';
  /** `add`: this piece covers it; `unconfirmed`: the best piece cannot be proven enough; `none`: no suitable piece */
  status: 'add' | 'unconfirmed' | 'none';
  item: ClothingItem | null;
  at: number; timeLabel: string;
  temp?: number; precipitationProb?: number;
  basis?: 'ISO 11079' | 'SET*';
};
export type CarryResult = { suggestions: CarrySuggestion[]; missingForecast: boolean };

const cloMid = (item: ClothingItem) => { const clo = itemCloPart(item).clo; return clo ? (clo.min + clo.max) / 2 : Infinity; };

/** One forecast hour as a stand-alone weather reading, so the existing models judge it unchanged. */
function hourAsWeather(weather: WeatherConsensus, point: HourlyForecastPoint & { humidity?: number }): WeatherConsensus {
  return { ...weather, selection: undefined, temp: point.temp, feelsLike: point.feelsLike, windSpeed: point.windSpeed,
    precipitationProb: point.precipitationProb, humidity: Number.isFinite(point.humidity) ? point.humidity! : weather.humidity,
    directNormalIrradiance: point.directNormalIrradiance, observedAt: point.validAt, hourly: [] };
}

export function carryAlong(items: readonly ClothingItem[], pool: readonly ClothingItem[], weather: WeatherConsensus, thermalOffsetC = 0, now = Date.now()): CarryResult {
  if (weather.selection || !items.length) return { suggestions: [], missingForecast: false };
  const zone = weather.timezone;
  const today = localDateKey(now, zone);
  const coming = (weather.hourly || []).filter(point => {
    const at = Date.parse(point.validAt ?? '');
    return Number.isFinite(at) && at > now && at <= now + CARRY_HORIZON_HOURS * 3_600_000 && localDateKey(at, zone) === today;
  });
  // The current reading carries only today's hours, so late in the day the horizon is simply empty;
  // only an absent hourly forecast is "missing".
  if (!coming.length) return { suggestions: [], missingForecast: !(weather.hourly || []).length };

  const worn = new Set(items.map(itemIdentity));
  const candidates = pool.filter(candidate => !worn.has(itemIdentity(candidate)));
  const suggestions: CarrySuggestion[] = [];

  // Colder: judge the outfit at the coldest coming hour; never claim a shortfall the model cannot prove.
  const coldest = coming.reduce((low, point) => point.temp < low.temp ? point : low, coming[0]);
  const coldWeather = hourAsWeather(weather, coldest);
  const coldContext = thermalContext(coldWeather, thermalOffsetC, 'walking', Date.parse(coldest.validAt!));
  const nowVerdict = assessItems(items, thermalContext(weather, thermalOffsetC, 'walking', now)).fit;
  const later = assessItems(items, coldContext);
  if (later.fit === 'insufficient' && nowVerdict !== 'insufficient') {
    const hasOuter = items.some(item => item.category === 'outer'), hasMid = items.some(item => item.category === 'mid');
    const layers = candidates.filter(candidate => (candidate.category === 'mid' && !hasMid || candidate.category === 'outer' && !hasOuter)
      && canRankForWeather(candidate, coldWeather)).sort((a, b) => cloMid(a) - cloMid(b));
    const verdicts = layers.map(candidate => ({ candidate, fit: assessItems([...items, candidate], coldContext).fit }));
    const proven = verdicts.find(entry => entry.fit === 'acceptable');
    const possible = [...verdicts].reverse().find(entry => entry.fit === 'unknown');
    const at = Date.parse(coldest.validAt!);
    suggestions.push({ reason: 'colder', status: proven ? 'add' : possible ? 'unconfirmed' : 'none', item: proven?.candidate ?? possible?.candidate ?? null,
      at, timeLabel: localTimeLabel(at, zone), temp: coldest.temp, basis: later.cold?.fit === 'insufficient' ? 'ISO 11079' : 'SET*' });
  }

  // Wet: the first coming hour at or above the rain threshold, if it is dry now and no waterproof outer is worn.
  const wet = coming.find(point => point.precipitationProb >= RAIN_THRESHOLD);
  if (wet && weather.precipitationProb < RAIN_THRESHOLD && !items.some(item => item.category === 'outer' && item.waterResistance === 'waterproof')) {
    const shell = candidates.filter(candidate => candidate.category === 'outer' && candidate.waterResistance === 'waterproof')
      .sort((a, b) => cloMid(a) - cloMid(b))[0] ?? null;
    const at = Date.parse(wet.validAt!);
    suggestions.push({ reason: 'rain', status: shell ? 'add' : 'none', item: shell, at, timeLabel: localTimeLabel(at, zone), precipitationProb: wet.precipitationProb });
  }
  return { suggestions, missingForecast: false };
}

/** One short line per suggestion; `name` is the locale-aware garment name. */
export function carryNote(suggestion: CarrySuggestion, name: string | null, locale: 'tr' | 'en', wardrobeOnly: boolean): string {
  const en = locale === 'en';
  if (suggestion.reason === 'rain') {
    if (suggestion.status === 'none') return en
      ? `Around ${suggestion.timeLabel} the chance of rain is ${suggestion.precipitationProb}%: ${wardrobeOnly ? 'your wardrobe has' : 'there is'} no waterproof outer layer to carry.`
      : `${suggestion.timeLabel} civarı yağış olasılığı %${suggestion.precipitationProb}: ${wardrobeOnly ? 'dolabında' : 'önerilerde'} yanına alınacak su geçirmez dış katman yok.`;
    return en ? `Take along: ${name} — around ${suggestion.timeLabel} the chance of rain is ${suggestion.precipitationProb}%.`
      : `Yanına al: ${name} — ${suggestion.timeLabel} civarı yağış olasılığı %${suggestion.precipitationProb}.`;
  }
  const when = en ? `by ${suggestion.timeLabel} it drops to ${suggestion.temp}°` : `${suggestion.timeLabel} itibarıyla ${suggestion.temp}°`;
  if (suggestion.status === 'none') return en
    ? `${when[0].toUpperCase()}${when.slice(1)}; ${suggestion.basis}: this outfit falls short then, and ${wardrobeOnly ? 'your wardrobe has' : 'there is'} no single layer to add that covers it.`
    : `${when}; ${suggestion.basis} modeline göre bu kombin o saatte yetmiyor ve ${wardrobeOnly ? 'dolabında' : 'önerilerde'} eklenip yetecek tek bir katman yok.`;
  if (suggestion.status === 'unconfirmed') return en
    ? `Take along: ${name} — ${when}; ${suggestion.basis}: this outfit falls short then, and it could not be confirmed that ${name} is enough.`
    : `Yanına al: ${name} — ${when}; ${suggestion.basis} modeline göre bu kombin o saatte yetmiyor, bu parçayla yeterlilik doğrulanamadı.`;
  return en ? `Take along: ${name} — ${when}; ${suggestion.basis}: this outfit falls short then.`
    : `Yanına al: ${name} — ${when}; ${suggestion.basis} modeline göre bu kombin o saatte yetmiyor.`;
}
