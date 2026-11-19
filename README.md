# Weathrobe

**Türkçe** · [English](#english)

Weathrobe (Wear Weather, bir NOk projesi), bulunduğun yerin ve gideceğin rotanın saatlik hava tahminine bakıp o gün ne giyeceğini öneren bir web uygulaması.

## Neler yapar

- **Hava:** İlçe, şehir ya da rota için birden çok kaynaktan saatlik tahmin (Open-Meteo, MET Norway; isteğe bağlı kişisel WeatherAPI / OpenWeather anahtarı).
- **Kombin önerisi:** Kıyafetin ısı yalıtımını ve vücudun ısı dengesini ISO 9920, ISO 11079, Gagge iki düğüm modeli ve ASHRAE 55 SolarCal ile hesaplar; öneriyi buna göre seçer.
- **Gün içi plan:** Sabah, öğle ve akşam için katman planı; akşam daha soğuk ya da yağışlıysa yanına alınacak tek parça.
- **Dolabım:** Kendi kıyafetlerini ekle; metinden, fotoğraftan veya barkoddan taslak çıkar. Taslak bilmediği bilgiyi uydurmaz, kaydetmeden önce senin onayını ister.
- **Katalog:** Kaynakları belirtilmiş gerçek ürün modelleri (PostgreSQL), kumaş bileşimi ve kaynak bilgisiyle.
- **Kişiselleşme:** "Üşüdüm / terledim" geri bildirimlerinle ısı tercihin öğrenilir.
- **Arayüz:** Türkçe / İngilizce, telefona uygun, kurulabilir web uygulaması (PWA), temsilî 3B kombin görünümü.

## Gizlilik

- Dolap, geri bildirimler, avatar, plan ve kişisel API anahtarları yalnızca tarayıcında saklanır.
- Hava ve konum servislerine giden koordinatlar iki ondalığa yuvarlanır.
- Gemini ile taslak yalnızca kendi anahtarını girersen çalışır; anahtarsız kural motoru kullanılır.
- Ürün geri bildirimi yalnızca sen gönderirsen sunucuya gider ([deploy/PRODUCT_FEEDBACK.md](deploy/PRODUCT_FEEDBACK.md)).

## Yerelde çalıştırma

Gerekenler: Node.js 24+, isteğe bağlı olarak Docker Desktop (katalog veritabanı için).

```bash
npm ci
npm run dev        # http://localhost:3000
```

- Ortam değişkenleri için `.env.example` dosyasını `.env.local` olarak kopyala. Hava, rota ve kural tabanlı taslak için anahtar gerekmez.
- Gerçek ürün kataloğu: Docker Desktop açıkken `npm run catalog:local`; ayrıntılar [db/README.md](db/README.md).
- Tüm kontroller (lint, tür denetimi, testler, derleme): `npm run check`. Aynı kontroller her gönderimde GitHub Actions'ta çalışır.

## Teknoloji

Next.js 15 · React 19 · TypeScript · PostgreSQL 17 · Three.js · Leaflet · Docker + Caddy

## Belgeler

| Belge | İçerik |
| --- | --- |
| [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md) | Tarihli geliştirme günlüğü ve devir notları |
| [db/README.md](db/README.md) | Katalog şeması, veri toplama kuralları, yedekleme |
| [deploy/ORACLE_PREVIEW.md](deploy/ORACLE_PREVIEW.md) | Sunucu önizlemesi kurulumu |
| [docs/](docs/) | İlk mimari, ürün tanımı ve mobil uygulama notları (Ekim 2026, tarihsel) |
| [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) | Kullanılan açık kaynak kodlar, veriler ve lisansları |

## Teşekkür

Weathrobe başkalarının emeği üzerine kurulu. Kullanılan her kod, veri ve servis [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) dosyasında ve uygulamada **Kaynaklar ve gizlilik → Teşekkürler ve kaynaklar** bölümünde listelenir.

## Lisans

Bu depo için bir lisans verilmemiştir; tüm hakları saklıdır. Kod incelenmek üzere görünürdür, ancak izin alınmadan kopyalanamaz, dağıtılamaz veya başka projelerde kullanılamaz. Üçüncü taraf parçalar kendi lisanslarına tabidir.

---

<a id="english"></a>

## English

Weathrobe (Wear Weather, a NOk project) is a web app that reads the hourly forecast for where you are, or the route you are taking, and suggests what to wear that day.

### What it does

- **Weather:** hourly forecasts for a district, city or route from several sources (Open-Meteo, MET Norway; optional personal WeatherAPI / OpenWeather keys).
- **Outfit suggestions:** clothing insulation and the body's heat balance are computed with ISO 9920, ISO 11079, the Gagge two-node model and ASHRAE 55 SolarCal, and the outfit is chosen from that.
- **Day plan:** layers for morning, midday and evening, plus one piece to take along when the evening turns colder or wetter.
- **Wardrobe:** add your own clothes and draft them from a description, a photo or a barcode. Drafts never invent facts they do not know and wait for your confirmation before saving.
- **Catalogue:** real, source-cited garment models (PostgreSQL) with fabric composition and provenance.
- **Personalisation:** your "cold / comfortable / hot / wet" feedback tunes your thermal preference.
- **Interface:** Turkish / English, phone-friendly, installable (PWA), with an illustrative 3D outfit view.

### Privacy

- Wardrobe, feedback, avatar, plans and personal API keys are stored only in your browser.
- Coordinates sent to weather and location services are rounded to two decimals.
- Gemini drafts run only with your own key; without one a local rule engine is used.
- Product feedback reaches the server only when you send it.

### Running locally

Requires Node.js 24+, and Docker Desktop if you want the catalogue database.

```bash
npm ci
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` for optional settings. `npm run catalog:local` starts the local catalogue (see [db/README.md](db/README.md)); `npm run check` runs lint, type checks, tests and the production build, as CI does on every push.

### Thanks

Every piece of third-party code, data and service is credited in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and in the app under **Sources & privacy → Thanks & sources**.

### Licence

No licence is granted for this repository; all rights reserved. The code is visible for review, but it may not be copied, redistributed or used in other projects without permission. Third-party parts remain under their own licences.
