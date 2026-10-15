import {
  WeatherConsensus,
  BudgetSegment,
  ClothingItem,
  LayerTimelineStep,
  AnchorMatchResult,
  HourlyForecastPoint,
} from './types';

// Anchor Items Catalogue that users can choose from
export const ANCHOR_ITEMS: ClothingItem[] = [
  {
    id: 'anc-denim-jacket',
    name: 'Klasik Mavi Denim Ceket',
    category: 'outer',
    segment: 'essential',
    material: 'Pamuklu Dayanıklı Kot Dokuma',
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
    id: 'anc-beige-trench',
    name: 'Bej Klasik Trençkot',
    category: 'outer',
    segment: 'essential',
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
    id: 'anc-grey-hoodie',
    name: 'Gri Kapüşonlu Sweatshirt (Hoodie)',
    category: 'mid',
    segment: 'essential',
    material: 'Şardonlu Pamuk-Polyester Karışım',
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
    id: 'anc-black-leather',
    name: 'Siyah Biker Deri / Faux Deri Ceket',
    category: 'outer',
    segment: 'premium',
    material: 'Yumuşak Doğal / Kaliteli Deri',
    warmth: 4,
    waterResistance: 'light',
    windResistance: 'high',
    colorName: 'Kömür Siyahı',
    colorHex: '#18181b',
    colorType: 'dark',
    description: 'Rüzgarı tamamen kesen, güneş ışığını emerek ısıtan iddialı parça.',
    isAnchorCompatible: true,
  },
  {
    id: 'anc-white-linen',
    name: 'Beyaz Keten Gömlek',
    category: 'mid',
    segment: 'premium',
    material: '%100 Saf Doğal Keten (Linen)',
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
    id: 'anc-wool-knit',
    name: 'Merinos Yünü Triko Kazak',
    category: 'mid',
    segment: 'premium',
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

// Color Thermal Advice Generator
export function getColorThermalAdvice(weather: WeatherConsensus): {
  recommendedPalette: string[];
  reason: string;
  caution: string;
} {
  const isHighUvOrHot = weather.temp >= 23 || weather.uvIndex >= 5;
  const isCold = weather.temp <= 10;
  const isRainy = weather.precipitationProb >= 50 || weather.condition === 'rainy';
  const isMuggy = (weather.dewPoint ?? 10) >= 16;

  if (isHighUvOrHot) {
    return {
      recommendedPalette: ['#ffffff', '#fef08a', '#e0f2fe', '#f5f5f4'],
      reason: `Güneş radyasyonunu ve UV ışınlarını (UV: ${weather.uvIndex}) yansıtan açık renkler (Beyaz, Bej, Açık Pastel) yüzey ısısının artmasını önler.`,
      caution: isMuggy
        ? `Çiy noktası yüksek (${weather.dewPoint}°C - bunaltıcı nem); koyu renkli ve sentetik dokulardan kaçının.`
        : 'Güneş altında koyu renkler (Siyah/Lacivert) ısıyı hızla hapsedeceğinden terlemeyi tetikleyebilir.',
    };
  }

  if (isCold) {
    return {
      recommendedPalette: ['#18181b', '#1e293b', '#374151', '#450a0a'],
      reason: 'Koyu renkler (Siyah, Antrasit, Lacivert, Bordo) kış güneşinin termal enerjisini emerek vücut sıcaklığının korunmasına destek olur.',
      caution: 'Hava erken kararacağından akşam yürüyüşlerinde açık tonlu veya reflektörlü küçük aksesuarlar bulundurmanız önerilir.',
    };
  }

  if (isRainy) {
    return {
      recommendedPalette: ['#334155', '#475569', '#1e1b4b', '#0f172a'],
      reason: 'Yağışlı ve ıslak havalarda su damlaları veya zemin sıçramalarının leke bırakmaması için orta ve koyu tonlu alt giyimler tercih edilmelidir.',
      caution: 'Açık renk kanvas veya süet ayakkabılardan kaçınınız.',
    };
  }

  return {
    recommendedPalette: ['#64748b', '#cbd5e1', '#3b82f6', '#f8fafc'],
    reason: 'Ilıman ve dengeli havada kontrast yaratacak nötr tonlar (Gri, Denim Mavisi, Kırık Beyaz) ideal konfor sağlar.',
    caution: 'Sabah ve akşam saatlerindeki sıcaklık farkına göre üst katmanda kolay kombinlenen renkleri seçiniz.',
  };
}

// Helper: Extract phase metrics from real hourly forecast array
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
  dewPoint: number
): LayerTimelineStep {
  // Effective temperature incorporates wind/humidity feelsLike + personal thermal offset
  const effectiveTemp = Math.round((metrics.feelsLike + thermalOffsetC) * 10) / 10;
  const isRainy = metrics.precipProb >= 40;
  const isWindy = metrics.windSpeed >= 22;
  const isHumid = dewPoint >= 16;

  const phaseLabel =
    phase === 'morning' ? 'Sabah' : phase === 'midday' ? 'Öğle' : 'Akşam';

  // 1. Cold Regime (Effective <= 10°C)
  if (effectiveTemp <= 10) {
    if (segment === 'essential') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle: `${phaseLabel}: 3 Tam Kış Katmanı Aktif`,
        actionDescription: isRainy
          ? 'Termal içlik/tişört + kalın polar + su itici kaban kapalı tutulmalı.'
          : 'Uzun kollu pamuklu içlik + polar sweatshirt + şişme mont/kaban.',
        activeItems: [
          'Pamuklu Uzun Kollu İç Katman',
          'Kalın Polar / Triko Kazak',
          isRainy ? 'Kapüşonlu Su İtici Parka' : 'Şişme Kaban / Kalın Mont',
          'Kalın Kot Pantolon & Bot',
        ],
        thermalTip: `Hissedilen ${metrics.feelsLike}°C${thermalOffsetC !== 0 ? ` (kişisel kalibrasyonla ${effectiveTemp}°C)` : ''} soğukta ısı kaybını önlemek için boyun ve bilekleri koruyun.`,
      };
    }
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle: `${phaseLabel}: Teknik Yalıtım + Membran Kabuk`,
      actionDescription: 'Merinos taban + kaşmir/yün orta katman + rüzgar ve su geçirmez hardshell.',
      activeItems: [
        '200g Merinos Yünü Termal İçlik',
        'Saf Kaşmir / Merinos Triko',
        'Gore-Tex Hardshell Yalıtımlı Kaban',
        'Vibram Tabanlı Deri Bot',
      ],
      thermalTip: `${metrics.feelsLike}°C hissedilen soğukta merinos yünü teri hapseden pamuğun aksine kuru ısı yalıtımı sağlar.`,
    };
  }

  // 2. Cool / Transition Regime (11°C - 17°C)
  if (effectiveTemp <= 17) {
    if (segment === 'essential') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle:
          phase === 'midday'
            ? `${phaseLabel}: Dış Katman Önü Açık / Esnek Mod`
            : `${phaseLabel}: Koruyucu Ara Katman + Ceket`,
        actionDescription:
          phase === 'midday'
            ? 'Yürüyüş temposunda ceketin önünü açarak aşırı ısınmayı dengeleyin.'
            : 'Tişört + gömlek/hırka üzerine rüzgar kesen trençkot veya denim ceket giyin.',
        activeItems: [
          'Basic Pamuklu Tişört',
          'Flanel Gömlek / İnce Triko Hırka',
          isRainy ? 'Su İtici Trençkot + Şemsiye' : isWindy ? 'Rüzgarlık / Trençkot' : 'Denim Ceket / Bomber Ceket',
          'Chino veya Kanvas Pantolon',
        ],
        thermalTip: `${metrics.temp}°C (Rüzgar: ${metrics.windSpeed} km/s) geçiş havasında katmanları fermuar/düğme ile kolayca ayarlayın.`,
      };
    }
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle: `${phaseLabel}: Modüler Merinos & DWR Kabuk`,
      actionDescription: 'İnce merinos triko üzerine DWR su/rüzgar itici hafif trençkot.',
      activeItems: [
        'İnce Merinos Yünü Polo Triko',
        isRainy || isWindy ? 'DWR Kaplamalı Teknik Trençkot' : 'Yumuşak Deri / Süet Ceket',
        'Elastan Katkılı Teknik Yün Pantolon',
      ],
      thermalTip: `Çiy noktası ${dewPoint}°C seviyesindeyken mikro gözenekli doğal lifler vücut ısısını sabit tutar.`,
    };
  }

  // 3. Mild / Pleasant Regime (18°C - 24°C)
  if (effectiveTemp <= 24) {
    if (segment === 'essential') {
      return {
        timeRange,
        phase,
        expectedTemp: metrics.temp,
        feelsLikeTemp: metrics.feelsLike,
        precipitationProb: metrics.precipProb,
        actionTitle:
          phase === 'midday'
            ? `${phaseLabel}: Ceketi Çıkar / Tek Katman Konforu`
            : `${phaseLabel}: Hafif Gömlek / İnce Üst Katman`,
        actionDescription:
          phase === 'midday'
            ? 'Dış katmanı çantaya veya omza alın; tişört veya kolları kıvrık gömlekle devam edin.'
            : 'Nefes alan pamuklu tişört üzerine önü açık ince gömlek tercih edin.',
        activeItems:
          phase === 'midday'
            ? ['Hafif Pamuklu Tişört', 'Gömlek (Kollar Kıvrık / Opsiyonel)', 'Nefes Alan Kanvas Sneaker']
            : ['Basic Pamuklu Tişört', 'Oxford / Poplin İnce Gömlek', isRainy ? 'Hafif Katlanır Şemsiye' : 'İnce Chino Pantolon'],
        thermalTip: `${metrics.temp}°C ılıman havada ağır dış katmanlar terletebilir; kolay taşınabilir ince parçalar seçin.`,
      };
    }
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle:
        phase === 'midday'
          ? `${phaseLabel}: Tek Katman Doğal Lif Ferahlığı`
          : `${phaseLabel}: Keten-Merinos Hafif Geçiş`,
      actionDescription:
        phase === 'midday'
          ? 'Üst katmanı çıkarıp nefes alan keten/pamuk tabanla devam edin.'
          : 'İnce keten gömlek veya hafif ipek-pamuk triko ile dengeli konfor.',
      activeItems: [
        'İtalyan Keten / Supima Pamuk Gömlek',
        phase === 'midday' ? 'UV400 Polarize Güneş Gözlüğü' : 'İnce Triko (Omuzda / Hazır)',
        'Hafif Gabardin Pantolon & Deri Loafer',
      ],
      thermalTip: `${metrics.temp}°C'de ${isHumid ? 'yüksek nem nedeniyle keten lifleri' : 'supima pamuk dokusu'} terlemeyi sıfıra indirir.`,
    };
  }

  // 4. Hot Summer Regime (>= 25°C)
  if (segment === 'essential') {
    return {
      timeRange,
      phase,
      expectedTemp: metrics.temp,
      feelsLikeTemp: metrics.feelsLike,
      precipitationProb: metrics.precipProb,
      actionTitle: `${phaseLabel}: Maksimum Nefes Alabilirlik (Sıcak Mod)`,
      actionDescription: 'Ceket veya katman kullanmayın; açık renkli, bol kesim tek katman giyin.',
      activeItems: [
        'Açık Renk İnce Pamuk / Keten Karışımlı Tişört',
        'İnce Keten-Pamuk Şort veya Bol Chino',
        'Hava Alan Bez / File Spor Ayakkabı',
        'Güneş Gözlüğü & Şapka',
      ],
      thermalTip: `${metrics.temp}°C (Hissedilen ${metrics.feelsLike}°C) sıcakta açık renkler güneş radyasyonunu yansıtarak serin tutar.`,
    };
  }
  return {
    timeRange,
    phase,
    expectedTemp: metrics.temp,
    feelsLikeTemp: metrics.feelsLike,
    precipitationProb: metrics.precipProb,
    actionTitle: `${phaseLabel}: Saf Keten & UV Koruma Modu`,
    actionDescription: '%100 saf keten dokuma ile hava sirkülasyonunu maksimumda tutun.',
    activeItems: [
      '%100 Saf Fransız/İtalyan Keten Gömlek (Açık Ton)',
      'Keten-İpek Karışımlı Hafif Pantolon / Şort',
      'El Yapımı Hava Alan Süet Espadril / Loafer',
      'UV Korumalı Polarize Gözlük',
    ],
    thermalTip: `${metrics.temp}°C sıcaklık ve ${dewPoint}°C çiy noktasında saf keten, nemi ciltten saniyeler içinde uzaklaştırır.`,
  };
}

// Generate Modular Layering Timeline driven by real hourly forecast & personal thermal offset
export function generateLayerTimeline(
  weather: WeatherConsensus,
  segment: BudgetSegment,
  thermalOffsetC: number = 0
): LayerTimelineStep[] {
  const morningMetrics = extractPhaseMetrics(weather, [7, 8, 9, 10], -3);
  const middayMetrics = extractPhaseMetrics(weather, [12, 13, 14, 15, 16], 2);
  const eveningMetrics = extractPhaseMetrics(weather, [18, 19, 20, 21, 22], -2);
  const dewPoint = weather.dewPoint ?? 10;

  return [
    buildPhaseStep('morning', '07:30 - 10:30', morningMetrics, segment, thermalOffsetC, dewPoint),
    buildPhaseStep('midday', '12:00 - 16:00', middayMetrics, segment, thermalOffsetC, dewPoint),
    buildPhaseStep('evening', '18:30 - 22:30', eveningMetrics, segment, thermalOffsetC, dewPoint),
  ];
}

// Generate Direct Outfit (Stand-alone single outfit calibrated with personal thermal offset)
export function generateDirectOutfit(
  weather: WeatherConsensus,
  segment: BudgetSegment,
  thermalOffsetC: number = 0
): ClothingItem[] {
  const effectiveTemp = weather.feelsLike + thermalOffsetC;
  const isCold = effectiveTemp <= 12;
  const isHot = effectiveTemp >= 23;
  const isRain = weather.precipitationProb >= 40 || weather.condition === 'rainy';

  if (segment === 'essential') {
    if (isCold) {
      return [
        { id: 'e-1', name: 'Polar Sweatshirt / Kalın Triko', category: 'mid', segment: 'essential', material: 'Şardonlu Polar', warmth: 4, waterResistance: 'none', windResistance: 'low', colorName: 'Antrasit', colorHex: '#374151', colorType: 'dark', description: 'Tek parça yüksek ısı koruması.' },
        { id: 'e-2', name: isRain ? 'Su İtici Kapüşonlu Parka' : 'Standart Şişme Kaban / Mont', category: 'outer', segment: 'essential', material: 'Sentetik Elyaf Dolgulu Naylon', warmth: 5, waterResistance: isRain ? 'waterproof' : 'light', windResistance: 'high', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Soğuk ve rüzgardan tam koruma.' },
        { id: 'e-3', name: 'Kalın Denim Pantolon', category: 'bottom', segment: 'essential', material: '%100 Pamuklu Kalın Kot', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Koyu Mavi', colorHex: '#1e293b', colorType: 'dark', description: 'Rüzgara dayanıklı klasik parça.' },
        { id: 'e-4', name: 'Suya Dayanıklı Tabanlı Bot', category: 'footwear', segment: 'essential', material: 'Suni Deri / Kauçuk Taban', warmth: 4, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Zemin soğuğunu keser.' },
      ];
    } else if (isHot) {
      return [
        { id: 'e-5', name: 'Hafif Pamuklu Basic Tişört', category: 'base', segment: 'essential', material: 'Taranmış İnce Pamuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Beyaz', colorHex: '#ffffff', colorType: 'light', description: 'Sıcağı yansıtır ve terletmez.' },
        { id: 'e-6', name: 'İnce Keten-Pamuk Şort / Chino', category: 'bottom', segment: 'essential', material: 'Pamuklu İnce Gabardin', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Taş Rengi', colorHex: '#e7e5e4', colorType: 'light', description: 'Maksimum ferahlık ve nefes alabilirlik.' },
        { id: 'e-7', name: 'Nefes Alan Kanvas Spor Ayakkabı', category: 'footwear', segment: 'essential', material: 'Bez / Kumaş Saya', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Açık Gri', colorHex: '#cbd5e1', colorType: 'light', description: 'Hafif ve terletmeyen günlük yürüyüş.' },
      ];
    } else {
      return [
        { id: 'e-8', name: 'Klasik Pamuklu Oxford Gömlek', category: 'mid', segment: 'essential', material: '%100 Pamuk Oxford Dokuma', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Açık Mavi', colorHex: '#93c5fd', colorType: 'light', description: 'Dengeli havalar için tek başına şık ve konforlu.' },
        { id: 'e-9', name: isRain ? 'Su İtici Klasik Trençkot' : 'Hafif Trençkot veya Bomber Ceket', category: 'outer', segment: 'essential', material: 'Pamuk-Polyester Karışım', warmth: 3, waterResistance: 'light', windResistance: 'medium', colorName: 'Haki Yeşili', colorHex: '#4d7c0f', colorType: 'neutral', description: 'Ilık hava esintisini ve çisenti yağışı keser.' },
        { id: 'e-10', name: 'Rahat Kesim Chino Pantolon', category: 'bottom', segment: 'essential', material: 'Esnek Pamuklu Twill', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Bej', colorHex: '#d6d3d1', colorType: 'light', description: 'Tüm gün konfor sağlar.' },
      ];
    }
  } else {
    // Premium Segment
    if (isCold) {
      return [
        { id: 'p-1', name: '%100 Kaşmir Balıkçı Yaka Kazak', category: 'mid', segment: 'premium', material: 'Moğolistan Saf Kaşmiri', warmth: 5, waterResistance: 'none', windResistance: 'medium', colorName: 'Gece Mavisi', colorHex: '#0f172a', colorType: 'dark', description: 'Ultra hafiflikte en yüksek termal yalıtım.' },
        { id: 'p-2', name: 'Gore-Tex Hardshell Yalıtımlı Kaban', category: 'outer', segment: 'premium', material: '3 Katmanlı Nefes Alabilir Membran', warmth: 5, waterResistance: 'waterproof', windResistance: 'high', colorName: 'Kömür Grisi', colorHex: '#1f2937', colorType: 'dark', description: 'Su ve rüzgarı sıfıra indiren ileri teknoloji.' },
        { id: 'p-3', name: 'Yün Karışımlı Özel Dikim Pantolon', category: 'bottom', segment: 'premium', material: 'İtalyan Yün Flaneli', warmth: 4, waterResistance: 'none', windResistance: 'medium', colorName: 'Füme', colorHex: '#374151', colorType: 'dark', description: 'Hem resmi hem sıcak tutan zarif dokuma.' },
        { id: 'p-4', name: 'Vibram Tabanlı Su Geçirmez Deri Bot', category: 'footwear', segment: 'premium', material: 'Tam Yağlı Dana Derisi + Membran', warmth: 5, waterResistance: 'waterproof', windResistance: 'high', colorName: 'Koyu Kahve', colorHex: '#451a03', colorType: 'dark', description: 'Kaymaz zemin tutuşu ve tam yalıtım.' },
      ];
    } else if (isHot) {
      return [
        { id: 'p-5', name: 'İtalyan Keten Saf Gömlek', category: 'mid', segment: 'premium', material: '%100 Fransız/İtalyan Keten Lifleri', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Kırık Beyaz', colorHex: '#fafaf9', colorType: 'light', description: 'Doğal lif yapısıyla nemi anında buharlaştırır.' },
        { id: 'p-6', name: 'Hafif Keten-İpek Karışım Pantolon', category: 'bottom', segment: 'premium', material: 'Keten & İpek Karışımlı Kumaş', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Açık Kum', colorHex: '#f5f5f4', colorType: 'light', description: 'Tenle temas ettiğinde serinlik hissi verir.' },
        { id: 'p-7', name: 'El Yapımı Deri Loafer / Süet Espadril', category: 'footwear', segment: 'premium', material: 'Hava Alan Yumuşak Nubuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Taba', colorHex: '#78350f', colorType: 'neutral', description: 'Zarif yaz konforu.' },
      ];
    } else {
      return [
        { id: 'p-8', name: 'Merinos Yünü Polo Yaka Triko', category: 'mid', segment: 'premium', material: '19.5 Mikron Merinos Yünü', warmth: 3, waterResistance: 'none', windResistance: 'low', colorName: 'Adaçayı Yeşili', colorHex: '#84cc16', colorType: 'neutral', description: 'Koku yapmaz, sıcaklık dalgalanmalarına adapte olur.' },
        { id: 'p-9', name: 'Teknik DWR Kaplamalı Trençkot', category: 'outer', segment: 'premium', material: 'İsviçre Schoeller Rüzgar Kumaşı', warmth: 3, waterResistance: 'light', windResistance: 'high', colorName: 'Karamel Bej', colorHex: '#b45309', colorType: 'light', description: 'Ultra hafif rüzgarlık ve yağmur koruyucu.' },
        { id: 'p-10', name: 'Teknik Yün Jogger / Pantolon', category: 'bottom', segment: 'premium', material: 'Elastan Katkılı Merinos Yünü', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Üstün hareket özgürlüğü.' },
      ];
    }
  }
}

// "Bu Parçayla Kombinle" Engine (Matches selected anchor item + thermal offset)
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
      {
        id: 'c-1',
        name: isCold ? 'Kalın Oduncu Gömleği / Sweatshirt' : 'Optik Beyaz Basic Tişört',
        category: 'base',
        segment: 'essential',
        material: isCold ? 'Şardonlu Pamuk Flanel' : 'Pamuk',
        warmth: isCold ? 3 : 1,
        waterResistance: 'none',
        windResistance: 'low',
        colorName: isCold ? 'Ekose Gri/Beyaz' : 'Beyaz',
        colorHex: '#ffffff',
        colorType: 'light',
        description: isCold ? 'Denim ceketin altında ısı yalıtımını destekler.' : 'Mavi denim ile en temiz ve zamansız kontrast.',
      },
      {
        id: 'c-2',
        name: isCold ? 'Antrasit Kargo / Kalın Denim Pantolon' : 'Bej Chino Pantolon',
        category: 'bottom',
        segment: 'essential',
        material: 'Pamuklu Twill',
        warmth: isCold ? 3 : 2,
        waterResistance: 'none',
        windResistance: 'medium',
        colorName: isCold ? 'Antrasit' : 'Bej',
        colorHex: isCold ? '#374151' : '#e7e5e4',
        colorType: 'neutral',
        description: 'Ceketin maviliğini dengeler.',
      },
      {
        id: 'c-3',
        name: 'Beyaz Deri / Kanvas Sneaker',
        category: 'footwear',
        segment: 'essential',
        material: 'Deri Saya',
        warmth: 2,
        waterResistance: 'light',
        windResistance: 'medium',
        colorName: 'Beyaz',
        colorHex: '#ffffff',
        colorType: 'light',
        description: 'Genç ve dinamik bitiriş.',
      },
    ];
    colorHarmony = 'Mavi kot ceket, beyaz iç katman ve bej/antrasit alt giyimle kusursuz bir renk dengesi kurar.';
    weatherFit = isHot
      ? `Hava ${weather.temp}°C olduğu için denim ceketi gündüz omzunuzda taşıyıp akşam serinliğinde giymeniz önerilir.`
      : `Bugünkü ${weather.temp}°C (hissedilen ${weather.feelsLike}°C) sıcaklıkta ceketiniz öğlen açılabilir, akşam esintisinde iliklenebilir.`;
  } else if (anchor.id === 'anc-beige-trench') {
    complements = [
      { id: 'c-4', name: isCold ? 'Siyah Boğazlı Merinos Triko' : 'Lacivert İnce Poplin Gömlek', category: 'mid', segment: 'essential', material: 'İnce Pamuk-Yün', warmth: isCold ? 3 : 2, waterResistance: 'none', windResistance: 'low', colorName: 'Siyah / Lacivert', colorHex: '#0f172a', colorType: 'dark', description: 'Bej rengin parlaklığını dengeleyen derin kontrast.' },
      { id: 'c-5', name: 'Koyu Gri Düz Kesim Pantolon', category: 'bottom', segment: 'essential', material: 'Pamuklu Gabardin', warmth: 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Koyu Gri', colorHex: '#4b5563', colorType: 'dark', description: 'Profesyonel ve şehirli görünüm.' },
      { id: 'c-6', name: 'Siyah Deri Chelsea Bot / Loafer', category: 'footwear', segment: 'essential', material: 'Deri', warmth: 3, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Su sıçramalarına karşı dayanıklı.' },
    ];
    colorHarmony = 'Bej tonları, içerideki siyah veya lacivert derin renklerle birleştiğinde yüksek kontrast ve asalet sağlar.';
    weatherFit = `Havadaki %${weather.precipitationProb} yağış ihtimali ve ${weather.windSpeed} km/s rüzgara karşı trençkotun gabardin dokusu gövdenizi korur.`;
  } else if (anchor.id === 'anc-black-leather') {
    complements = [
      { id: 'c-7', name: isCold ? 'Antrasit Kapüşonlu Hoodie' : 'Gri Melanj Pamuklu Tişört', category: 'base', segment: 'premium', material: 'Pamuk', warmth: isCold ? 3 : 2, waterResistance: 'none', windResistance: 'low', colorName: 'Melanj Gri', colorHex: '#9ca3af', colorType: 'neutral', description: 'Siyah derinin sertliğini kıran yumuşak geçiş.' },
      { id: 'c-8', name: 'Siyah / Koyu Füme Slim Pantolon', category: 'bottom', segment: 'premium', material: 'Esnek Denim', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Füme', colorHex: '#1f2937', colorType: 'dark', description: 'Monokromatik ve modern siluet.' },
      { id: 'c-9', name: 'Siyah Deri Biker Bot', category: 'footwear', segment: 'premium', material: 'Hakiki Deri', warmth: 4, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Rüzgarı tamamen kesen alt koruma.' },
    ];
    colorHarmony = 'Monokromatik gri ve siyah geçişi sokak stiliyle tam uyumludur.';
    weatherFit = isHot
      ? `Dikkat: ${weather.temp}°C sıcaklıkta siyah deri güneş ısısını hızla çeker; yalnızca akşam saatlerinde tercih edin.`
      : `Siyah deri ${weather.windSpeed} km/s rüzgarı tamamen bloke eder ve serin havada vücut ısısını korur.`;
  } else {
    complements = [
      { id: 'c-10', name: isCold ? 'Termal Uzun Kollu İçlik' : 'Nötr Renkli Pamuklu Tişört', category: 'base', segment: anchor.segment, material: 'Pamuk', warmth: isCold ? 3 : 1, waterResistance: 'none', windResistance: 'low', colorName: 'Kırık Beyaz', colorHex: '#f5f5f4', colorType: 'light', description: 'Dengeli zemin.' },
      { id: 'c-11', name: isHot ? 'İnce Keten Karışımlı Pantolon' : 'Rahat Kesim Gabardin Pantolon', category: 'bottom', segment: anchor.segment, material: 'Pamuklu Dokuma', warmth: isHot ? 1 : 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Tamamlayıcı alt katman.' },
      { id: 'c-12', name: 'Şehir Sneaker / Loafer', category: 'footwear', segment: anchor.segment, material: 'Deri / Kanvas', warmth: 2, waterResistance: 'light', windResistance: 'medium', colorName: 'Koyu Kahve', colorHex: '#3b2f2f', colorType: 'dark', description: 'Rahat adım.' },
    ];
    colorHarmony = `${anchor.name} rengi ile uyumlu nötr ve dengeli renk paleti seçilmiştir.`;
    weatherFit = `${weather.temp}°C (hissedilen ${weather.feelsLike}°C) koşulunda ana parçanız merkezde tutularak termal denge sağlanmıştır.`;
  }

  return {
    anchorItem: anchor,
    complementaryItems: complements,
    colorHarmonyNotes: colorHarmony,
    weatherFitNotes: weatherFit,
  };
}
