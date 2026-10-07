# 🌦️ Wear Weather (by NOk)
## Sistem Mimarisi, API Entegrasyonları ve Tasarım Haritası (v0.2.1)

**Organizasyon:** NOk Collective  
**Uygulama Adı:** Wear Weather  
**Güncel Sürüm:** `v0.2.1`  
**Vizyon:** Hobi ve yenilikçi deneyler üreten bağımsız ekibimiz (NOk) tarafından geliştirilen; gizlilik odaklı, çok kaynaklı hava durumu konsensüsü sağlayan, CARTO Voyager haritalı, OSRM gerçek rota motorlu, renk ve malzeme bilimine dayalı akıllı giyim ve seyahat asistanı.

---

## 1. 🗺️ Harita ve Navigasyon Altyapısı (CARTO & OSRM)

Uygulama, statik veya kısıtlı şehir listelerinden tamamen bağımsız, dünya çapında çalışan gerçek bir coğrafi navigasyon ve harita ekosistemine sahiptir:

### A. CARTO Voyager Yüksek Çözünürlüklü Harita Katmanı
* **Lisanslı Basemap Entegrasyonu:** CARTO'nun resmi Voyager raster harita servisi sisteme entegre edilmiştir (`key=cb1_4dgh_1_fb67c545080244da64b27f70`).
* **Kapasite & Kalite:** Aylık 5 milyon isteğe kadar ücretsiz, filigransız (no watermark), net sokak ve sahil detayları.
* **Tüm Modlarda Aktif:** Şehir/İlçe haritası, Şehirler arası karayolu haritası ve Uluslararası dünya haritasında kusursuz çalışır.

### B. Canlı Harita Tıklaması & Tersine Coğrafi Kodlama (Reverse Geocoding)
* Kullanıcı harita üzerinde dünya genelinde **herhangi bir noktaya tıkladığında**, sunucu tarafındaki `/api/geocode` rotası koordinatları anında çözümler:
  * Tıklanan noktanın gerçek İlçe, Şehir ve Ülke adı bulunur.
  * O koordinatın 3+ kaynaktan canlı meteorolojik konsensüsü çekilir.
  * O konuma özel katmanlı/tekli kıyafet reçetesi anında ekrana yansıtılır.

### C. Dünya Çapında Canlı Otomatik Tamamlama (Global Search Autocomplete)
* Arama motoru Türkiye'deki tüm mahalle/ilçeler dahil olmak üzere dünya üzerindeki tüm yerleşim yerlerini destekler (`/api/geocode?q=...`).
* Kullanıcı arama yaptığında harita yumuşak bir animasyonla (`flyTo`) hedef konuma odaklanır.

### D. Gerçek Karayolu Rota Motoru (OSRM - Open Source Routing Machine)
* Şehirler arası seyahatlerde yapay çizgiler yerine **gerçek otoyol ve karayolu geometrisi (polyline)** çizilir (`/api/route`).
* Gerçek karayolu mesafesi (km) ve tahmini sürüş süresi hesaplanır.
* Otoyol güzergahı boyunca duraklar (ör. dağ geçitleri, mola tesisleri) dinamik olarak örneklenerek durak bazlı iklim şoku ve kıyafet uyarıları sunulur.

---

## 2. 🌐 Çok Kaynaklı Hava Durumu Konsensüsü (Weather Aggregator)

Sistem en az 3 bağımsız meteorolojik kaynaktan veri alarak ağırlıklı ortalama ve güven puanı (%) hesaplar:

| Kaynak / Servis | Model / Altyapı | Durum | Özellikler |
| :--- | :--- | :--- | :--- |
| **1. Open-Meteo** | ECMWF, NOAA GFS, DWD ICON | **Aktif** (Anahtarsız) | Saatlik sıcaklık, bağıl nem, çiy noktası, rüzgar hamlesi, UV ve yağış olasılığı. |
| **2. MET Norway (Yr.no)** | Norveç Meteoroloji Enstitüsü | **Aktif** (Anahtarsız) | İskandinav ve Avrupa yüksek çözünürlüklü modelleri. |
| **3. DWD / Bright Sky** | Deutscher Wetterdienst (Alman Devlet Servisi) | **Aktif** (Anahtarsız) | ICON küresel hava modeli verisi. |
| **Opsiyonel Ek Kaynaklar** | WeatherAPI, OpenWeatherMap, Tomorrow.io | **Destekleniyor** | Arayüzdeki "Kaynaklar" modalından kullanıcı kendi API anahtarlarını ekleyebilir. |

---

## 3. 👔 Kapsayıcı Kıyafet Mimarisi: Bütçe Segmentleri & Katmanlama

Platform, toplumun tüm kesimlerine hitap edecek şekilde **iki eksenli hibrit bir giyim motoru** barındırır:

### A. Bütçe ve Malzeme Segmentleri
1. **Erişilebilir & Temel Segment (Bütçe Dostu):**
   * Herkesin gardırobunda bulunan temel parçalar: Pamuklu basic tişört, pamuk/flanel gömlek, polar sweatshirt, standart denim ceket, trençkot, kanvas spor ayakkabı, klasik şemsiye.
2. **Premium & İleri Kumaşlar Segmenti:**
   * İleri malzeme bilimi ve üst segment kumaşlar: Merinos yünü termal içlikler, kaşmir trikolar, Gore-Tex su geçirmez membranlar, DWR kaplamalı rüzgarlıklar, İtalyan keteni, Vibram tabanlı deri botlar.

### B. Giyim Yaklaşımları
1. **Modüler Katmanlama (Layering Timeline):**
   * Günün saatlerine göre giysi birleştirme ve ayırma zaman çizelgesi:
   * *Sabah (07:30 - 10:30):* 3 Katman aktif (Tişört + Gömlek/Hırka + Ceket kapalı).
   * *Öğle (12:00 - 16:00):* Ceketi çıkar ve çantaya/omza as, gömleğin kollarını kıvır (1-2 Katman).
   * *Akşam (18:30 - 22:30):* Ceketi tekrar giy, akşam serinliğine karşı göğsü kapat.
2. **Doğrudan & Tekli Kombin (Direct Outfit):**
   * Katmanlarla uğraşmak istemeyenler için hava durumuna uygun hazır setler.
3. **"Bu Parçayla Kombinle" (Anchor Item Matching Engine):**
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

## 6. ☁️ Dağıtım Altyapısı (Oracle Cloud Free Tier)

* **Multi-Stage Dockerfile:** Next.js Standalone modunda çalışan, ultra hafif konteyner.
* **docker-compose.yml:** Tek komutla (`docker compose up -d --build`) ayağa kalkma garantisi.
* **ORACLE_CLOUD_DEPLOY_GUIDE.md:** VM oluşturma, firewall/port açma, Nginx reverse proxy ve Let's Encrypt ücretsiz SSL kurulum kılavuzu.

---

## 7. 🔮 Gelecek Planları ve Yol Haritası (Roadmap)

| Aşama | Hedeflenen Özellik | Açıklama |
| :--- | :--- | :--- |
| **v0.3.0** | **Dijital Gardırop (My Wardrobe)** | Kullanıcının kendi sahip olduğu giysileri dolabına kaydetmesi ve kombin önerilerinin sadece kendi dolabındaki parçalardan türetilmesi. |
| **v0.4.0** | **PWA & Çevrimdışı Çalışma (Offline Mode)** | Web App Manifest ve Service Worker ile cep telefonlarına "Uygulama Olarak Yükle" desteği ve son rota verilerinin çevrimdışı önbelleklenmesi. |
| **v0.5.0** | **Kıyafet Üreticileri Entegrasyonu** | Eksik katmanlar için kullanıcı dilerse doğrudan üretici ve e-ticaret ürün önerileri (Affiliate / Sponsorlu içerik altyapısı). |
| **v1.0.0** | **Topluluk Geri Bildirim Haritası** | Global kullanıcıların girdiği hava/kıyafet geri bildirimlerinin harita üzerinde ısı haritası (heat-map) olarak gösterilmesi. |
