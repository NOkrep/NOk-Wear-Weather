import {
  WeatherConsensus,
  BudgetSegment,
  ClothingItem,
  LayerTimelineStep,
  AnchorMatchResult,
  HourlyForecastPoint,
} from './types';
import { getMarketProfileForCountry } from './clothing-catalog';

// Anchor Items Catalogue
export const ANCHOR_ITEMS: ClothingItem[] = [
  {
    id: 'anc-denim-jacket', garmentTypeId: 'light-jacket',
    name: 'Klasik Mavi Denim Ceket',
    category: 'outer',
    segment: 'essential',
    material: 'Pamuklu Dayanıklı Kot (12 oz)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'İndigo Mavisi',
    colorHex: '#3b82f6',
    colorType: 'neutral',
    description: 'Her gardıropta bulunan zamansız ara katman parçası.',
    isAnchorCompatible: true,
  },
  {
    id: 'anc-beige-trench', garmentTypeId: 'coat-parka',
    name: 'Bej Klasik Trençkot',
    category: 'outer',
    segment: 'smart',
    material: 'Sıkı Dokuma Pamuklu Gabardin',
    warmth: 3,
    waterResistance: 'light',
    windResistance: 'high',
    colorName: 'Açık Bej',
    colorHex: '#d4b996',
    colorType: 'light',
    description: 'Rüzgarlı ve serin geçiş havalarında hem şık hem koruyucu.',
    isAnchorCompatible: true,
  },
  {
    id: 'anc-grey-hoodie', garmentTypeId: 'sweatshirt',
    name: 'Gri Kapüşonlu Sweatshirt (Hoodie)',
    category: 'mid',
    segment: 'essential',
    material: '3 İplik Şardonlu Pamuk (320 GSM)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Melanj Grisi',
    colorHex: '#9ca3af',
    colorType: 'neutral',
    description: 'Günlük rahatlığın vazgeçilmezi, hırka veya ceket altına ideal.',
    isAnchorCompatible: true,
  },
  {
    id: 'anc-black-leather', garmentTypeId: 'light-jacket',
    name: 'Siyah Biker Deri Ceket',
    category: 'outer',
    segment: 'smart',
    material: 'Yumuşak Doğal / Kaliteli Deri',
    warmth: 4,
    waterResistance: 'light',
    windResistance: 'high',
    colorName: 'Kömür Siyahı',
    colorHex: '#18181b',
    colorType: 'dark',
    description: 'Rüzgarı tamamen kesen, akşam serinliğinde koruyan şehir parçası.',
    isAnchorCompatible: true,
  },
  {
    id: 'anc-white-linen', garmentTypeId: 'shirt',
    name: 'Beyaz Saf Keten Gömlek',
    category: 'mid',
    segment: 'smart',
    material: '%100 Saf Doğal Keten (145 GSM)',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Optik Beyaz',
    colorHex: '#ffffff',
    colorType: 'light',
    description: 'Güneş ışığını maksimum oranda yansıtan, ultra nefes alabilir parça.',
    isAnchorCompatible: true,
  },
  {
    id: 'anc-wool-knit', garmentTypeId: 'sweater',
    name: 'Merinos Yünü Triko Kazak',
    category: 'mid',
    segment: 'luxury',
    material: '%100 Ekstra İnce Merinos Yünü',
    warmth: 4,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Orman Yeşili',
    colorHex: '#166534',
    colorType: 'dark',
    description: 'Hafifliğine rağmen yüksek ısı yalıtımı sağlayan teknik doğal lif.',
    isAnchorCompatible: true,
  },
];

// Color Thermal Advice Generator (Section 3.C)
export function getColorThermalAdvice(weather: WeatherConsensus): {
  recommendedPalette: string[];
  reason: string;
  caution: string;
} {
  const isHighUvOrHot = weather.temp >= 24 || weather.uvIndex >= 5;
  const isCold = weather.temp <= 10;
  const isRainy = weather.precipitationProb >= 50 || weather.condition === 'rainy';
  const isMuggy = (weather.dewPoint ?? 10) >= 16;

  if (isHighUvOrHot) {
    return {
      recommendedPalette: ['#ffffff', '#fef08a', '#e0f2fe', '#f5f5f4'],
      reason: `Güneş ışığını ve UV radyasyonunu (UV: ${weather.uvIndex}) yansıtan açık renkler (Beyaz, bej, açık pastel) vücut ısısını korur.`,
      caution: isMuggy
        ? `Çiy noktası yüksek (${weather.dewPoint}°C); koyu renkli ve sentetik dokulardan kaçının.`
        : 'Güneş altında koyu renkler ısıyı hızla hapsedeceğinden terlemeyi tetikler.',
    };
  }

  if (isCold) {
    return {
      recommendedPalette: ['#18181b', '#1e293b', '#374151', '#450a0a'],
      reason: 'Isıyı soğuran ve muhafaza eden koyu tonlar (Siyah, antrasit, lacivert) kış güneşinin termal enerjisini değerlendirir.',
      caution: 'Akşam saatlerinde fark edilirlik için açık tonlu küçük bir aksesuar bulundurun.',
    };
  }

  if (isRainy) {
    return {
      recommendedPalette: ['#334155', '#475569', '#1e1b4b', '#0f172a'],
      reason: 'Yağışlı ve çamurlu havalarda leke ve su sıçramalarına karşı koyu renk alt giyim tercih edilmelidir.',
      caution: 'Açık renk kanvas veya süet ayakkabılardan kaçınınız.',
    };
  }

  return {
    recommendedPalette: ['#64748b', '#cbd5e1', '#3b82f6', '#f8fafc'],
    reason: 'Ilıman havada kontrast yaratacak nötr tonlar (Gri, Denim Mavisi, Kırık Beyaz) dengeli konfor sağlar.',
    caution: 'Sabah ve akşam sıcaklık farkına göre kolay kombinlenen ara tonlar seçin.',
  };
}

function extractPhaseMetrics(
  weather: WeatherConsensus,
  targetHours: number[],
  fallbackDelta: number
): { temp: number; feelsLike: number; precipProb: number; windSpeed: number } {
  const matching = (weather.hourly || []).filter((h: HourlyForecastPoint) =>
    targetHours.includes(h.hourNumber)
  );
  if (matching.length > 0) {
    const avgTemp = Math.round(matching.reduce((s, h) => s + h.temp, 0) / matching.length);
    const avgFeel = Math.round(matching.reduce((s, h) => s + h.feelsLike, 0) / matching.length);
    const maxPrecip = Math.max(...matching.map((h) => h.precipitationProb));
    const avgWind = Math.round(matching.reduce((s, h) => s + h.windSpeed, 0) / matching.length);
    return { temp: avgTemp, feelsLike: avgFeel, precipProb: maxPrecip, windSpeed: avgWind };
  }
  const est = Math.round(weather.temp + fallbackDelta);
  return {
    temp: est,
    feelsLike: Math.round(weather.feelsLike + fallbackDelta),
    precipProb: weather.precipitationProb,
    windSpeed: weather.windSpeed,
  };
}

function buildPhaseStep(
  phase: 'morning' | 'midday' | 'evening',
  timeRange: string,
  metrics: { temp: number; feelsLike: number; precipProb: number; windSpeed: number },
  segment: BudgetSegment,
  thermalOffsetC: number,
  dewPoint: number,
  country: string
): LayerTimelineStep {
  const effectiveTemp = Math.round((metrics.feelsLike + thermalOffsetC) * 10) / 10;
  const isRainy = metrics.precipProb >= 40;
  const isWindy = metrics.windSpeed >= 22;
  const market = getMarketProfileForCountry(country);
  const tierKey = segment === 'premium' || segment === 'luxury' ? 'luxury' : segment === 'smart' ? 'smart' : 'essential';
  const brands = market.tiers[tierKey].referenceBrands.slice(0, 2).join('/');

  const phaseLabel = phase === 'morning' ? 'Sabah' : phase === 'midday' ? 'Öğle' : 'Akşam';

  // Cold Regime (<= 10°C)
  if (effectiveTemp <= 10) {
    if (tierKey === 'essential') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle: `${phaseLabel}: 3 Kış Katmanı Aktif`,
        actionDescription: `Termal içlik + polar/sweatshirt + dolgulu mont (${brands}).`,
        activeItems: [
          'Termal Uzun Kollu İçlik',
          '3 İplik Polar Sweatshirt / Triko',
          isRainy ? 'Su İtici Kapüşonlu Parka' : 'Şişme Mont (Puffer)',
          'Kalın Kot & Su İtici Bot',
        ],
        thermalTip: `${metrics.feelsLike}°C hissedilen soğukta dış katmanı kapalı tutun.`,
      };
    }
    if (tierKey === 'smart') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle: `${phaseLabel}: Merinos & Yün Kaban`,
        actionDescription: `İnce merinos kazak + yün kaban veya kaz tüyü mont (${brands}).`,
        activeItems: [
          'Pamuk/Termal Taban',
          'İnce Merinos Yünü Triko Kazak',
          isRainy ? 'Su Geçirmez Kapüşonlu Kaban' : 'Yün Kaşe Kaban / Kaz Tüyü Mont',
          'Deri Chelsea Bot',
        ],
        thermalTip: `${metrics.feelsLike}°C soğukta merinos yünü ağırlık yapmadan ısıtır.`,
      };
    }
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle: `${phaseLabel}: Kaşmir + Gore-Tex Kabuk`,
      actionDescription: `Merinos içlik + saf kaşmir + Gore-Tex 3L kabuk (${brands}).`,
      activeItems: [
        '200g Merinos Termal Taban',
        '%100 Saf Kaşmir Triko',
        'Gore-Tex Hardshell Yalıtımlı Kaban',
        'Vibram Tabanlı Deri Bot',
      ],
      thermalTip: `${metrics.feelsLike}°C koşulda nefes alan membran teri dışarı atar.`,
    };
  }

  // Cool / Transition Regime (11°C - 17°C)
  if (effectiveTemp <= 17) {
    if (tierKey === 'essential') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle:
          phase === 'midday' ? `${phaseLabel}: Ceket Önü Açık / Esnek` : `${phaseLabel}: Ara Katman + Ceket`,
        actionDescription: `Pamuklu tişört + gömlek/hoodie + rüzgarlık/kot ceket (${brands}).`,
        activeItems: [
          'Basic %100 Pamuklu Tişört',
          'Flanel Gömlek / 3 İplik Hoodie',
          isRainy ? 'Su Geçirmez Yağmurluk' : isWindy ? 'Rüzgarlık / Trençkot' : 'Denim Ceket',
          'Kot veya Chino Pantolon',
        ],
        thermalTip: `${metrics.temp}°C geçiş havasında fermuar/düğmeli katman seçin.`,
      };
    }
    if (tierKey === 'smart') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle: `${phaseLabel}: Gabardin Trençkot & Triko`,
        actionDescription: `Oxford gömlek veya ince triko üzerine su itici trençkot (${brands}).`,
        activeItems: [
          'Supima Pamuk Tişört',
          'Oxford Gömlek / İnce Merinos Triko',
          'Su İtici Klasik Gabardin Trençkot',
          'Gabardin Chino & Deri Sneaker',
        ],
        thermalTip: `Rüzgar (${metrics.windSpeed} km/s) etkisini gabardin doku dengeler.`,
      };
    }
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle: `${phaseLabel}: Teknik DWR Trençkot`,
      actionDescription: `19.5 mikron merinos polo + DWR rüzgar/su itici kabuk (${brands}).`,
      activeItems: [
        'Merinos Yünü Polo Triko',
        'DWR Kaplamalı Teknik Trençkot / Süet Ceket',
        'Elastan Katkılı Teknik Yün Pantolon',
      ],
      thermalTip: `Çiy noktası ${dewPoint}°C iken doğal lifler terlemeyi önler.`,
    };
  }

  // Mild Regime (18°C - 24°C)
  if (effectiveTemp <= 24) {
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle:
        phase === 'midday' ? `${phaseLabel}: Ceketi Çıkar / Tek Katman` : `${phaseLabel}: Hafif Gömlek / İnce Üst`,
      actionDescription:
        phase === 'midday'
          ? `Dış katmanı çantaya/omza alın; nefes alan tek katmanla devam edin (${brands}).`
          : `Pamuklu tişört üzerine önü açık gömlek veya ince hırka (${brands}).`,
      activeItems:
        phase === 'midday'
          ? ['%100 Pamuk / Keten Üst', 'İnce Chino Pantolon', 'Nefes Alan Sneaker']
          : ['Basic Pamuklu Tişört', 'Uzun Kollu Oxford / Keten Gömlek', isRainy ? 'Katlanır Şemsiye' : 'Chino Pantolon'],
      thermalTip: `${metrics.temp}°C ılıman havada kolay taşınabilir ince katman kullanın.`,
    };
  }

  // Hot Regime (>= 25°C)
  return {
    timeRange,
    phase,
    expectedTemp: metrics.temp,
    feelsLikeTemp: metrics.feelsLike,
    precipitationProb: metrics.precipProb,
    actionTitle: `${phaseLabel}: Maksimum Nefes Alabilirlik`,
    actionDescription: `Açık renkli saf keten veya ince pamuklu tek katman (${brands}).`,
    activeItems: [
      tierKey === 'essential' ? 'Açık Renk %100 Pamuk Tişört (160 GSM)' : '%100 Saf Keten Gömlek / AIRism Tişört',
      'İnce Keten-Pamuk Şort veya Bol Chino',
      'Hava Alan Bez Sneaker / Loafer & UV Gözlük',
    ],
    thermalTip: `${metrics.temp}°C sıcakta açık renkler güneş radyasyonunu yansıtır.`,
  };
}

export function generateLayerTimeline(
  weather: WeatherConsensus,
  segment: BudgetSegment,
  thermalOffsetC: number = 0,
  country: string = 'Türkiye'
): LayerTimelineStep[] {
  const morningMetrics = extractPhaseMetrics(weather, [7, 8, 9, 10], -3);
  const middayMetrics = extractPhaseMetrics(weather, [12, 13, 14, 15, 16], 2);
  const eveningMetrics = extractPhaseMetrics(weather, [18, 19, 20, 21, 22], -2);
  const dewPoint = weather.dewPoint ?? 10;

  return [
    buildPhaseStep('morning', '07:30 - 10:30', morningMetrics, segment, thermalOffsetC, dewPoint, country),
    buildPhaseStep('midday', '12:00 - 16:00', middayMetrics, segment, thermalOffsetC, dewPoint, country),
    buildPhaseStep('evening', '18:30 - 22:30', eveningMetrics, segment, thermalOffsetC, dewPoint, country),
  ];
}

export function generateDirectOutfit(
  weather: WeatherConsensus,
  segment: BudgetSegment,
  thermalOffsetC: number = 0,
  country: string = 'Türkiye'
): ClothingItem[] {
  const effectiveTemp = weather.feelsLike + thermalOffsetC;
  const isCold = effectiveTemp <= 12;
  const isHot = effectiveTemp >= 23;
  const isRain = weather.precipitationProb >= 40 || weather.condition === 'rainy';
  const market = getMarketProfileForCountry(country);
  const tierKey = segment === 'premium' || segment === 'luxury' ? 'luxury' : segment === 'smart' ? 'smart' : 'essential';
  const brandHint = market.tiers[tierKey].referenceBrands.slice(0, 3).join(' / ');

  if (tierKey === 'essential') {
    if (isCold) {
      return [
        { id: 'e-1', garmentTypeId: 'sweatshirt', name: '3 İplik Polar Sweatshirt', category: 'mid', segment: 'essential', material: 'Şardonlu Pamuk/Polar (320 GSM)', warmth: 4, waterResistance: 'none', windResistance: 'low', colorName: 'Antrasit', colorHex: '#374151', colorType: 'dark', description: 'Yüksek ısı koruması.', brandHint },
        { id: 'e-2', garmentTypeId: isRain ? 'coat-parka' : 'puffer', name: isRain ? 'Su İtici Kapüşonlu Parka' : 'Şişme Mont (Puffer)', category: 'outer', segment: 'essential', material: 'Mikrofiber & Elyaf Dolgu', warmth: 5, waterResistance: isRain ? 'waterproof' : 'light', windResistance: 'high', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Soğuk ve rüzgardan tam koruma.', brandHint },
        { id: 'e-3', garmentTypeId: 'jeans', name: 'Kalın Denim (Kot) Pantolon', category: 'bottom', segment: 'essential', material: '%100 Pamuklu 12.5 oz Kot', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Koyu İndigo', colorHex: '#1e293b', colorType: 'dark', description: 'Rüzgara dayanıklı klasik parça.', brandHint },
        { id: 'e-4', garmentTypeId: 'winter-boots', name: 'Suya Dayanıklı Tabanlı Bot', category: 'footwear', segment: 'essential', material: 'Su İtici Saya / Kauçuk Taban', warmth: 4, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Zemin soğuğunu keser.', brandHint },
      ];
    }
    if (isHot) {
      return [
        { id: 'e-5', garmentTypeId: 'short-sleeve-tee', name: 'Basic %100 Pamuk Tişört', category: 'base', segment: 'essential', material: '160 GSM Taranmış Pamuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Optik Beyaz', colorHex: '#ffffff', colorType: 'light', description: 'Sıcağı yansıtır ve terletmez.', brandHint },
        { id: 'e-6', garmentTypeId: 'shorts', name: 'İnce Pamuk-Keten Şort / Chino', category: 'bottom', segment: 'essential', material: 'İnce Dokuma Gabardin', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Taş Beji', colorHex: '#e7e5e4', colorType: 'light', description: 'Maksimum ferahlık.', brandHint },
        { id: 'e-7', garmentTypeId: 'sneakers', name: 'Nefes Alan Kanvas Sneaker', category: 'footwear', segment: 'essential', material: 'Hava Alan Kumaş Saya', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Açık Gri', colorHex: '#cbd5e1', colorType: 'light', description: 'Hafif günlük yürüyüş.', brandHint },
      ];
    }
    return [
      { id: 'e-8', garmentTypeId: 'shirt', name: 'Klasik Pamuklu Oxford Gömlek', category: 'mid', segment: 'essential', material: '%100 Pamuk Oxford (185 GSM)', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Açık Mavi', colorHex: '#93c5fd', colorType: 'light', description: 'Dengeli havalar için konforlu.', brandHint },
      { id: 'e-9', garmentTypeId: isRain ? 'rain-jacket' : 'light-jacket', name: isRain ? 'Su Geçirmez Yağmurluk' : 'Denim Ceket / İnce Rüzgarlık', category: 'outer', segment: 'essential', material: 'Pamuk Denim / Ripstop', warmth: 3, waterResistance: isRain ? 'waterproof' : 'light', windResistance: 'medium', colorName: 'Haki / Mavi', colorHex: '#4d7c0f', colorType: 'neutral', description: 'Esintiyi ve çisentiyi keser.', brandHint },
      { id: 'e-10', garmentTypeId: 'woven-trousers', name: 'Rahat Kesim Chino Pantolon', category: 'bottom', segment: 'essential', material: '%98 Pamuk %2 Elastan Twill', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Bej', colorHex: '#d6d3d1', colorType: 'light', description: 'Tüm gün konfor sağlar.', brandHint },
    ];
  }

  if (tierKey === 'smart') {
    if (isCold) {
      return [
        { id: 's-1', garmentTypeId: 'sweater', name: 'İnce Merinos Yünü Triko Kazak', category: 'mid', segment: 'smart', material: '%100 Merinos Yünü', warmth: 4, waterResistance: 'none', windResistance: 'medium', colorName: 'Zümrüt Yeşili', colorHex: '#166534', colorType: 'dark', description: 'Doğal yün ısı regülasyonu.', brandHint },
        { id: 's-2', garmentTypeId: 'coat-parka', name: 'Yün Kaşe Kaban / Su İtici Parka', category: 'outer', segment: 'smart', material: 'Yün Karışım / Membran', warmth: 5, waterResistance: 'light', windResistance: 'high', colorName: 'Antrasit', colorHex: '#1f2937', colorType: 'dark', description: 'Şehir şıklığı ve rüzgar koruması.', brandHint },
        { id: 's-3', garmentTypeId: 'woven-trousers', name: 'Tok Gabardin / Yün Karışım Pantolon', category: 'bottom', segment: 'smart', material: 'Pamuk-Yün Flanel', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Füme', colorHex: '#374151', colorType: 'dark', description: 'Soğuk geçirmez tok dokuma.', brandHint },
        { id: 's-4', garmentTypeId: 'winter-boots', name: 'Su Geçirmez Deri Chelsea Bot', category: 'footwear', segment: 'smart', material: 'Doğal Deri & Kauçuk Taban', warmth: 4, waterResistance: 'waterproof', windResistance: 'high', colorName: 'Siyah', colorHex: '#09090b', colorType: 'dark', description: 'Yağışlı zeminde kuru konfor.', brandHint },
      ];
    }
    if (isHot) {
      return [
        { id: 's-5', garmentTypeId: 'shirt', name: '%100 Saf Keten Gömlek', category: 'mid', segment: 'smart', material: '145 GSM Doğal Keten', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Kırık Beyaz', colorHex: '#fafaf9', colorType: 'light', description: 'Nemi anında buharlaştırır.', brandHint },
        { id: 's-6', garmentTypeId: 'woven-trousers', name: 'Keten-Pamuk Hafif Pantolon / Şort', category: 'bottom', segment: 'smart', material: '%55 Keten %45 Pamuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Kum Beji', colorHex: '#f5f5f4', colorType: 'light', description: 'Serinlik hissi verir.', brandHint },
        { id: 's-7', garmentTypeId: 'sneakers', name: 'Süet Loafer / Deri Sneaker', category: 'footwear', segment: 'smart', material: 'Nefes Alan Yumuşak Nubuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Taba', colorHex: '#78350f', colorType: 'neutral', description: 'Zarif yaz adımı.', brandHint },
      ];
    }
    return [
      { id: 's-8', garmentTypeId: 'sweater', name: 'Supima Pamuk / Merinos Polo Triko', category: 'mid', segment: 'smart', material: 'Supima Pamuk & Merinos', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Terletmeyen doğal doku.', brandHint },
      { id: 's-9', garmentTypeId: 'coat-parka', name: 'Su İtici Klasik Gabardin Trençkot', category: 'outer', segment: 'smart', material: '290 GSM Pamuk Gabardin', warmth: 3, waterResistance: 'light', windResistance: 'high', colorName: 'Klasik Bej', colorHex: '#d4b996', colorType: 'light', description: 'Rüzgar ve çisenti kalkanı.', brandHint },
      { id: 's-10', garmentTypeId: 'woven-trousers', name: 'Esnek Gabardin Chino Pantolon', category: 'bottom', segment: 'smart', material: 'Pamuk-Elastan Twill', warmth: 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Taş Rengi', colorHex: '#e7e5e4', colorType: 'light', description: 'Şehir içi esnek konfor.', brandHint },
    ];
  }

  // Luxury / Technical Tier
  if (isCold) {
    return [
      { id: 'p-1', garmentTypeId: 'sweater', name: '%100 Saf Kaşmir Balıkçı Yaka Kazak', category: 'mid', segment: 'luxury', material: 'Moğolistan Saf Kaşmiri', warmth: 5, waterResistance: 'none', windResistance: 'medium', colorName: 'Gece Mavisi', colorHex: '#0f172a', colorType: 'dark', description: 'Ultra hafiflikte maksimum yalıtım.', brandHint },
      { id: 'p-2', garmentTypeId: 'rain-jacket', name: 'Gore-Tex 3L Yalıtımlı Hardshell Kaban', category: 'outer', segment: 'luxury', material: 'GORE-TEX® ePE Membran', warmth: 5, waterResistance: 'waterproof', windResistance: 'high', colorName: 'Kömür Siyahı', colorHex: '#1f2937', colorType: 'dark', description: 'Fırtına ve sağanakta sıfır geçirgenlik.', brandHint },
      { id: 'p-3', garmentTypeId: 'woven-trousers', name: 'İtalyan Yün Flanel Pantolon', category: 'bottom', segment: 'luxury', material: '100% Virgin Wool Flanel', warmth: 4, waterResistance: 'none', windResistance: 'medium', colorName: 'Antrasit', colorHex: '#374151', colorType: 'dark', description: 'Zarif ve sıcak tutan dokuma.', brandHint },
      { id: 'p-4', garmentTypeId: 'winter-boots', name: 'Vibram Tabanlı Su Geçirmez Deri Bot', category: 'footwear', segment: 'luxury', material: 'Tam Yağlı Deri + Gore-Tex', warmth: 5, waterResistance: 'waterproof', windResistance: 'high', colorName: 'Koyu Kahve', colorHex: '#451a03', colorType: 'dark', description: 'Kaymaz zemin tutuşu.', brandHint },
    ];
  }
  if (isHot) {
    return [
      { id: 'p-5', garmentTypeId: 'shirt', name: 'İtalyan Saf Keten Gömlek', category: 'mid', segment: 'luxury', material: '%100 Albini Keten Lifleri', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Optik Beyaz', colorHex: '#fafaf9', colorType: 'light', description: 'Maksimum hava geçirgenliği.', brandHint },
      { id: 'p-6', garmentTypeId: 'woven-trousers', name: 'Keten-İpek Karışım Hafif Pantolon', category: 'bottom', segment: 'luxury', material: 'Keten & İpek Dokuma', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Açık Kum', colorHex: '#f5f5f4', colorType: 'light', description: 'Doğal serinlik hissi.', brandHint },
      { id: 'p-7', name: 'El Yapımı Süet Espadril / Loafer', category: 'footwear', segment: 'luxury', material: 'Hava Alan İtalyan Süet', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Taba', colorHex: '#78350f', colorType: 'neutral', description: 'Üst düzey yaz konforu.', brandHint },
    ];
  }
  return [
    { id: 'p-8', garmentTypeId: 'sweater', name: '19.5 Mikron Merinos Polo Triko', category: 'mid', segment: 'luxury', material: '%100 Ekstra İnce Merinos', warmth: 3, waterResistance: 'none', windResistance: 'low', colorName: 'Adaçayı Yeşili', colorHex: '#84cc16', colorType: 'neutral', description: 'Sıcaklık dalgalanmalarına adapte olur.', brandHint },
    { id: 'p-9', garmentTypeId: 'coat-parka', name: 'Schoeller DWR Teknik Trençkot', category: 'outer', segment: 'luxury', material: 'İsviçre Schoeller Membran', warmth: 3, waterResistance: 'waterproof', windResistance: 'high', colorName: 'Karamel Bej', colorHex: '#b45309', colorType: 'light', description: 'Ultra hafif rüzgar ve yağmur kalkanı.', brandHint },
    { id: 'p-10', garmentTypeId: 'woven-trousers', name: 'Teknik Merinos Yün Pantolon', category: 'bottom', segment: 'luxury', material: 'Elastan Katkılı Merinos', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Üstün hareket özgürlüğü.', brandHint },
  ];
}

export function matchAnchorItem(
  anchor: ClothingItem,
  weather: WeatherConsensus,
  thermalOffsetC: number = 0
): AnchorMatchResult {
  const effectiveTemp = weather.feelsLike + thermalOffsetC;
  const isCold = effectiveTemp <= 12;
  const isHot = effectiveTemp >= 23;

  let complements: ClothingItem[] = [];
  let colorHarmony = '';
  let weatherFit = '';

  if (anchor.id === 'anc-denim-jacket') {
    complements = [
      { id: 'c-1', name: isCold ? 'Oduncu Flanel Gömlek / Hoodie' : 'Optik Beyaz Basic Tişört', category: 'base', segment: 'essential', material: isCold ? 'Pamuk Flanel' : '%100 Pamuk', warmth: isCold ? 3 : 1, waterResistance: 'none', windResistance: 'low', colorName: 'Beyaz', colorHex: '#ffffff', colorType: 'light', description: 'Mavi denim ile temiz kontrast.' },
      { id: 'c-2', name: isCold ? 'Antrasit Kalın Kot Pantolon' : 'Bej Chino Pantolon', category: 'bottom', segment: 'essential', material: 'Pamuklu Twill', warmth: isCold ? 3 : 2, waterResistance: 'none', windResistance: 'medium', colorName: isCold ? 'Antrasit' : 'Bej', colorHex: isCold ? '#374151' : '#e7e5e4', colorType: 'neutral', description: 'Ceketin maviliğini dengeler.' },
      { id: 'c-3', name: 'Beyaz Deri Sneaker', category: 'footwear', segment: 'essential', material: 'Deri Saya', warmth: 2, waterResistance: 'light', windResistance: 'medium', colorName: 'Beyaz', colorHex: '#ffffff', colorType: 'light', description: 'Dinamik bitiriş.' },
    ];
    colorHarmony = 'Mavi kot ceket, beyaz iç katman ve bej/antrasit alt giyimle zamansız denge kurar.';
    weatherFit = `${weather.temp}°C sıcaklıkta öğlen önü açılabilir, akşam serinliğinde iliklenebilir.`;
  } else if (anchor.id === 'anc-beige-trench') {
    complements = [
      { id: 'c-4', name: isCold ? 'Siyah Merinos Triko' : 'Lacivert Poplin Gömlek', category: 'mid', segment: 'smart', material: 'Pamuk/Merinos', warmth: isCold ? 3 : 2, waterResistance: 'none', windResistance: 'low', colorName: 'Lacivert', colorHex: '#0f172a', colorType: 'dark', description: 'Bej rengin parlaklığını dengeler.' },
      { id: 'c-5', name: 'Koyu Gri Gabardin Pantolon', category: 'bottom', segment: 'smart', material: 'Gabardin', warmth: 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Koyu Gri', colorHex: '#4b5563', colorType: 'dark', description: 'Şehirli görünüm.' },
      { id: 'c-6', name: 'Siyah Deri Chelsea Bot', category: 'footwear', segment: 'smart', material: 'Deri', warmth: 3, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Su sıçramalarına dayanıklı.' },
    ];
    colorHarmony = 'Bej tonları, içerideki siyah veya lacivert derin renklerle yüksek kontrast sağlar.';
    weatherFit = `%${weather.precipitationProb} yağış ihtimali ve ${weather.windSpeed} km/s rüzgara karşı gabardin dokusu koruma sağlar.`;
  } else {
    complements = [
      { id: 'c-10', name: isCold ? 'Termal Uzun Kollu İçlik' : 'Nötr Pamuklu Tişört', category: 'base', segment: anchor.segment, material: '%100 Pamuk', warmth: isCold ? 3 : 1, waterResistance: 'none', windResistance: 'low', colorName: 'Kırık Beyaz', colorHex: '#f5f5f4', colorType: 'light', description: 'Nefes alan taban.' },
      { id: 'c-11', name: isHot ? 'İnce Keten Pantolon' : 'Gabardin Chino Pantolon', category: 'bottom', segment: anchor.segment, material: 'Pamuk/Keten', warmth: isHot ? 1 : 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Tamamlayıcı alt katman.' },
      { id: 'c-12', name: 'Şehir Sneaker / Loafer', category: 'footwear', segment: anchor.segment, material: 'Deri', warmth: 2, waterResistance: 'light', windResistance: 'medium', colorName: 'Koyu Kahve', colorHex: '#3b2f2f', colorType: 'dark', description: 'Gün boyu konfor.' },
    ];
    colorHarmony = `${anchor.name} ile uyumlu nötr renk paleti seçilmiştir.`;
    weatherFit = `${weather.temp}°C (His: ${weather.feelsLike}°C) koşulunda ana parçanız merkezde tutularak denge sağlandı.`;
  }

  return {
    anchorItem: anchor,
    complementaryItems: complements,
    colorHarmonyNotes: colorHarmony,
    weatherFitNotes: weatherFit,
  };
}
