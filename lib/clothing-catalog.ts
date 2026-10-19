import { ClothingItem, PurchasingPowerTier } from './types';
import { LEGACY_TYPE_MAP, normalizeCatalogText } from './catalog/taxonomy';

export interface CountryMarketProfile {
  countryCode: string;
  countryName: string;
  currencySymbol: string;
  tiers: {
    essential: {
      title: string;
      priceBand: string;
      referenceBrands: string[];
      description: string;
    };
    smart: {
      title: string;
      priceBand: string;
      referenceBrands: string[];
      description: string;
    };
    luxury: {
      title: string;
      priceBand: string;
      referenceBrands: string[];
      description: string;
    };
  };
}

export const COUNTRY_MARKET_PROFILES: Record<string, CountryMarketProfile> = {
  Türkiye: {
    countryCode: 'TR',
    countryName: 'Türkiye',
    currencySymbol: '₺',
    tiers: {
      essential: {
        title: 'Standart & Bütçe Dostu',
        priceBand: '₺450 – ₺2.500',
        referenceBrands: ['LC Waikiki', 'DeFacto', 'Koton', 'Mavi', 'Decathlon (Quechua)'],
        description: 'Türkiye alım gücüne göre ulaşılabilir, yüksek fiyat/performanslı temel gardırop parçaları.',
      },
      smart: {
        title: 'Orta-Üst & Şehir Klasiği',
        priceBand: '₺2.500 – ₺8.500',
        referenceBrands: ['Zara', 'Massimo Dutti', 'Marks & Spencer', 'Network', 'Columbia'],
        description: 'Doğal lif oranı yüksek (keten, merinos karışım, gabardin) uzun ömürlü şehir giyimi.',
      },
      luxury: {
        title: 'Lüks & İleri Teknik',
        priceBand: '₺9.000+',
        referenceBrands: ['Beymen Collection', 'Vakko', 'Arc’teryx', 'Patagonia', 'The North Face Summit'],
        description: 'Gore-Tex 3L membran, %100 saf kaşmir, ekstra ince merinos ve Vibram taban teknolojileri.',
      },
    },
  },
  Global: {
    countryCode: 'GL',
    countryName: 'Avrupa / Küresel Pazar',
    currencySymbol: '€/$',
    tiers: {
      essential: {
        title: 'Standart & Erişilebilir (Essential)',
        priceBand: '€20 – €80',
        referenceBrands: ['Uniqlo', 'H&M', 'Decathlon', 'C&A', 'Pull&Bear'],
        description: 'Günlük fonksiyonel pamuklu, polar ve su itici temel giysiler.',
      },
      smart: {
        title: 'Orta-Üst & Kaliteli Şehir (Smart)',
        priceBand: '€80 – €280',
        referenceBrands: ['COS', 'Arket', 'Massimo Dutti', 'Levi’s', 'Columbia'],
        description: 'Yüksek gramajlı organik pamuk, saf keten ve merinos yünü şehir koleksiyonları.',
      },
      luxury: {
        title: 'Lüks & Pro-Teknik (Luxury)',
        priceBand: '€300+',
        referenceBrands: ['Arc’teryx', 'Loro Piana', 'Patagonia', 'Barbour', 'Norse Projects'],
        description: 'Üst düzey membran, İtalyan yün/kaşmir dokumalar ve ekspedisyon sınıfı koruma.',
      },
    },
  },
};

export function getMarketProfileForCountry(country: string): CountryMarketProfile {
  if (!country) return COUNTRY_MARKET_PROFILES['Türkiye'];
  const norm = country.toLowerCase();
  if (norm.includes('türkiye') || norm.includes('turkey') || norm === 'tr') {
    return COUNTRY_MARKET_PROFILES['Türkiye'];
  }
  return {
    ...COUNTRY_MARKET_PROFILES['Global'],
    countryName: country,
  };
}

export interface CatalogGarmentTemplate extends ClothingItem {
  tags: string[];
  brandExamplesTr: string;
  brandExamplesGlobal: string;
  gsmWeight?: string;
  breathability: 'low' | 'medium' | 'high';
}

// Historical recommendation examples; not verified individual store products.
export const LEGACY_GARMENT_CATALOG: CatalogGarmentTemplate[] = [
  // BASE LAYERS
  {
    id: 'cat-base-1',
    name: 'Basic %100 Pamuklu Süprem Tişört',
    category: 'base',
    segment: 'essential',
    material: '%100 Taranmış Pamuk (160 GSM)',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Optik Beyaz',
    colorHex: '#ffffff',
    colorType: 'light',
    description: 'Nefes alan, teri emen günlük temel tişört.',
    tags: ['tişört', 't-shirt', 'tshirt', 'pamuk', 'beyaz', 'yazlık', 'basic', 'lcw', 'defacto', 'mavi'],
    brandExamplesTr: 'LC Waikiki / Mavi / Koton Basic',
    brandExamplesGlobal: 'Uniqlo U Crew Neck / H&M',
    gsmWeight: '160 g/m²',
    breathability: 'high',
  },
  {
    id: 'cat-base-2',
    name: 'Hava Alan Mikro-Gözenekli Performans Tişörtü',
    category: 'base',
    segment: 'smart',
    material: 'Supima Pamuk & Lyocell Karışım (AIRism Tipi)',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Buz Mavisi',
    colorHex: '#e0f2fe',
    colorType: 'light',
    description: 'Yüksek nem ve çiy noktasında teri saniyeler içinde buharlaştıran serinletici doku.',
    tags: ['tişört', 'spor', 'airism', 'serin', 'nem', 'yazlık', 'uniqlo', 'decathlon', 'marks & spencer'],
    brandExamplesTr: 'Marks & Spencer Coolermax / Decathlon',
    brandExamplesGlobal: 'Uniqlo AIRism / COS Supima',
    gsmWeight: '135 g/m²',
    breathability: 'high',
  },
  {
    id: 'cat-base-3',
    name: 'Termal İçlik Üst (Soğuk Hava Tabanı)',
    category: 'base',
    segment: 'essential',
    material: 'Şardonlu Termal Polyester-Viskoz (HEATTECH Tipi)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Antrasit Siyah',
    colorHex: '#18181b',
    colorType: 'dark',
    description: 'Vücut ısısını hapseden ince uzun kollu kışlık iç katman.',
    tags: ['içlik', 'termal', 'kışlık', 'uzun kol', 'heattech', 'decathlon', 'siyah'],
    brandExamplesTr: 'Decathlon Wedze / Marks & Spencer Heatgen',
    brandExamplesGlobal: 'Uniqlo HEATTECH / Odlo',
    gsmWeight: '190 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-base-4',
    name: '%100 Saf Merinos Yünü Termal Taban (200 GSM)',
    category: 'base',
    segment: 'luxury',
    material: '%100 Ekstra İnce 18.5 Mikron Merinos Yünü',
    warmth: 4,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Gece Laciverti',
    colorHex: '#0f172a',
    colorType: 'dark',
    description: 'Koku yapmayan, ıslansa bile ısıtmaya devam eden üst düzey doğal termal katman.',
    tags: ['merinos', 'yün', 'içlik', 'termal', 'kışlık', 'icebreaker', 'outdoor'],
    brandExamplesTr: 'Columbia / The North Face / Meydan Kamp',
    brandExamplesGlobal: 'Icebreaker 200 Oasis / Smartwool',
    gsmWeight: '200 g/m²',
    breathability: 'high',
  },

  // MID LAYERS
  {
    id: 'cat-mid-1',
    name: '%100 Saf Keten Uzun Kollu Gömlek',
    category: 'mid',
    segment: 'smart',
    material: '%100 Doğal Keten Dokuma (145 GSM)',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Kırık Beyaz / Kum',
    colorHex: '#f5f5f4',
    colorType: 'light',
    description: 'Sıcak ve nemli havalarda maksimum hava sirkülasyonu sağlayan doğal keten gömlek.',
    tags: ['gömlek', 'keten', 'linen', 'yazlık', 'zara', 'massimo dutti', 'beyaz', 'bej'],
    brandExamplesTr: 'Zara / Massimo Dutti / Mavi Keten Serisi',
    brandExamplesGlobal: 'Massimo Dutti / Arket Linen',
    gsmWeight: '145 g/m²',
    breathability: 'high',
  },
  {
    id: 'cat-mid-2',
    name: 'Klasik Pamuklu Oxford Dokuma Gömlek',
    category: 'mid',
    segment: 'essential',
    material: '%100 Pamuk Oxford (185 GSM)',
    warmth: 2,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Açık Mavi',
    colorHex: '#93c5fd',
    colorType: 'light',
    description: 'Ilıman geçiş havalarında tişört üzerine veya tek başına giyilen tok dokulu gömlek.',
    tags: ['gömlek', 'oxford', 'pamuk', 'mavi', 'ofis', 'klasik', 'koton', 'network'],
    brandExamplesTr: 'Koton / Mavi / Network',
    brandExamplesGlobal: 'Polo Ralph Lauren / Uniqlo Oxford',
    gsmWeight: '185 g/m²',
    breathability: 'high',
  },
  {
    id: 'cat-mid-3',
    name: '3 İplik Şardonlu Kapüşonlu Sweatshirt (Hoodie)',
    category: 'mid',
    segment: 'essential',
    material: '%80 Pamuk %20 Polyester 3 İplik (320 GSM)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Melanj Grisi',
    colorHex: '#9ca3af',
    colorType: 'neutral',
    description: 'Serin havalarda ceket altına veya günlük kullanıma uygun içi yumuşak şardonlu sweatshirt.',
    tags: ['sweatshirt', 'hoodie', 'kapüşonlu', 'polar', 'gri', 'pamuk', 'mavi', 'lcw', 'pull&bear'],
    brandExamplesTr: 'Mavi / DeFacto / Les Benjamins Essential',
    brandExamplesGlobal: 'Nike Club Fleece / Champion',
    gsmWeight: '320 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-mid-4',
    name: 'Oduncu / Flanel Ekose Pamuk Gömlek',
    category: 'mid',
    segment: 'essential',
    material: '%100 Fırçalanmış Yumuşak Pamuk Flanel (240 GSM)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Bordo / Lacivert Ekose',
    colorHex: '#7f1d1d',
    colorType: 'dark',
    description: 'Sonbahar ve serin bahar sabahlarında ceket gibi de kullanılabilen sıcak flanel gömlek.',
    tags: ['oduncu', 'flanel', 'ekose', 'gömlek', 'sonbahar', 'pamuk'],
    brandExamplesTr: 'Mavi / Loft / LC Waikiki',
    brandExamplesGlobal: 'Uniqlo Flannel / Levi’s',
    gsmWeight: '240 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-mid-5',
    name: 'Mikro Polar Fermuarlı Orta Katman (Fleece)',
    category: 'mid',
    segment: 'essential',
    material: 'Yüksek Yalıtımlı Mikro-Polar (260 GSM)',
    warmth: 4,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Haki Yeşili',
    colorHex: '#3f6212',
    colorType: 'dark',
    description: 'Çok hafif olmasına rağmen vücut ısısını hızla yükselten pratik fermuarlı polar.',
    tags: ['polar', 'fleece', 'fermuarlı', 'hırka', 'kışlık', 'decathlon', 'columbia'],
    brandExamplesTr: 'Decathlon Quechua MH120 / Columbia Fast Trek',
    brandExamplesGlobal: 'Patagonia Better Sweater / Columbia',
    gsmWeight: '260 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-mid-6',
    name: 'İnce Merinos Yünü Triko Kazak',
    category: 'mid',
    segment: 'smart',
    material: '%100 Ekstra İnce Merinos Yünü',
    warmth: 4,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Zümrüt / Orman Yeşili',
    colorHex: '#166534',
    colorType: 'dark',
    description: 'Kaban altında ağırlık yapmadan yüksek ısı konforu ve şıklık sunan doğal yün triko.',
    tags: ['kazak', 'triko', 'yün', 'merinos', 'kışlık', 'massimo dutti', 'marks & spencer'],
    brandExamplesTr: 'Marks & Spencer / Massimo Dutti / Kiğılı',
    brandExamplesGlobal: 'COS / Uniqlo Extra Fine Merino',
    gsmWeight: '210 g/m²',
    breathability: 'high',
  },
  {
    id: 'cat-mid-7',
    name: '%100 Saf Kaşmir Balıkçı Yaka Kazak',
    category: 'mid',
    segment: 'luxury',
    material: '%100 Moğolistan Saf Kaşmir Lifleri',
    warmth: 5,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Antrasit Füme',
    colorHex: '#374151',
    colorType: 'dark',
    description: 'Koyun yününden 8 kat daha sıcak tutan, tüy kadar hafif lüks kış katmanı.',
    tags: ['kaşmir', 'kazak', 'balıkçı yaka', 'boğazlı', 'lüks', 'beymen', 'vakko'],
    brandExamplesTr: 'Beymen / Vakko / Silk & Cashmere',
    brandExamplesGlobal: 'Loro Piana / Brunello Cucinelli',
    gsmWeight: '230 g/m²',
    breathability: 'high',
  },

  // OUTER LAYERS
  {
    id: 'cat-outer-1',
    name: 'Klasik Mavi Denim (Kot) Ceket',
    category: 'outer',
    segment: 'essential',
    material: '%100 Rijit Pamuklu Denim (12 oz)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'İndigo Mavi',
    colorHex: '#3b82f6',
    colorType: 'neutral',
    description: 'Ilıman ve hafif esintili bahar/sonbahar günlerinin vazgeçilmez dış katmanı.',
    tags: ['kot ceket', 'denim ceket', 'mavi', 'ceket', 'levi', 'baharlık'],
    brandExamplesTr: 'Mavi / Colin’s / Loft',
    brandExamplesGlobal: 'Levi’s Trucker Jacket',
    gsmWeight: '380 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-outer-2',
    name: 'Su İtici Klasik Gabardin Trençkot',
    category: 'outer',
    segment: 'smart',
    material: 'Sıkı Dokuma Su İtici Pamuk-Gabardin',
    warmth: 3,
    waterResistance: 'light',
    windResistance: 'high',
    colorName: 'Klasik Bej / Taş',
    colorHex: '#d4b996',
    colorType: 'light',
    description: 'Geçiş mevsimlerinde sert rüzgarı ve çisenti yağmuru bloke eden zamansız trençkot.',
    tags: ['trençkot', 'trench', 'bej', 'yağmurluk', 'rüzgarlık', 'zara', 'mango', 'burberry'],
    brandExamplesTr: 'Zara / Mango / İpekyol / Beymen Club',
    brandExamplesGlobal: 'Massimo Dutti / Burberry / COS',
    gsmWeight: '290 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-outer-3',
    name: 'Katlanabilir Su Geçirmez Yağmurluk / Rüzgarlık',
    category: 'outer',
    segment: 'essential',
    material: 'PU Membran Kaplamalı Su Geçirmez Ripstop (5000mm)',
    warmth: 2,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Koyu Lacivert',
    colorHex: '#1e3a8a',
    colorType: 'dark',
    description: 'Çantada yer kaplamayan, ani sağanak ve fırtınada tam su/rüzgar koruması sağlayan kabuk.',
    tags: ['yağmurluk', 'rüzgarlık', 'su geçirmez', 'kapüşonlu', 'decathlon', 'quechua'],
    brandExamplesTr: 'Decathlon Quechua Raincut / Koton',
    brandExamplesGlobal: 'Rains / Uniqlo Blocktech',
    gsmWeight: '150 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-outer-4',
    name: 'Siyah Deri / Biker Ceket',
    category: 'outer',
    segment: 'smart',
    material: '%100 Doğal Kuzu Derisi (veya Yüksek Kalite Vegan Deri)',
    warmth: 4,
    waterResistance: 'light',
    windResistance: 'high',
    colorName: 'Siyah',
    colorHex: '#18181b',
    colorType: 'dark',
    description: 'Rüzgarı %100 kesen, akşam serinliğinde vücut ısısını koruyan şehir ceketi.',
    tags: ['deri ceket', 'biker', 'siyah ceket', 'desa', 'derimod', 'zara'],
    brandExamplesTr: 'Desa / Derimod / Zara',
    brandExamplesGlobal: 'AllSaints / Schott NYC',
    gsmWeight: '450 g/m²',
    breathability: 'low',
  },
  {
    id: 'cat-outer-5',
    name: 'Kapüşonlu Kışlık Şişme Mont (Puffer)',
    category: 'outer',
    segment: 'essential',
    material: 'Su İtici Mikrofiber Dış Yüzey + Yoğun Elyaf/Kaz Tüyü Dolgu',
    warmth: 5,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Siyah / Antrasit',
    colorHex: '#1f2937',
    colorType: 'dark',
    description: 'Soğuk kış günlerinde (10°C altı) yüksek ısı yalıtımı sağlayan dolgulu mont.',
    tags: ['mont', 'şişme mont', 'kaban', 'parka', 'kışlık', 'puffer', 'mavi', 'lufian'],
    brandExamplesTr: 'Lufian / Mavi / DeFacto / Columbia',
    brandExamplesGlobal: 'The North Face Nuptse / Uniqlo Seamless Down',
    gsmWeight: '520 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-outer-6',
    name: 'Gore-Tex 3L Su ve Rüzgar Geçirmez Teknik Kabuk (Hardshell)',
    category: 'outer',
    segment: 'luxury',
    material: '3 Katmanlı GORE-TEX® ePE Nefes Alabilir Membran (28.000mm)',
    warmth: 4,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Kömür Siyahı',
    colorHex: '#09090b',
    colorType: 'dark',
    description: 'Şiddetli yağmur, kar ve fırtınayı dışarıda tutarken içerideki su buharını dışarı atan ileri mühendislik.',
    tags: ['gore-tex', 'goretex', 'hardshell', 'teknik ceket', 'su geçirmez', 'arcteryx', 'north face'],
    brandExamplesTr: 'The North Face / Columbia Titanium / Salomon',
    brandExamplesGlobal: 'Arc’teryx Beta Jacket / Patagonia Triolet',
    gsmWeight: '310 g/m²',
    breathability: 'high',
  },

  // BOTTOMS
  {
    id: 'cat-bot-1',
    name: 'Koyu Mavi Klasik Denim (Kot) Pantolon',
    category: 'bottom',
    segment: 'essential',
    material: '%99 Pamuk %1 Elastan Tok Denim (12.5 oz)',
    warmth: 3,
    waterResistance: 'none',
    windResistance: 'medium',
    colorName: 'Koyu İndigo',
    colorHex: '#1e293b',
    colorType: 'dark',
    description: 'Dört mevsim şehir kullanımına ve rüzgara dayanıklı kot pantolon.',
    tags: ['kot', 'jean', 'denim', 'pantolon', 'mavi', 'levis'],
    brandExamplesTr: 'Mavi (Marcus/Jake) / Colin’s / LTB',
    brandExamplesGlobal: 'Levi’s 501 / 511',
    gsmWeight: '390 g/m²',
    breathability: 'medium',
  },
  {
    id: 'cat-bot-2',
    name: 'Bej / Taş Rengi Pamuklu Chino Pantolon',
    category: 'bottom',
    segment: 'essential',
    material: '%98 Pamuk %2 Elastan İnce Gabardin Twill',
    warmth: 2,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Taş Beji',
    colorHex: '#d6d3d1',
    colorType: 'light',
    description: 'Ilıman ve sıcak günlerde kot pantolona göre çok daha ferah tutan şehir pantolonu.',
    tags: ['chino', 'kanvas', 'pantolon', 'bej', 'pamuk', 'dockers', 'network'],
    brandExamplesTr: 'Mavi / Koton / Altınyıldız / Network',
    brandExamplesGlobal: 'Dockers Alpha / Massimo Dutti',
    gsmWeight: '240 g/m²',
    breathability: 'high',
  },
  {
    id: 'cat-bot-3',
    name: 'Yazlık Saf Keten / Keten-Pamuk Şort & Pantolon',
    category: 'bottom',
    segment: 'smart',
    material: '%55 Keten %45 Pamuk Nefes Alan Dokuma',
    warmth: 1,
    waterResistance: 'none',
    windResistance: 'low',
    colorName: 'Açık Kum',
    colorHex: '#f5f5f4',
    colorType: 'light',
    description: '25°C üzeri sıcaklarda terlemeyi önleyen ultra hafif alt giyim.',
    tags: ['şort', 'keten pantolon', 'yazlık', 'bej', 'zara'],
    brandExamplesTr: 'Zara / Mavi / DeFacto Keten Koleksiyonu',
    brandExamplesGlobal: 'Arket / Massimo Dutti Linen',
    gsmWeight: '165 g/m²',
    breathability: 'high',
  },

  // FOOTWEAR & ACCESSORIES
  {
    id: 'cat-foot-1',
    name: 'Nefes Alan Günlük Deri / Kanvas Sneaker',
    category: 'footwear',
    segment: 'essential',
    material: 'Deri/Kanvas Saya & Kauçuk Taban',
    warmth: 2,
    waterResistance: 'light',
    windResistance: 'medium',
    colorName: 'Beyaz / Gri',
    colorHex: '#f8fafc',
    colorType: 'light',
    description: 'Kuru ve ılıman günlerde uzun şehir yürüyüşleri için konforlu spor ayakkabı.',
    tags: ['sneaker', 'spor ayakkabı', 'ayakkabı', 'beyaz', 'adidas', 'nike', 'new balance'],
    brandExamplesTr: 'Kinetix / Lumberjack / Adidas / New Balance',
    brandExamplesGlobal: 'New Balance / Adidas Stan Smith / Veja',
    breathability: 'high',
  },
  {
    id: 'cat-foot-2',
    name: 'Su Geçirmez Kışlık Deri Bot / Trekking Ayakkabısı',
    category: 'footwear',
    segment: 'smart',
    material: 'Su Geçirmez Nubuk/Deri + Kaymaz Kauçuk Taban',
    warmth: 4,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Siyah / Koyu Kahve',
    colorHex: '#18181b',
    colorType: 'dark',
    description: 'Yağmurlu, karlı ve soğuk zeminlerde ayakları kuru ve sıcak tutan bot.',
    tags: ['bot', 'deri bot', 'su geçirmez', 'kışlık ayakkabı', 'harley', 'timberland', 'greyder', 'scooter'],
    brandExamplesTr: 'Greyder / Scooter Waterproof / Kemal Tanca',
    brandExamplesGlobal: 'Timberland / Salomon / Dr. Martens',
    breathability: 'medium',
  },
  {
    id: 'cat-acc-1',
    name: 'Rüzgara Dayanıklı Fiber Telli Katlanır Şemsiye',
    category: 'accessory',
    segment: 'essential',
    material: 'Teflon Su İtici Kumaş + Fiberglas İskelet',
    warmth: 1,
    waterResistance: 'waterproof',
    windResistance: 'high',
    colorName: 'Siyah',
    colorHex: '#09090b',
    colorType: 'dark',
    description: 'Sert rüzgarda ters dönmeyen kompakt çanta boy şemsiye.',
    tags: ['şemsiye', 'yağmur', 'aksesuar'],
    brandExamplesTr: 'Koton / Decathlon / Knirps',
    brandExamplesGlobal: 'Fulton / Blunt Umbrella',
    breathability: 'medium',
  },
];

/** @deprecated Kept for saved IDs and existing UI imports; these profiles are unverified. */
export const VERIFIED_GARMENT_CATALOG = LEGACY_GARMENT_CATALOG;
for (const profile of LEGACY_GARMENT_CATALOG) profile.garmentTypeId = LEGACY_TYPE_MAP[profile.id];

export function searchGarmentCatalog(
  query: string,
  categoryFilter: string = 'all',
  tierFilter: string = 'all'
): CatalogGarmentTemplate[] {
  const q = normalizeCatalogText(query);
  return LEGACY_GARMENT_CATALOG.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (tierFilter !== 'all' && item.segment !== tierFilter) return false;
    if (!q) return true;
    return (
      normalizeCatalogText(item.name).includes(q) ||
      normalizeCatalogText(item.material).includes(q) ||
      normalizeCatalogText(item.description).includes(q) ||
      normalizeCatalogText(item.brandExamplesTr).includes(q) ||
      normalizeCatalogText(item.brandExamplesGlobal).includes(q) ||
      item.tags.some((t) => normalizeCatalogText(t).includes(q))
    );
  });
}
