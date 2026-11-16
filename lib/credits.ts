/**
 * Everything Weathrobe builds on, with thanks. Shown in "Sources & privacy" → "Thanks & sources"
 * and mirrored in THIRD_PARTY_NOTICES.md. tests/credits.test.cjs keeps every package.json
 * dependency listed here with the licence its own package declares.
 */
export type CreditKind = 'science' | 'data' | 'asset' | 'runtime' | 'tooling';
export interface Credit {
  id: string;
  name: string;
  by: string;
  /** SPDX identifier or plain wording (terms of service, public domain, standard) */
  license: string;
  url: string;
  licenseUrl?: string;
  kind: CreditKind;
  usage: { tr: string; en: string };
  /** npm package names this entry covers; `@types/*` covers all type packages */
  packages?: string[];
}

const iso = (code: string) => `https://www.iso.org/search.html?q=${encodeURIComponent(code)}`;

export const CREDIT_KINDS: { kind: CreditKind; tr: string; en: string }[] = [
  { kind: 'science', tr: 'Bilimsel yöntemler', en: 'Scientific methods' },
  { kind: 'data', tr: 'Veri ve hizmetler', en: 'Data and services' },
  { kind: 'asset', tr: '3D ve görsel varlıklar', en: '3D and visual assets' },
  { kind: 'runtime', tr: 'Uygulamada çalışan açık kaynak', en: 'Open source in the app' },
  { kind: 'tooling', tr: 'Geliştirme araçları', en: 'Development tools' },
];

export const CREDITS: Credit[] = [
  // Science
  { id: 'pythermalcomfort', kind: 'science', name: 'pythermalcomfort', by: 'Federico Tartarini and contributors (CBE, UC Berkeley)', license: 'MIT',
    url: 'https://github.com/pythermalcomfort/pythermalcomfort', licenseUrl: 'https://github.com/pythermalcomfort/pythermalcomfort/blob/master/LICENSE',
    usage: { tr: 'Giysi yalıtımı (ISO 9920) ve soğukta gereken yalıtım (ISO 11079) hesaplarımız bu kütüphanenin açık kodundan TypeScript\'e aktarıldı; giysi clo tablosu ve doğrulama değerleri de buradan.', en: 'Our clothing insulation (ISO 9920) and cold-weather required insulation (ISO 11079) calculations are ported from this library\'s open code; the garment clo table and validation values come from it too.' } },
  { id: 'ashrae-55', kind: 'science', name: 'ASHRAE Standard 55 — garment insulation table', by: 'ASHRAE', license: 'Standard (cited values)',
    url: 'https://www.ashrae.org/technical-resources/bookstore/standard-55-thermal-environmental-conditions-for-human-occupancy',
    usage: { tr: 'Tişört, pantolon, kazak gibi giysi türlerinin yalıtım (clo) değerleri. Kaynakta karşılığı olmayan türlere değer uydurmuyoruz.', en: 'Insulation (clo) values for garment types such as T-shirts, trousers and sweaters. Types without a source value are left unknown.' } },
  { id: 'iso-9920', kind: 'science', name: 'ISO 9920 & ISO 7730 Annex C', by: 'International Organization for Standardization', license: 'Standard (cited method)', url: iso('ISO 9920'),
    usage: { tr: 'Kombinin toplam yalıtımı ile rüzgâr ve yürümenin yalıtımı nasıl azalttığı.', en: 'Total outfit insulation and how wind and walking reduce it.' } },
  { id: 'iso-11079', kind: 'science', name: 'ISO 11079 (IREQ)', by: 'International Organization for Standardization', license: 'Standard (cited method)', url: iso('ISO 11079'),
    usage: { tr: 'Soğuk havada gereken giysi yalıtımı ve kısa süreli maruziyet sınırı.', en: 'Required clothing insulation in the cold and the limit for short exposures.' } },
  { id: 'engineering-toolbox', kind: 'science', name: 'Engineering ToolBox — clothing insulation (clo) table', by: 'Engineering ToolBox', license: 'Cited values (secondary source)',
    url: 'https://www.engineeringtoolbox.com/clo-clothing-thermal-insulation-d_732.html',
    usage: { tr: 'Şişme mont, palto ve parka için yalıtım değerleri. ASHRAE tablolarının ikincil kopyası; birincil kaynağı doğrulamadık ve arayüzde "doğrulanmadı" diye belirtiyoruz.', en: 'Insulation values for puffer jackets, coats and parkas. A secondary copy of ASHRAE tables; we have not checked the primary source and say so in the app.' } },
  { id: 'noaa-solar', kind: 'science', name: 'NOAA Solar Calculation', by: 'NOAA Global Monitoring Laboratory', license: 'Public domain (U.S. federal work)', url: 'https://gml.noaa.gov/grad/solcalc/',
    usage: { tr: 'Gün doğumu ve batımı; gece ile gündüz gösterimi.', en: 'Sunrise and sunset; showing day or night correctly.' } },

  // Data and services
  { id: 'open-meteo', kind: 'data', name: 'Open-Meteo', by: 'Open-Meteo', license: 'CC BY 4.0', url: 'https://open-meteo.com/', licenseUrl: 'https://open-meteo.com/en/license',
    usage: { tr: 'Saatlik hava tahmini ve yer adı araması.', en: 'Hourly forecasts and place search.' } },
  { id: 'met-norway', kind: 'data', name: 'MET Norway Locationforecast', by: 'Norwegian Meteorological Institute', license: 'CC BY 4.0 / NLOD 2.0', url: 'https://api.met.no/', licenseUrl: 'https://api.met.no/doc/License',
    usage: { tr: 'Hava tahminini karşılaştırmak için ikinci kaynak.', en: 'A second forecast source for comparison.' } },
  { id: 'bright-sky', kind: 'data', name: 'Bright Sky (DWD data)', by: 'Bright Sky; Deutscher Wetterdienst', license: 'DWD open data terms', url: 'https://brightsky.dev/', licenseUrl: 'https://www.dwd.de/EN/service/copyright/copyright_artikel.html',
    usage: { tr: 'Destekleyen bölgelerde güncel gözlem.', en: 'Current observations where available.' } },
  { id: 'weatherapi', kind: 'data', name: 'WeatherAPI.com', by: 'WeatherAPI.com', license: 'Terms of service', url: 'https://www.weatherapi.com/',
    usage: { tr: 'Yalnız kendi anahtarını girersen ek hava kaynağı.', en: 'Extra forecast source, only with your own key.' } },
  { id: 'openweathermap', kind: 'data', name: 'OpenWeatherMap', by: 'OpenWeather', license: 'Terms of service', url: 'https://openweathermap.org/',
    usage: { tr: 'Yalnız kendi anahtarını girersen ek hava kaynağı.', en: 'Extra forecast source, only with your own key.' } },
  { id: 'openstreetmap', kind: 'data', name: 'OpenStreetMap & Nominatim', by: 'OpenStreetMap contributors', license: 'ODbL 1.0', url: 'https://www.openstreetmap.org/', licenseUrl: 'https://www.openstreetmap.org/copyright',
    usage: { tr: 'Harita verisi ve koordinattan ilçe adı (yuvarlanmış koordinatla).', en: 'Map data and district names from coordinates (rounded coordinates).' } },
  { id: 'osrm', kind: 'data', name: 'OSRM', by: 'Project OSRM', license: 'BSD-2-Clause (software)', url: 'https://project-osrm.org/',
    usage: { tr: 'Duraklar arası rota ve süre.', en: 'Routes and travel times between stops.' } },
  { id: 'carto', kind: 'data', name: 'CARTO basemaps', by: 'CARTO', license: 'CARTO attribution terms', url: 'https://carto.com/', licenseUrl: 'https://carto.com/attributions',
    usage: { tr: 'Açık ve koyu harita altlıkları.', en: 'Light and dark map tiles.' } },
  { id: 'upcitemdb', kind: 'data', name: 'UPCitemdb', by: 'UPCitemdb', license: 'Terms of service', url: 'https://www.upcitemdb.com/',
    usage: { tr: 'Barkodla ürün adı ön doldurma (deneme uç noktası).', en: 'Prefilling product names from barcodes (trial endpoint).' } },
  { id: 'gemini', kind: 'data', name: 'Google Gemini API', by: 'Google', license: 'Terms of service', url: 'https://ai.google.dev/', licenseUrl: 'https://ai.google.dev/gemini-api/terms',
    usage: { tr: 'Yalnız kendi anahtarınla isteğe bağlı yapay zekâ stil önerisi.', en: 'Optional AI styling suggestions, only with your own key.' } },

  // Assets
  { id: 'quaternius', kind: 'asset', name: 'Universal Base Characters (Standard)', by: 'Quaternius', license: 'CC0 1.0', url: 'https://quaternius.itch.io/universal-base-characters', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    usage: { tr: '3D manken gövdeleri, saç modelleri ve sakal.', en: '3D mannequin bodies, hairstyles and beard.' } },

  // Runtime open source
  { id: 'next', kind: 'runtime', name: 'Next.js', by: 'Vercel and contributors', license: 'MIT', url: 'https://nextjs.org', packages: ['next'],
    usage: { tr: 'Sitenin ve API uç noktalarının çatısı.', en: 'Framework for the site and its API routes.' } },
  { id: 'react', kind: 'runtime', name: 'React', by: 'Meta and contributors', license: 'MIT', url: 'https://react.dev/', packages: ['react', 'react-dom'],
    usage: { tr: 'Arayüz bileşenleri.', en: 'User interface components.' } },
  { id: 'three', kind: 'runtime', name: 'three.js', by: 'mrdoob and contributors', license: 'MIT', url: 'https://threejs.org/', packages: ['three'],
    usage: { tr: '3D manken ve giysi çizimi.', en: 'Rendering the 3D mannequin and garments.' } },
  { id: 'react-three', kind: 'runtime', name: 'React Three Fiber & Drei', by: 'Poimandres (pmndrs) and contributors', license: 'MIT', url: 'https://github.com/pmndrs/react-three-fiber', packages: ['@react-three/fiber', '@react-three/drei'],
    usage: { tr: 'three.js sahnesini React içinde kurmak.', en: 'Building the three.js scene in React.' } },
  { id: 'leaflet', kind: 'runtime', name: 'Leaflet', by: 'Volodymyr Agafonkin and contributors', license: 'BSD-2-Clause', url: 'https://leafletjs.com/', packages: ['leaflet'],
    usage: { tr: 'Etkileşimli rota haritası.', en: 'Interactive route map.' } },
  { id: 'lucide', kind: 'runtime', name: 'Lucide', by: 'Lucide contributors', license: 'ISC', url: 'https://lucide.dev', packages: ['lucide-react'],
    usage: { tr: 'Arayüz simgeleri.', en: 'Interface icons.' } },
  { id: 'motion', kind: 'runtime', name: 'Motion', by: 'Matt Perry and contributors', license: 'MIT', url: 'https://github.com/motiondivision/motion', packages: ['motion'],
    usage: { tr: "Bağımlılık olarak kurulu; şu an kodda doğrudan kullanılmıyor.", en: "Installed as a dependency; not used directly in the code at the moment." } },
  { id: 'zxing', kind: 'runtime', name: 'ZXing for JS', by: 'ZXing-js contributors', license: 'MIT', url: 'https://github.com/zxing-js/browser', packages: ['@zxing/browser'],
    usage: { tr: 'Kamerayla barkod okuma.', en: 'Reading barcodes with the camera.' } },
  { id: 'google-genai', kind: 'runtime', name: 'Google Gen AI SDK', by: 'Google', license: 'Apache-2.0', url: 'https://github.com/googleapis/js-genai', packages: ['@google/genai'],
    usage: { tr: 'İsteğe bağlı Gemini isteklerini göndermek.', en: 'Sending optional Gemini requests.' } },
  { id: 'node-postgres', kind: 'runtime', name: 'node-postgres', by: 'Brian Carlson and contributors', license: 'MIT', url: 'https://github.com/brianc/node-postgres', packages: ['pg'],
    usage: { tr: 'Ürün kataloğu veritabanı bağlantısı.', en: 'Connecting to the product catalogue database.' } },
  { id: 'hookform-resolvers', kind: 'runtime', name: 'React Hook Form resolvers', by: 'Bill Luo and contributors', license: 'MIT', url: 'https://react-hook-form.com', packages: ['@hookform/resolvers'],
    usage: { tr: "Bağımlılık olarak kurulu; şu an kodda doğrudan kullanılmıyor.", en: "Installed as a dependency; not used directly in the code at the moment." } },
  { id: 'class-utilities', kind: 'runtime', name: 'clsx, class-variance-authority, tailwind-merge', by: 'Luke Edwards; Joe Bell; Dany Castillo', license: 'MIT / Apache-2.0', url: 'https://github.com/lukeed/clsx', packages: ['clsx', 'class-variance-authority', 'tailwind-merge'],
    usage: { tr: 'Stil sınıflarını birleştirme (clsx, tailwind-merge); class-variance-authority kurulu ama şu an kullanılmıyor.', en: 'Combining style classes (clsx, tailwind-merge); class-variance-authority is installed but not used at the moment.' } },
  { id: 'postcss', kind: 'runtime', name: 'PostCSS & Autoprefixer', by: 'Andrey Sitnik and contributors', license: 'MIT', url: 'https://postcss.org/', packages: ['postcss', 'autoprefixer'],
    usage: { tr: 'Stil dosyalarını tarayıcılara uygun hazırlamak.', en: 'Preparing stylesheets for browsers.' } },

  // Tooling
  { id: 'tailwind', kind: 'tooling', name: 'Tailwind CSS', by: 'Tailwind Labs and contributors', license: 'MIT', url: 'https://tailwindcss.com', packages: ['tailwindcss', '@tailwindcss/postcss', '@tailwindcss/typography', 'tw-animate-css'],
    usage: { tr: 'Stil dosyasının temel katmanı. @tailwindcss/typography ve tw-animate-css (Luca Bosin) kurulu ama şu an kullanılmıyor.', en: 'Base layer of the stylesheet. @tailwindcss/typography and tw-animate-css (Luca Bosin) are installed but not used at the moment.' } },
  { id: 'typescript', kind: 'tooling', name: 'TypeScript', by: 'Microsoft', license: 'Apache-2.0', url: 'https://www.typescriptlang.org/', packages: ['typescript'],
    usage: { tr: 'Tür denetimi ve testlerde kodu çevirmek.', en: 'Type checking and compiling code in tests.' } },
  { id: 'definitelytyped', kind: 'tooling', name: 'DefinitelyTyped', by: 'DefinitelyTyped contributors', license: 'MIT', url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', packages: ['@types/*'],
    usage: { tr: 'Kütüphanelerin tür tanımları.', en: 'Type definitions for libraries.' } },
  { id: 'eslint', kind: 'tooling', name: 'ESLint & eslint-config-next', by: 'OpenJS Foundation and contributors; Vercel', license: 'MIT', url: 'https://eslint.org', packages: ['eslint', 'eslint-config-next'],
    usage: { tr: 'Kod kalitesi denetimi.', en: 'Code quality checks.' } },
  { id: 'tsx', kind: 'tooling', name: 'tsx', by: 'Hiroki Osame', license: 'MIT', url: 'https://tsx.hirok.io', packages: ['tsx'],
    usage: { tr: 'Katalog betiklerini çalıştırmak.', en: 'Running catalogue scripts.' } },
];
