# 🌦️ Wear Weather / Weathrobe (by NOk)
## Kapsamlı Proje Spesifikasyonu, HMI Tasarım İlkeleri, Sistem Mimarisi ve Yol Haritası

**Organizasyon:** NOk Collective  
**Uygulama Adı:** Weathrobe / Wear Weather  
**Teknoloji Yığını:** Next.js 15 (App Router, Standalone), React 19, TypeScript, Tailwind CSS v4, Leaflet + CARTO Raster Tiles, OSRM Routing, `@google/genai`, PWA & Capacitor (Mobil App)  
**Vizyon:** Hobi ve yenilikçi deneyler üreten bağımsız ekibimiz (NOk) tarafından geliştirilen; gizlilik ve veri güvenliği odaklı, çok kaynaklı paralel hava durumu konsensüsü sağlayan, tekil birleşik harita üzerinde çok duraklı günlük rota planlayan, bulunulan ülkenin alım gücüne ve gerçek kumaş bilimine dayalı, HMI (İnsan-Makine Arayüzü) standartlarında kompakt web ve mobil akıllı giyim asistanı.

## 1. 🗺️ Tekil Harita ve Çok Duraklı Navigasyon Altyapısı (CARTO & OSRM)

Uygulama, farklı modlar için ayrı harita pencereleri açmak yerine tüm coğrafi işlemleri **tek bir birleşik harita (Unified Map Hub)** üzerinde yürütür:

### A. CARTO Voyager & Dark Matter Yüksek Çözünürlüklü Harita Katmanı
* **Lisanslı Basemap Entegrasyonu:** CARTO'nun resmi Voyager (Açık tema) ve Dark Matter (Koyu tema) raster harita servisleri sisteme entegre edilmiştir (`NEXT_PUBLIC_CARTO_API_KEY`).
* **Kapasite & Kalite:** Aylık 5 milyon isteğe kadar ücretsiz, filigransız (no watermark), net sokak ve sahil detayları.
* **Tek Harita Kuralı & 3D Kürenin Kaldırılması:** Ayrı pencerelerde birden fazla harita sekmesi veya 3D küre (`GlobeView`) kesinlikle kullanılmaz. Şehir içi, şehirler arası ve uluslararası tüm duraklar aynı harita penceresinde yönetilir.

### B. Esnek Çok Duraklı & Saat Tercihli Günlük Planlayıcı
* Kullanıcılar gün içinde gidecekleri yerleri **şehir içi, ülke içi veya ülkeler arası fark etmeksizin** istedikleri kadar arttırıp azaltabilir (`+ Durak Ekle` / `✕ Durak Sil`).
* Her durak için **isteğe bağlı saat tercihi** (`08:30`, `13:00`, `19:30` vb.) girilebilir.
* Harita üzerinde herhangi bir noktaya tıklandığında veya global arama yapıldığında, sunucu tarafındaki `/api/geocode` rotası koordinatları çözümler (İlçe, Şehir, Ülke) ve seçime göre mevcut durağı günceller veya zincire yeni durak olarak ekler.
* Zincirde 2 veya daha fazla durak bulunduğunda **OSRM (Open Source Routing Machine)** (`/api/route`) üzerinden gerçek karayolu geometrisi (polyline), mesafe (km) ve sürüş süresi otomatik olarak aynı harita üzerinde çizilir.

## 2. 🌐 Çok Kaynaklı Hava Durumu Konsensüsü (Weather Aggregator)

Sistem en az 3 bağımsız meteorolojik kaynaktan `Promise.allSettled` ile paralel veri alarak ağırlıklı ortalama, hissedilen sıcaklık, çiy noktası (dew point) ve güven puanı (%) hesaplar:

| Kaynak / Servis | Model / Altyapı | Durum | Özellikler |
| :--- | :--- | :--- | :--- |
| **1. Open-Meteo** | ECMWF, NOAA GFS, DWD ICON | **Aktif** (Anahtarsız) | Saatlik sıcaklık, bağıl nem, çiy noktası, rüzgar hamlesi, UV ve yağış olasılığı. |
| **2. MET Norway (Yr.no)** | Norveç Meteoroloji Enstitüsü | **Aktif** (Anahtarsız) | İskandinav ve Avrupa yüksek çözünürlüklü modelleri. |
| **3. DWD / Bright Sky** | Deutscher Wetterdienst (Alman Devlet Servisi) | **Aktif** (Anahtarsız) | Bright Sky istasyon verisi ve küresel DWD ICON hava modeli verisi. |
| **Opsiyonel Ek Kaynaklar** | WeatherAPI, OpenWeatherMap, Tomorrow.io | **Destekleniyor** | Arayüzdeki "Kaynaklar" modalından kullanıcı kendi API anahtarlarını ekleyebilir. |

## 3. 👔 Kapsayıcı Kıyafet Mimarisi: Ülke Alım Gücü, Kumaş Kataloğu & Katmanlama

Platform, sadece kullanıcının manuel eklediği birkaç parçayla sınırlı kalmayan; bulunulan ülkenin ekonomik alım gücüne göre kademelendirilmiş geniş bir **doğrulanmış kumaş ve giysi veri tabanı** barındırır:

### A. Bulunulan Ülkenin Alım Gücüne Göre 3 Kademeli Segment
1. **Standart & Erişilebilir Segment (Bütçe Dostu / Essential):**
   * Bulunulan ülkenin alım gücüne göre herkesin erişebileceği fiyat/performans markaları ve temel parçalar *(Örn. Türkiye için: LC Waikiki, DeFacto, Koton, Mavi, Decathlon/Quechua; Küresel için: Uniqlo, H&M, Decathlon)*.
   * Kumaşlar: `%100 Pamuk Basic Tişört (160 GSM)`, `Pamuk/Flanel Gömlek`, `3 İplik Şardonlu Sweatshirt (320 GSM)`, `Standart Denim Ceket`, `Su İtici Ripstop Yağmurluk`, `Kanvas Sneaker`.
2. **Orta-Üst & Şehir Klasiği Segment (Smart Casual):**
   * Doğal lif oranı yüksek, uzun ömürlü şehir giyimi *(Örn. Türkiye için: Zara, Massimo Dutti, Marks & Spencer, Network, İpekyol, Columbia; Küresel için: COS, Arket, Massimo Dutti)*.
   * Kumaşlar: `%100 Saf Keten Gömlek (145 GSM)`, `Supima Pamuk & Lyocell`, `İnce Merinos Yünü Triko`, `Su İtici Klasik Gabardin Trençkot (290 GSM)`, `Deri Chelsea Bot`.
3. **Lüks & İleri Teknik Segment (Luxury / Pro Technical):**
   * İleri malzeme bilimi ve üst segment kumaşlar *(Örn. Türkiye için: Beymen, Vakko, Arc'teryx, Patagonia, The North Face Summit; Küresel için: Loro Piana, Arc'teryx, Barbour)*.
   * Kumaşlar: `18.5 Mikron Merinos Termal İçlik (200 GSM)`, `%100 Saf Moğolistan Kaşmiri`, `Gore-Tex 3L Membran Hardshell`, `Schoeller DWR Trençkot`, `Vibram Tabanlı Su Geçirmez Deri Bot`.

### B. Fotoğrafsız Mağaza & Kumaş Kataloğu Arama Motoru (`/api/catalog`)
* Her kullanıcı kıyafet fotoğrafı yüklemek istemeyebilir ve fotoğraftan bir kıyafetin gerçek kumaş karışımı (`%100 pamuk` mu yoksa `%80 polyester` mi olduğu) anlaşılamayabilir.
* Bu nedenle kullanıcılar katalog arama çubuğundan doğrudan kıyafet türü (*"trençkot"*, *"keten gömlek"*, *"polar"*, *"yağmurluk"*), kumaş tipi veya marka aratarak gerçek kumaş gramajı (`GSM`), nefes alabilirlik, su/rüzgar direnci ve ısı katsayısı (`1-5`) önceden tanımlanmış kıyafetleri tek tıkla kendi dijital gardıroplarına ekleyebilir.
* E-ticaret / açık ürün veri yapılarıyla zenginleştirilmiş katalog mimarisi temel alınır.

### C. Giyim Yaklaşımları
1. **Modüler Katmanlama (Layering Timeline):**
   * Günün saatlerine ve eklenen durakların saat tercihlerine göre giysi birleştirme/ayırma çizelgesi:
   * *Sabah (07:30 - 10:30):* 3 Katman aktif (Tişört + Gömlek/Hırka + Ceket kapalı).
   * *Öğle (12:00 - 16:00):* Ceketi çıkar ve çantaya/omza as, gömleğin kollarını kıvır (1-2 Katman).
   * *Akşam (18:30 - 22:30):* Ceketi tekrar giy, akşam serinliğine karşı göğsü kapat.
2. **Benim Gardırobumdan Kombinle (My Wardrobe):**
   * Kullanıcının katalogdan seçerek veya kendi ekleyerek oluşturduğu dolabındaki parçalardan o günkü durak zincirine en uygun kombinin türetilmesi.
3. **Doğrudan & Tekli Kombin (Direct Outfit):**
   * Katmanlarla uğraşmak istemeyenler için hava durumuna uygun hazır setler.
4. **"Bu Parçayla Kombinle" (Anchor Item Matching Engine):**
   * Kullanıcının seçtiği ana parçaya (Mavi Denim Ceket, Bej Trençkot, Siyah Deri Ceket, Gri Hoodie vb.) göre hem hava koşullarına hem de renk uyumuna uygun tamamlayıcı parçaların üretilmesi.

### D. Termal ve Optik Renk Bilimi
* **Yüksek UV & Sıcak (> 24°C):** Güneş ışığını yansıtan açık renkler (Beyaz, bej, açık pastel).
* **Soğuk Kış (< 10°C):** Isıyı soğuran ve muhafaza eden koyu tonlar (Siyah, antrasit, lacivert).
* **Yağışlı & Çamurlu Havalar:** Leke ve su sıçramalarına karşı koyu renk alt giyim önerileri.

## 4. 🎨 HMI (İnsan-Makine Arayüzü) Standartları, Kompaktlık & Dinamik Renkler

Uygulamanın arayüz tasarımında temel beklentiler şunlardır:

* **İnsan Odaklı HMI Tasarımı & Kompakt Yapı:** Ekran kalabalık kart yığınlarından ve gereksiz boşluklardan arındırılmalıdır. Kullanıcı uygulamaya baktığında `<2` saniye içinde hava durumunu, duraklarını ve ne giymesi gerektiğini tek bakışta (kaydırma karmaşası olmadan) anlamalıdır.
* **Yazı Yığınları Yerine Görsel Temsil:** Kıyafet önerilerinde uzun paragraflar ve metin açıklamaları **kullanılmamalıdır**. Giysiler vektörel/görsel kıyafet silüetleri (renk kodlarıyla boyanmış ikonlar), kısa ürün adı ve 1-2 kelimelik mikro etiketlerle (`Su İtici`, `%100 Keten`, `Isı: 3/5`) görselleştirilmelidir.
* **Hava Durumuna Göre Dinamik Tasarım Renkleri:** Sadece arka plan değil; arayüzün vurgu renkleri, kart çerçeveleri, rozetleri ve harita rota çizgileri anlık hava koşuluna göre dinamik olarak renk değiştirmelidir:
  * *Güneşli:* Kehribar / Altın sarısı ve sıcak gökyüzü tonları.
  * *Yağmurlu:* Derin okyanus mavisi ve camgöbeği tonları.
  * *Karlı:* Kristal buz mavisi ve gümüş tonları.
  * *Fırtınalı:* Elektrik moru ve koyu arduvaz tonları.
  * *Gece:* Gece indigosu tonları.
* **Çift Tema Desteği:** Manuel **Koyu (Dark)** ve **Açık (Light)** tema seçici (`@custom-variant dark` ile tam uyumlu).
* **Referans Site Uyarlaması:** Tasarım dili, kullanıcının vereceği örnek referans sitenin/uygulamanın kompaktlığına ve görsel estetiğine göre şekillendirilecektir.

## 5. 🔒 Optimizasyon ve Veri Güvenliği (Privacy & Performance First)

* **Koordinat Anonimleştirme (Geo-Privacy Obfuscation):** Kullanıcının noktasal GPS konumu asla kaydedilmez ve dış API'lere gönderilmez; koordinatlar `~1.1 km` (virgülden sonra 2 basamak) ızgaraya yuvarlanarak anonimleştirilir.
* **API Anahtarı Güvenliği & Sıfır İz (Zero-Trace Wipe):** Harita ve özel API anahtarları URL sorgularında açık taşınmaz; kullanıcı dilediği an tek tıkla tarayıcıdaki tüm yerel verilerini (`localStorage`) sıfırlayabilir.
* **60 FPS Harita & Render Optimizasyonu:**
  * Sunucu tarafında koordinat bazlı 15 dakikalık LRU önbellek (Geo-Grid Cache) ve istemci tarafında eşzamanlı istek tekilleştirme (*Request Deduplication*).
  * Leaflet üzerinde `preferCanvas: true` donanım hızlandırması, `AbortController` ile yarım kalan arama/tıklama isteklerinin iptali, `React.memo` ve `useMemo` ile gereksiz yeniden render'ların önlenmesi.

## 6. 💬 Global Geri Bildirim & Kişisel Termal Kalibrasyon Sistemi

* 1-5 Yıldız tahmin doğruluğu değerlendirmesi.
* Kaynak kıyaslama (*"Open-Meteo mu, MET Norway mi, DWD mi daha doğruydu?"*).
* Kıyafet isabeti (*"Üşüttü", "Terletti", "Islattı", "Tam İsabet"*) ve bu geri bildirimlere göre kullanıcının kişisel **Termal Tolerans Katsayısının (`±°C`)** otomatik kalibre edilmesi.
* Yerel depolama ve tek tıkla dışa aktarılabilir JSON rapor formatı.

## 7. 📱 Mobil Uygulama (App Preview, PWA & Capacitor) ve Dağıtım Altyapısı

Proje sadece bir web sitesi değil, aynı zamanda tam teşekküllü bir **mobil uygulama (App)** olarak geliştirilmektedir:
* **Canlı App Preview:** Geliştirme aşamasında arayüz içinde tek tıkla **Mobil Uygulama Önizlemesi (App Preview)** ve masaüstü görünümü arasında geçiş yapılabilmelidir.
* **PWA & Çevrimdışı Çalışma:** `public/manifest.json` ve `public/sw.js` (Service Worker) ile iOS/Android ana ekranına tam ekran uygulama olarak kurulabilme ve son rotaları çevrimdışı önbellekleme.
* **Capacitor Native Paketleme:** `capacitor.config.json` üzerinden Android (`.apk`/`.aab`) ve iOS (`.ipa`) mağaza çıktısı üretebilme.
* **Oracle Cloud Free Tier Dağıtımı:** Multi-Stage `Dockerfile` (Next.js Standalone), `docker-compose.yml` ve `ORACLE_CLOUD_DEPLOY_GUIDE.md`.

## 8. 🔮 Yol Haritası (Roadmap)

| Aşama | Hedeflenen Özellik | Durum / Açıklama |
| :--- | :--- | :--- |
| **v0.2.x** | **CARTO Harita, OSRM Rota & 3+ Kaynaklı Konsensüs** | Temel harita, tersine coğrafi kodlama ve paralel meteorolojik konsensüs altyapısı. |
| **v0.3.x** | **Dijital Gardırop & Kişisel Termal Kalibrasyon** | Kullanıcının kendi dolabını yönetmesi ve geri bildirimlerle `±°C` kişisel kalibrasyon. |
| **v0.4.x - v0.5.x** | **Tek Harita Çoklu Durak, Ülke Alım Gücü Kataloğu, HMI Görsel Giysi & Mobil App** | 3D kürenin ve ayrı haritaların kaldırılıp tek haritada birleştirilmesi, fotoğrafsız mağaza/kumaş kataloğu, metinsiz görsel giysi kartları, dinamik hava renkleri ve mobil App Preview. |
| **v0.6.0** | **Referans Tasarım Dilinin Birebir Uygulanması & E-Ticaret Veri Çekimi** | Kullanıcının belirleyeceği referans site tasarımına göre HMI arayüzünün son haline getirilmesi ve canlı ürün/kumaş verisi entegrasyonu. |
| **v1.0.0** | **Topluluk Geri Bildirim Isı Haritası & Mağaza Yayını** | Global kullanıcı geri bildirimlerinin harita üzerinde ısı haritası (heat-map) olarak gösterilmesi ve iOS/Android yayını. |


---

## 9. Geliştirme devri ve avatar kararı eki — 16 Ekim 2026

Bu şartnamedeki özgün kapsam korunmuştur. Şartname hedefleri ile gerçekten uygulanmış davranışların ayrımı, ilgili dosyalar ve test kaydı **[DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md)** dosyasındadır.

**Kullanıcının son yönlendirmesi:** Meta VR/Horizon'da görülen, kullanıcı hesabıyla ilişkili kişisel karakter oluşturma deneyimi beğeniliyor. Amaç; vücut, yüz, saç/sakal seçenekleriyle insanların oluştururken eğleneceği kişisel avatar/maskot. Önceki beyaz SVG manken kullanıcı tarafından yetersiz bulundu. Bu istek yalnız birkaç SVG seçeneği eklemeye indirgenmemeli.

**Kullanıcı onayıyla ilk sürümü uygulandı:** NOk'a ait görsel kişiselleştirme ekranı, gerçek stilize 3D karakter ve lisansı uygun model/saç varlıkları. Meta hesabından doğrudan avatar aktarımı doğrulanmış bir entegrasyon değildir. Fotoğraf veya dış hesap zorunluluğu getirmeyen yerel profil kullanılır. Ücretsiz paket ve CC0 lisansı incelendi, kod dosyası kapsamı onaylandı. Gerçek uygulama iki temel gövde, beş saç ve sakal içeriyor; bağımsız yüz morph hedefleri ve gerçek ürünlerin 3D kalıpları sonraki aşama. Güncel devir belgesinin 8. bölümü uygulama sonucunu kaydeder.

**Belge bakımı:** Kullanıcı, proje içerik/yapı Markdown belgelerinin gerektiğinde geliştirmelerle birlikte güncellenmesini istedi. Mevcut bölümleri silmeden veya kısaltmadan; uygulananlar, bekleyenler, yeni kararlar ve test sonuçları tarihli biçimde eklenmelidir.
