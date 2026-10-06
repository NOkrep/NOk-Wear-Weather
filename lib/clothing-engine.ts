import {
  WeatherConsensus,
  BudgetSegment,
  OutfitApproach,
  ClothingItem,
  LayerTimelineStep,
  AnchorMatchResult,
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
  const isHighUvOrHot = weather.temp >= 22 || weather.uvIndex >= 5;
  const isCold = weather.temp <= 10;
  const isRainy = weather.precipitationProb >= 50 || weather.condition === 'rainy';

  if (isHighUvOrHot) {
    return {
      recommendedPalette: ['#ffffff', '#fef08a', '#e0f2fe', '#f5f5f4'],
      reason: 'Güneş radyasyonunu ve UV ışınlarını yansıtan açık renkler (Beyaz, Bej, Açık Pastel) vücut ısınızın artmasını önler.',
      caution: 'Güneş altında koyu renkler (Siyah/Lacivert) ısıyı hızla hapsedeceğinden terlemeyi tetikleyebilir.',
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

// Generate Modular Layering Timeline (Morning, Midday, Evening)
export function generateLayerTimeline(
  weather: WeatherConsensus,
  segment: BudgetSegment
): LayerTimelineStep[] {
  const morningTemp = Math.round(weather.temp - 4);
  const middayTemp = Math.round(weather.temp + 3);
  const eveningTemp = Math.round(weather.temp - 2);

  const isRain = weather.precipitationProb >= 40;

  if (segment === 'essential') {
    return [
      {
        timeRange: '07:30 - 10:30',
        phase: 'morning',
        expectedTemp: morningTemp,
        actionTitle: '3 Katman Aktif (Sabah Serinliği)',
        actionDescription: 'Tişört + Gömlek/Hırka + Ceket kapalı tutulmalı.',
        activeItems: ['Basic Pamuklu Tişört', 'Flanel Gömlek / İnce Hırka', 'Denim Ceket / Rüzgarlık', 'Kanvas Pantolon'],
        thermalTip: `${morningTemp}°C serinliğinde rüzgarın göğüs kafesine temasını önlemek için dış katmanı ilikli tutun.`,
      },
      {
        timeRange: '12:00 - 16:00',
        phase: 'midday',
        expectedTemp: middayTemp,
        actionTitle: 'Dış Katmanı Çıkar / Rahat Mod',
        actionDescription: 'Ceketi çıkarıp çantaya/kola asın, gömleğin kollarını kıvırın.',
        activeItems: ['Basic Pamuklu Tişört', 'Gömlek (Önü Açık / Kollar Kıvrık)'],
        thermalTip: `${middayTemp}°C civarında artan güneş ısısında terlememek için hava sirkülasyonu sağlayın.`,
      },
      {
        timeRange: '18:30 - 22:30',
        phase: 'evening',
        expectedTemp: eveningTemp,
        actionTitle: 'Ceketi Tekrar Üzerinize Alın',
        actionDescription: 'Güneş battıktan sonra düşen sıcaklığa karşı dış katmanı tekrar giyin.',
        activeItems: ['Basic Pamuklu Tişört', 'Gömlek', 'Denim Ceket / Rüzgarlık', isRain ? 'Katlanır El Şemsiyesi' : 'Hafif Şal'],
        thermalTip: `${eveningTemp}°C akşam esintisinde boyun ve omuz bölgesini soğuktan koruyun.`,
      },
    ];
  } else {
    // Premium Segment
    return [
      {
        timeRange: '07:30 - 10:30',
        phase: 'morning',
        expectedTemp: morningTemp,
        actionTitle: 'Teknik Katmanlama (Sabah Havası)',
        actionDescription: 'Merinos taban + Kaşmir/Teknik Triko + Su İtici Membran Ceket.',
        activeItems: ['Merinos Yünü Termal Taban', 'İnce Kaşmir Triko', 'Gore-Tex / Hardshell Membran Ceket', 'Termo Pantolon'],
        thermalTip: `${morningTemp}°C koşulunda merinos yünü cildinizdeki nemi anında dışarı atarak kuru sıcaklık sağlar.`,
      },
      {
        timeRange: '12:00 - 16:00',
        phase: 'midday',
        expectedTemp: middayTemp,
        actionTitle: 'Hafif Mod / Dış Kabuğu Çıkar',
        actionDescription: 'Teknik kabuğu çıkarıp triko veya keten tabanla devam edin.',
        activeItems: ['Nefes Alabilir Taban / Triko', 'UV Korumalı Polarize Gözlük'],
        thermalTip: `${middayTemp}°C'de mikro-gözenekli lifler vücut sıcaklığınızı regüle eder.`,
      },
      {
        timeRange: '18:30 - 22:30',
        phase: 'evening',
        expectedTemp: eveningTemp,
        actionTitle: 'Dış Kabuk Koruması',
        actionDescription: 'Rüzgar ve nem düşüşüne karşı DWR kaplamalı teknik kabuğu giyin.',
        activeItems: ['Merinos Taban', 'Kaşmir Triko', 'Teknik Kabuk Ceket', 'Vibram Tabanlı Bot'],
        thermalTip: `${eveningTemp}°C akşam serinliğinde rüzgar geçirmez bariyer vücut ısısını hapseder.`,
      },
    ];
  }
}

// Generate Direct Outfit (Stand-alone single outfit)
export function generateDirectOutfit(
  weather: WeatherConsensus,
  segment: BudgetSegment
): ClothingItem[] {
  const isCold = weather.temp <= 12;
  const isHot = weather.temp >= 23;
  const isRain = weather.precipitationProb >= 40 || weather.condition === 'rainy';

  if (segment === 'essential') {
    if (isCold) {
      return [
        { id: 'e-1', name: 'Polar Sweatshirt / Kalın Triko', category: 'mid', segment: 'essential', material: 'Şardonlu Polar', warmth: 4, waterResistance: 'none', windResistance: 'low', colorName: 'Antrasit', colorHex: '#374151', colorType: 'dark', description: 'Tek parça yüksek ısı koruması.' },
        { id: 'e-2', name: 'Standart Şişme Kaban / Parka', category: 'outer', segment: 'essential', material: 'Sentetik Elyaf Dolgulu Naylon', warmth: 5, waterResistance: 'light', windResistance: 'high', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Soğuk ve rüzgardan tam koruma.' },
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
        { id: 'e-9', name: 'Hafif Trençkot veya Bomber Ceket', category: 'outer', segment: 'essential', material: 'Pamuk-Polyester Karışım', warmth: 3, waterResistance: 'light', windResistance: 'medium', colorName: 'Haki Yeşili', colorHex: '#4d7c0f', colorType: 'neutral', description: 'Ilık hava esintisini keser.' },
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

// "Bu Parçayla Kombinle" Engine (Matches selected anchor item)
export function matchAnchorItem(
  anchor: ClothingItem,
  weather: WeatherConsensus
): AnchorMatchResult {
  const isCold = weather.temp <= 12;
  const isHot = weather.temp >= 22;

  let complements: ClothingItem[] = [];
  let colorHarmony = '';
  let weatherFit = '';

  if (anchor.id === 'anc-denim-jacket') {
    complements = [
      { id: 'c-1', name: 'Optik Beyaz Basic Tişört', category: 'base', segment: 'essential', material: 'Pamuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Beyaz', colorHex: '#ffffff', colorType: 'light', description: 'Mavi denim ile en temiz ve zamansız kontrast.' },
      { id: 'c-2', name: isCold ? 'Antrasit Kargo / Denim Pantolon' : 'Bej Chino Pantolon', category: 'bottom', segment: 'essential', material: 'Pamuklu Twill', warmth: 2, waterResistance: 'none', windResistance: 'medium', colorName: isCold ? 'Antrasit' : 'Bej', colorHex: isCold ? '#374151' : '#e7e5e4', colorType: 'neutral', description: 'Ceketin maviliğini dengeler.' },
      { id: 'c-3', name: 'Beyaz Deri / Kanvas Sneaker', category: 'footwear', segment: 'essential', material: 'Deri Saya', warmth: 2, waterResistance: 'light', windResistance: 'medium', colorName: 'Beyaz', colorHex: '#ffffff', colorType: 'light', description: 'Genç ve dinamik bitiriş.' },
    ];
    colorHarmony = 'Mavi kot ceket, beyaz iç katman ve bej/antrasit alt giyimle kusursuz bir renk dengesi kurar.';
    weatherFit = `Bugünkü ${weather.temp}°C sıcaklıkta ceketiniz öğlen açılabilir, akşam esintisinde kapanabilir.`;
  } else if (anchor.id === 'anc-beige-trench') {
    complements = [
      { id: 'c-4', name: 'Siyah veya Lacivert Boğazlı Triko / Gömlek', category: 'mid', segment: 'essential', material: 'İnce Pamuk-Yün', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Siyah', colorHex: '#0f172a', colorType: 'dark', description: 'Bej rengin parlaklığını dengeleyen derin kontrast.' },
      { id: 'c-5', name: 'Koyu Gri Düz Kesim Pantolon', category: 'bottom', segment: 'essential', material: 'Pamuklu Gabardin', warmth: 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Koyu Gri', colorHex: '#4b5563', colorType: 'dark', description: 'Profesyonel ve şehirli görünüm.' },
      { id: 'c-6', name: 'Siyah Deri Chelsea Bot / Loafer', category: 'footwear', segment: 'essential', material: 'Deri', warmth: 3, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Su sıçramalarına karşı dayanıklı.' },
    ];
    colorHarmony = 'Bej tonları, içerideki siyah veya lacivert derin renklerle birleştiğinde yüksek kontrast ve asalet sağlar.';
    weatherFit = `Havadaki %${weather.precipitationProb} yağış ihtimali ve rüzgara karşı trençkotun gabardin dokusu gövdenizi korur.`;
  } else if (anchor.id === 'anc-black-leather') {
    complements = [
      { id: 'c-7', name: 'Gri Melanj Pamuklu Tişört / Hoodie', category: 'base', segment: 'premium', material: 'Pamuk', warmth: 2, waterResistance: 'none', windResistance: 'low', colorName: 'Melanj Gri', colorHex: '#9ca3af', colorType: 'neutral', description: 'Siyah derinin sertliğini kıran yumuşak geçiş.' },
      { id: 'c-8', name: 'Siyah / Koyu Füme Slim Pantolon', category: 'bottom', segment: 'premium', material: 'Esnek Denim', warmth: 3, waterResistance: 'none', windResistance: 'medium', colorName: 'Füme', colorHex: '#1f2937', colorType: 'dark', description: 'Monokromatik ve modern siluet.' },
      { id: 'c-9', name: 'Siyah Deri Biker Bot', category: 'footwear', segment: 'premium', material: 'Hakiki Deri', warmth: 4, waterResistance: 'light', windResistance: 'high', colorName: 'Siyah', colorHex: '#000000', colorType: 'dark', description: 'Rüzgarı tamamen kesen alt koruma.' },
    ];
    colorHarmony = 'Monokromatik gri ve siyah geçişi sokak stiliyle tam uyumludur.';
    weatherFit = `Siyah deri ${weather.windSpeed} km/h rüzgarı tamamen bloke eder ve güneş ışığını hapsederek ısıtır.`;
  } else {
    // Default fallback anchor complements
    complements = [
      { id: 'c-10', name: 'Nötr Renkli Tişört / Gömlek', category: 'base', segment: anchor.segment, material: 'Pamuk', warmth: 1, waterResistance: 'none', windResistance: 'low', colorName: 'Kırık Beyaz', colorHex: '#f5f5f4', colorType: 'light', description: 'Dengeli zemin.' },
      { id: 'c-11', name: 'Rahat Kesim Pantolon', category: 'bottom', segment: anchor.segment, material: 'Pamuklu Dokuma', warmth: 2, waterResistance: 'none', windResistance: 'medium', colorName: 'Lacivert', colorHex: '#1e3a8a', colorType: 'dark', description: 'Tamamlayıcı alt katman.' },
      { id: 'c-12', name: 'Şehir Ayakkabısı', category: 'footwear', segment: anchor.segment, material: 'Deri / Kanvas', warmth: 2, waterResistance: 'light', windResistance: 'medium', colorName: 'Koyu Kahve', colorHex: '#3b2f2f', colorType: 'dark', description: 'Rahat adım.' },
    ];
    colorHarmony = `${anchor.name} rengi ile uyumlu nötr ve dengeli renk paleti seçilmiştir.`;
    weatherFit = `${weather.temp}°C sıcaklık ve ${weather.condition} koşulunda ana parçanız merkezde tutularak konfor sağlanmıştır.`;
  }

  return {
    anchorItem: anchor,
    complementaryItems: complements,
    colorHarmonyNotes: colorHarmony,
    weatherFitNotes: weatherFit,
  };
}
