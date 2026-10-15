# 🌦️ Wear Weather (by NOk)
## Sistem Mimarisi, API Entegrasyonları ve Tasarım Haritası (v0.3.0)

**Organizasyon:** NOk Collective  
**Uygulama Adı:** Weathrobe / Wear Weather  
**Güncel Sürüm:** `v0.3.0`  
**Vizyon:** Hobi ve yenilikçi deneyler üreten bağımsız ekibimiz (NOk) tarafından geliştirilen; gizlilik odaklı, çok kaynaklı paralel hava durumu konsensüsü sağlayan, CARTO Voyager & Dark Matter haritalı, OSRM gerçek rota motorlu, renk/malzeme bilimine ve **Gemini AI destekli Dijital Gardırop** mimarisine dayalı akıllı giyim ve seyahat asistanı.

---

## 1. 🗺️ Harita ve Navigasyon Altyapısı (CARTO & OSRM)

Uygulama, statik veya kısıtlı şehir listelerinden tamamen bağımsız, dünya çapında çalışan gerçek bir coğrafi navigasyon ve harita ekosistemine sahiptir:

### A. CARTO Voyager & Dark Matter Yüksek Çözünürlüklü Harita Katmanı
* **Lisanslı Basemap Entegrasyonu:** CARTO'nun resmi Voyager (Açık tema) ve Dark Matter (Koyu tema) raster harita servisleri sisteme entegre edilmiştir (`NEXT_PUBLIC_CARTO_API_KEY` ortam değişkeni ile).
* **Kapasite & Kalite:** Aylık 5 milyon isteğe kadar ücretsiz, filigransız (no watermark), net sokak ve sahil detayları.
* **Tüm Modlarda Aktif:** Şehir/İlçe haritası, Şehirler arası karayolu haritası ve Uluslararası dünya haritasında kesintisiz `flyTo` animasyonuyla çalışır.

### B. Canlı Harita Tıklaması & Tersine Coğrafi Kodlama (Reverse Geocoding)
* Kullanıcı harita üzerinde dünya genelinde **herhangi bir noktaya tıkladığında** veya **"Konumumu Algıla"** butonuna bastığında, sunucu tarafındaki `/api/geocode` rotası koordinatları anında çözümler:
  * Noktanın gerçek İlçe, Şehir ve Ülke adı bulunur.
  * O koordinatın 3+ kaynaktan canlı meteorolojik konsensüsü paralel olarak çekilir.
  * O konuma özel katmanlı/tekli/gardırop bazlı kıyafet reçetesi anında ekrana yansıtılır.

### C. Dünya Çapında Canlı Otomatik Tamamlama (Debounced Global Search Autocomplete)
* Arama motoru Türkiye'deki tüm mahalle/ilçeler dahil olmak üzere dünya üzerindeki tüm yerleşim yerlerini destekler (`/api/geocode?q=...`).
* 300ms *debounce* korumalı arama ile harita yeniden yüklenmeden yumuşak bir animasyonla (`flyTo`) hedef konuma odaklanır.

### D. Gerçek Karayolu Rota Motoru & Canlı Durak İklim Analizi (OSRM)
* Şehirler arası seyahatlerde yapay çizgiler yerine **gerçek otoyol ve karayolu geometrisi (polyline)** çizilir (`/api/route`).
* Gerçek karayolu mesafesi (km) ve ulaşım aracına (Araç, Otobüs, Tren) göre tahmini sürüş süresi hesaplanır.
* Otoyol güzergahı boyunca 4 nokta (Kalkış, %33, %66, Varış) dinamik olarak örneklenir; her durağın gerçek ilçe/bölge adı ve **canlı hava durumu** paralel çekilerek durak bazlı iklim şoku (`±°C` fark) ve kıyafet uyarıları sunulur.

---

## 2. 🌐 Çok Kaynaklı Paralel Hava Durumu Konsensüsü (Weather Aggregator)

Sistem en az 3 bağımsız meteorolojik kaynaktan `Promise.allSettled` ile **paralel** veri alarak ağırlıklı ortalama, Çiy Noktası (Dew Point) ve güven puanı (%) hesaplar; ayrıca `~1.1 km` Geo-Grid LRU önbellekleme ile yanıt süresini milisaniyelere indirir:

| Kaynak / Servis | Model / Altyapı | Durum | Özellikler |
| :--- | :--- | :--- | :--- |
| **1. Open-Meteo** | ECMWF IFS, NOAA GFS | **Aktif** (Anahtarsız) | Saatlik sıcaklık, bağıl nem, çiy noktası, rüzgar, UV ve yağış olasılığı. |
| **2. MET Norway (Yr.no)** | Norveç Meteoroloji Enstitüsü | **Aktif** (Anahtarsız) | İskandinav ve Avrupa yüksek çözünürlüklü modelleri. |
| **3. DWD / Bright Sky & ICON** | Deutscher Wetterdienst (Alman Devlet Servisi) | **Aktif** (Anahtarsız) | Bright Sky istasyon verisi + Küresel DWD ICON modeli. |
| **4. WeatherAPI & OpenWeatherMap** | Özel API Anahtarı Desteği | **Aktif** (Opsiyonel) | Arayüzdeki "Kaynaklar" modalından girilen anahtarlar canlı konsensüse 4. ve 5. model olarak katılır. |

---

## 3. 👔 Kapsayıcı Kıyafet Mimarisi, Dijital Gardırop (`v0.3.0`) & Gemini AI

Platform, toplumun tüm kesimlerine hitap edecek şekilde **dört farklı kombin modu**, **kişisel termal kalibrasyon** ve **Gemini AI entegrasyonu** barındırır:

### A. Dijital Gardırop (My Wardrobe) & Gemini Multimodal Etiketleme (`/api/ai-stylist`)
* Kullanıcılar kendi dolaplarındaki giysileri **fotoğrafını yükleyerek** veya **kısa bir metin yazarak** (`"Zümrüt yeşili merinos yünü kazak"`) saniyeler içinde dijital gardıroplarına ekleyebilir.
* `app/api/ai-stylist/route.ts` üzerindeki `@google/genai` (`gemini-2.5-flash`) motoru giysinin kategorisini, kumaş yapısını, ısı yalıtım derecesini (`1-5`), su/rüzgar direncini ve HEX renk kodunu otomatik çıkarır.
* **"Benim Gardırobumdan Kombinle"** sekmesi, anlık hava durumuna göre yalnızca kullanıcının kendi dolabındaki parçaları puanlayarak en ideal kombini kurar ve dolaptaki eksik katmanları raporlar (`Dolap Uyum Skoru %`).

### B. Gemini AI Stil & Mikroklima Danışmanı
* Kullanıcının o günkü aktivitesini (ör. *"Sabah vapurla işe gidip akşam Kadıköy'de açık havada oturacağım"*), 3 kaynaklı meteorolojik konsensüsü, kişisel termal profilini (`±°C`) ve kendi gardırobundaki kıyafetleri birleştirerek bilimsel (çiy noktası, rüzgar soğuğu, optik yansıma) kombin reçetesi üretir.

---

## 4. 🔮 Gelecek Planları ve Yol Haritası (Roadmap)

| Aşama | Hedeflenen Özellik | Açıklama |
| :--- | :--- | :--- |
| **v0.3.0** | **Dijital Gardırop (My Wardrobe) & Gemini AI** | **TAMAMLANDI** — Fotoğraf/metin ile gardırop yönetimi, kişisel dolaptan kombin eşleştirme ve Gemini AI Stil Danışmanı. |
| **v0.4.0** | **PWA & Çevrimdışı Çalışma (Offline Mode)** | Web App Manifest ve Service Worker ile cep telefonlarına "Uygulama Olarak Yükle" desteği ve son rota verilerinin çevrimdışı önbelleklenmesi. |
| **v0.5.0** | **Kıyafet Üreticileri Entegrasyonu** | Eksik katmanlar için kullanıcı dilerse doğrudan üretici ve e-ticaret ürün önerileri (Affiliate / Sponsorlu içerik altyapısı). |
| **v1.0.0** | **Topluluk Geri Bildirim Haritası** | Global kullanıcıların girdiği hava/kıyafet geri bildirimlerinin harita üzerinde ısı haritası (heat-map) olarak gösterilmesi. |
