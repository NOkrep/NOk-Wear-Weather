import type { GarmentTypeId } from './catalog/taxonomy';
import type { CatalogFacts, CatalogSource, FieldEvidence } from './catalog/model';
import type { GarmentAppearance } from './garment-appearance';

export type WeatherCondition =
  | 'sunny'
  | 'clear_night'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy';

export interface LocationInfo {
  country: string;
  city: string;
  district: string;
  lat: number;
  lon: number;
}

export interface WeatherSourceReading {
  sourceName: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  dewPoint?: number;
  windSpeed: number; // km/h
  precipitationProb: number; // %
  condition: WeatherCondition;
  isAvailable: boolean;
  isDay?: boolean | null;
}

/** Additive metadata: old personal records remain readable. All instants are UTC ISO. */
export interface WeatherTimeContext {
  timezoneKnown?: boolean;
  timezone?: string;
  lat?: number;
  lon?: number;
  observedAt?: string;
  isDay?: boolean | null;
  solarDays?: { date: string; sunrise: string | null; sunset: string | null }[];
}

export interface HourlyForecastPoint {
  timezone?: string;
  stopLabel?: string;
  stopId?: string;
  coveredStartAt?: string;
  coveredEndAt?: string;
  validAt?: string;
  isDay?: boolean | null;
  timeStr: string; // "08:00", "12:00" etc.
  hourNumber: number;
  temp: number;
  feelsLike: number;
  precipitationProb: number;
  windSpeed: number;
  condition: WeatherCondition;
  suggestedAction: string;
  /** Open-Meteo direct normal irradiance (W/m², preceding-hour mean); absent when the provider gave none */
  directNormalIrradiance?: number;
}

export interface StopWeatherPlan {
  date: string; // YYYY-MM-DD at this stop, not at the browser/server
  startTime: string;
  endTime?: string; // earlier than start means the next local day; empty means one instant
}
export interface ForecastPoint extends HourlyForecastPoint {
  humidity: number;
  dewPoint: number;
  uvIndex?: number;
}
export interface ForecastSource extends WeatherTimeContext {
  sourceName: string;
  status: 'available' | 'unavailable' | 'current-only';
  points: ForecastPoint[];
}
export interface WeatherPlanSelection {
  date: string;
  startAt: string;
  endAt: string;
  point: boolean;
  minTemp: number;
  maxTemp: number;
  minFeelsLike: number;
  maxFeelsLike: number;
  maxWind: number;
  maxPrecipitation: number;
}

export interface WeatherConsensus extends WeatherTimeContext {
  requestedDate?: string;
  forecastSources?: ForecastSource[];
  selection?: WeatherPlanSelection;
  uvIndexKnown?: boolean;
  /** Open-Meteo current direct normal irradiance, W/m²; not set for planned intervals (use `hourly`) */
  directNormalIrradiance?: number;
  fetchedAt?: string;
  forecastAvailable?: boolean;
  temp: number;
  feelsLike: number;
  humidity: number;
  dewPoint: number;
  windSpeed: number;
  precipitationProb: number;
  uvIndex: number;
  condition: WeatherCondition;
  confidenceScore: number; // 0 - 100
  sources: WeatherSourceReading[];
  hourly: HourlyForecastPoint[];
  lastUpdated: string;
  cached?: boolean;
}

export type PurchasingPowerTier = 'essential' | 'smart' | 'luxury';
export type BudgetSegment = 'essential' | 'smart' | 'luxury' | 'premium';
export type OutfitApproach = 'layering' | 'direct' | 'anchor' | 'wardrobe';
export type GenderPreference = 'unisex' | 'men' | 'women';

export interface ClothingItem {
  id: string;
  name: string;
  category: 'base' | 'mid' | 'outer' | 'bottom' | 'footwear' | 'accessory';
  segment: BudgetSegment | null;
  material: string;
  warmth: 1 | 2 | 3 | 4 | 5 | null;
  waterResistance: 'none' | 'light' | 'waterproof' | null;
  windResistance: 'low' | 'medium' | 'high' | null;
  colorName: string;
  colorHex: string;
  colorType: 'light' | 'dark' | 'neutral' | 'unknown';
  description: string;
  brandHint?: string;
  brand?: string;
  model?: string;
  isAnchorCompatible?: boolean;
  isUserOwned?: boolean;
  catalogId?: string;
  /** Optional additive references: old local wardrobe records remain valid. */
  garmentTypeId?: GarmentTypeId;
  productId?: string;
  variantId?: string;
  barcode?: string;
  productUrl?: string;
  dataSource?: 'template' | 'barcode' | 'user' | 'catalog';
  materialConfirmed?: boolean;
  nameEn?: string;
  materialEn?: string;
  /** Personal opinion stays separate from source facts and is never published to the catalogue. */
  personalWarmth?: 1 | 2 | 3 | 4 | 5 | null;
  /** Local representative styling, kept separate from product/source facts. */
  personalAppearance?: GarmentAppearance;
  catalogFacts?: CatalogFacts;
  catalogEvidence?: FieldEvidence[];
  catalogSources?: CatalogSource[];
}

export interface LayerTimelineStep {
  timeRange: string;
  phase: 'morning' | 'midday' | 'evening' | 'night';
  expectedTemp: number;
  feelsLikeTemp: number;
  precipitationProb: number;
  actionTitle: string;
  actionDescription: string;
  activeItems: string[];
  thermalTip: string;
}

export interface AnchorMatchResult {
  anchorItem: ClothingItem;
  complementaryItems: ClothingItem[];
  colorHarmonyNotes: string;
  weatherFitNotes: string;
}

export interface WardrobeOutfitMatch {
  selectedItems: ClothingItem[];
  missingCategories: string[];
  coverageScore: number;
  summaryNote: string;
}

export interface AiStylistResponse {
  headline: string;
  outfitAdvice: string;
  fabricAndColorTip: string;
  travelOrActivityTip: string;
  recommendedItemNames: string[];
  modelUsed: string;
  isFallback?: boolean;
}

export interface FeedbackRecord {
  id: string;
  timestamp: string;
  location: string;
  rating: number;
  bestSource: string;
  clothingResult: 'froze' | 'sweated' | 'wet' | 'color_hot' | 'perfect';
  notes: string;
  context?: {
    worn: true;
    items: { key: string; name: string; category: ClothingItem['category'] }[];
    itemKey?: string;
    feelsLike: number;
    windSpeed: number;
    precipitationProb: number;
    activity: 'resting' | 'walking' | 'active';
    liveWeather: boolean;
  };
}

export interface ThermalProfile {
  offsetC: number;
  feedbackCount: number;
  label: string;
}

export interface CustomApiKeys {
  weatherApiKey?: string;
  openWeatherMapKey?: string;
  geminiApiKey?: string;
}

// Multi-stop user itinerary item (City, Domestic, or International)
export interface ItineraryStop {
  plan?: StopWeatherPlan;
  id: string;
  location: LocationInfo;
  preferredTime?: string; // e.g., "08:30", "14:00", or "" for live/now
  weather?: WeatherConsensus;
  effectiveHourTemp?: number;
  effectiveHourFeels?: number;
  effectiveHourPrecip?: number;
  effectiveHourCondition?: WeatherCondition;
}

export interface RouteStop {
  validAt?: string;
  timezone?: string;
  isDay?: boolean | null;
  forecastAvailable?: boolean;
  id: string;
  name: string;
  lat: number;
  lon: number;
  timeStr: string;
  isOrigin: boolean;
  isDest: boolean;
  temp: number;
  feelsLike: number;
  precipitationProb: number;
  windSpeed: number;
  condition: WeatherCondition;
  tempDeltaFromOrigin: number;
  clothingTip: string;
}
