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
  suggestedAction: string; // "Ceketi giy", "Ceketi çıkar", vb.
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

export type BudgetSegment = 'essential' | 'premium';
export type OutfitApproach = 'layering' | 'direct' | 'anchor' | 'wardrobe';
export type GenderPreference = 'unisex' | 'men' | 'women';

export interface ClothingItem {
  id: string;
  name: string;
  category: 'base' | 'mid' | 'outer' | 'bottom' | 'footwear' | 'accessory';
  segment: BudgetSegment;
  material: string;
  warmth: 1 | 2 | 3 | 4 | 5; // 1 = ince, 5 = kışlık polar/kaban
  waterResistance: 'none' | 'light' | 'waterproof';
  windResistance: 'low' | 'medium' | 'high';
  colorName: string;
  colorHex: string;
  colorType: 'light' | 'dark' | 'neutral';
  description: string;
  isAnchorCompatible?: boolean;
  isUserOwned?: boolean;
}

export interface LayerTimelineStep {
  timeRange: string; // "07:30 - 10:30"
  phase: 'morning' | 'midday' | 'evening';
  expectedTemp: number;
  feelsLikeTemp: number;
  precipitationProb: number;
  actionTitle: string; // "3 Katman Aktif" | "Dış Katmanı Çıkar"
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
  coverageScore: number; // 0 - 100
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
  rating: number; // 1 to 5
  bestSource: string;
  clothingResult: 'froze' | 'sweated' | 'wet' | 'color_hot' | 'perfect';
  notes: string;
}

export interface ThermalProfile {
  offsetC: number; // -4 to +4 (negative means user gets cold easily -> recommend warmer clothes)
  feedbackCount: number;
  label: string;
}

export interface CustomApiKeys {
  weatherApiKey?: string;
  openWeatherMapKey?: string;
  geminiApiKey?: string;
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

export interface TravelPlan {
  mode: 'city' | 'domestic_route' | 'international_flight';
  origin: LocationInfo;
  destination?: LocationInfo;
  transportType: 'car' | 'bus' | 'train' | 'plane';
  departureTime: string;
  stops: RouteStop[];
}
