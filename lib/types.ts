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
}

export interface HourlyForecastPoint {
  timeStr: string; // "08:00", "12:00" etc.
  hourNumber: number;
  temp: number;
  feelsLike: number;
  precipitationProb: number;
  windSpeed: number;
  condition: WeatherCondition;
  suggestedAction: string;
}

export interface WeatherConsensus {
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
  phase: 'morning' | 'midday' | 'evening';
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
