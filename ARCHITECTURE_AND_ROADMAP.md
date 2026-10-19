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


---

## 8. Güncel durum eki — 16 Ekim 2026

Önceki mimari ve yol haritası bölümleri tarihsel kayıt olarak korunmuştur. Güncel uygulama/plan ayrımı ve sonraki geliştirme devri için **[DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md)** esas alınmalıdır.

- Mevcut arayüzde rota/kombin odak geçişi, TR/EN, hava paletleri, şeffaf NOk simgesi, çoklu kıyafet seçimi, kişisel konfor geri bildirimi ve barkod akışı bulunur.
- Eşleştir: birden fazla parça seçilir, tekrar basınca bırakılır; aynı kategorinin son seçimi kullanılır, diğerleri alternatif kalır.
- Meta VR/Horizon karakter oluşturucu kullanıcının avatar referansıdır. Kullanıcı onayıyla SVG görünümün yerini ilk gerçek 3D avatar/editör aldı: iki temel model, beş saç, sakal, ten/renk ve Kaydet/Vazgeç. Bağımsız yüz morph hedefleri ve gerçek ürün kalıpları mevcut değil.
- Gerçek OSRM geometrisi yalnız iki durakta kullanılır; 3+ durak çizgisi henüz karayolu geometrisi değildir.
- Katalog giysi profilleri canlı mağaza stoğu veya doğrulanmış tekil ürün sayılmaz. Barkod aramasının kumaş bilgisi sağlama garantisi yoktur.
- Topluluk katkısı izinli dosya tabanlı pilottur; genel öneri motorunu otomatik güncellemez.
- Capacitor yapılandırmasının bulunması APK/IPA üretimi ve mağaza yayını kanıtı değildir. Ayrıntılı sınırlar güncel devir belgesindedir.

Bu tarihten itibaren geliştirme turuyla birlikte güncel durum, kararlar, doğrulama ve açık işler belgelere işlenmelidir; mevcut bölümler habersiz silinmemelidir.

## 9. Kaynaklı katalog altyapısı — 18 Ekim 2026

- Kullanıcı onayıyla 32 kıyafet türü ve tür başına 10–15 farklı model hedefi tanımlandı: toplam 320–480. Bu bir veri toplama hedefidir; bu tur kaynaklı gerçek ürün sayısı 0'dır.
- `lib/catalog/`: türler, alan bazlı kaynak/dayanak modeli, katı import doğrulaması, PostgreSQL bağlantısı, yayın transaction'ı ve arama. `db/migrations/001_catalog.sql`: normalize ürün/varyant/teklif/malzeme/kanıt tabloları, taslaklar, eski profiller ve indeksler.
- Bilinmeyen teknik özellikler `null`; fiyat seviyesi teknik niteliğe eşitlenmez. Dış kumaş, astar ve dolgu ayrıdır. GTIN modelden ayrı varyanta aittir. Aynı barkod iki ürüne bağlanamaz.
- 23 tarihsel profil ve kimlikleri korunur, `legacy_unverified` olarak ayrıca tohumlanır. Geçmişteki “verified” isimli export yalnız geriye uyumluluk alias'ıdır; kaynak doğrulanmış gerçek ürün anlamına gelmez.
- `/api/catalog` geçmiş `results` alanını korur, gerçek ürünleri ayrı `products` ve kaynakları `sources` alanlarında sunar. Yeni ürün/tür kartlarının dolap arayüzüne bağlanması, elbise üst/alt kapsamı ve çoklu aksesuar giydirme kuralları sonraki aşamadadır.
- Yeni `Dockerfile`, Compose PostgreSQL/geçiş/salt okuma web hesabı, isteğe bağlı Caddy HTTPS ve yedekleme betiği yerel/taşınabilir kurulum içindir. Node 24+ gerekir. Oracle kaynağı oluşturma, ARM performansı ve gerçek alan adı/TLS yayını doğrulanmış değildir.
- Yerel dolap/kişisel geri bildirim sunucuya otomatik taşınmaz; topluluk dosya pilotunun PostgreSQL'e geçişi bu turda yapılmadı.
- Sonraki aşama: izinli/kaynaklı gerçek ürün toplama, yönetim arayüzü, kontrollü ürün düzeltme/fiyat yenileme, gerçek ürün seçimi ve güvenilirliğe göre öneri entegrasyonu. Ayrıntılı işletim rehberi `db/README.md`; doğrulamalar `DEVELOPMENT_HANDOFF.md`.

## 10. Yerel gerçek ürün görünümü — 18 Ekim 2026

Sonraki veri ve aktarım onaylarıyla 10 kaynaklı kısa kollu tişört modeli kalıcı yerel PostgreSQL'e yayımlandı; dolap ekranı artık varsayılan olarak `products/sources/coverage` alanlarını kullanır. TR/EN arama, 32 tür kapsamı ve kaynak ayrıntıları vardır. Eski 23 profil ayrı Örnek profiller görünümündedir; kişisel dolap verisi tarayıcıda korunur.

`catalog:local`, `scripts/catalog/activate-local.ts` ve `docker-compose.local.yml` host geliştirmesini `weathrobe-local` projesindeki kalıcı volume'a bağlar; yalnız loopback DB portu ve uygulamada salt okuma hesabı kullanılır. İncelenen grup açık komutla yayımlanır; migrasyon veya sayfa açılması yayın tetiklemez. Bu yerel akış Oracle kurulumu değildir.

Kartların kaynaklı gerçek ürün incelemesi tamamlandı; ürünleri dolaba ekleme/öneri motoruna bağlama, null teknik veriye uygun puanlama, doğrulanmış varyant/fiyat ve kalan 31 türün doldurulması hâlâ sonraki aşamadır. Önceki 0 ürün ve UI bağlantısı yapılmadı ifadeleri önceki turun tarihsel kapsamını belirtir. Ayrıntılar devir belgesinin 11. bölümündedir.

## 11. Kaynaklı ürünlerin öneri akışına bağlanması — 18 Ekim 2026

- `lib/catalog-wardrobe.ts` ürün → yerel dolap adaptörü, TR/EN kumaş gösterimi, kişisel ısı ve hava sıralamasına uygunluk sınırını tutar. `ClothingItem` artık bilinmeyen ısı/su/rüzgâr/fiyat segmentini `null` olarak taşır; eski kayıtların şekli/kimliği değişmez.
- Ürün gerçeği ve `personalWarmth` ayrı tutulur. Snapshot; kaynak, dayanak, bileşim ve GSM'yi korur; yerel tercih merkezi kataloğu değiştirmez. Kaynağı bilinmeyen renk çizim içindir, renk uyumu veya ısı bonusu almaz.
- Gerçek ürün kartından dolaba ekleme, aynı kaydı çoğaltmama, kişisel tahmini sonradan değiştirme/temizleme, TR/EN ayrıntılar ve Eşleştir'de kullanıcı seçimi tamamlandı. Otomatik seçim/kişiselleştirme/AI stilist girdisi eksik teknik verilere göre filtrelenir.
- Kişisel geri bildirim ürün kimliğiyle ilişkilendirilebilir; topluluk katkısı halen doğrulanmış GTIN sınırındadır. Bu tur ürün kimliğiyle genel model güncellemesi veya otomatik kamu yayını açılmadı.
- Açık işler: kalan 31 tür, tek-parça slot kuralları, doğrulanmış varyant/fiyat/stok, kaynaklı teknik ölçümler ve görsel kullanımını kapsayan mağaza akışı. Fotoğraf URL'sine erişim, onu uygulamada kullanma izni sayılmaz. Güncel kanıtlar devir belgesinin 12. bölümündedir.

## 12. Çok kaynaklı katalog ve erişim kaydı — 18 Ekim 2026

- Onaylanan yeni turda DeFacto/Koton/Mavi/Stanley-Stella'dan 14 model yerel PostgreSQL'e aktarıldı. Toplam 24 model: kısa kollu 14, uzun kollu 10; doldurulmayı bekleyen tür sayısı 30. Önceki 10 ürün/31 boş tür ifadeleri önceki aşamanın kaydıdır.
- `db/sources/registry.json` ve README, 13 sağlayıcının erişim biçimi, onaylı ürün kimlikleri, görsel durumu, gerekli hesap/izin ve yeniden ele alma koşulunu tutar. 7 sağlayıcıdan katalog verisi kullanılır; 6 sağlayıcı gelecekte erişim/doğrulama bekler. Bu dosya API entegrasyonu veya lisans izni değildir.
- Printful'dan hesapsız gerçek API gözlemi alındı; iki modelin seçili varyant kumaşları araştırma snapshot'ında. Model reçetesini renge göre farklı reçetelerle karıştırmamak, uygulama/API ve medya kapsamını doğrulamak gerekir; katalog yayını/otomatik senkronizasyon kurulmadı. Awin/GS1/adidas/pazaryeri API'leri için somut bekleyen işler yazıldı.
- `db/imports/local-approved.json` açık incelenmiş grup listesidir. Yerel etkinleştirme bunu önceden doğrular, yalnız listelenen grupları mevcut transaction/hash idempotansıyla yükler. Aday/probe dosyaları dizin taramasıyla yayımlanmaz. Var olan ürün kimlikleri ezilmez.
- Uygulama arama/tür/sayfalama akışı DB'den yeni modelleri kullanır; bu tur UI kodu veya kişisel dolap değiştirilmedi. Bir sonraki veri aşaması kalan 30 tür ve erişim geldikçe izinli mağaza/medya bağlantılarıdır. Güncel doğrulamalar devir belgesinin 13. bölümündedir.

## 13. Ayrıntılı ortak görseller ve temsili kombin yönü — 18 Ekim 2026

Kullanıcı fotoğraf yerine ortak tür görsellerini; türün altında yaka, kol, kesim, boy, renk ve desen çeşitlerini seçti. İlk adımda 32 sabit türü kullanan özgün SVG şablonları ve dolapta Kaydet/Vazgeç akışlı kişisel görünüm penceresi kuruldu. `lib/garment-appearance.ts` bu sözleşmeyi doğrular; `ClothingItem.personalAppearance` isteğe bağlıdır ve eski dolapları korur. Gerçek ürünün renk/ısı/teknik bilgileri veya kaynak snapshot'ları kişisel çizimle değiştirilmez. Kişisel desen/renk teknik öneri skoruna kaynak gerçeği olarak aktarılmaz. Katalogda marka/model, kartta kısa eksik bilgi etiketleri ve ayrıntıda teknik alanlar bulunur; bilinmeyen yapılandırılmış renk/desen/kesim bilgileri bilinmiyor kalır.

Sonraki geliştirmelerde aynı tür kimliği hem 2D çizime hem ayrı 3D giysi şablonuna bağlanacak. Mevcut avatar hâlâ gövde bölgesi renk önizlemesidir; bu tur 3D giydirme veya kalıp simülasyonu tamamlanmadı. İlk altı giysi şablonundan sonra katman/bağımsız aksesuar/tek-parça yuvaları ve kalan 30 türün gerçek ürünleri önceliklidir.

Kullanıcı kaynaklı bilgi için üretici beyanından ayrı, ürün/varyant ve alan düzeyinde katkı modeli planlandı. Bağımsız katkı sayısı, çelişki ve güncellik/kanıt incelenecek; yeterli uzlaşı “Kullanıcılar ekledi” etiketiyle gösterilecek. Salt oy sayısı doğrulanmış bilgi veya otomatik teknik performans güncellemesi sayılmayacak. İzin, geri çekme ve tekrar/kötüye kullanım kuralları uygulanmadan topluluk yayını açılmayacak. Bu genişletme mevcut GTIN pilotundan ayrıdır ve henüz uygulanmadı.

Kabul edilen ek ürün işleri: akşam/yağış için “Yanına al” parçası, tek dokunuşla kısa öneri gerekçeleri, sabitlenen parçaları tamamlayan ve günler arasında saklanabilen kombinler. Üç ve üzeri durakta gerçek karayolu rotası, zaman/hareket/kapalı alan bağlamı, kişisel geri bildirim, gerçek mobil/çevrimdışı testleri ve kullanıcı kontrollü yedekleme sırası korunur. Ayrıntılı uygulama ve doğrulama kaydı `DEVELOPMENT_HANDOFF.md` 14. bölümdedir. Önceki belge bölümleri tarihsel kapsamlarıyla aynen korunmuştur.

## 14. 3D giysi şablonları ve aksesuar yuvaları — 18 Ekim 2026

Ortak görünüm sözleşmesi artık `lib/avatar-garments.ts` ve `lib/garment-mesh.ts` üzerinden altı temel 3D giysi şablonuna bağlanır. Yerel CC0 gövde topolojisinden bağımsız skinned yüzeyler, kol/paça/bolluk, açık ceket, yaka/kapüşon/taban ayrıntıları ve yerel desen dokuları üretilir. Bere/atkı/eldiven/çorap temsilleri de vardır. Bu yapı kumaş fiziği veya gerçek ürüne ait kalıp değildir; etek, elbise, sandalet, güneş şapkası ve ekipman hâlâ kart görünümünde kalır.

`lib/outfit-layers.ts` gerçek kayıtlı türe bağlı aksesuar yuvalarını ayırır: baş/boyun/el/çorap/ekipman. Bere–atkı–eldiven birlikte seçilir; aynı baş yuvasında son seçim aktif, önceki alternatiftir. Eşleştirme, dolap ve kişisel geri bildirim bu yuvaları kullanır. Kişisel görsel ayarı kaynak ürünün teknik özelliklerini veya gerçek yuvasını değiştirmez. Manuel/barkod ekleme formunda kategoriye bağlı tür seçimi vardır; yeni manuel kayıtta su/rüzgâr bilinmiyorsa `null` saklanır. Tek-parça giysinin üst/alt birlikte kaplama kuralı açık iştir.

3D karakter editörü mevcut kombini önizler; profil Kaydet/Vazgeç akışı korunur. Aksesuarlar kartların üstüne binmek yerine ayrı saran şerittedir. Son paket: 33/33 davranış/entegrasyon kontrolü, iki gerçek glTF gövdesinde CPU geometri kontrolleri, başarılı tip kontrolü/üretim derlemesi ve masaüstü/mobil gerçek tarayıcı render doğrulaması. Performans için istek üzerine çizim/DPR sınırı korunur; gerçek cihazda 60 FPS garantisi ölçülmedi. Ayrıntılı kanıt, geçici test düzeltmeleri, sınırlamalar ve kullanıcı kontrol listesi `DEVELOPMENT_HANDOFF.md` 15. bölümdedir. Eski belge bölümleri korunmuştur.

## 15. Kataloğu önceleme ve 50 gerçek model — 18 Ekim 2026

Kullanıcı 3D üst üste giydirmede hata gördüğünü bildirdi ve önce kıyafet veritabanının ilerletilmesini istedi. Önceki test/derleme kanıtı görsel sorunun çözüldüğü anlamına gelmez. Bu tur 3D dosyaları değiştirilmedi; katman çakışması açık iş olarak kaldı.

Beş yeni JSON grubu mevcut şema/manifest/import işlemiyle yayımlandı: polar, sweatshirt, kumaş pantolon, yağmurluk ve koşu ayakkabısında 10'ar model. Toplam **74 gerçek ürün/74 kaynak, 7 dolu ve 25 boş tür**; hedef hâlâ 32 × 10–15. Bileşen yüzdeleri ana kumaş/astar bazında korunur; taban/membran/takviye mevcut rollere zorlanmaz. 9 su geçirmezlik üretici iddiası ve 1 ihtiyatlı su itici kaydı dışında yeni performans puanı türetilmedi. Bütün ısı seviyeleri bilinmiyor kalır.

Veri kalitesi, dolap dönüşümü, PostgreSQL geri okuma, tür filtresi ve idempotans test edildi. Eski 24 model korundu; yedek ayrı boş DB'ye geri yüklenerek doğrulandı. Kaynak kararları db/sources/complete-outfit-research.2026-10-18.md, güncel kontrol listesi DEVELOPMENT_HANDOFF.md bölüm 16 içindedir. Günlük jean/gömlek/kazak/hırka ve farklı mağazalarla denge, ardından kışlık dış giyim/aksesuarlar önceliklidir.

## 16. 100 gerçek model hedefi ve ayrı SVG tasarım katmanı — 18 Ekim 2026

Kullanıcının açıklamasıyla hedef her türde 100 **gerçek mağaza/üretici modeli** oldu. `lib/catalog/taxonomy.ts` artık 36 sabit kimlik taşır; polo, bluz, yelek ve yağmurluk pançosu eklenmiştir. `002_catalog_targets.sql` mevcut türlerin hedefini 100'e yükseltir; yeni türleri mevcut migrate seed'i ekler. Eski 32 kimlik, 23 legacy profil ve yayınlanmış ürünler korunur. Gömlek alias'ları polo/bluzla karışmayacak şekilde ayrılır.

`lib/garment-designs.ts` tür başına 5 özgün tasarımı kararlı kimlikle (`type:variant`) sağlar. Kişisel görünümün sürümü 1 kalır; isteğe bağlı `designId` yalnız uyumlu tür için kabul edilir. Preset varsayılanlarının üstüne açık kişisel renk/desen/yaka/kol/kesim/boy yazılır. Kaynak ürün nesnesi, teknik alanlar ve seçim yuvası değişmez. `GarmentVisual` farklı silüet/dikiş/cep/kapanışları çizer; galeri sayfa başına 12 çizim gösterir ve gerçek ürün hedefini artırmaz. Editör 5 görsel seçenek, önizleme ve Kaydet/Vazgeç akışını kullanır. Bu 2D ayrıntılar gerçek 3D kalıp veya kumaş fiziği değildir.

72 yeni üretici kaynaklı model 13 yeni JSON grubuyla kalıcı kataloğa yayımlandı. Toplam **146 model / 20 grup / 36 tür**, 18 dolu ve 18 boş tür vardır. **3.600 hedefi tamamlanmadı; 3.454 model eksik**. `scripts/catalog/progress.ts` açık manifesti ve şemaları doğrular, marka/model tekrarlarını reddeder, tür bazlı eksikleri raporlar. UI gerçek toplamı ve seçili türün 100 hedefine ilerlemesini gösterir. Kaynak notları ve erişilemeyen/çelişkili adaylar db/sources/catalog-expansion.2026-10-18.md içindedir.

Sonraki veri önceliği boş türler ve farklı günlük giyim markalarıdır. İzinli toplu ürün akışı/partner erişimi kurulmuş sayılmaz. Gerçek 3D katman çakışması, tek parça/aksesuar geometrisi, topluluk alan katkıları ve lisanslı canlı fiyat/varyant akışı önceki açık işler olarak sürer. Hedefe ulaşıldığı yalnız tür başına 100 farklı, kaynaklı model yayımlandığında söylenebilir.
