# 🌦️ Wear Weather (by NOk)
## Sistem Mimarisi, API Entegrasyonları ve Tasarım Haritası (v0.4.0)

**Organizasyon:** NOk Collective  
**Uygulama Adı:** Weathrobe / Wear Weather  
**Güncel Sürüm:** `v0.4.0`  
**Vizyon:** Hobi ve yenilikçi deneyler üreten bağımsız ekibimiz (NOk) tarafından geliştirilen; gizlilik odaklı, çok kaynaklı hava durumu konsensüsü sağlayan, CARTO Voyager & Dark Matter haritalı, OSRM gerçek rota motorlu, ülke alım gücüne duyarlı mağaza/kumaş kataloğuna ve çok duraklı günlük planlayıcıya dayalı akıllı giyim ve seyahat uygulaması.

---

## 1. 🗺️ Harita, Çok Duraklı Planlayıcı ve Navigasyon Altyapısı (CARTO & OSRM)

Uygulama, statik veya kısıtlı şehir listelerinden tamamen bağımsız, dünya çapında çalışan gerçek bir coğrafi navigasyon ve harita ekosistemine sahiptir:

### A. CARTO Voyager & Dark Matter Yüksek Çözünürlüklü Harita Katmanı
* **Lisanslı Basemap Entegrasyonu:** CARTO'nun resmi Voyager ve Dark Matter raster harita servisi sisteme entegre edilmiştir (`NEXT_PUBLIC_CARTO_API_KEY` ortam değişkeni ile).
* **Kapasite & Kalite:** Aylık 5 milyon isteğe kadar ücretsiz, filigransız (no watermark), net sokak ve sahil detayları.
* **Tüm Modlarda Aktif:** Şehir/İlçe haritası, Şehirler arası karayolu haritası ve Uluslararası dünya haritasında kusursuz çalışır.

### B. Esnek Çok Duraklı & Saat Tercihli Günlük Planlayıcı (`v0.4.0`)
* Kullanıcılar şehir içi (ör. `08:30 Kadıköy` -> `13:00 Maslak` -> `19:30 Beşiktaş`), şehirler arası (`İstanbul` -> `Bolu` -> `Ankara`) veya ülkeler arası (`İstanbul` -> `Londra`) fark etmeksizin gün içinde gidecekleri yerleri **istedikleri kadar arttırıp azaltabilir** ve her durağa **isteğe bağlı saat tercihi** verebilir.
* Sistem tüm durakların belirtilen saatlerdeki hava durumunu birleştirerek bütün günü kurtaran tek bir ortak kombin reçetesi üretir.

### C. Dünya Çapında Canlı Otomatik Tamamlama (Global Search Autocomplete)
* Arama motoru Türkiye'deki tüm mahalle/ilçeler dahil olmak üzere dünya üzerindeki tüm yerleşim yerlerini destekler (`/api/geocode?q=...`).
* Kullanıcı arama yaptığında ister mevcut durağı güncelleyebilir ister tek tıkla yeni durak olarak zincire ekleyebilir.

### D. Gerçek Karayolu Rota Motoru (OSRM - Open Source Routing Machine)
* Şehirler arası seyahatlerde yapay çizgiler yerine **gerçek otoyol ve karayolu geometrisi (polyline)** çizilir (`/api/route`).
* Gerçek karayolu mesafesi (km) ve tahmini sürüş süresi hesaplanır.
* Otoyol güzergahı boyunca duraklar (ör. dağ geçitleri, mola tesisleri) dinamik olarak örneklenerek durak bazlı iklim şoku ve kıyafet uyarıları sunulur.

---

## 2. 🌐 Çok Kaynaklı Hava Durumu Konsensüsü & Veri Güvenliği

Sistem en az 3 bağımsız meteorolojik kaynaktan paralel veri alarak ağırlıklı ortalama ve güven puanı (%) hesaplar; koordinatları dış servislere göndermeden önce `~1.1 km` ızgaraya yuvarlayarak (Geo-Privacy Obfuscation) noktasal konumu gizler:

| Kaynak / Servis | Model / Altyapı | Durum | Özellikler |
| :--- | :--- | :--- | :--- |
| **1. Open-Meteo** | ECMWF, NOAA GFS, DWD ICON | **Aktif** (Anahtarsız) | Saatlik sıcaklık, bağıl nem, çiy noktası, rüzgar hamlesi, UV ve yağış olasılığı. |
| **2. MET Norway (Yr.no)** | Norveç Meteoroloji Enstitüsü | **Aktif** (Anahtarsız) | İskandinav ve Avrupa yüksek çözünürlüklü modelleri. |
| **3. DWD / Bright Sky** | Deutscher Wetterdienst (Alman Devlet Servisi) | **Aktif** (Anahtarsız) | ICON küresel hava modeli verisi. |
| **Opsiyonel Ek Kaynaklar** | WeatherAPI, OpenWeatherMap, Tomorrow.io | **Destekleniyor** | Arayüzdeki "Kaynaklar" modalından kullanıcı kendi API anahtarlarını ekleyebilir. |

---

## 3. 👔 Kapsayıcı Kıyafet Mimarisi: Ülke Alım Gücü Segmentleri, Kumaş Kataloğu & Katmanlama

Platform, bulunulan ülkenin alım gücüne uyarlanan **3 kademeli giyim motoru** ve **fotoğrafsız aratılabilir kumaş/mağaza kataloğu** barındırır:

### A. Ülke Alım Gücüne Göre 3 Kademeli Segment (`lib/clothing-catalog.ts`)
1. **Standart & Bütçe Dostu Segment (`essential`):**
   * Türkiye için *LC Waikiki, DeFacto, Koton, Mavi, Decathlon*; Küresel pazar için *Uniqlo, H&M, Decathlon* ölçeğinde ulaşılabilir temel parçalar (`%100 Pamuk 160 GSM`, `3 İplik Şardonlu 320 GSM`, `Su İtici Ripstop`).
2. **Orta-Üst & Şehir Klasiği Segment (`smart`):**
   * *Zara, Massimo Dutti, Marks & Spencer, Network, Columbia* ölçeğinde doğal lif oranı yüksek (`%100 Saf Keten 145 GSM`, `Merinos Triko`, `Su İtici Gabardin Trençkot`) uzun ömürlü parçalar.
3. **Lüks & İleri Teknik Segment (`luxury`):**
   * *Beymen, Vakko, Arc’teryx, Patagonia, Loro Piana, The North Face* ölçeğinde ileri malzeme bilimi (`Gore-Tex 3L Membran`, `%100 Saf Kaşmir`, `18.5 Mikron Merinos`, `Vibram Tabanlı Deri Bot`).

### B. Giyim Yaklaşımları ve Katalog Arama Motoru (`/api/catalog`)
1. **Modüler Katmanlama (Layering Timeline):**
   * Günün saatlerine göre giysi birleştirme ve ayırma zaman çizelgesi:
   * *Sabah (07:30 - 10:30):* 3 Katman aktif (Tişört + Gömlek/Hırka + Ceket kapalı).
   * *Öğle (12:00 - 16:00):* Ceketi çıkar ve çantaya/omza as, gömleğin kollarını kıvır (1-2 Katman).
   * *Akşam (18:30 - 22:30):* Ceketi tekrar giy, akşam serinliğine karşı göğsü kapat.
2. **Katalogdan Aratarak Dijital Gardırop Oluşturma (`v0.4.0`):**
   * Fotoğraf yüklemeye gerek kalmadan; kumaş gramajı (`GSM`), su/rüzgar direnci ve ısı yalıtımı doğrulanmış katalogdan aratarak (*"keten gömlek"*, *"trençkot"*, *"polar"*, *"yağmurluk"*) tek tıkla dolaba giysi ekleme.
3. **Doğrudan & Tekli Kombin (Direct Outfit):**
   * Katmanlarla uğraşmak istemeyenler için hava durumuna uygun hazır setler.
4. **"Bu Parçayla Kombinle" (Anchor Item Matching Engine):**
   * Kullanıcının dolabından seçtiği ana parçaya (Mavi Denim Ceket, Bej Trençkot, Siyah Deri Ceket, Gri Hoodie vb.) göre hem hava koşullarına hem de renk uyumuna uygun tamamlayıcı parçaların üretilmesi.

### C. Termal ve Optik Renk Bilimi
* **Yüksek UV & Sıcak (> 24°C):** Güneş ışığını yansıtan açık renkler (Beyaz, bej, açık pastel).
* **Soğuk Kış (< 10°C):** Isıyı soğuran ve muhafaza eden koyu tonlar (Siyah, antrasit, lacivert).
* **Yağışlı & Çamurlu Havalar:** Leke ve su sıçramalarına karşı koyu renk alt giyim önerileri.

---

## 4. 🎨 Çift Tema ve Dinamik Ambiyans

* Manuel **Koyu (Dark)** ve **Açık (Light)** tema seçici.
* **Dinamik Hava Ambiyansı:** Güneşli, Yağmurlu, Karlı, Fırtınalı, Sisli ve Gece koşullarına göre arka plan ve vurgu renklerinin otomatik adaptasyonu.

---

## 5. 💬 Global Geri Bildirim Sistemi

* 1-5 Yıldız tahmin doğruluğu.
* Kaynak kıyaslama ("Open-Meteo mu, MET Norway mi, DWD mi daha doğruydu?").
* Kıyafet isabeti ("Üşüttü", "Terletti", "Islattı", "Tam İsabet").
* Yerel depolama ve tek tıkla dışa aktarılabilir JSON rapor formatı.

---

## 6. ☁️ Dağıtım Altyapısı (Oracle Cloud Free Tier) & Mobil App (PWA / Capacitor)

* **Multi-Stage Dockerfile:** Next.js Standalone modunda çalışan, ultra hafif konteyner.
* **docker-compose.yml:** Tek komutla (`docker compose up -d --build`) ayağa kalkma garantisi.
* **ORACLE_CLOUD_DEPLOY_GUIDE.md:** VM oluşturma, firewall/port açma, Nginx reverse proxy ve Let's Encrypt ücretsiz SSL kurulum kılavuzu.
* **MOBILE_APP_GUIDE.md:** `public/manifest.json`, `public/sw.js` ve `capacitor.config.json` ile iOS/Android mobil uygulama kurulumu.

---

## 7. 🔮 Gelecek Planları ve Yol Haritası (Roadmap)

| Aşama | Hedeflenen Özellik | Açıklama |
| :--- | :--- | :--- |
| **v0.3.0** | **Dijital Gardırop (My Wardrobe)** | **TAMAMLANDI** — Kullanıcının kendi sahip olduğu giysileri dolabına kaydetmesi ve kombin önerilerinin sadece kendi dolabındaki parçalardan türetilmesi. |
| **v0.4.0** | **PWA, Mobil App, Ülke Alım Gücü Kataloğu & Çok Duraklı Planlayıcı** | **TAMAMLANDI** — Web App Manifest, Service Worker, Capacitor yapılandırması, fotoğrafsız mağaza/kumaş kataloğu ve saat tercihli çok duraklı günlük rota zinciri. |
| **v0.5.0** | **Kıyafet Üreticileri Entegrasyonu** | Eksik katmanlar için kullanıcı dilerse doğrudan üretici ve e-ticaret ürün önerileri (Affiliate / Sponsorlu içerik altyapısı). |
| **v1.0.0** | **Topluluk Geri Bildirim Haritası** | Global kullanıcıların girdiği hava/kıyafet geri bildirimlerinin harita üzerinde ısı haritası (heat-map) olarak gösterilmesi. |
