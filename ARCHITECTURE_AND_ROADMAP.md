# 🌦️ Weathrobe: Sistem Mimarisi, API Entegrasyonları ve Tasarım Haritası (v2.1)

Bu doküman; **Weathrobe** platformunun mimari standartlarını, açık ve anahtarlı hava durumu kaynaklarını, **erişilebilir ve gündelik parçalarla modüler katmanlı giyim (Layering) motorunu**, gün içi sıcaklık değişimlerine göre giysi ekleme/çıkarma zaman çizelgesini, dijital gardırop veri modelini ve GitHub / dağıtım yönergelerini tanımlar.

---

## 1. 🌐 Hava Durumu API Kaynakları Analizi (Sınırsız / Multi-Source Mimarisi)

Sistem, tek bir sağlayıcıya bağımlı kalmadan en az 3 bağımsız meteorolojik kaynaktan veri alarak medyan/ağırlıklı ortalama oluşturan modüler bir **"Hava Durumu Orkestratörü (Weather Aggregator)"** mimarisi kullanır.

### A. Anahtarsız (API Key İstemeyen) Açık ve Güvenilir Kaynaklar (Kullanıma Hazır)

| Kaynak / Servis | Model / Altyapı | Ücretsiz Kullanım Limiti | Entegrasyon Özellikleri |
| :--- | :--- | :--- | :--- |
| **1. Open-Meteo** (`api.open-meteo.com`) | ECMWF, GFS, DWD ICON küresel modelleri | Günde **yaklaşık 10.000 istek** (ticari olmayan açık kullanım) | API anahtarı gerektirmez. Enlem/boylam ile saatlik sıcaklık, bağıl nem, çiy noktası, rüzgar hamlesi, yağış miktarı, UV indeksi ve bulutluluk verilerini yüksek doğrulukla döndürür. |
| **2. MET Norway** (`api.met.no` - Locationforecast 2.0) | Norveç Meteoroloji Enstitüsü & ECMWF | Kamu hizmeti olarak ücretsiz ve anahtarsız | API anahtarı gerekmez; HTTP başlığında tanımlayıcı bir `User-Agent` (`WeathrobeApp/1.0 contact@weathrobe.internal`) iletilmelidir. Dünya çapında yüksek çözünürlüklü saatlik tahmin ve WMO hava sembolleri sunar. |
| **3. Bright Sky / DWD** (`api.brightsky.dev`) | Deutscher Wetterdienst (Alman Devlet Meteoroloji Servisi) | Tamamen açık kaynak ve anahtarsız | Karmaşık DWD meteoroloji verilerini temiz REST JSON formatında sunar. Küresel tahminler ve özellikle Avrupa/Türkiye coğrafyasında ICON modeli verisi sağlar. |

---

### B. API Key Gerektiren Yüksek Güvenilirlikli Kaynaklar (Opsiyonel / Ek Kaynaklar)

Sistem, ortam değişkenlerinden (`.env`) veya arayüzdeki "Veri Kaynağı Ayarları" panelinden girilecek anahtarlarla aşağıdaki kaynakları otomatik olarak konsensüse dahil eder:

| Servis | Ücretsiz Kullanım Kotası (Yaklaşık Değerler)* | Entegrasyon Kolaylığı & Sağlanan Veriler |
| :--- | :--- | :--- |
| **1. WeatherAPI.com** | Ayda **yaklaşık 100.000 istek**, saniyede 10 istek (Kredi kartı gerekmez) | Basit bir `key` parametresiyle anlık hava, 14 güne kadar saatlik tahmin, hava kalitesi, UV ve rüzgar detayları. |
| **2. OpenWeatherMap** | Klasik Ücretsiz Plan: Dakikada 60 istek, ayda **yaklaşık 1.000.000 istek** (Kredi kartı gerekmez) | Standart `/data/2.5/forecast` uç noktası ile 5 günlük / 3 saatlik ayrıntılı tahminler, rüzgar yönü ve yağış olasılığı. |
| **3. Tomorrow.io** | Günde **yaklaşık 500 istek**, saatte 25 istek (Kredi kartı gerekmez) | 80'den fazla meteoroloji katmanı, yüksek çözünürlüklü 5 günlük tahmin ve hassas hava kalitesi/nem profili. |

*\*Not: Ücretsiz kotalar sağlayıcıların güncel kullanım şartlarına bağlı olarak değişkenlik gösterebilir; birincil kaynaklarından teyit edilmesi önerilir.*

---

## 2. 🛡️ Gizlilik ve Konum Belirleme Mimarisi

* **Konum Hassasiyeti İndirgeme (Location Obfuscation):** Tarayıcı Geolocation API'sinden gelen hassas enlem/boylam koordinatları anında ~10-15 km yarıçapında yuvarlanır. Sunucuya veya yerel depolamaya cadde, bina veya açık IP adresi kaydedilmez.
* **Tersine Coğrafi Kodlama (Reverse Geocoding):** Noktasal veri sadece **Ülke / İl (Şehir) / İlçe** adını belirlemek için kullanılır.
* **Manuel Arama & Seçim:** Konum izni vermek istemeyen kullanıcılar için Türkiye'nin 81 ili ve 900+ ilçesi öncelikli olmak üzere, dünya çapında tüm şehirleri kapsayan anlık arama motoru mevcuttur.

---

## 3. 👕 Erişilebilir, Gündelik ve Modüler Katmanlama (Layering) Sistemi

Pahalı ve özel teknik kumaşlar (Gore-Tex, kaşmir, saf alpaka yünü vb.) yerine, her kullanıcının dolabında bulunan **erişilebilir, temel ve bütçe dostu parçalar** ana omurgayı oluşturur.

### A. Modüler Katman Kombinleme Mantığı (Örn: Tişört + Gömlek + Hırka / Ceket)
Gün içindeki sıcaklık dalgalanmalarına (sabah ayazı, öğle güneşi, akşam serinliği) uyum sağlayabilen dinamik giysi mimarisi:

```
[İç Katman (Base)]: Pamuklu Basic Tişört / Askılı Atlet
       +
[Orta Katman (Mid)]: Açık/Düğmeli Gömlek (Flanel / Pamuk) veya İnce Sweatshirt / Hırka
       +
[Dış Katman (Outer)]: Denim Ceket / Hafif Trençkot / Şişme Yelek / Rüzgarlık
```

### B. Gün İçi Saatlik Katman Zaman Çizelgesi (Hour-by-Hour Layer Timeline)
Uygulama, günün saatlerine göre kullanıcının üstündeki parçaları nasıl ayarlaması gerektiğini adım adım gösterir:
* **07:00 - 10:00 (Sabah Serinliği - 11°C):** 3 Katman Aktif (Tişört + Gömlek + Ceket kapalı).
* **12:00 - 16:00 (Öğle Sıcağı - 21°C):** Ceketi çıkar ve çantaya/kola as, gömleğin kollarını kıvır (veya sadece Tişört kal).
* **18:00 - 22:00 (Akşam Esintisi - 13°C):** Ceketi tekrar üzerine al, hafif şal/atkı ekle.

### C. Dijital Gardırop (My Wardrobe) & Geleceğe Hazır Veri Modeli
Kullanıcının kendi gardırobunu tanımlayabilmesi ve ileride giyim üreticileriyle entegre edilebilir/ürün tavsiyesi yapılabilir esnek veri yapısı:

```typescript
export interface WardrobeItem {
  id: string;
  name: string;             // Örn: "Oversize Beyaz Pamuk Tişört", "Klasik Mavi Denim Ceket"
  category: 'base' | 'mid' | 'outer' | 'bottom' | 'footwear' | 'accessory';
  warmthLevel: 1 | 2 | 3 | 4 | 5; // 1: Çok serin/ince, 5: Ağır kışlık
  waterResistance: 'none' | 'light' | 'waterproof'; // Su iticilik
  windResistance: 'low' | 'medium' | 'high';        // Rüzgar direnci
  breathability: 'low' | 'medium' | 'high';          // Nefes alabilirlik
  material: string;         // "Pamuk (%100)", "Denim/Kot", "Polar", "Keten", "Sentetik Karışım"
  isUserOwned?: boolean;    // Kullanıcının kendi dolabında mevcut mu?
  productUrl?: string;      // İlerideki üretici/affiliate/reklam entegrasyonu için bağlantı
  brand?: string;           // Opsiyonel marka bilgisi
}
```

---

## 4. 🎨 Adaptif ve Çift Katmanlı Tema Mimarisi

* **Temel Seçim:** Manuel **Koyu (Dark)** ve **Açık (Light)** tema anahtarı.
* **Dinamik Hava Durumu Ambiyansı:** Kullanıcının bulunduğu konumdaki hava durumuna göre sayfa arka planı ve vurgu renkleri otomatik adapte olur (Güneşli, Yağmurlu, Karlı, Fırtınalı, Sisli, Gece).

---

## 5. 🗺️ Harita ve Seyahat Deneyimi (Firefox Öncelikli)

1. **Şehir İçi Harita:** İlçe sınırları/vektör haritası, ilçelerin üzerinde hava ikonu ve tıklandığında açılan katmanlı kıyafet reçetesi.
2. **Şehirler Arası Rota:** Ulaşım aracı (Araç, Otobüs, Tren) ve kalkış saatine göre yol üzerindeki mola noktalarında hava tahmini.
3. **Uluslararası Rota (3D Küre):** Three.js ile Firefox uyumlu 3D Dünya Küresi üzerinde uçuş yayı ve hedef ülke iklim şoku önlemleri.

---

## 6. 💬 Global Geri Bildirim ve Doğruluk Değerlendirme Sistemi

* 1-5 Yıldız tahmin doğruluğu.
* Kaynak kıyaslama ("Open-Meteo mu, MET Norway mi, DWD mi daha doğruydu?").
* Kıyafet isabeti ("Üşüttü", "Terletti", "Islattı", "Kombin tam yerindeydi").
* Yerel depolama ve tek tıkla dışa aktarılabilir rapor formatı.

---

## 7. 🐙 GitHub Deposu (Repository) Bağlantı Yönergesi

AI Studio ortamındaki uygulamanızı kendi GitHub deponuza bağlamak için kullanabileceğiniz 2 temel yöntem:

### Yöntem A: Terminal / Git Komutları ile Bağlama
1. GitHub'da oluşturduğunuz boş reponun URL'sini alın (Örn: `https://github.com/KULLANICI_ADI/weathrobe.git`).
2. GitHub hesabınızdan bir **Personal Access Token (PAT)** oluşturun (*GitHub -> Settings -> Developer Settings -> Personal access tokens -> Tokens (classic) -> `repo` yetkisi*).
3. Bu ortamda terminal komutu ile aşağıdaki adımları çalıştırmamı isteyebilirsiniz:
   ```bash
   git init
   git config user.name "Adınız veya Kullanıcı Adınız"
   git config user.email "epostaniz@example.com"
   git add .
   git commit -m "Initial commit: Weathrobe architecture and core app"
   git branch -M main
   git remote add origin https://<GITHUB_PAT_TOKEN>@github.com/<KULLANICI_ADI>/<REPO_ADI>.git
   git push -u origin main
   ```
*(Not: Güvenlik açısından token'ınızı sohbete yazmak istemezseniz token'sız remote ekleyip komut çıktısını size de verebiliriz).*

### Yöntem B: AI Studio Arayüzü Üzerinden İndirme / Dışa Aktarma
* Ekranın sağ üst köşesindeki menüden veya proje ayarlarından projeyi ZIP olarak bilgisayarınıza indirebilir, ardından kendi bilgisayarınızda `git push` yapabilirsiniz.
