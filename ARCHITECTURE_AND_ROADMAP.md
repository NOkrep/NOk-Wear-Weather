# 🌦️ Wear Weather (by NOk)
## Sistem Mimarisi, API Entegrasyonları ve Tasarım Haritası (v2.3)

**Organizasyon:** NOk  
**Uygulama Adı:** Wear Weather  
**Vizyon:** Hobi ve yenilikçi deneyler üreten bağımsız ekibimiz (NOk) tarafından geliştirilen; gizlilik odaklı, çok kaynaklı hava durumu konsensüsü sağlayan, renk ve malzeme bilimine dayalı akıllı giyim ve rota asistanı.

---

## 1. 🌐 Hava Durumu API Kaynakları Analizi (Multi-Source Orkestrasyonu)

Sistem, tek bir sağlayıcıya bağımlı kalmadan en az 3 bağımsız meteorolojik kaynaktan veri alarak medyan/ağırlıklı ortalama oluşturan modüler bir **"Hava Durumu Orkestratörü (Weather Aggregator)"** mimarisi kullanır.

### A. Anahtarsız (API Key İstemeyen) Açık ve Güvenilir Kaynaklar (Kullanıma Hazır)

| Kaynak / Servis | Model / Altyapı | Ücretsiz Kullanım Limiti | Entegrasyon Özellikleri |
| :--- | :--- | :--- | :--- |
| **1. Open-Meteo** (`api.open-meteo.com`) | ECMWF, GFS, DWD ICON küresel modelleri | Günde **yaklaşık 10.000 istek** (açık kullanım) | API anahtarı gerekmez. Saatlik sıcaklık, bağıl nem, çiy noktası, rüzgar hamlesi, yağış miktarı, UV indeksi ve bulutluluk verilerini yüksek doğrulukla döndürür. |
| **2. MET Norway** (`api.met.no` - Locationforecast 2.0) | Norveç Meteoroloji Enstitüsü & ECMWF | Kamu hizmeti olarak ücretsiz ve anahtarsız | API anahtarı gerekmez; HTTP başlığında tanımlayıcı bir `User-Agent` (`WearWeatherApp/1.0 NOk-org@weathrobe.internal`) iletilmelidir. Dünya çapında yüksek çözünürlüklü saatlik tahmin ve WMO hava sembolleri sunar. |
| **3. Bright Sky / DWD** (`api.brightsky.dev`) | Deutscher Wetterdienst (Alman Devlet Meteoroloji Servisi) | Tamamen açık kaynak ve anahtarsız | DWD meteoroloji verilerini temiz REST JSON formatında sunar. Küresel tahminler ve özellikle Avrupa/Türkiye coğrafyasında ICON modeli verisi sağlar. |

---

### B. API Key Gerektiren Yüksek Güvenilirlikli Kaynaklar (Opsiyonel / Ek Kaynaklar)

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

## 3. 🎨 Renk Dinamikleri & "Bu Parçayla Kombinle" (Anchor Item) Motoru

Kıyafet önerilerinde estetik ve kumaşın yanı sıra **termo-optik renk etkisi** ve **kullanıcının seçtiği bir parça etrafında gardırop kurma** yeteneği eklenmiştir:

### A. Kıyafet Renklerinin Termal ve Meteorolojik Etkisi
* **Yüksek UV & Sıcak (> 24°C / UV > 5):** Açık renkler (Beyaz, kırık beyaz, bej, açık pastel tonlar) güneş ışınlarını yansıtarak vücut ısısının yükselmesini engeller.
* **Soğuk & Güneşli Kış Günleri (< 10°C):** Koyu renkler (Siyah, antrasit, lacivert) güneş ışığını soğurarak ısı tutulmasına yardımcı olur.
* **Yağışlı & Çamurlu Havalar:** Açık renk pantolon veya ayakkabılardan kaçınma; koyu veya su geçirmez koyu tonlu alt giyim tavsiyesi.

### B. "Bu Parçayla Kombinle" (Anchor Item Matching Engine)
Kullanıcı "Bugün mavi denim ceketimi giymek istiyorum" veya "Siyah trençkotumu seçtim" dediğinde sistem:
1. Seçilen ana parçayı kilitler (Anchor item).
2. O günkü hava durumuna göre (sabah/öğle/akşam sıcaklıkları) bu parçanın yetersiz kalacağı veya fazla geleceği saatleri tespit eder.
3. Hem **renk uyumuna** (Örn: Mavi denim ceket altına beyaz basic t-shirt + bej chino veya koyu gri pantolon) hem de **hava şartlarına** göre parçayı tamamlayan iç katman, alt giyim ve aksesuarları üretir.

---

## 4. 👔 Çift Bütçe Segmenti & Çift Giyim Yaklaşımı

1. **Bütçe Segmentleri:**
   * **Temel & Erişilebilir (Bütçe Dostu):** Pamuk basic t-shirt, standart flanel/pamuk gömlek, polar, denim ceket, standart trençkot, kanvas spor ayakkabı, klasik şemsiye.
   * **Premium & İleri Kumaşlar:** Merinos yünü, kaşmir, Gore-Tex su geçirmez membranlar, DWR kaplamalı teknik rüzgarlık, İtalyan keteni, Vibram tabanlı deri botlar.
2. **Giyim Yaklaşımları:**
   * **Modüler Katmanlama (Layering Timeline):** Sabah (3 Katman), Öğle (Ceketi çıkar/kolları kıvır), Akşam (Tekrar giy).
   * **Doğrudan & Tekli Kombin (Direct Outfit):** Tek parça kalın kazak/kaban veya tek parça ince keten gömlek.

---

## 5. 🎨 Adaptif ve Çift Katmanlı Tema Mimarisi

* Manuel **Koyu (Dark)** ve **Açık (Light)** tema seçici.
* **Dinamik Hava Durumu Ambiyansı:** Güneşli, Yağmurlu, Karlı, Fırtınalı, Sisli ve Gece hava koşullarına göre akıcı arayüz renk uyarlaması.

---

## 6. 🗺️ Harita ve Seyahat Deneyimi (Firefox Öncelikli)

1. **Şehir İçi Harita:** İlçe sınırları/vektör haritası, ilçe hava durumu pinleri ve tıklandığında açılan detaylı giysi/kombin listesi.
2. **Şehirler Arası Rota:** Ulaşım aracı (Araç, Otobüs, Tren) ve kalkış saatine göre yol üzerindeki mola noktalarında hava tahmini.
3. **Uluslararası Rota (3D Küre):** Three.js ile Firefox uyumlu 3D Dünya Küresi üzerinde uçuş yayı ve hedef ülke iklim şoku önlemleri.

---

## 7. 💬 Global Geri Bildirim ve Doğruluk Değerlendirme Sistemi

* 1-5 Yıldız tahmin doğruluğu.
* Kaynak kıyaslama ("Open-Meteo mu, MET Norway mi, DWD mi daha doğruydu?").
* Kıyafet ve renk isabeti ("Üşüttü", "Terletti", "Renk güneş altında fazla sıcaktı", "Tam İsabet").
* Yerel depolama ve tek tıkla dışa aktarılabilir rapor formatı.

---

## 8. 🏢 NOk Organizasyon Künyesi

* **Geliştirici Kolektifi:** NOk (Yenilikçi tarayıcı eklentileri, etkileşimli dublaj projeleri ve akıllı web deneyleri geliştiren bağımsız yaratıcı ekip).
