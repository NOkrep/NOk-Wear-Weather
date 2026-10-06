import { LocationInfo } from './types';

export interface DistrictData {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  svgX: number; // for custom SVG map representation
  svgY: number;
}

export interface CityData {
  name: string;
  lat: number;
  lon: number;
  districts: DistrictData[];
}

export const TURKISH_CITIES: Record<string, CityData> = {
  'İstanbul': {
    name: 'İstanbul',
    lat: 41.0082,
    lon: 28.9784,
    districts: [
      { id: 'ist-kadikoy', name: 'Kadıköy', city: 'İstanbul', lat: 40.992, lon: 29.027, svgX: 320, svgY: 260 },
      { id: 'ist-besiktas', name: 'Beşiktaş', city: 'İstanbul', lat: 41.042, lon: 29.006, svgX: 280, svgY: 210 },
      { id: 'ist-uskudar', name: 'Üsküdar', city: 'İstanbul', lat: 41.026, lon: 29.015, svgX: 310, svgY: 230 },
      { id: 'ist-sisli', name: 'Şişli', city: 'İstanbul', lat: 41.060, lon: 28.987, svgX: 260, svgY: 190 },
      { id: 'ist-bakirkoy', name: 'Bakırköy', city: 'İstanbul', lat: 40.978, lon: 28.872, svgX: 190, svgY: 270 },
      { id: 'ist-sariyer', name: 'Sarıyer', city: 'İstanbul', lat: 41.168, lon: 29.055, svgX: 300, svgY: 120 },
      { id: 'ist-beylikduzu', name: 'Beylikdüzü', city: 'İstanbul', lat: 40.993, lon: 28.644, svgX: 110, svgY: 260 },
      { id: 'ist-pendik', name: 'Pendik', city: 'İstanbul', lat: 40.875, lon: 29.233, svgX: 420, svgY: 300 },
      { id: 'ist-fatih', name: 'Fatih', city: 'İstanbul', lat: 41.018, lon: 28.949, svgX: 240, svgY: 240 },
      { id: 'ist-maltepe', name: 'Maltepe', city: 'İstanbul', lat: 40.932, lon: 29.131, svgX: 360, svgY: 280 },
    ],
  },
  'Ankara': {
    name: 'Ankara',
    lat: 39.9334,
    lon: 32.8597,
    districts: [
      { id: 'ank-cankaya', name: 'Çankaya', city: 'Ankara', lat: 39.900, lon: 32.860, svgX: 270, svgY: 270 },
      { id: 'ank-yenimahalle', name: 'Yenimahalle', city: 'Ankara', lat: 39.970, lon: 32.800, svgX: 210, svgY: 190 },
      { id: 'ank-kecioren', name: 'Keçiören', city: 'Ankara', lat: 40.000, lon: 32.870, svgX: 280, svgY: 160 },
      { id: 'ank-mamak', name: 'Mamak', city: 'Ankara', lat: 39.930, lon: 32.920, svgX: 340, svgY: 240 },
      { id: 'ank-etimesgut', name: 'Etimesgut', city: 'Ankara', lat: 39.950, lon: 32.680, svgX: 140, svgY: 220 },
      { id: 'ank-golbasi', name: 'Gölbaşı', city: 'Ankara', lat: 39.790, lon: 32.810, svgX: 250, svgY: 340 },
    ],
  },
  'İzmir': {
    name: 'İzmir',
    lat: 38.4237,
    lon: 27.1428,
    districts: [
      { id: 'izm-konak', name: 'Konak', city: 'İzmir', lat: 38.419, lon: 27.128, svgX: 230, svgY: 240 },
      { id: 'izm-karsiyaka', name: 'Karşıyaka', city: 'İzmir', lat: 38.459, lon: 27.112, svgX: 220, svgY: 180 },
      { id: 'izm-bornova', name: 'Bornova', city: 'İzmir', lat: 38.469, lon: 27.217, svgX: 310, svgY: 190 },
      { id: 'izm-buca', name: 'Buca', city: 'İzmir', lat: 38.389, lon: 27.178, svgX: 280, svgY: 280 },
      { id: 'izm-cesme', name: 'Çeşme', city: 'İzmir', lat: 38.323, lon: 26.305, svgX: 90, svgY: 270 },
      { id: 'izm-urla', name: 'Urla', city: 'İzmir', lat: 38.322, lon: 26.763, svgX: 160, svgY: 260 },
    ],
  },
  'Antalya': {
    name: 'Antalya',
    lat: 36.8969,
    lon: 30.7133,
    districts: [
      { id: 'ant-muratpasa', name: 'Muratpaşa', city: 'Antalya', lat: 36.885, lon: 30.708, svgX: 260, svgY: 230 },
      { id: 'ant-konyaalti', name: 'Konyaaltı', city: 'Antalya', lat: 36.865, lon: 30.630, svgX: 190, svgY: 250 },
      { id: 'ant-kepez', name: 'Kepez', city: 'Antalya', lat: 36.935, lon: 30.690, svgX: 240, svgY: 170 },
      { id: 'ant-alanya', name: 'Alanya', city: 'Antalya', lat: 36.543, lon: 31.999, svgX: 420, svgY: 290 },
      { id: 'ant-manavgat', name: 'Manavgat', city: 'Antalya', lat: 36.786, lon: 31.442, svgX: 340, svgY: 260 },
      { id: 'ant-kas', name: 'Kaş', city: 'Antalya', lat: 36.200, lon: 29.637, svgX: 80, svgY: 340 },
    ],
  },
  'Bursa': {
    name: 'Bursa',
    lat: 40.1885,
    lon: 29.0610,
    districts: [
      { id: 'bur-osmangazi', name: 'Osmangazi', city: 'Bursa', lat: 40.210, lon: 29.060, svgX: 260, svgY: 210 },
      { id: 'bur-nilufer', name: 'Nilüfer', city: 'Bursa', lat: 40.210, lon: 28.980, svgX: 190, svgY: 220 },
      { id: 'bur-yildirim', name: 'Yıldırım', city: 'Bursa', lat: 40.190, lon: 29.110, svgX: 310, svgY: 220 },
      { id: 'bur-mudanya', name: 'Mudanya', city: 'Bursa', lat: 40.370, lon: 28.880, svgX: 180, svgY: 140 },
    ],
  },
  'Trabzon': {
    name: 'Trabzon',
    lat: 41.0027,
    lon: 39.7168,
    districts: [
      { id: 'tra-ortahisar', name: 'Ortahisar', city: 'Trabzon', lat: 41.000, lon: 39.720, svgX: 250, svgY: 220 },
      { id: 'tra-akcaabat', name: 'Akçaabat', city: 'Trabzon', lat: 41.020, lon: 39.570, svgX: 160, svgY: 220 },
      { id: 'tra-yomra', name: 'Yomra', city: 'Trabzon', lat: 40.950, lon: 39.860, svgX: 340, svgY: 240 },
    ],
  },
};

export const POPULAR_GLOBAL_CITIES: LocationInfo[] = [
  { country: 'Türkiye', city: 'İstanbul', district: 'Kadıköy', lat: 40.992, lon: 29.027 },
  { country: 'Türkiye', city: 'Ankara', district: 'Çankaya', lat: 39.900, lon: 32.860 },
  { country: 'Türkiye', city: 'İzmir', district: 'Konak', lat: 38.419, lon: 27.128 },
  { country: 'Türkiye', city: 'Antalya', district: 'Muratpaşa', lat: 36.885, lon: 30.708 },
  { country: 'Birleşik Krallık', city: 'Londra', district: 'Westminster', lat: 51.5074, lon: -0.1278 },
  { country: 'Almanya', city: 'Berlin', district: 'Mitte', lat: 52.5200, lon: 13.4050 },
  { country: 'Fransa', city: 'Paris', district: 'Le Marais', lat: 48.8566, lon: 2.3522 },
  { country: 'Japonya', city: 'Tokyo', district: 'Shinjuku', lat: 35.6762, lon: 139.6503 },
  { country: 'ABD', city: 'New York', district: 'Manhattan', lat: 40.7128, lon: -74.0060 },
  { country: 'İtalya', city: 'Roma', district: 'Centro Storico', lat: 41.9028, lon: 12.4964 },
];
